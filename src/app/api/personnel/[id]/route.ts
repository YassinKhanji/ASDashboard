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

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      availability: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  // Get assigned projects with role
  const projectAssignments = await prisma.projectStaff.findMany({
    where: { userId: id },
    include: {
      project: {
        select: { id: true, title: true, type: true, status: true, startDate: true, endDate: true },
      },
    },
  });

  // Get upcoming sessions for this staff member's projects
  const projectIds = projectAssignments.map(pa => pa.projectId);
  const upcomingSessions = await prisma.session.findMany({
    where: {
      projectId: { in: projectIds },
      startTime: { gte: new Date() },
      isCancelled: false,
    },
    orderBy: { startTime: "asc" },
    take: 10,
    include: {
      project: { select: { title: true } },
      room: { select: { name: true, color: true } },
    },
  });

  return NextResponse.json({
    ...user,
    projectAssignments,
    upcomingSessions,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Only admin can edit other users; users can edit their own availability
  const isAdmin = session.user.role === "ADMIN";
  const isSelf = session.user.id === id;

  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  // Non-admin can only update availability
  const data: Record<string, unknown> = {};
  if (body.availability !== undefined) data.availability = body.availability;

  if (isAdmin) {
    if (body.name !== undefined) data.name = body.name;
    if (body.email !== undefined) data.email = body.email;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.role !== undefined) data.role = body.role;
    if (body.isActive !== undefined) data.isActive = body.isActive;
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true, name: true, email: true, role: true, phone: true,
      availability: true, isActive: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  
  await prisma.user.delete({ where: { id } });
  
  return NextResponse.json({ success: true });
}
