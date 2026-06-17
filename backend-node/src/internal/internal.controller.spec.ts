import { Test, TestingModule } from '@nestjs/testing';
import { InternalController } from './internal.controller';
import { LinksService } from '../links/links.service';
import { QueueService } from '../queues/queue.service';
import { AiService } from '../ai/ai.service';
import { UnauthorizedException } from '@nestjs/common';

const mockLinks = { markAsProcessed: jest.fn(), updateStatus: jest.fn() };
const mockQueue = { addReminderSchedulerJob: jest.fn() };
const mockAi = {
  analyzeLink: jest.fn().mockResolvedValue({
    category: 'DEV', intent: 'CODE_REVIEW', summary: 'A PR.', dynamic_tags: ['ts'],
  }),
};

process.env.INTERNAL_WORKER_SECRET = 'test-secret';

describe('InternalController', () => {
  let controller: InternalController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InternalController],
      providers: [
        { provide: LinksService, useValue: mockLinks },
        { provide: QueueService, useValue: mockQueue },
        { provide: AiService, useValue: mockAi },
      ],
    }).compile();
    controller = module.get<InternalController>(InternalController);
  });

  it('should return 401 with wrong secret', async () => {
    await expect(
      controller.handleProcessedCallback({ link_id: 'l1', user_id: 'u1', success: true }, 'wrong-secret'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should call updateStatus ERROR on failed scrape', async () => {
    await controller.handleProcessedCallback({ link_id: 'l1', user_id: 'u1', success: false }, 'test-secret');
    expect(mockLinks.updateStatus).toHaveBeenCalledWith('l1', 'u1', 'ERROR');
  });

  it('should call analyzeLink on successful scrape', async () => {
    mockLinks.markAsProcessed.mockResolvedValue({});
    await controller.handleProcessedCallback({ link_id: 'l1', user_id: 'u1', success: true, raw_text_sample: 'text', context_text: 'ctx' }, 'test-secret');
    expect(mockAi.analyzeLink).toHaveBeenCalled();
  });

  it('should call markAsProcessed with AI result', async () => {
    mockLinks.markAsProcessed.mockResolvedValue({});
    await controller.handleProcessedCallback({ link_id: 'l1', user_id: 'u1', success: true }, 'test-secret');
    expect(mockLinks.markAsProcessed).toHaveBeenCalledWith('l1', expect.objectContaining({ category: 'DEV' }));
  });

  it('should schedule reminder after successful processing', async () => {
    mockLinks.markAsProcessed.mockResolvedValue({});
    await controller.handleProcessedCallback({ link_id: 'l1', user_id: 'u1', success: true }, 'test-secret');
    expect(mockQueue.addReminderSchedulerJob).toHaveBeenCalledWith({ userId: 'u1' });
  });

  it('should return ok:true on success', async () => {
    mockLinks.markAsProcessed.mockResolvedValue({});
    const result = await controller.handleProcessedCallback({ link_id: 'l1', user_id: 'u1', success: true }, 'test-secret');
    expect(result.ok).toBe(true);
  });

  it('should return ok:false on failed scrape', async () => {
    const result = await controller.handleProcessedCallback({ link_id: 'l1', user_id: 'u1', success: false }, 'test-secret');
    expect(result.ok).toBe(false);
  });

  it('should not call analyzeLink on failure', async () => {
    await controller.handleProcessedCallback({ link_id: 'l1', user_id: 'u1', success: false }, 'test-secret');
    expect(mockAi.analyzeLink).not.toHaveBeenCalled();
  });

  it('should pass preview_image to markAsProcessed', async () => {
    mockLinks.markAsProcessed.mockResolvedValue({});
    await controller.handleProcessedCallback({ link_id: 'l1', user_id: 'u1', success: true, preview_image: 'img.png' }, 'test-secret');
    expect(mockLinks.markAsProcessed).toHaveBeenCalledWith('l1', expect.objectContaining({ previewImage: 'img.png' }));
  });

  it('should pass title to markAsProcessed', async () => {
    mockLinks.markAsProcessed.mockResolvedValue({});
    await controller.handleProcessedCallback({ link_id: 'l1', user_id: 'u1', success: true, title: 'My Title' }, 'test-secret');
    expect(mockLinks.markAsProcessed).toHaveBeenCalledWith('l1', expect.objectContaining({ title: 'My Title' }));
  });
});
