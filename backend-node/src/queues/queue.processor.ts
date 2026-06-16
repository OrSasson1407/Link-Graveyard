import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QueueService } from './queue.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Processor('link-ingestion-queue')
export class QueueProcessor {
  private readonly logger = new Logger(QueueProcessor.name);

  constructor(
    private readonly queueService: QueueService,
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Process('ingest')
  async handleIngestion(job: Job) {
    const { linkId, url, userId, contextText } = job.data;
    this.logger.log('Processing ingestion job for linkId=' + linkId);

    try {
      new URL(url);
      await this.queueService.addDomScrapingJob({ linkId, url, userId, contextText });
      this.logger.log('Ingestion complete, forwarded to scraping: ' + linkId);
    } catch (err) {
      this.logger.error('Ingestion failed for ' + linkId + ': ' + err.message);
      await this.prisma.link.update({ where: { id: linkId }, data: { status: 'ERROR' } });
      throw err;
    }
  }

  @Process('analyze')
  async handleAiAnalysis(job: Job) {
    const { linkId, url, userId, title, rawTextSample, contextText } = job.data;
    this.logger.log('Processing AI analysis job for linkId=' + linkId);

    try {
      const result = await this.aiService.analyzeLink({
        url,
        rawTextSample: rawTextSample || '',
        contextText: contextText || '',
      });

      await this.prisma.link.update({
        where: { id: linkId },
        data: {
          status: 'ACTIVE',
          category: result.category,
          metadata: {
            upsert: {
              create: { title: title || url, aiSummary: result.summary, dynamicData: { tags: result.dynamic_tags } },
              update: { title: title || url, aiSummary: result.summary, dynamicData: { tags: result.dynamic_tags } },
            },
          },
          intent: { upsert: { create: { source: 'ai', inferredAction: result.intent }, update: { inferredAction: result.intent } } },
        },
      });

      this.eventsGateway.emitLinkProcessed(linkId, result);
      await this.queueService.addReminderSchedulerJob({ userId });
      this.logger.log('AI analysis complete for ' + linkId);
    } catch (err) {
      this.logger.error('AI analysis failed for ' + linkId + ': ' + err.message);
      throw err;
    }
  }

  @Process('schedule')
  async handleReminderSchedule(job: Job) {
    const { userId } = job.data;
    this.logger.log('Processing reminder schedule job for userId=' + userId);
  }
}

