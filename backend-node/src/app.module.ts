import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthModule } from "./auth/auth.module";
import { LinksModule } from "./links/links.module";
import { QueueModule } from "./queues/queue.module";
import { RemindersModule } from "./reminders/reminders.module";
import { EventsModule } from "./events/events.module";
import { AiModule } from "./ai/ai.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { MonetizationModule } from "./monetization/monetization.module";
import { InternalModule } from "./internal/internal.module";
import { PrismaService } from "./prisma.service";
import { MetricsController } from "./common/metrics/metrics.controller";
import { validate } from "./config.validation";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate }),
    ThrottlerModule.forRoot([
      { name: "global",  ttl: 60000, limit: 60 },
      { name: "auth",    ttl: 60000, limit: 10 },
      { name: "ingest",  ttl: 60000, limit: 20 },
    ]),
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
  providers: [
    PrismaService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}