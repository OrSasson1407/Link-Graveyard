import { Test, TestingModule } from "@nestjs/testing";
import { LinksService } from "./links.service";
import { PrismaService } from "../prisma.service";
import { QueueService } from "../queues/queue.service";
import { EventsGateway } from "../events/events.gateway";
import { NotFoundException, ForbiddenException } from "@nestjs/common";

const mockPrisma = {
  link: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockQueue = { addLinkIngestionJob: jest.fn() };
const mockGateway = { emitLinkProcessed: jest.fn() };

const baseLink = {
  id: "link-1",
  userId: "user-1",
  originalUrl: "https://example.com",
  status: "ACTIVE",
  category: "ARTICLE",
  createdAt: new Date(),
  metadata: {
    title: "Test",
    aiSummary: "Summary",
    previewImage: null,
    dynamicData: {},
  },
  intent: {
    inferredAction: "TO_READ",
    source: "WEB_EXT",
    rawContext: "context",
  },
};

describe("LinksService", () => {
  let service: LinksService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QueueService, useValue: mockQueue },
        { provide: EventsGateway, useValue: mockGateway },
      ],
    }).compile();
    service = module.get<LinksService>(LinksService);
  });

  describe("create", () => {
    it("should create a link and return link_id", async () => {
      mockPrisma.link.create.mockResolvedValue({ id: "link-1" });
      mockQueue.addLinkIngestionJob.mockResolvedValue(undefined);
      const result = await service.create("user-1", {
        url: "https://example.com",
        source: "WEB_EXT",
      });
      expect(result.data.link_id).toBe("link-1");
    });

    it("should set status PENDING on create", async () => {
      mockPrisma.link.create.mockResolvedValue({ id: "link-1" });
      mockQueue.addLinkIngestionJob.mockResolvedValue(undefined);
      const result = await service.create("user-1", {
        url: "https://example.com",
        source: "WEB_EXT",
      });
      expect(result.data.status).toBe("PENDING");
    });

    it("should push job to ingestion queue", async () => {
      mockPrisma.link.create.mockResolvedValue({ id: "link-1" });
      mockQueue.addLinkIngestionJob.mockResolvedValue(undefined);
      await service.create("user-1", {
        url: "https://example.com",
        source: "WEB_EXT",
      });
      expect(mockQueue.addLinkIngestionJob).toHaveBeenCalledWith(
        expect.objectContaining({ linkId: "link-1" }),
      );
    });

    it("should include context_text in queue job if provided", async () => {
      mockPrisma.link.create.mockResolvedValue({ id: "link-1" });
      mockQueue.addLinkIngestionJob.mockResolvedValue(undefined);
      await service.create("user-1", {
        url: "https://example.com",
        source: "WEB_EXT",
        context_text: "hello",
      });
      expect(mockQueue.addLinkIngestionJob).toHaveBeenCalledWith(
        expect.objectContaining({ contextText: "hello" }),
      );
    });

    it("should return message field in response", async () => {
      mockPrisma.link.create.mockResolvedValue({ id: "link-1" });
      mockQueue.addLinkIngestionJob.mockResolvedValue(undefined);
      const result = await service.create("user-1", {
        url: "https://example.com",
        source: "WEB_EXT",
      });
      expect(result.message).toBeDefined();
    });
  });

  describe("findAll", () => {
    it("should return paginated links with meta", async () => {
      mockPrisma.$transaction.mockResolvedValue([[baseLink], 1]);
      const result = await service.findAll("user-1", {});
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it("should default to status ACTIVE when no status provided", async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);
      await service.findAll("user-1", {});
      const txCall = mockPrisma.$transaction.mock.calls[0][0];
      expect(txCall).toBeDefined();
    });

    it("should apply category filter when provided", async () => {
      mockPrisma.$transaction.mockResolvedValue([[baseLink], 1]);
      const result = await service.findAll("user-1", { category: "ARTICLE" });
      expect(result.data[0].category).toBe("ARTICLE");
    });

    it("should return correct page in meta", async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);
      const result = await service.findAll("user-1", { page: 2 });
      expect(result.meta.page).toBe(2);
    });

    it("should map metadata fields correctly", async () => {
      mockPrisma.$transaction.mockResolvedValue([[baseLink], 1]);
      const result = await service.findAll("user-1", {});
      expect(result.data[0].metadata.ai_summary).toBe("Summary");
    });

    it("should handle null metadata gracefully", async () => {
      const linkNoMeta = { ...baseLink, metadata: null };
      mockPrisma.$transaction.mockResolvedValue([[linkNoMeta], 1]);
      const result = await service.findAll("user-1", {});
      expect(result.data[0].metadata).toBeNull();
    });
  });

  describe("updateStatus", () => {
    it("should update status successfully", async () => {
      mockPrisma.link.findUnique.mockResolvedValue({
        id: "link-1",
        userId: "user-1",
      });
      mockPrisma.link.update.mockResolvedValue({
        id: "link-1",
        status: "ARCHIVED",
      });
      const result = await service.updateStatus("link-1", "user-1", "ARCHIVED");
      expect(result.status).toBe("ARCHIVED");
    });

    it("should throw NotFoundException if link not found", async () => {
      mockPrisma.link.findUnique.mockResolvedValue(null);
      await expect(
        service.updateStatus("bad-id", "user-1", "ARCHIVED"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if userId mismatch", async () => {
      mockPrisma.link.findUnique.mockResolvedValue({
        id: "link-1",
        userId: "other-user",
      });
      await expect(
        service.updateStatus("link-1", "user-1", "ARCHIVED"),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("reconstructContext", () => {
    it("should return reconstructed story string", async () => {
      mockPrisma.link.findUnique.mockResolvedValue(baseLink);
      const result = await service.reconstructContext("link-1", "user-1");
      expect(result.reconstructed_story).toContain("Test");
    });

    it("should throw NotFoundException if link missing", async () => {
      mockPrisma.link.findUnique.mockResolvedValue(null);
      await expect(service.reconstructContext("bad", "user-1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ForbiddenException if wrong user", async () => {
      mockPrisma.link.findUnique.mockResolvedValue({
        ...baseLink,
        userId: "other",
      });
      await expect(
        service.reconstructContext("link-1", "user-1"),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should handle missing intent gracefully", async () => {
      mockPrisma.link.findUnique.mockResolvedValue({
        ...baseLink,
        intent: null,
      });
      const result = await service.reconstructContext("link-1", "user-1");
      expect(result.reconstructed_story).toBeDefined();
    });

    it("should include source in story when intent present", async () => {
      mockPrisma.link.findUnique.mockResolvedValue(baseLink);
      const result = await service.reconstructContext("link-1", "user-1");
      expect(result.reconstructed_story).toContain("WEB_EXT");
    });
  });

  describe("markAsProcessed", () => {
    it("should update link to ACTIVE status", async () => {
      mockPrisma.link.update.mockResolvedValue({
        ...baseLink,
        status: "ACTIVE",
      });
      const result = await service.markAsProcessed("link-1", {
        title: "Title",
        category: "DEV",
      });
      expect(mockPrisma.link.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "link-1" },
        }),
      );
    });

    it("should upsert metadata on process", async () => {
      mockPrisma.link.update.mockResolvedValue(baseLink);
      await service.markAsProcessed("link-1", {
        title: "T",
        aiSummary: "S",
        previewImage: "img.png",
      });
      const updateCall = mockPrisma.link.update.mock.calls[0][0];
      expect(updateCall.data.metadata.upsert.create.title).toBe("T");
    });

    it("should set inferredAction from data", async () => {
      mockPrisma.link.update.mockResolvedValue(baseLink);
      await service.markAsProcessed("link-1", {
        inferredAction: "CODE_REVIEW",
      });
      const updateCall = mockPrisma.link.update.mock.calls[0][0];
      expect(updateCall.data.intent.update.inferredAction).toBe("CODE_REVIEW");
    });
  });
});
