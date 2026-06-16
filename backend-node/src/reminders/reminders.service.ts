import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CspSolver } from './csp.solver';
import { PushService } from './push.service';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cspSolver: CspSolver,
    private readonly pushService: PushService,
  ) {}

  async scheduleRemindersForUser(userId: string) {
    this.logger.log(Scheduling reminders for userId=);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const activeLinks = await this.prisma.link.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { metadata: true, context: true },
    });

    if (!activeLinks.length) return;

    const userTimezone = (user.preferences as any)?.timezone || 'UTC';
    const schedule = this.cspSolver.solve(activeLinks, userTimezone);

    // Persist scheduled reminders
    for (const item of schedule) {
      await this.prisma.reminderSchedule.upsert({
        where: { id: item.reminderId },
        create: {
          id: item.reminderId,
          linkId: item.linkId,
          userId,
          scheduledFor: item.scheduledFor,
        },
        update: {
          scheduledFor: item.scheduledFor,
        },
      });
    }

    this.logger.log(
      Scheduled  reminders for userId=,
    );
    return schedule;
  }

  async getPendingReminders() {
    const now = new Date();
    return this.prisma.reminderSchedule.findMany({
      where: {
        scheduledFor: { lte: now },
        notificationSent: false,
      },
      include: { link: { include: { metadata: true } }, user: true },
    });
  }

  async markReminderSent(reminderId: string) {
    return this.prisma.reminderSchedule.update({
      where: { id: reminderId },
      data: { notificationSent: true },
    });
  }
}
