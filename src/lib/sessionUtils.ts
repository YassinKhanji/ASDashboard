/**
 * Session Pattern Utilities
 * 
 * Shared logic for expanding session patterns into concrete dates.
 * Used by: generateSessionRecords, /api/conflicts/check, /api/rooms/[id]/availability
 */

export interface SessionPatternFull {
  days: number[];              // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string;           // "HH:MM" in 24h
  endTime: string;             // "HH:MM" in 24h
  frequency?: "weekly" | "biweekly" | "monthly" | "custom";
  customIntervalDays?: number; // only used when frequency === "custom"
}

export interface ExpandedSession {
  date: Date;         // The specific calendar date
  dayOfWeek: number;  // 0=Sun .. 6=Sat
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
  startMinutes: number;
  endMinutes: number;
}

/**
 * Parse "HH:MM" into total minutes since midnight.
 */
export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Expand a single session pattern into an array of concrete session dates
 * between startDate and endDate (inclusive).
 */
export function expandPatternToDates(
  pattern: SessionPatternFull,
  startDate: Date,
  endDate: Date
): ExpandedSession[] {
  const results: ExpandedSession[] = [];
  const frequency = pattern.frequency || "weekly";

  if (!pattern.days?.length || !pattern.startTime || !pattern.endTime) {
    return results;
  }

  const startMinutes = parseTimeToMinutes(pattern.startTime);
  const endMinutes = parseTimeToMinutes(pattern.endTime);
  if (startMinutes >= endMinutes) return results;

  for (const targetDay of pattern.days) {
    // Find first occurrence of this day of week from startDate
    const first = new Date(startDate);
    first.setHours(0, 0, 0, 0);
    while (first.getDay() !== targetDay) {
      first.setDate(first.getDate() + 1);
    }

    const endBound = new Date(endDate);
    endBound.setHours(23, 59, 59, 999);

    const current = new Date(first);

    while (current <= endBound) {
      results.push({
        date: new Date(current),
        dayOfWeek: targetDay,
        startTime: pattern.startTime,
        endTime: pattern.endTime,
        startMinutes,
        endMinutes,
      });

      // Advance based on frequency
      switch (frequency) {
        case "biweekly":
          current.setDate(current.getDate() + 14);
          break;

        case "monthly": {
          // Move to the same weekday in the next month
          // E.g., "first Monday of next month"
          const nextMonth = new Date(current);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          nextMonth.setDate(1);
          // Find the first occurrence of targetDay in next month
          while (nextMonth.getDay() !== targetDay) {
            nextMonth.setDate(nextMonth.getDate() + 1);
          }
          current.setTime(nextMonth.getTime());
          break;
        }

        case "custom": {
          const interval = pattern.customIntervalDays || 7;
          current.setDate(current.getDate() + interval);
          break;
        }

        case "weekly":
        default:
          current.setDate(current.getDate() + 7);
          break;
      }
    }
  }

  // Sort by date
  results.sort((a, b) => a.date.getTime() - b.date.getTime());
  return results;
}

/**
 * Expand multiple patterns into a flat list of concrete sessions.
 */
export function expandAllPatterns(
  patterns: SessionPatternFull[],
  startDate: Date,
  endDate: Date
): ExpandedSession[] {
  return patterns.flatMap(p => expandPatternToDates(p, startDate, endDate));
}

/**
 * Check if two time ranges overlap.
 * Returns true if [startA, endA) overlaps [startB, endB).
 */
export function timesOverlap(
  startA: number, endA: number,
  startB: number, endB: number
): boolean {
  return startA < endB && endA > startB;
}
