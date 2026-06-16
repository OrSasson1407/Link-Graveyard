import { Controller, Post, Body, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('worker/callback')
  @ApiOperation({ summary: 'Internal callback from Python scraping worker' })
  async workerCallback(
    @Body() body: any,
    @Headers('x-internal-secret') secret: string,
  ) {
    if (secret !== process.env.INTERNAL_WORKER_SECRET) {
      throw new UnauthorizedException('Invalid internal secret');
    }

    this.logger.log(Worker callback received for linkId=);
    return this.webhooksService.handleWorkerCallback(body);
  }

  @Post('whatsapp')
  @ApiOperation({ summary: 'WhatsApp Bot webhook for link ingestion' })
  async whatsappWebhook(@Body() body: any) {
    return this.webhooksService.handleWhatsappWebhook(body);
  }
}
