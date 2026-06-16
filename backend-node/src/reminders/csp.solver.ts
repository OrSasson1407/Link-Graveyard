import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface LinkForScheduling {
  id: string;
  category: string | null;
  context: { inferredAction: string | null } | null;
}

export interface ScheduledReminder {
  reminderId: string;
  linkId: string;
  scheduledFor: Date;
  slot: string;
}

@Injectable()
export class CspSolver {
  private readonly logger = new Logger(CspSolver.name);

  // Time slot definitions (24h)
  private readonly TIME_SLOTS = {
    Morning: 8,   // 08:00
    Noon: 12,     // 12:00
    Evening: 19,  // 19:00
    Weekend: 10,  // 10:00 Saturday
  };

  solve(links: LinkForScheduling[], timezone: string): ScheduledReminder[] {
    const schedule: ScheduledReminder[] = [];
    const dailyCount: Record<string, number> = {};

    for (const link of links) {
      const slot = this.scoreBestSlot(link);
      const scheduledFor = this.resolveSlotTime(slot, timezone, dailyCount);

      if (!scheduledFor) {
        this.logger.warn(Could not schedule link  — daily limit reached);
        continue;
      }

      const dateKey = scheduledFor.toISOString().split('T')[0];
      dailyCount[dateKey] = (dailyCount[dateKey] || 0) + 1;

      schedule.push({
        reminderId: uuidv4(),
        linkId: link.id,
        scheduledFor,
        slot,
      });
    }

    return schedule;
  }

  private scoreBestSlot(link: LinkForScheduling): string {
    const scores: Record<string, number> = {
      Morning: 0,
      Noon: 0,
      Evening: 0,
      Weekend: 0,
    };

    // Soft constraint: DEV + CODE_REVIEW → Morning (+15)
    if (
      link.category === 'DEV' &&
      link.context?.inferredAction === 'CODE_REVIEW'
    ) {
      scores['Morning'] += 15;
    }

    // Soft constraint: VIDEO → Weekend (+10)
    if (link.category === 'VIDEO') {
      scores['Weekend'] += 10;
    }

    // Soft constraint: ARTICLE → Evening (+5)
    if (link.category === 'ARTICLE') {
      scores['Evening'] += 5;
    }

    // Soft constraint: PRODUCT/TO_BUY → Noon (+8)
    if (
      link.category === 'PRODUCT' &&
      link.context?.inferredAction === 'TO_BUY'
    ) {
      scores['Noon'] += 8;
    }

    // Return slot with highest score
    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  }

  private resolveSlotTime(
    slot: string,
    timezone: string,
    dailyCount: Record<string, number>,
  ): Date | null {
    const now = new Date();

    // Hard constraint: no notifications between 23:00 and 07:00
    const hour = this.TIME_SLOTS[slot];

    let targetDate = new Date(now);
    targetDate.setHours(hour, 0, 0, 0);

    // If time has already passed today, schedule for tomorrow
    if (targetDate <= now) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    // For Weekend slot, advance to next Saturday
    if (slot === 'Weekend') {
      const dayOfWeek = targetDate.getDay();
      const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
      targetDate.setDate(targetDate.getDate() + daysUntilSaturday);
    }

    // Hard constraint: max 2 notifications per day
    const dateKey = targetDate.toISOString().split('T')[0];
    if ((dailyCount[dateKey] || 0) >= 2) {
      // Try next day
      targetDate.setDate(targetDate.getDate() + 1);
      const nextKey = targetDate.toISOString().split('T')[0];
      if ((dailyCount[nextKey] || 0) >= 2) {
        return null; // Cannot schedule
      }
    }

    return targetDate;
  }
}
