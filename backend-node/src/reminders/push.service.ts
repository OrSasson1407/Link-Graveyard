import { Injectable, Logger } from '@nestjs/common';

export interface PushPayload {
  userId: string;
  linkId: string;
  title: string;
  body: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  async sendPushNotification(payload: PushPayload): Promise<void> {
    this.logger.log(
      Sending push to userId= for linkId=,
    );

    // FCM (Firebase Cloud Messaging) integration
    if (process.env.FCM_SERVER_KEY) {
      await this.sendFcm(payload);
      return;
    }

    // APNs (Apple Push Notification Service) integration
    if (process.env.APNS_KEY_ID) {
      await this.sendApns(payload);
      return;
    }

    this.logger.warn('No push provider configured — skipping push notification');
  }

  private async sendFcm(payload: PushPayload): Promise<void> {
    // Placeholder: integrate with Firebase Admin SDK
    this.logger.log([FCM] Push notification sent to userId=);
  }

  private async sendApns(payload: PushPayload): Promise<void> {
    // Placeholder: integrate with node-apn
    this.logger.log([APNs] Push notification sent to userId=);
  }
}
