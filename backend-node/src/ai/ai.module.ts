import { Module } from "@nestjs/common";
import { AiService } from "./ai.service";
import { AudioService } from "./audio.service";

@Module({
  providers: [AiService, AudioService],
  exports: [AiService, AudioService],
})
export class AiModule {}
