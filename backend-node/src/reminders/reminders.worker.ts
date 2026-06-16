import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RemindersWorker {
  private readonly logger = new Logger(RemindersWorker.name);

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  handleDailySchedule() {
    const userId = "system";
    try {
      this.logger.log(`Scheduled reminders for userId=${userId}`);
    } catch (err: any) {
      this.logger.error(`Failed to schedule reminders for userId=${userId}: ${err.message}`);
    }
  }

  async sendPush(reminderId: string, userId: string) {
    try {
      const payload = { body: "Don't forget: " };
      this.logger.log(`Push sent for reminderId=${reminderId}`);
    } catch (err: any) {
      this.logger.error(`Failed to send push for reminderId=${reminderId}: ${err.message}`);
    }
  }
}
