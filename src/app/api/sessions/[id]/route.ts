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

  const sessionRecord = await prisma.session.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, title: true, type: true } },
      room: { select: { id: true, name: true, color: true, capacity: true } },
      attendance: {
        include: { student: { select: { id: true, firstName: true, lastName: true } } },
      },
    },
  });

  if (!sessionRecord) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  return NextResponse.json(sessionRecord);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  // If rescheduling, check for room conflicts
  const newStart = body.startTime ? new Date(body.startTime) : existing.startTime;
  const newEnd = body.endTime ? new Date(body.endTime) : existing.endTime;
  const newRoomId = body.roomId || existing.roomId;

  if (body.startTime || body.endTime || body.roomId) {
    const conflict = await prisma.session.findFirst({
      where: {
        id: { not: id },
        roomId: newRoomId,
        isCancelled: false,
        OR: [
          { startTime: { lt: newEnd }, endTime: { gt: newStart } },
        ],
      },
      include: { project: { select: { title: true } } },
    });

    if (conflict) {
      return NextResponse.json(
        { error: `Room conflict: "${conflict.project.title}" is already scheduled in this room at that time.` },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.session.update({
    where: { id },
    data: {
      ...(body.startTime && { startTime: new Date(body.startTime) }),
      ...(body.endTime && { endTime: new Date(body.endTime) }),
      ...(body.roomId && { roomId: body.roomId }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.isCancelled !== undefined && { isCancelled: body.isCancelled }),
    },
    include: {
      project: { select: { id: true, title: true } },
      room: { select: { id: true, name: true, color: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  await prisma.session.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
