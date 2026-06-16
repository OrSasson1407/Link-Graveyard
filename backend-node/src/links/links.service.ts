import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { QueueService } from '../queues/queue.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class LinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async create(userId: string, dto: { url: string; source: string; context_text?: string }) {
    const link = await this.prisma.link.create({
      data: {
        userId,
        originalUrl: dto.url,
        status: 'PENDING',
        context: {
          create: {
            source: dto.source,
            rawContext: dto.context_text,
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
      message: 'Link queued for processing',
      data: { link_id: link.id, status: link.status },
    };
  }

  async findAll(userId: string, filters: { status?: string; page: number; limit: number; category?: string }) {
    const { status, page, limit, category } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) where.status = status;
    if (category) where.category = category;

    const [links, total] = await this.prisma.([
      this.prisma.link.findMany({
        where,
        skip,
        take: limit,
        include: { metadata: true, context: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.link.count({ where }),
    ]);

    return {
      data: links.map((l) => ({
        id: l.id,
        url: l.originalUrl,
        status: l.status,
        category: l.category,
        metadata: l.metadata
          ? { title: l.metadata.title, ai_summary: l.metadata.aiSummary, dynamic_data: l.metadata.dynamicData }
          : null,
        intent: l.context ? { inferred_action: l.context.inferredAction } : null,
      })),
      meta: { total, page },
    };
  }

  async updateStatus(id: string, userId: string, status: string) {
    const link = await this.prisma.link.findFirst({ where: { id, userId } });
    if (!link) throw new NotFoundException('Link not found');
    return this.prisma.link.update({ where: { id }, data: { status } });
  }

  async reconstructContext(id: string, userId: string) {
    const link = await this.prisma.link.findFirst({
      where: { id, userId },
      include: { context: true, metadata: true },
    });
    if (!link) throw new NotFoundException('Link not found');

    const savedAt = link.createdAt.toLocaleDateString('en-US', {
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
    });
    const source = link.context?.source?.replace('_', ' ') || 'unknown source';
    const rawContext = link.context?.rawContext || 'no additional context';
    const title = link.metadata?.title || link.originalUrl;

    const reconstructed_story =
      'You saved "' + title + '" on ' + savedAt +
      ' from your ' + source + '. The surrounding context was: "' + rawContext + '".';

    return { reconstructed_story };
  }

  async markAsProcessed(linkId: string, data: {
    title?: string;
    aiSummary?: string;
    previewImage?: string;
    dynamicData?: any;
    category?: string;
    inferredAction?: string;
  }) {
    await this.prisma.link.update({
      where: { id: linkId },
      data: {
        status: 'ACTIVE',
        category: data.category,
        metadata: {
          upsert: {
            create: {
              title: data.title,
              aiSummary: data.aiSummary,
              previewImage: data.previewImage,
              dynamicData: data.dynamicData || {},
            },
            update: {
              title: data.title,
              aiSummary: data.aiSummary,
              previewImage: data.previewImage,
              dynamicData: data.dynamicData || {},
            },
          },
        },
        context: { update: { inferredAction: data.inferredAction } },
      },
    });

    this.eventsGateway.emitLinkProcessed(linkId, data);
  }
}
