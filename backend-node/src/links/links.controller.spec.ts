import { Test, TestingModule } from '@nestjs/testing';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  updateStatus: jest.fn(),
  reconstructContext: jest.fn(),
};

const mockUser = { id: 'user-1', email: 'a@b.com' };

describe('LinksController', () => {
  let controller: LinksController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LinksController],
      providers: [{ provide: LinksService, useValue: mockService }],
    }).compile();
    controller = module.get<LinksController>(LinksController);
  });

  it('should call create with userId from JWT', async () => {
    mockService.create.mockResolvedValue({ message: 'ok', data: { link_id: 'l1', status: 'PENDING' } });
    const req = { user: mockUser };
    await controller.create(req as any, { url: 'https://x.com', source: 'WEB_EXT' } as any);
    expect(mockService.create).toHaveBeenCalledWith('user-1', expect.any(Object));
  });

  it('should call findAll with userId and query params', async () => {
    mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } });
    const req = { user: mockUser };
    await controller.findAll(req as any, {} as any);
    expect(mockService.findAll).toHaveBeenCalledWith('user-1', expect.any(Object));
  });

  it('should call updateStatus with id and userId', async () => {
    mockService.updateStatus.mockResolvedValue({ id: 'l1', status: 'ARCHIVED' });
    const req = { user: mockUser };
    await controller.updateStatus('l1', req as any, { status: 'ARCHIVED' } as any);
    expect(mockService.updateStatus).toHaveBeenCalledWith('l1', 'user-1', 'ARCHIVED');
  });

  it('should call reconstructContext with id and userId', async () => {
    mockService.reconstructContext.mockResolvedValue({ reconstructed_story: 'You saved...' });
    const req = { user: mockUser };
    await controller.whyDidISaveThis('l1', req as any);
    expect(mockService.reconstructContext).toHaveBeenCalledWith('l1', 'user-1');
  });

  it('should return result from create', async () => {
    mockService.create.mockResolvedValue({ message: 'queued', data: { link_id: 'l1', status: 'PENDING' } });
    const req = { user: mockUser };
    const result = await controller.create(req as any, { url: 'https://x.com', source: 'WEB_EXT' } as any);
    expect(result.data.status).toBe('PENDING');
  });

  it('should return data from findAll', async () => {
    mockService.findAll.mockResolvedValue({ data: [{ id: 'l1' }], meta: { total: 1, page: 1, limit: 20 } });
    const req = { user: mockUser };
    const result = await controller.findAll(req as any, {} as any);
    expect(result.data).toHaveLength(1);
  });

  it('should pass category query param to findAll', async () => {
    mockService.findAll.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20 } });
    const req = { user: mockUser };
    await controller.findAll(req as any, { category: 'DEV' } as any);
    expect(mockService.findAll).toHaveBeenCalledWith('user-1', expect.objectContaining({ category: 'DEV' }));
  });

  it('should return reconstructed story from whyDidISaveThis', async () => {
    mockService.reconstructContext.mockResolvedValue({ reconstructed_story: 'You saved this on Monday' });
    const req = { user: mockUser };
    const result = await controller.whyDidISaveThis('l1', req as any);
    expect(result.reconstructed_story).toContain('Monday');
  });
});
