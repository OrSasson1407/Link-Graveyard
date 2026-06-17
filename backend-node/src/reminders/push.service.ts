import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  async sendPush(reminderId: string, userId: string, title: string) {
    // TODO: integrate APNs / FCM
    this.logger.log(
      `[PUSH] reminderId=${reminderId} userId=${userId} title="${title}"`,
    );
  }
}
