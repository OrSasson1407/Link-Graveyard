import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";

const JOB_DEFAULTS = {
  removeOnComplete: 100,
  removeOnFail: false,
};

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
    @InjectQueue("link-dlq")
    private readonly dlq: Queue,
  ) {}

  async addLinkIngestionJob(data: {
    linkId: string;
    url: string;
    userId: string;
    contextText?: string;
  }) {
    return this.linkIngestionQueue.add("ingest", data, {
      ...JOB_DEFAULTS,
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
      ...JOB_DEFAULTS,
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
      ...JOB_DEFAULTS,
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 },
    });
  }

  async addReminderSchedulerJob(data: { userId: string }) {
    return this.reminderSchedulerQueue.add("schedule", data, {
      ...JOB_DEFAULTS,
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    });
  }

  async sendToDlq(data: {
    linkId: string;
    jobName: string;
    queue: string;
    error: string;
    attempts: number;
    payload: any;
  }) {
    return this.dlq.add("failed", data, {
      removeOnComplete: false,
      removeOnFail: false,
    });
  }
}