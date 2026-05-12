import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { canReviewProjects, canEditProject, canDeleteProjects } from "@/lib/permissions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      staff: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      sessions: { include: { room: true }, orderBy: { startTime: "asc" } },
      enrollments: { include: { student: true }, orderBy: { enrolledAt: "desc" } },
      reviewActions: { include: { reviewer: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      discussions: { include: { messages: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "asc" } } } },
    },
  });

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Fetch default admin for valid relations since auth is mocked
  const defaultAdmin = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "COMMITTEE"] } },
    select: { id: true, name: true }
  });
  const fallbackId = defaultAdmin ? defaultAdmin.id : session.user.id;
  const fallbackName = defaultAdmin ? defaultAdmin.name : session.user.name;

  // Handle status transitions
  if (body.action) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    switch (body.action) {
      case "submit":
        await prisma.project.update({ where: { id }, data: { status: "SUBMITTED" } });
        // Notify committee
        const committee = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "COMMITTEE"] }, isActive: true } });
        await prisma.notification.createMany({
          data: committee.map(m => ({
            userId: m.id,
            title: "Project submitted for review",
            content: `"${project.title}" is waiting for your review.`,
            link: `/projets/${id}`,
          })),
        });
        break;

      case "approve":
        if (!canReviewProjects(session.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        await prisma.project.update({ where: { id }, data: { status: "APPROVED" } });
        await prisma.reviewAction.create({
          data: { projectId: id, reviewerId: fallbackId, action: "APPROVE", notes: body.notes || "" },
        });
        await prisma.notification.create({
          data: { userId: project.createdById, title: "Project approved", content: `Your project "${project.title}" has been approved.`, link: `/projets/${id}` },
        });
        break;

      case "reject":
        if (!canReviewProjects(session.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        await prisma.project.update({ where: { id }, data: { status: "REJECTED" } });
        await prisma.reviewAction.create({
          data: { projectId: id, reviewerId: fallbackId, action: "REJECT", notes: body.notes || "" },
        });
        await prisma.notification.create({
          data: { userId: project.createdById, title: "Project rejected", content: `Your project "${project.title}" has been rejected. Reason: ${body.notes}`, link: `/projets/${id}` },
        });
        break;

      case "request_revision":
        if (!canReviewProjects(session.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        await prisma.project.update({ where: { id }, data: { status: "DRAFT" } });
        await prisma.reviewAction.create({
          data: { projectId: id, reviewerId: fallbackId, action: "REQUEST_REVISION", notes: body.notes || "" },
        });
        await prisma.notification.create({
          data: { userId: project.createdById, title: "Revision requested", content: `Changes are requested for "${project.title}".`, link: `/projets/${id}` },
        });
        break;

      case "activate":
        await prisma.project.update({ where: { id }, data: { status: "ACTIVE" } });
        break;

      case "complete":
        await prisma.project.update({ where: { id }, data: { status: "COMPLETED" } });
        break;

      case "archive":
        await prisma.project.update({ where: { id }, data: { status: "ARCHIVED" } });
        break;
    }

    const updated = await prisma.project.findUnique({ where: { id } });
    return NextResponse.json(updated);
  }

  // Regular update
  const { startDate, endDate, enrollmentOpen, enrollmentClose, ...rest } = body;
  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...rest,
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(enrollmentOpen !== undefined && { enrollmentOpen: enrollmentOpen ? new Date(enrollmentOpen) : null }),
      ...(enrollmentClose !== undefined && { enrollmentClose: enrollmentClose ? new Date(enrollmentClose) : null }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !canDeleteProjects(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
