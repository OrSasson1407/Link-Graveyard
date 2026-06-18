import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

interface TimeSlot {
  label: "MORNING" | "NOON" | "EVENING" | "WEEKEND";
  hour: number;
}

const TIME_SLOTS: TimeSlot[] = [
  { label: "MORNING", hour: 8 },
  { label: "NOON",    hour: 12 },
  { label: "EVENING", hour: 19 },
  { label: "WEEKEND", hour: 10 },
];

interface UserPreferences {
  maxRemindersPerDay?: number;
  quietHoursStart?: number;
  quietHoursEnd?: number;
  preferredSlots?: string[];
}

function getLocalHour(date: Date, timezone: string): number {
  try {
    return parseInt(
      new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "numeric", hour12: false }).format(date),
      10,
    );
  } catch {
    return date.getUTCHours();
  }
}

function getTimezoneOffsetMs(date: Date, timezone: string): number {
  const utcStr = date.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr  = date.toLocaleString("en-US", { timeZone: timezone });
  return new Date(utcStr).getTime() - new Date(tzStr).getTime();
}

function buildSlotDate(slot: TimeSlot, timezone: string): Date {
  const now = new Date();
  const candidate = new Date(now);

  if (slot.label === "WEEKEND") {
    const nowDay = now.getDay();
    const daysUntilSat = nowDay === 6 ? 7 : 6 - nowDay;
    candidate.setDate(now.getDate() + daysUntilSat);
  } else {
    if (getLocalHour(now, timezone) >= slot.hour) {
      candidate.setDate(now.getDate() + 1);
    }
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(candidate);

  const year  = parseInt(parts.find((p) => p.type === "year")!.value, 10);
  const month = parseInt(parts.find((p) => p.type === "month")!.value, 10) - 1;
  const day   = parseInt(parts.find((p) => p.type === "day")!.value, 10);

  const localSlot = new Date(
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(slot.hour).padStart(2, "0")}:00:00`,
  );

  return new Date(localSlot.getTime() - getTimezoneOffsetMs(localSlot, timezone));
}

@Injectable()
export class CspSolver {
  private readonly logger = new Logger(CspSolver.name);

  constructor(private readonly prisma: PrismaService) {}

  async solveForUser(userId: string): Promise<{ linkId: string; scheduledFor: Date }[]> {
    const links = await this.prisma.link.findMany({
      where: { userId, status: "ACTIVE", deletedAt: null },
      include: { intent: true },
      orderBy: { createdAt: "asc" },
    });
    if (!links.length) return [];

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const timezone = user?.timezone ?? "UTC";
    const prefs: UserPreferences = (user?.preferences as any) ?? {};

    // User-configurable hard constraints (with sensible defaults)
    const MAX_PER_DAY      = prefs.maxRemindersPerDay  ?? 2;
    const QUIET_START      = prefs.quietHoursStart     ?? 23;
    const QUIET_END        = prefs.quietHoursEnd       ?? 7;
    const preferredSlots   = prefs.preferredSlots      ?? [];

    const scheduledPerDay = new Map<string, number>();
    const results: { linkId: string; scheduledFor: Date }[] = [];

    for (const link of links) {
      const scored = TIME_SLOTS.map((slot) => {
        let score = 0;
        const isWeekend = slot.label === "WEEKEND";

        // User preferred slots get a big bonus
        if (preferredSlots.includes(slot.label)) score += 20;

        if (link.category === "VIDEO"   && isWeekend)                                          score += 10;
        if (link.category === "DEV"     && link.intent?.inferredAction === "CODE_REVIEW" && slot.label === "MORNING") score += 15;
        if (link.category === "ARTICLE" && slot.label === "EVENING")                           score += 5;
        if (link.category === "PRODUCT" && slot.label === "NOON")                              score += 5;
        if (link.category === "DOCS"    && slot.label === "MORNING")                           score += 8;
        if (link.category === "RECIPE"  && slot.label === "NOON")                              score += 8;

        return { slot, score };
      }).sort((a, b) => b.score - a.score);

      let scheduled = false;
      for (const { slot } of scored) {
        const targetDate = buildSlotDate(slot, timezone);
        const dayKey     = targetDate.toISOString().slice(0, 10);
        const count      = scheduledPerDay.get(dayKey) ?? 0;

        if (count >= MAX_PER_DAY) continue;

        const localHour = getLocalHour(targetDate, timezone);
        if (QUIET_START > QUIET_END) {
          if (localHour >= QUIET_START || localHour < QUIET_END) continue;
        } else {
          if (localHour >= QUIET_START && localHour < QUIET_END) continue;
        }

        scheduledPerDay.set(dayKey, count + 1);
        results.push({ linkId: link.id, scheduledFor: targetDate });
        scheduled = true;
        break;
      }

      if (!scheduled) {
        this.logger.warn(`Could not schedule link ${link.id} — all slots exhausted`);
      }
    }

    return results;
  }
}