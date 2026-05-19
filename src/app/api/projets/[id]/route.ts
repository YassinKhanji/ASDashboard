import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { canReviewProjects, canEditProject, canDeleteProjects } from "@/lib/permissions";
import { expandAllPatterns, parseTimeToMinutes, type SessionPatternFull } from "@/lib/sessionUtils";

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
      room: { select: { id: true, name: true, capacity: true, color: true } },
      staff: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      sessions: { include: { room: true }, orderBy: { startTime: "asc" } },
      enrollments: { include: { student: true }, orderBy: { enrolledAt: "desc" } },
      reviewActions: { include: { reviewer: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      discussions: { include: { messages: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "asc" } } } },
    },
  });

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // Parse stored session patterns for the response
  let sessionPatterns = null;
  try {
    if (project.sessionPatternsJson) sessionPatterns = JSON.parse(project.sessionPatternsJson);
  } catch {}

  return NextResponse.json({ ...project, sessionPatterns });
}

// ─── Helper: Generate recurring session records ─────────
// Uses shared expandAllPatterns to support weekly, biweekly, monthly, and custom frequencies.

async function generateSessionRecords(
  projectId: string,
  roomId: string,
  startDate: Date,
  endDate: Date,
  patterns: SessionPatternFull[]
) {
  const expanded = expandAllPatterns(patterns, startDate, endDate);

  const sessions = expanded.map(e => {
    const [sh, sm] = e.startTime.split(":").map(Number);
    const [eh, em] = e.endTime.split(":").map(Number);

    const sessionStart = new Date(e.date);
    sessionStart.setHours(sh, sm, 0, 0);

    const sessionEnd = new Date(e.date);
    sessionEnd.setHours(eh, em, 0, 0);

    return {
      projectId,
      roomId,
      startTime: sessionStart,
      endTime: sessionEnd,
    };
  });

  if (sessions.length > 0) {
    await prisma.session.createMany({ data: sessions });
  }

  return sessions.length;
}

// ─── Helper: Check for scheduling conflicts ─────────────

async function checkApprovalConflicts(projectId: string) {
  // Get all sessions for this project
  const projectSessions = await prisma.session.findMany({
    where: { projectId, isCancelled: false },
    include: { room: { select: { name: true } } },
  });

  const conflicts: {
    projectName: string;
    roomName: string;
    day: string;
    time: string;
  }[] = [];

  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  for (const sess of projectSessions) {
    // Find overlapping sessions in the same room from other approved/active projects
    const overlapping = await prisma.session.findFirst({
      where: {
        roomId: sess.roomId,
        isCancelled: false,
        projectId: { not: projectId },
        project: { status: { in: ["APPROVED", "ACTIVE"] } },
        startTime: { lt: sess.endTime },
        endTime: { gt: sess.startTime },
      },
      include: {
        project: { select: { title: true } },
        room: { select: { name: true } },
      },
    });

    if (overlapping) {
      const sessDate = new Date(sess.startTime);
      conflicts.push({
        projectName: overlapping.project.title,
        roomName: overlapping.room.name,
        day: DAY_NAMES[sessDate.getDay()],
        time: `${sessDate.getHours().toString().padStart(2, "0")}:${sessDate.getMinutes().toString().padStart(2, "0")}–${new Date(sess.endTime).getHours().toString().padStart(2, "0")}:${new Date(sess.endTime).getMinutes().toString().padStart(2, "0")}`,
      });
    }
  }

  // De-duplicate
  const seen = new Set<string>();
  return conflicts.filter(c => {
    const key = `${c.projectName}-${c.day}-${c.time}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

      case "approve": {
        if (!canReviewProjects(session.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        
        // Generate sessions from stored patterns on the project
        const sessionPatterns: SessionPatternFull[] = project.sessionPatternsJson
          ? JSON.parse(project.sessionPatternsJson)
          : [];
        const roomId = project.roomId;

        if (sessionPatterns.length > 0 && roomId && project.startDate && project.endDate) {
          // Clear any existing sessions first
          await prisma.session.deleteMany({ where: { projectId: id } });
          // Generate new session records
          await generateSessionRecords(
            id,
            roomId,
            new Date(project.startDate),
            new Date(project.endDate),
            sessionPatterns
          );
        }

        // Check for scheduling conflicts with other approved projects
        const conflicts = await checkApprovalConflicts(id);
        if (conflicts.length > 0) {
          // Roll back generated sessions since approval is blocked
          // Non-approved projects must not have calendar entries
          await prisma.session.deleteMany({ where: { projectId: id } });

          const conflictDetails = conflicts.map(c => 
            `• ${c.projectName} in ${c.roomName} on ${c.day} at ${c.time}`
          ).join("\n");

          return NextResponse.json({
            error: "Cannot approve — scheduling conflict detected",
            conflicts,
            message: `This project has scheduling conflicts with approved projects:\n${conflictDetails}\n\nResolve the conflicts before approving.`,
          }, { status: 409 });
        }

        await prisma.project.update({ where: { id }, data: { status: "APPROVED" } });
        await prisma.reviewAction.create({
          data: { projectId: id, reviewerId: fallbackId, action: "APPROVE", notes: body.notes || "" },
        });
        await prisma.notification.create({
          data: { userId: project.createdById, title: "Project approved", content: `Your project "${project.title}" has been approved.`, link: `/projets/${id}` },
        });
        break;
      }

      case "reject":
        if (!canReviewProjects(session.user.role)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        await prisma.project.update({ where: { id }, data: { status: "REJECTED" } });
        // Remove all sessions when rejected
        await prisma.session.deleteMany({ where: { projectId: id } });
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
        // Remove all sessions when revision requested
        await prisma.session.deleteMany({ where: { projectId: id } });
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
        // Remove calendar entries when archived
        await prisma.session.deleteMany({ where: { projectId: id } });
        break;
    }

    const updated = await prisma.project.findUnique({ where: { id } });
    return NextResponse.json(updated);
  }

  // Regular update
  const { startDate, endDate, enrollmentOpen, enrollmentClose, sessionPatterns: sp, ...rest } = body;
  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...rest,
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(enrollmentOpen !== undefined && { enrollmentOpen: enrollmentOpen ? new Date(enrollmentOpen) : null }),
      ...(enrollmentClose !== undefined && { enrollmentClose: enrollmentClose ? new Date(enrollmentClose) : null }),
      ...(sp !== undefined && { sessionPatternsJson: JSON.stringify(sp) }),
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
