import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CspSolver } from './csp.solver';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cspSolver: CspSolver,
  ) {}

  async scheduleReminder(userId: string) {
    this.logger.log(`Running CSP for userId=${userId}`);

    const scheduled = await this.cspSolver.solveForUser(userId);

    for (const { linkId, scheduledFor } of scheduled) {
      const existing = await this.prisma.reminderSchedule.findFirst({
        where: { linkId, notificationSent: false },
      });

      if (existing) {
        await this.prisma.reminderSchedule.update({
          where: { id: existing.id },
          data: { scheduledFor },
        });
      } else {
        await this.prisma.reminderSchedule.create({
          data: { linkId, userId, scheduledFor, notificationSent: false },
        });
      }
    }

    this.logger.log(`Scheduled ${scheduled.length} reminders for userId=${userId}`);
    return scheduled;
  }
}
