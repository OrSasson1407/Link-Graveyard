import { Controller, Post, Body, Logger } from '@nestjs/common';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  @Post('worker-callback')
  handleWorkerCallback(@Body() body: any) {
    const linkId = body?.linkId || 'unknown';
    this.logger.log(`Worker callback received for linkId=${linkId}`);
    return { status: 'received' };
  }
}
