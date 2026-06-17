import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue("link-ingestion-queue")
    private readonly linkIngestionQueue: Queue,
    @InjectQueue("dom-scraping-queue")
    private readonly domScrapingQueue: Queue,
    @InjectQueue("ai-analysis-queue")
    private readonly aiAnalysisQueue: Queue,
    @InjectQueue("reminder-scheduler-queue")
    private readonly reminderSchedulerQueue: Queue,
  ) {}

  async addLinkIngestionJob(data: {
    linkId: string;
    url: string;
    userId: string;
    contextText?: string;
  }) {
    return this.linkIngestionQueue.add("ingest", data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    });
  }

  async addDomScrapingJob(data: {
    linkId: string;
    url: string;
    userId: string;
    contextText?: string;
  }) {
    return this.domScrapingQueue.add("scrape", data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 3000 },
    });
  }

  async addAiAnalysisJob(data: {
    linkId: string;
    url: string;
    userId: string;
    title?: string;
    rawTextSample?: string;
    contextText?: string;
  }) {
    return this.aiAnalysisQueue.add("analyze", data, {
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 },
    });
  }

  async addReminderSchedulerJob(data: { userId: string }) {
    return this.reminderSchedulerQueue.add("schedule", data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    });
  }
}
