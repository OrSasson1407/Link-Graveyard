import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { QueueService } from "./queue.service";
import { QueueProcessor } from "./queue.processor";
import { DlqProcessor } from "./dlq.processor";
import { PrismaService } from "../prisma.service";
import { EventsModule } from "../events/events.module";
import { AiModule } from "../ai/ai.module";

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get("REDIS_HOST", "localhost"),
          port: config.get<number>("REDIS_PORT", 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: "link-ingestion-queue" },
      { name: "dom-scraping-queue" },
      { name: "ai-analysis-queue" },
      { name: "reminder-scheduler-queue" },
      { name: "link-dlq" },
    ),
    EventsModule,
    AiModule,
  ],
  providers: [QueueService, QueueProcessor, DlqProcessor, PrismaService],
  exports: [QueueService, BullModule],
})
export class QueueModule {}