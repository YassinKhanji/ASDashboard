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

  const discussion = await prisma.discussion.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      project: { select: { id: true, title: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });

  if (!discussion) return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
  return NextResponse.json(discussion);
}

// Add a message to a discussion
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const defaultAdmin = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "COMMITTEE"] } },
    select: { id: true, name: true }
  });
  const creatorId = defaultAdmin ? defaultAdmin.id : session.user.id;
  const creatorName = defaultAdmin ? defaultAdmin.name : session.user.name;

  const message = await prisma.message.create({
    data: {
      discussionId: id,
      authorId: creatorId,
      content: body.content,
      tag: body.tag || null,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  // Notify participants (everyone who has posted in this thread, except the author)
  const participants = await prisma.message.findMany({
    where: { discussionId: id, authorId: { not: creatorId } },
    select: { authorId: true },
    distinct: ["authorId"],
  });

  const discussion = await prisma.discussion.findUnique({
    where: { id },
    select: { title: true, createdById: true },
  });

  const notifyIds = new Set(participants.map((p) => p.authorId));
  if (discussion && discussion.createdById !== creatorId) {
    notifyIds.add(discussion.createdById);
  }

  if (notifyIds.size > 0) {
    await prisma.notification.createMany({
      data: Array.from(notifyIds).map((userId) => ({
        userId,
        title: `New message in "${discussion?.title}"`,
        content: `${creatorName}: ${body.content.slice(0, 80)}${body.content.length > 80 ? "..." : ""}`,
        link: `/discussions/${id}`,
      })),
    });
  }

  return NextResponse.json(message, { status: 201 });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updated = await prisma.discussion.update({
    where: { id },
    data: { title: body.title },
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
  await prisma.discussion.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

