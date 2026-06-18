import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { QueueService } from "../queues/queue.service";
import { EventsGateway } from "../events/events.gateway";

@Injectable()
export class LinksService {
  private readonly logger = new Logger(LinksService.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(
    userId: string,
    dto: { url: string; source: string; context_text?: string },
  ) {
    this.logger.log(`Creating link for user ${userId}`);

    const existing = await this.prisma.link.findFirst({
      where: { userId, originalUrl: dto.url, deletedAt: null },
      select: { id: true, status: true },
    });
    if (existing) {
      throw new ConflictException({
        message: "URL already saved",
        link_id: existing.id,
        status: existing.status,
      });
    }

    const link = await this.prisma.link.create({
      data: {
        userId,
        originalUrl: dto.url,
        status: "PENDING",
        intent: {
          create: {
            source: dto.source,
            rawContext: dto.context_text ?? null,
          },
        },
      },
    });

    await this.queueService.addLinkIngestionJob({
      linkId: link.id,
      url: dto.url,
      userId,
      contextText: dto.context_text,
    });

    return {
      message: "Link queued for processing",
      data: { link_id: link.id, status: "PENDING" },
    };
  }

  async findAll(
    userId: string,
    query: { status?: string; page?: number; limit?: number; category?: string },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { userId, deletedAt: null };
    if (query.status) where.status = query.status;
    else where.status = "ACTIVE";
    if (query.category) where.category = query.category;

    const [links, total] = await this.prisma.$transaction([
      this.prisma.link.findMany({
        where,
        skip,
        take: limit,
        include: { metadata: true, intent: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.link.count({ where }),
    ]);

    const data = links.map((l) => ({
      id: l.id,
      url: l.originalUrl,
      status: l.status,
      category: l.category,
      createdAt: l.createdAt,
      metadata: l.metadata
        ? {
            title: l.metadata.title,
            ai_summary: l.metadata.aiSummary,
            preview_image: l.metadata.previewImage,
            dynamic_data: l.metadata.dynamicData,
          }
        : null,
      intent: l.intent
        ? { inferred_action: l.intent.inferredAction, source: l.intent.source }
        : null,
    }));

    return { data, meta: { total, page, limit } };
  }

  async updateStatus(id: string, userId: string, status: string) {
    const link = await this.prisma.link.findFirst({ where: { id, deletedAt: null } });
    if (!link) throw new NotFoundException("Link not found");
    if (link.userId !== userId) throw new ForbiddenException("Access denied");
    const updated = await this.prisma.link.update({ where: { id }, data: { status } });
    return { id: updated.id, status: updated.status };
  }

  async softDelete(id: string, userId: string) {
    const link = await this.prisma.link.findFirst({ where: { id, deletedAt: null } });
    if (!link) throw new NotFoundException("Link not found");
    if (link.userId !== userId) throw new ForbiddenException("Access denied");
    await this.prisma.link.update({ where: { id }, data: { deletedAt: new Date() } });
    return { id, deleted: true };
  }

  // ── Step 8: Re-analyze on demand ──────────────────────────────────────────
  async reanalyze(id: string, userId: string) {
    const link = await this.prisma.link.findFirst({
      where: { id, deletedAt: null },
      include: { metadata: true },
    });
    if (!link) throw new NotFoundException("Link not found");
    if (link.userId !== userId) throw new ForbiddenException("Access denied");

    await this.prisma.link.update({ where: { id }, data: { status: "PENDING" } });

    await this.queueService.addLinkIngestionJob({
      linkId: link.id,
      url: link.originalUrl,
      userId,
      contextText: undefined,
    });

    return { message: "Re-analysis queued", data: { link_id: id, status: "PENDING" } };
  }

  async reconstructContext(id: string, userId: string) {
    const link = await this.prisma.link.findFirst({
      where: { id, deletedAt: null },
      include: { intent: true, metadata: true },
    });
    if (!link) throw new NotFoundException("Link not found");
    if (link.userId !== userId) throw new ForbiddenException("Access denied");

    const savedAt = link.createdAt.toLocaleDateString("en-US", {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
    const source = link.intent?.source ?? "unknown source";
    const context = link.intent?.rawContext
      ? `The surrounding text was "${link.intent.rawContext}".`
      : "";
    const title = link.metadata?.title ?? link.originalUrl;

    return {
      reconstructed_story: `You saved "${title}" on ${savedAt} from ${source}. ${context}`.trim(),
    };
  }

  async markAsProcessed(
    linkId: string,
    data: {
      title?: string;
      aiSummary?: string;
      previewImage?: string;
      dynamicData?: any;
      category?: string;
      inferredAction?: string;
    },
  ) {
    this.logger.log(`Marking link ${linkId} as processed`);
    const updated = await this.prisma.link.update({
      where: { id: linkId },
      data: {
        status: "ACTIVE",
        category: data.category ?? null,
        metadata: {
          upsert: {
            create: {
              title: data.title ?? null,
              aiSummary: data.aiSummary ?? null,
              previewImage: data.previewImage ?? null,
              dynamicData: data.dynamicData ?? {},
            },
            update: {
              title: data.title ?? null,
              aiSummary: data.aiSummary ?? null,
              previewImage: data.previewImage ?? null,
              dynamicData: data.dynamicData ?? {},
            },
          },
        },
        intent: { update: { inferredAction: data.inferredAction ?? null } },
      },
      include: { metadata: true, intent: true },
    });
    return updated;
  }
}