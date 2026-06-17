import { Test, TestingModule } from "@nestjs/testing";
import { QueueService } from "./queue.service";
import { getQueueToken } from "@nestjs/bull";

const mockQueue = { add: jest.fn().mockResolvedValue({ id: "job-1" }) };

describe("QueueService", () => {
  let service: QueueService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: getQueueToken("link-ingestion-queue"), useValue: mockQueue },
        { provide: getQueueToken("dom-scraping-queue"), useValue: mockQueue },
        { provide: getQueueToken("ai-analysis-queue"), useValue: mockQueue },
        {
          provide: getQueueToken("reminder-scheduler-queue"),
          useValue: mockQueue,
        },
      ],
    }).compile();
    service = module.get<QueueService>(QueueService);
  });

  it("should add ingest job to link-ingestion-queue", async () => {
    await service.addLinkIngestionJob({
      linkId: "l1",
      url: "https://x.com",
      userId: "u1",
    });
    expect(mockQueue.add).toHaveBeenCalledWith(
      "ingest",
      expect.objectContaining({ linkId: "l1" }),
      expect.any(Object),
    );
  });

  it("should add scraping job to dom-scraping-queue", async () => {
    await service.addDomScrapingJob({
      linkId: "l1",
      url: "https://x.com",
      userId: "u1",
    });
    expect(mockQueue.add).toHaveBeenCalledWith(
      "scrape",
      expect.objectContaining({ linkId: "l1" }),
      expect.any(Object),
    );
  });

  it("should add ai analysis job to ai-analysis-queue", async () => {
    await service.addAiAnalysisJob({
      linkId: "l1",
      url: "https://x.com",
      userId: "u1",
      title: "T",
      rawTextSample: "",
      contextText: "",
    });
    expect(mockQueue.add).toHaveBeenCalledWith(
      "analyze",
      expect.any(Object),
      expect.any(Object),
    );
  });

  it("should add reminder job to reminder-scheduler-queue", async () => {
    await service.addReminderSchedulerJob({ userId: "u1" });
    expect(mockQueue.add).toHaveBeenCalledWith(
      "schedule",
      expect.objectContaining({ userId: "u1" }),
      expect.any(Object),
    );
  });

  it("should configure retry attempts on ingestion job", async () => {
    await service.addLinkIngestionJob({
      linkId: "l1",
      url: "https://x.com",
      userId: "u1",
    });
    const opts = mockQueue.add.mock.calls[0][2];
    expect(opts.attempts).toBeGreaterThan(1);
  });

  it("should configure exponential backoff on ingestion job", async () => {
    await service.addLinkIngestionJob({
      linkId: "l1",
      url: "https://x.com",
      userId: "u1",
    });
    const opts = mockQueue.add.mock.calls[0][2];
    expect(opts.backoff.type).toBe("exponential");
  });

  it("should include optional contextText in scraping job", async () => {
    await service.addDomScrapingJob({
      linkId: "l1",
      url: "https://x.com",
      userId: "u1",
      contextText: "ctx",
    });
    expect(mockQueue.add).toHaveBeenCalledWith(
      "scrape",
      expect.objectContaining({ contextText: "ctx" }),
      expect.any(Object),
    );
  });

  it("should return job object from add", async () => {
    const result = await service.addLinkIngestionJob({
      linkId: "l1",
      url: "https://x.com",
      userId: "u1",
    });
    expect(result).toBeDefined();
  });

  it("should include userId in scraping job payload", async () => {
    await service.addDomScrapingJob({
      linkId: "l1",
      url: "https://x.com",
      userId: "u1",
    });
    expect(mockQueue.add).toHaveBeenCalledWith(
      "scrape",
      expect.objectContaining({ userId: "u1" }),
      expect.any(Object),
    );
  });

  it("should include userId in ingestion job payload", async () => {
    await service.addLinkIngestionJob({
      linkId: "l1",
      url: "https://x.com",
      userId: "u1",
    });
    expect(mockQueue.add).toHaveBeenCalledWith(
      "ingest",
      expect.objectContaining({ userId: "u1" }),
      expect.any(Object),
    );
  });
});
