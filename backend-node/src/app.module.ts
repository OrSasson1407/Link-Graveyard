import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { LinksModule } from './links/links.module';
import { QueueModule } from './queues/queue.module';
import { RemindersModule } from './reminders/reminders.module';
import { EventsModule } from './events/events.module';
import { AiModule } from './ai/ai.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { MonetizationModule } from './monetization/monetization.module';
import { InternalModule } from './internal/internal.module';
import { PrismaService } from './prisma.service';
import { MetricsController } from './common/metrics/metrics.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    ScheduleModule.forRoot(),
    AuthModule,
    LinksModule,
    QueueModule,
    RemindersModule,
    EventsModule,
    AiModule,
    WebhooksModule,
    IntegrationsModule,
    MonetizationModule,
    InternalModule,
  ],
  controllers: [MetricsController],
  providers: [PrismaService],
})
export class AppModule {}
