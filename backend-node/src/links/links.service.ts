import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class LinksService {
  private readonly logger = new Logger(LinksService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: any) {
    this.logger.log(`Creating link for user ${userId}`);
    // Will be connected to Prisma and Queues in the next phase
    return { link_id: 'uuid-placeholder', status: 'PENDING' };
  }

  async findAll(userId: string, query: any) {
    this.logger.log(`Finding links for user ${userId}`);
    return this.getActiveLinks(userId, query?.page || 1, query?.limit || 20);
  }

  async getActiveLinks(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [links, total] = await this.prisma.$transaction([
      this.prisma.link.findMany({
        where: { userId, status: 'ACTIVE' },
        skip,
        take: limit,
      }),
      this.prisma.link.count({ where: { userId, status: 'ACTIVE' } })
    ]);
    return { data: links, meta: { total, page, limit } };
  }

  async updateStatus(id: string, userId: string, status: string) {
    this.logger.log(`Updating status for link ${id} to ${status}`);
    return { id, status };
  }

  async reconstructContext(id: string, userId: string) {
    this.logger.log(`Reconstructing context for link ${id}`);
    return {
      reconstructed_story: "You saved this on Thursday night from your WhatsApp Bot. The surrounding text was 'Need to review this PR for the core module'."
    };
  }

  async markAsProcessed(linkId: string, data: any) {
    this.logger.log(`Marking link ${linkId} as processed`);
    return { id: linkId, status: 'ACTIVE', metadata: data };
  }
}
