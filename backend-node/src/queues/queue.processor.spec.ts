import { Test, TestingModule } from '@nestjs/testing';
import { QueueProcessor } from './queue.processor';
import { QueueService } from './queue.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

const mockQueue = { addDomScrapingJob: jest.fn(), addReminderSchedulerJob: jest.fn() };
const mockAi = {
  analyzeLink: jest.fn().mockResolvedValue({ category: 'DEV', intent: 'CODE_REVIEW', summary: 'S', dynamic_tags: [] }),
};
const mockPrisma = { link: { update: jest.fn() } };
const mockGateway = { emitLinkProcessed: jest.fn() };

describe('QueueProcessor', () => {
  let processor: QueueProcessor;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueProcessor,
        { provide: QueueService, useValue: mockQueue },
        { provide: AiService, useValue: mockAi },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsGateway, useValue: mockGateway },
      ],
    }).compile();
    processor = module.get<QueueProcessor>(QueueProcessor);
  });

  describe('handleIngestion', () => {
    it('should forward valid URL to dom-scraping-queue', async () => {
      await processor.handleIngestion({ data: { linkId: 'l1', url: 'https://x.com', userId: 'u1' } } as any);
      expect(mockQueue.addDomScrapingJob).toHaveBeenCalledWith(expect.objectContaining({ linkId: 'l1' }));
    });

    it('should set link status to ERROR on invalid URL', async () => {
      await expect(processor.handleIngestion({ data: { linkId: 'l1', url: 'not-a-url', userId: 'u1' } } as any)).rejects.toThrow();
      expect(mockPrisma.link.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'ERROR' } }));
    });

    it('should pass contextText to scraping job', async () => {
      await processor.handleIngestion({ data: { linkId: 'l1', url: 'https://x.com', userId: 'u1', contextText: 'ctx' } } as any);
      expect(mockQueue.addDomScrapingJob).toHaveBeenCalledWith(expect.objectContaining({ contextText: 'ctx' }));
    });
  });

  describe('handleAiAnalysis', () => {
    it('should call analyzeLink with correct payload', async () => {
      mockPrisma.link.update.mockResolvedValue({});
      await processor.handleAiAnalysis({ data: { linkId: 'l1', url: 'https://x.com', userId: 'u1', rawTextSample: 'text', contextText: 'ctx' } } as any);
      expect(mockAi.analyzeLink).toHaveBeenCalled();
    });

    it('should update link to ACTIVE after AI analysis', async () => {
      mockPrisma.link.update.mockResolvedValue({});
      await processor.handleAiAnalysis({ data: { linkId: 'l1', url: 'https://x.com', userId: 'u1', rawTextSample: '', contextText: '' } } as any);
      expect(mockPrisma.link.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'ACTIVE' }),
      }));
    });

    it('should emit link.processed WebSocket event', async () => {
      mockPrisma.link.update.mockResolvedValue({});
      await processor.handleAiAnalysis({ data: { linkId: 'l1', url: 'https://x.com', userId: 'u1', rawTextSample: '', contextText: '' } } as any);
      expect(mockGateway.emitLinkProcessed).toHaveBeenCalledWith('u1', 'l1', expect.any(Object));
    });

    it('should schedule reminder after AI analysis', async () => {
      mockPrisma.link.update.mockResolvedValue({});
      await processor.handleAiAnalysis({ data: { linkId: 'l1', url: 'https://x.com', userId: 'u1', rawTextSample: '', contextText: '' } } as any);
      expect(mockQueue.addReminderSchedulerJob).toHaveBeenCalledWith({ userId: 'u1' });
    });

    it('should throw on AI analysis failure', async () => {
      mockAi.analyzeLink.mockRejectedValueOnce(new Error('AI down'));
      await expect(processor.handleAiAnalysis({ data: { linkId: 'l1', url: 'https://x.com', userId: 'u1', rawTextSample: '', contextText: '' } } as any)).rejects.toThrow();
    });
  });
});
