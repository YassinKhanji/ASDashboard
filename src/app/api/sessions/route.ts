import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const sessions = await prisma.session.findMany({
    where: {
      project: { status: { in: ["APPROVED", "ACTIVE"] } },
    },
    orderBy: { startTime: "asc" },
    include: {
      project: { select: { id: true, title: true, type: true, status: true } },
      room: { select: { id: true, name: true, color: true } },
    },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Check for room conflicts
  const conflict = await prisma.session.findFirst({
    where: {
      roomId: body.roomId,
      isCancelled: false,
      OR: [
        { startTime: { lt: new Date(body.endTime) }, endTime: { gt: new Date(body.startTime) } },
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

  const newSession = await prisma.session.create({
    data: {
      projectId: body.projectId,
      roomId: body.roomId,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      notes: body.notes,
    },
  });

  return NextResponse.json(newSession, { status: 201 });
}
