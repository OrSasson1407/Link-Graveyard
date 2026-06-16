import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);

  constructor(private readonly prisma: PrismaService) {}

  async buildKnowledgeGraph(userId: string) {
    this.logger.log('Building knowledge graph for userId=' + userId);

    const links = await this.prisma.link.findMany({
      where: { userId },
      include: { metadata: true, intent: true },
    });

    const nodes = links.map((l) => ({
      id: l.id,
      label: l.metadata?.title || l.originalUrl,
      category: l.category,
      intent: l.intent?.inferredAction,
    }));

    const edges: { source: string; target: string; weight: number }[] = [];

    for (let i = 0; i < links.length; i++) {
      for (let j = i + 1; j < links.length; j++) {
        const a = links[i];
        const b = links[j];
        let weight = 0;
        if (a.category && a.category === b.category) weight += 2;
        if (a.intent?.inferredAction && a.intent.inferredAction === b.intent?.inferredAction) weight += 1;
        if (weight > 0) edges.push({ source: a.id, target: b.id, weight });
      }
    }

    return { nodes, edges };
  }
}

