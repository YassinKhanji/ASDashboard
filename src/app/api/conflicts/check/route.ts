import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * POST /api/conflicts/check
 * 
 * Check for scheduling conflicts between proposed session patterns and existing sessions.
 * Returns hard conflicts (approved/active projects) and soft conflicts (pending/draft projects).
 */

interface SessionPattern {
  days: number[];      // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string;   // "HH:MM"
  endTime: string;     // "HH:MM"
}

interface CheckRequest {
  roomId: string;
  startDate: string;    // ISO date
  endDate: string;      // ISO date
  sessions: SessionPattern[];
  excludeProjectId?: string;  // Exclude this project's own sessions (for edit mode)
}

interface ConflictInfo {
  projectId: string;
  projectName: string;
  projectStatus: string;
  roomName: string;
  day: string;
  dayNumber: number;
  time: string;
  sessionId: string;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: CheckRequest = await req.json();
  const { roomId, startDate, endDate, sessions: proposedSessions, excludeProjectId } = body;

  if (!roomId || !startDate || !endDate || !proposedSessions?.length) {
    return NextResponse.json({ hardConflicts: [], softConflicts: [] });
  }

  const proposedStart = new Date(startDate);
  const proposedEnd = new Date(endDate);

  // Fetch all existing sessions in this room that overlap with the proposed date range
  const existingSessions = await prisma.session.findMany({
    where: {
      roomId,
      isCancelled: false,
      ...(excludeProjectId ? { projectId: { not: excludeProjectId } } : {}),
      // Date range overlap: session date must be within the proposed range
      startTime: { lte: proposedEnd },
      endTime: { gte: proposedStart },
    },
    include: {
      project: { select: { id: true, title: true, status: true } },
      room: { select: { name: true } },
    },
  });

  const hardConflicts: ConflictInfo[] = [];
  const softConflicts: ConflictInfo[] = [];

  for (const existingSession of existingSessions) {
    const sessionDate = new Date(existingSession.startTime);
    const dayOfWeek = sessionDate.getDay(); // 0=Sun, 1=Mon, ...
    const existingStartMinutes = sessionDate.getHours() * 60 + sessionDate.getMinutes();
    const existingEndDate = new Date(existingSession.endTime);
    const existingEndMinutes = existingEndDate.getHours() * 60 + existingEndDate.getMinutes();

    // Check each proposed session pattern
    for (const pattern of proposedSessions) {
      // Check if any proposed day matches this session's day of week
      if (!pattern.days.includes(dayOfWeek)) continue;

      // Parse proposed times
      const [pStartH, pStartM] = pattern.startTime.split(":").map(Number);
      const [pEndH, pEndM] = pattern.endTime.split(":").map(Number);
      const proposedStartMinutes = pStartH * 60 + pStartM;
      const proposedEndMinutes = pEndH * 60 + pEndM;

      // Time overlap check: startA < endB AND endA > startB
      if (proposedStartMinutes < existingEndMinutes && proposedEndMinutes > existingStartMinutes) {
        const conflict: ConflictInfo = {
          projectId: existingSession.project.id,
          projectName: existingSession.project.title,
          projectStatus: existingSession.project.status,
          roomName: existingSession.room.name,
          day: DAY_NAMES[dayOfWeek],
          dayNumber: dayOfWeek,
          time: `${pattern.startTime}–${pattern.endTime}`,
          sessionId: existingSession.id,
        };

        const isApproved = ["APPROVED", "ACTIVE"].includes(existingSession.project.status);
        if (isApproved) {
          hardConflicts.push(conflict);
        } else {
          softConflicts.push(conflict);
        }
      }
    }
  }

  // De-duplicate conflicts by project + day
  const dedup = (arr: ConflictInfo[]) => {
    const seen = new Set<string>();
    return arr.filter(c => {
      const key = `${c.projectId}-${c.dayNumber}-${c.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return NextResponse.json({
    hardConflicts: dedup(hardConflicts),
    softConflicts: dedup(softConflicts),
  });
}
