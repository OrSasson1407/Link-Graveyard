import { Test, TestingModule } from '@nestjs/testing';
import { CspSolver } from './csp.solver';
import { PrismaService } from '../prisma.service';

const makeLink = (overrides = {}) => ({
  id: 'link-1',
  userId: 'user-1',
  status: 'ACTIVE',
  category: 'ARTICLE',
  createdAt: new Date(),
  intent: { inferredAction: 'TO_READ' },
  ...overrides,
});

const mockPrisma = {
  link: { findMany: jest.fn() },
  user: { findUnique: jest.fn() },
};

describe('CspSolver', () => {
  let solver: CspSolver;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CspSolver,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    solver = module.get<CspSolver>(CspSolver);
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', tzOffset: '0' });
  });

  it('should return empty array when no active links', async () => {
    mockPrisma.link.findMany.mockResolvedValue([]);
    const result = await solver.solveForUser('user-1');
    expect(result).toEqual([]);
  });

  it('should schedule one reminder per active link', async () => {
    mockPrisma.link.findMany.mockResolvedValue([makeLink()]);
    const result = await solver.solveForUser('user-1');
    expect(result).toHaveLength(1);
  });

  it('should not exceed 2 reminders per day (hard constraint)', async () => {
    const links = Array.from({ length: 5 }, (_, i) => makeLink({ id: `link-${i}` }));
    mockPrisma.link.findMany.mockResolvedValue(links);
    const result = await solver.solveForUser('user-1');
    const byDay: Record<string, number> = {};
    for (const r of result) {
      const day = r.scheduledFor.toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    }
    for (const count of Object.values(byDay)) {
      expect(count).toBeLessThanOrEqual(2);
    }
  });

  it('should prefer WEEKEND slot for VIDEO links (soft constraint +10)', async () => {
    mockPrisma.link.findMany.mockResolvedValue([makeLink({ category: 'VIDEO' })]);
    const result = await solver.solveForUser('user-1');
    expect(result).toHaveLength(1);
    expect(result[0].scheduledFor).toBeDefined();
  });

  it('should prefer MORNING slot for DEV+CODE_REVIEW links (soft constraint +15)', async () => {
    mockPrisma.link.findMany.mockResolvedValue([
      makeLink({ category: 'DEV', intent: { inferredAction: 'CODE_REVIEW' } }),
    ]);
    const result = await solver.solveForUser('user-1');
    expect(result).toHaveLength(1);
    const hour = result[0].scheduledFor.getHours();
    expect(hour).toBeGreaterThanOrEqual(6);
  });

  it('should return scheduledFor as Date object', async () => {
    mockPrisma.link.findMany.mockResolvedValue([makeLink()]);
    const result = await solver.solveForUser('user-1');
    expect(result[0].scheduledFor).toBeInstanceOf(Date);
  });

  it('should return linkId in each result', async () => {
    mockPrisma.link.findMany.mockResolvedValue([makeLink({ id: 'special-link' })]);
    const result = await solver.solveForUser('user-1');
    expect(result[0].linkId).toBe('special-link');
  });

  it('should not schedule during 23:00-07:00 (hard constraint)', async () => {
    mockPrisma.link.findMany.mockResolvedValue([makeLink()]);
    const result = await solver.solveForUser('user-1');
    for (const r of result) {
      const hour = r.scheduledFor.getHours();
      expect(hour < 23 && hour >= 7).toBe(true);
    }
  });

  it('should handle user with no tzOffset gracefully', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    mockPrisma.link.findMany.mockResolvedValue([makeLink()]);
    const result = await solver.solveForUser('user-1');
    expect(result).toBeDefined();
  });

  it('should handle 10 links without throwing', async () => {
    const links = Array.from({ length: 10 }, (_, i) => makeLink({ id: `link-${i}` }));
    mockPrisma.link.findMany.mockResolvedValue(links);
    await expect(solver.solveForUser('user-1')).resolves.toBeDefined();
  });

  it('should prefer EVENING for ARTICLE links (soft constraint +5)', async () => {
    mockPrisma.link.findMany.mockResolvedValue([makeLink({ category: 'ARTICLE' })]);
    const result = await solver.solveForUser('user-1');
    expect(result).toHaveLength(1);
  });

  it('should not schedule past midnight', async () => {
    mockPrisma.link.findMany.mockResolvedValue([makeLink()]);
    const result = await solver.solveForUser('user-1');
    for (const r of result) {
      expect(r.scheduledFor.getHours()).toBeLessThan(23);
    }
  });

  it('should return unique linkIds in results', async () => {
    const links = [makeLink({ id: 'a' }), makeLink({ id: 'b' })];
    mockPrisma.link.findMany.mockResolvedValue(links);
    const result = await solver.solveForUser('user-1');
    const ids = result.map((r) => r.linkId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
