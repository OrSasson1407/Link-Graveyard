import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma.service";
import { RemindersService } from "./reminders.service";
import { PushService } from "./push.service";

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
        this.logger.error(
          `Failed to schedule reminders for userId=${user.id}: ${err.message}`,
        );
      }
    }
  }

  @Cron("* * * * *")
  async handleDuePushes() {
    const due = await this.prisma.reminderSchedule.findMany({
      where: {
        scheduledFor: { lte: new Date() },
        notificationSent: false,
      },
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
        this.logger.error(
          `Failed push for reminderId=${reminder.id}: ${err.message}`,
        );
      }
    }
  }
}
