import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const search = searchParams.get("search");
  const tag = searchParams.get("tag");

  const whereClause: any = {};
  
  if (projectId) whereClause.projectId = projectId;
  else whereClause.projectId = null;

  if (search) {
    whereClause.title = { contains: search, mode: "insensitive" };
  }

  if (tag) {
    whereClause.messages = {
      some: { tag: tag }
    };
  }

  const discussions = await prisma.discussion.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { author: { select: { name: true } } },
      },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(discussions);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const defaultAdmin = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "COMMITTEE"] } },
    select: { id: true }
  });
  const creatorId = defaultAdmin ? defaultAdmin.id : session.user.id;

  const discussion = await prisma.discussion.create({
    data: {
      title: body.title,
      projectId: body.projectId || null,
      createdById: creatorId,
    },
  });

  // Create the first message if provided
  if (body.message) {
    await prisma.message.create({
      data: {
        discussionId: discussion.id,
        authorId: creatorId,
        content: body.message,
        tag: body.tag || null,
      },
    });
  }

  return NextResponse.json(discussion, { status: 201 });
}
