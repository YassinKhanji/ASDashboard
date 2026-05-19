import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { expandAllPatterns, type SessionPatternFull } from "@/lib/sessionUtils";

/**
 * GET /api/rooms/[id]/availability?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&excludeProjectId=...
 * 
 * Returns booked and tentative slots for the room in the given date range.
 * - bookedSlots: from approved/active projects (firm bookings)
 * - tentativeSlots: from submitted/under-review projects (pending bookings)
 */

interface SlotInfo {
  day: number;           // 0=Sun .. 6=Sat
  startMinutes: number;
  endMinutes: number;
  projectName: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: roomId } = await params;
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const excludeProjectId = searchParams.get("excludeProjectId");

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "startDate and endDate are required" }, { status: 400 });
  }

  const rangeStart = new Date(startDate);
  const rangeEnd = new Date(endDate);

  // 1. Get real Session records from approved/active projects in this room
  const existingSessions = await prisma.session.findMany({
    where: {
      roomId,
      isCancelled: false,
      ...(excludeProjectId ? { projectId: { not: excludeProjectId } } : {}),
      startTime: { lte: rangeEnd },
      endTime: { gte: rangeStart },
      project: { status: { in: ["APPROVED", "ACTIVE"] } },
    },
    include: {
      project: { select: { title: true } },
    },
  });

  const bookedSlots: SlotInfo[] = existingSessions.map(s => {
    const d = new Date(s.startTime);
    return {
      day: d.getDay(),
      startMinutes: d.getHours() * 60 + d.getMinutes(),
      endMinutes: new Date(s.endTime).getHours() * 60 + new Date(s.endTime).getMinutes(),
      projectName: s.project.title,
    };
  });

  // 2. Get "virtual" sessions from submitted/under-review projects via sessionPatternsJson
  const pendingProjects = await prisma.project.findMany({
    where: {
      roomId,
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      ...(excludeProjectId ? { id: { not: excludeProjectId } } : {}),
      startDate: { not: null },
      endDate: { not: null },
      sessionPatternsJson: { not: null },
    },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      sessionPatternsJson: true,
    },
  });

  const tentativeSlots: SlotInfo[] = [];

  for (const project of pendingProjects) {
    if (!project.startDate || !project.endDate || !project.sessionPatternsJson) continue;

    let patterns: SessionPatternFull[] = [];
    try {
      patterns = JSON.parse(project.sessionPatternsJson);
    } catch { continue; }

    const expanded = expandAllPatterns(patterns, project.startDate, project.endDate);

    for (const session of expanded) {
      tentativeSlots.push({
        day: session.dayOfWeek,
        startMinutes: session.startMinutes,
        endMinutes: session.endMinutes,
        projectName: project.title,
      });
    }
  }

  // De-duplicate slots by day + time range
  const dedupSlots = (slots: SlotInfo[]) => {
    const seen = new Set<string>();
    return slots.filter(s => {
      const key = `${s.day}-${s.startMinutes}-${s.endMinutes}-${s.projectName}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return NextResponse.json({
    bookedSlots: dedupSlots(bookedSlots),
    tentativeSlots: dedupSlots(tentativeSlots),
  });
}
