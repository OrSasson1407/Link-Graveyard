import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { QueueProcessor } from './queue.processor';
import { PrismaService } from '../prisma.service';
import { EventsModule } from '../events/events.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'link-ingestion-queue' },
      { name: 'dom-scraping-queue' },
      { name: 'ai-analysis-queue' },
      { name: 'reminder-scheduler-queue' },
    ),
    EventsModule,
    AiModule,
  ],
  providers: [QueueService, QueueProcessor, PrismaService],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
