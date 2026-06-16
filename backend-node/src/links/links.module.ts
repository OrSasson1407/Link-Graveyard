import { Module } from '@nestjs/common';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';
import { QueueModule } from '../queues/queue.module';
import { EventsModule } from '../events/events.module';
import { PrismaService } from '../prisma.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [QueueModule, EventsModule, AiModule],
  controllers: [LinksController],
  providers: [LinksService, PrismaService],
  exports: [LinksService],
})
export class LinksModule {}
