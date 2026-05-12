import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.room.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const updated = await prisma.room.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.capacity !== undefined && { capacity: body.capacity }),
      ...(body.color !== undefined && { color: body.color }),
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

  const existing = await prisma.room.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  // Check if room has any future sessions
  const futureSessions = await prisma.session.count({
    where: { roomId: id, startTime: { gte: new Date() }, isCancelled: false },
  });
  if (futureSessions > 0) {
    return NextResponse.json(
      { error: `Cannot delete room: ${futureSessions} upcoming session(s) are scheduled here.` },
      { status: 409 }
    );
  }

  await prisma.room.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
