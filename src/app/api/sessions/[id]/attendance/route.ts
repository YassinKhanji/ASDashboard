import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Get attendance records for a session
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sessionId } = await params;

  // Get session with its project to find enrolled students
  const sessionRecord = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { projectId: true },
  });

  if (!sessionRecord) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  // Get enrolled students for this session's project
  const enrolledStudents = await prisma.enrollment.findMany({
    where: { projectId: sessionRecord.projectId, status: "CONFIRMED" },
    include: { student: { select: { id: true, firstName: true, lastName: true } } },
  });

  // Get existing attendance records
  const attendanceRecords = await prisma.attendance.findMany({
    where: { sessionId },
    include: { student: { select: { id: true, firstName: true, lastName: true } } },
  });

  // Merge: show all enrolled students with their attendance status (or null if not recorded)
  const attendanceMap = new Map(attendanceRecords.map(a => [a.studentId, a]));
  const merged = enrolledStudents.map(e => ({
    studentId: e.student.id,
    firstName: e.student.firstName,
    lastName: e.student.lastName,
    attendance: attendanceMap.get(e.student.id) || null,
  }));

  return NextResponse.json(merged);
}

// Record/update attendance for multiple students at once
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: sessionId } = await params;
  const body = await req.json();

  // Validate session exists
  const sessionRecord = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!sessionRecord) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  // body.records should be an array of { studentId, status }
  if (!Array.isArray(body.records)) {
    return NextResponse.json({ error: "records array is required" }, { status: 400 });
  }

  const validStatuses = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];
  const results = [];

  for (const record of body.records) {
    if (!record.studentId || !record.status) continue;
    if (!validStatuses.includes(record.status)) continue;

    const result = await prisma.attendance.upsert({
      where: {
        studentId_sessionId: { studentId: record.studentId, sessionId },
      },
      update: { status: record.status },
      create: {
        studentId: record.studentId,
        sessionId,
        status: record.status,
      },
    });
    results.push(result);
  }

  return NextResponse.json(results);
}
