import { Module } from "@nestjs/common";
import { RemindersService } from "./reminders.service";
import { RemindersWorker } from "./reminders.worker";
import { CspSolver } from "./csp.solver";
import { PushService } from "./push.service";
import { PrismaService } from "../prisma.service";
import { EventsModule } from "../events/events.module";

@Module({
  imports: [EventsModule],
  providers: [
    RemindersService,
    RemindersWorker,
    CspSolver,
    PushService,
    PrismaService,
  ],
  exports: [RemindersService],
})
export class RemindersModule {}
