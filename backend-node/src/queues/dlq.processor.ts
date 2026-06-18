import { Process, Processor } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import { PrismaService } from "../prisma.service";

@Processor("link-dlq")
export class DlqProcessor {
  private readonly logger = new Logger(DlqProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process("failed")
  async handleDeadLetter(job: Job) {
    const { linkId, jobName, queue, error, attempts } = job.data;

    this.logger.error(
      `[DLQ] Job "${jobName}" from "${queue}" dead after ${attempts} attempts | linkId=${linkId} | error=${error}`,
    );

    if (linkId) {
      await this.prisma.link.update({
        where: { id: linkId },
        data: {
          status: "FAILED",
          metadata: {
            upsert: {
              create: { dynamicData: { dlq: { error, attempts, queue, ts: new Date().toISOString() } } },
              update: { dynamicData: { dlq: { error, attempts, queue, ts: new Date().toISOString() } } },
            },
          },
        },
      });
    }
  }
}