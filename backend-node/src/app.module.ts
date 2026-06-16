import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { LinksModule } from './links/links.module';
import { QueueModule } from './queues/queue.module';
import { EventsModule } from './events/events.module';
import { RemindersModule } from './reminders/reminders.module';
import { AiModule } from './ai/ai.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { MonetizationModule } from './monetization/monetization.module';
import { MetricsController } from './common/metrics/metrics.controller';
import { LoggerService } from './common/logger/logger.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    AuthModule,
    LinksModule,
    QueueModule,
    EventsModule,
    RemindersModule,
    AiModule,
    WebhooksModule,
    IntegrationsModule,
    MonetizationModule,
  ],
  controllers: [MetricsController],
  providers: [PrismaService, LoggerService],
  exports: [PrismaService, LoggerService],
})
export class AppModule {}
