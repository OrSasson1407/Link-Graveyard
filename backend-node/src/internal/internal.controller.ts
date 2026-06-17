import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { LinksService } from "../links/links.service";
import { QueueService } from "../queues/queue.service";
import { AiService } from "../ai/ai.service";

class ProcessedCallbackDto {
  link_id: string;
  user_id: string;
  title?: string;
  preview_image?: string;
  raw_text_sample?: string;
  context_text?: string;
  success: boolean;
}

@Controller("internal")
export class InternalController {
  private readonly logger = new Logger(InternalController.name);

  constructor(
    private readonly linksService: LinksService,
    private readonly queueService: QueueService,
    private readonly aiService: AiService,
  ) {}

  @Post("links/processed")
  async handleProcessedCallback(
    @Body() dto: ProcessedCallbackDto,
    @Headers("x-internal-secret") secret: string,
  ) {
    if (secret !== process.env.INTERNAL_WORKER_SECRET) {
      throw new UnauthorizedException("Invalid internal secret");
    }

    this.logger.log(
      `Received callback for linkId=${dto.link_id}, success=${dto.success}`,
    );

    if (!dto.success) {
      await this.linksService.updateStatus(dto.link_id, dto.user_id, "ERROR");
      return { ok: false };
    }

    const aiResult = await this.aiService.analyzeLink({
      url: "",
      rawTextSample: dto.raw_text_sample ?? "",
      contextText: dto.context_text ?? "",
    });

    await this.linksService.markAsProcessed(dto.link_id, {
      title: dto.title,
      previewImage: dto.preview_image,
      aiSummary: aiResult.summary,
      dynamicData: { tags: aiResult.dynamic_tags },
      category: aiResult.category,
      inferredAction: aiResult.intent,
    });

    await this.queueService.addReminderSchedulerJob({ userId: dto.user_id });

    return { ok: true };
  }
}
