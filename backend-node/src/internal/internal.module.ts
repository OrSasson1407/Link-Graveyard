import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { LinksModule } from '../links/links.module';
import { AiModule } from '../ai/ai.module';
import { QueueModule } from '../queues/queue.module';

@Module({
  imports: [LinksModule, AiModule, QueueModule],
  controllers: [InternalController],
})
export class InternalModule {}
