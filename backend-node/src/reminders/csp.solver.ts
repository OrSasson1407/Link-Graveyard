import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

interface TimeSlot {
  label: "MORNING" | "NOON" | "EVENING" | "WEEKEND";
  hour: number;
}

const TIME_SLOTS: TimeSlot[] = [
  { label: "MORNING", hour: 8 },
  { label: "NOON", hour: 12 },
  { label: "EVENING", hour: 19 },
  { label: "WEEKEND", hour: 10 },
];

@Injectable()
export class CspSolver {
  private readonly logger = new Logger(CspSolver.name);

  constructor(private readonly prisma: PrismaService) {}

  async solveForUser(
    userId: string,
  ): Promise<{ linkId: string; scheduledFor: Date }[]> {
    const links = await this.prisma.link.findMany({
      where: { userId, status: "ACTIVE" },
      include: { intent: true },
      orderBy: { createdAt: "asc" },
    });

    if (!links.length) return [];

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const tzOffset = parseInt(user?.tzOffset ?? "0", 10);

    // Hard constraint: max 2 notifications per day
    const MAX_PER_DAY = 2;
    const scheduledPerDay = new Map<string, number>();
    const results: { linkId: string; scheduledFor: Date }[] = [];

    for (const link of links) {
      // Score each slot via soft constraints
      const scored = TIME_SLOTS.map((slot) => {
        let score = 0;
        const isWeekend = slot.label === "WEEKEND";

        if (link.category === "VIDEO" && isWeekend) score += 10;
        if (
          link.category === "DEV" &&
          link.intent?.inferredAction === "CODE_REVIEW" &&
          slot.label === "MORNING"
        )
          score += 15;
        if (link.category === "ARTICLE" && slot.label === "EVENING") score += 5;
        if (link.category === "PRODUCT" && slot.label === "NOON") score += 5;

        return { slot, score };
      }).sort((a, b) => b.score - a.score);

      // Pick best slot that satisfies hard constraints
      let scheduled = false;
      for (const { slot } of scored) {
        const targetDate = this.getNextSlotDate(slot, tzOffset);
        const dayKey = targetDate.toISOString().slice(0, 10);

        const count = scheduledPerDay.get(dayKey) ?? 0;
        if (count >= MAX_PER_DAY) continue;

        // Hard constraint: no notifications between 23:00-07:00
        const localHour = (slot.hour + tzOffset + 24) % 24;
        if (localHour >= 23 || localHour < 7) continue;

        scheduledPerDay.set(dayKey, count + 1);
        results.push({ linkId: link.id, scheduledFor: targetDate });
        scheduled = true;
        break;
      }

      if (!scheduled) {
        this.logger.warn(
          `Could not schedule link ${link.id} — daily limit reached for all slots`,
        );
      }
    }

    return results;
  }

  private getNextSlotDate(slot: TimeSlot, tzOffset: number): Date {
    const now = new Date();
    const target = new Date(now);

    if (slot.label === "WEEKEND") {
      const day = now.getDay();
      const daysUntilSat = day === 6 ? 7 : 6 - day;
      target.setDate(now.getDate() + daysUntilSat);
    } else {
      if (now.getHours() >= slot.hour) {
        target.setDate(now.getDate() + 1);
      }
    }

    target.setHours(slot.hour - tzOffset, 0, 0, 0);
    return target;
  }
}
