import { Test, TestingModule } from "@nestjs/testing";
import { RemindersService } from "./reminders.service";
import { PrismaService } from "../prisma.service";
import { CspSolver } from "./csp.solver";

const mockPrisma = {
  reminderSchedule: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockCsp = { solveForUser: jest.fn() };

describe("RemindersService", () => {
  let service: RemindersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemindersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CspSolver, useValue: mockCsp },
      ],
    }).compile();
    service = module.get<RemindersService>(RemindersService);
  });

  it("should return empty array when CSP returns no results", async () => {
    mockCsp.solveForUser.mockResolvedValue([]);
    const result = await service.scheduleReminder("user-1");
    expect(result).toEqual([]);
  });

  it("should create new reminder if none exists", async () => {
    mockCsp.solveForUser.mockResolvedValue([
      { linkId: "l1", scheduledFor: new Date() },
    ]);
    mockPrisma.reminderSchedule.findFirst.mockResolvedValue(null);
    mockPrisma.reminderSchedule.create.mockResolvedValue({});
    await service.scheduleReminder("user-1");
    expect(mockPrisma.reminderSchedule.create).toHaveBeenCalled();
  });

  it("should update existing reminder if found", async () => {
    const newDate = new Date();
    mockCsp.solveForUser.mockResolvedValue([
      { linkId: "l1", scheduledFor: newDate },
    ]);
    mockPrisma.reminderSchedule.findFirst.mockResolvedValue({ id: "r1" });
    mockPrisma.reminderSchedule.update.mockResolvedValue({});
    await service.scheduleReminder("user-1");
    expect(mockPrisma.reminderSchedule.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "r1" },
        data: { scheduledFor: newDate },
      }),
    );
  });

  it("should not call create if reminder already exists", async () => {
    mockCsp.solveForUser.mockResolvedValue([
      { linkId: "l1", scheduledFor: new Date() },
    ]);
    mockPrisma.reminderSchedule.findFirst.mockResolvedValue({ id: "r1" });
    mockPrisma.reminderSchedule.update.mockResolvedValue({});
    await service.scheduleReminder("user-1");
    expect(mockPrisma.reminderSchedule.create).not.toHaveBeenCalled();
  });

  it("should schedule multiple reminders from CSP result", async () => {
    mockCsp.solveForUser.mockResolvedValue([
      { linkId: "l1", scheduledFor: new Date() },
      { linkId: "l2", scheduledFor: new Date() },
    ]);
    mockPrisma.reminderSchedule.findFirst.mockResolvedValue(null);
    mockPrisma.reminderSchedule.create.mockResolvedValue({});
    await service.scheduleReminder("user-1");
    expect(mockPrisma.reminderSchedule.create).toHaveBeenCalledTimes(2);
  });

  it("should return scheduled results from CSP", async () => {
    const slots = [{ linkId: "l1", scheduledFor: new Date() }];
    mockCsp.solveForUser.mockResolvedValue(slots);
    mockPrisma.reminderSchedule.findFirst.mockResolvedValue(null);
    mockPrisma.reminderSchedule.create.mockResolvedValue({});
    const result = await service.scheduleReminder("user-1");
    expect(result).toHaveLength(1);
  });

  it("should call CSP solver with correct userId", async () => {
    mockCsp.solveForUser.mockResolvedValue([]);
    await service.scheduleReminder("user-abc");
    expect(mockCsp.solveForUser).toHaveBeenCalledWith("user-abc");
  });

  it("should set notificationSent false on create", async () => {
    mockCsp.solveForUser.mockResolvedValue([
      { linkId: "l1", scheduledFor: new Date() },
    ]);
    mockPrisma.reminderSchedule.findFirst.mockResolvedValue(null);
    mockPrisma.reminderSchedule.create.mockResolvedValue({});
    await service.scheduleReminder("user-1");
    expect(mockPrisma.reminderSchedule.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ notificationSent: false }),
      }),
    );
  });
});
