import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      enrollments: {
        include: {
          project: {
            select: { id: true, title: true, type: true, status: true, maxCapacity: true },
          },
        },
        orderBy: { enrolledAt: "desc" },
      },
      attendance: {
        include: {
          session: {
            include: {
              project: { select: { title: true } },
              room: { select: { name: true } },
            },
          },
        },
        orderBy: { session: { startTime: "desc" } },
      },
    },
  });

  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  return NextResponse.json(student);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const updated = await prisma.student.update({
    where: { id },
    data: {
      ...(body.firstName !== undefined && { firstName: body.firstName }),
      ...(body.lastName !== undefined && { lastName: body.lastName }),
      ...(body.dateOfBirth !== undefined && { dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null }),
      ...(body.parentName !== undefined && { parentName: body.parentName }),
      ...(body.parentEmail !== undefined && { parentEmail: body.parentEmail }),
      ...(body.parentPhone !== undefined && { parentPhone: body.parentPhone }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.flags !== undefined && { flags: body.flags }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  await prisma.student.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
