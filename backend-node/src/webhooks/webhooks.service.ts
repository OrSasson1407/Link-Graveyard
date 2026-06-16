import { Injectable, Logger } from '@nestjs/common';
import { LinksService } from '../links/links.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly linksService: LinksService) {}

  async handleWorkerCallback(data: {
    linkId: string;
    title?: string;
    aiSummary?: string;
    previewImage?: string;
    dynamicData?: any;
    category?: string;
    inferredAction?: string;
  }) {
    await this.linksService.markAsProcessed(data.linkId, data);
    return { success: true };
  }

  async handleWhatsappWebhook(body: any) {
    this.logger.log('WhatsApp webhook received');
    // Extract URL from WhatsApp message body
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = (body?.message || '').match(urlRegex) || [];

    if (!urls.length) {
      return { success: false, message: 'No URL found in message' };
    }

    // Placeholder: resolve userId from WhatsApp sender ID
    const userId = body?.userId;
    if (!userId) return { success: false, message: 'No userId resolved' };

    await this.linksService.create(userId, {
      url: urls[0],
      source: 'WHATSAPP_BOT',
      context_text: body?.message,
    });

    return { success: true };
  }
}
