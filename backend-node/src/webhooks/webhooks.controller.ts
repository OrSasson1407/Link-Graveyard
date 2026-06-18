import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { WebhooksService } from "./webhooks.service";

@ApiTags("webhooks")
@Controller("webhooks")
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post("worker-callback")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Internal callback from Python scraper worker" })
  async handleWorkerCallback(
    @Body() body: any,
    @Headers("x-internal-secret") secret: string,
  ) {
    if (secret !== process.env.INTERNAL_WORKER_SECRET) {
      throw new UnauthorizedException("Invalid internal secret");
    }
    return this.webhooksService.handleWorkerCallback(body);
  }

  @Post("whatsapp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Receive links from WhatsApp bot" })
  async handleWhatsapp(@Body() body: any) {
    return this.webhooksService.handleWhatsappWebhook(body);
  }
}