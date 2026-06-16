import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { RemindersService } from './reminders.service';
import { PushService } from './push.service';

@Injectable()
export class RemindersWorker {
  private readonly logger = new Logger(RemindersWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly remindersService: RemindersService,
    private readonly pushService: PushService,
  ) {}

  // Run daily at 00:01 for each user
  @Cron('1 0 * * *')
  async runDailyScheduler() {
    this.logger.log('Running daily CSP reminder scheduler');

    const users = await this.prisma.user.findMany({
      select: { id: true },
    });

    for (const user of users) {
      try {
        await this.remindersService.scheduleRemindersForUser(user.id);
      } catch (err) {
        this.logger.error(
          Failed to schedule reminders for userId=: ,
        );
      }
    }
  }

  // Poll every minute for due reminders
  @Cron(CronExpression.EVERY_MINUTE)
  async dispatchDueReminders() {
    const pending = await this.remindersService.getPendingReminders();

    for (const reminder of pending) {
      try {
        await this.pushService.sendPushNotification({
          userId: reminder.userId,
          linkId: reminder.linkId,
          title: reminder.link.metadata?.title || 'Link Graveyard Reminder',
          body: Don't forget: ,
        });

        await this.remindersService.markReminderSent(reminder.id);
        this.logger.log(Push sent for reminderId=);
      } catch (err) {
        this.logger.error(
          Failed to send push for reminderId=: ,
        );
      }
    }
  }
}
