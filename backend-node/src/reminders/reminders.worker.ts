import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma.service";
import { RemindersService } from "./reminders.service";
import { PushService } from "./push.service";

const RESCHEDULE_AFTER_DAYS = 3;

@Injectable()
export class RemindersWorker {
  private readonly logger = new Logger(RemindersWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly remindersService: RemindersService,
    private readonly pushService: PushService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailySchedule() {
    this.logger.log("Running daily reminder scheduling for all users");
    const users = await this.prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      try {
        await this.remindersService.scheduleReminder(user.id);
      } catch (err: any) {
        this.logger.error(`Failed to schedule reminders for userId=${user.id}: ${err.message}`);
      }
    }
  }

  @Cron("* * * * *")
  async handleDuePushes() {
    const due = await this.prisma.reminderSchedule.findMany({
      where: { scheduledFor: { lte: new Date() }, notificationSent: false },
      include: { link: { include: { metadata: true } } },
    });

    for (const reminder of due) {
      try {
        await this.pushService.sendPush(
          reminder.id,
          reminder.userId,
          reminder.link.metadata?.title ?? reminder.link.originalUrl,
        );
        await this.prisma.reminderSchedule.update({
          where: { id: reminder.id },
          data: { notificationSent: true },
        });
      } catch (err: any) {
        this.logger.error(`Failed push for reminderId=${reminder.id}: ${err.message}`);
      }
    }
  }

  // Step 12: Re-schedule links whose reminder was sent but never opened
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleStaleReschedule() {
    this.logger.log("Checking for stale sent reminders to re-schedule");

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RESCHEDULE_AFTER_DAYS);

    // Find reminders sent more than N days ago where the link is still ACTIVE (not archived/read)
    const stale = await this.prisma.reminderSchedule.findMany({
      where: {
        notificationSent: true,
        scheduledFor: { lte: cutoff },
        link: { status: "ACTIVE", deletedAt: null },
      },
      include: { link: true },
      distinct: ["linkId"],
    });

    for (const reminder of stale) {
      try {
        // Reset notificationSent so CSP can re-schedule it
        await this.prisma.reminderSchedule.update({
          where: { id: reminder.id },
          data: { notificationSent: false, scheduledFor: new Date(Date.now() + 86400000) },
        });
        this.logger.log(`Re-scheduled stale reminder for linkId=${reminder.linkId}`);
      } catch (err: any) {
        this.logger.error(`Re-schedule failed for reminderId=${reminder.id}: ${err.message}`);
      }
    }

    if (stale.length) {
      this.logger.log(`Re-scheduled ${stale.length} stale reminders`);
    }
  }
}