import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Enroll a student in a project
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: studentId } = await params;
  const body = await req.json();

  if (!body.projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  // Verify student exists
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  // Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: body.projectId },
    include: { _count: { select: { enrollments: true } } },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Check for duplicate enrollment
  const existing = await prisma.enrollment.findUnique({
    where: { studentId_projectId: { studentId, projectId: body.projectId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Student is already enrolled in this project" }, { status: 409 });
  }

  // Determine status: CONFIRMED if capacity available, WAITLIST if full
  const confirmedCount = await prisma.enrollment.count({
    where: { projectId: body.projectId, status: "CONFIRMED" },
  });
  const status = project.maxCapacity && confirmedCount >= project.maxCapacity
    ? "WAITLIST"
    : "CONFIRMED";

  const enrollment = await prisma.enrollment.create({
    data: {
      studentId,
      projectId: body.projectId,
      status: body.status || status,
    },
    include: {
      project: { select: { title: true } },
    },
  });

  return NextResponse.json(enrollment, { status: 201 });
}

// Remove enrollment
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: studentId } = await params;
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId query parameter is required" }, { status: 400 });
  }

  const existing = await prisma.enrollment.findUnique({
    where: { studentId_projectId: { studentId, projectId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
  }

  await prisma.enrollment.delete({
    where: { studentId_projectId: { studentId, projectId } },
  });

  return NextResponse.json({ ok: true });
}
