import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { canViewAllProjects } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const where = canViewAllProjects(session.user.role as any) 
    ? {} 
    : {
        OR: [
          { createdById: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      };

  const projects = await prisma.project.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { enrollments: true, sessions: true } },
      staff: { include: { user: { select: { name: true } } } },
    },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { submit, leadInstructorId, coInstructorIds, helperIds, roomId, ...projectData } = body;

  // Find a valid admin or committee user to assign as creator
  const defaultAdmin = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "COMMITTEE"] } },
    select: { id: true, name: true }
  });

  if (!defaultAdmin) {
    return NextResponse.json({ error: "No valid admin user found in database." }, { status: 500 });
  }

  const project = await prisma.project.create({
    data: {
      ...projectData,
      status: submit ? "SUBMITTED" : "DRAFT",
      startDate: projectData.startDate ? new Date(projectData.startDate) : null,
      endDate: projectData.endDate ? new Date(projectData.endDate) : null,
      enrollmentOpen: projectData.enrollmentOpen ? new Date(projectData.enrollmentOpen) : null,
      enrollmentClose: projectData.enrollmentClose ? new Date(projectData.enrollmentClose) : null,
      createdById: defaultAdmin.id,
    },
  });

  // Assign lead instructor
  if (leadInstructorId) {
    await prisma.projectStaff.create({
      data: { projectId: project.id, userId: leadInstructorId, role: "LEAD" },
    });
  }

  // Generate sessions based on patterns
  if (project.startDate && project.endDate && body.sessionPatterns?.length > 0 && body.roomId) {
    const sessions = [];
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);

    for (const pattern of body.sessionPatterns) {
      let current = new Date(start);
      // Adjust to first occurrence of that day of week
      while (current.getDay() !== pattern.day) {
        current.setDate(current.getDate() + 1);
      }

      while (current <= end) {
        const [sh, sm] = pattern.startTime.split(":").map(Number);
        const [eh, em] = pattern.endTime.split(":").map(Number);
        
        const sessionStart = new Date(current);
        sessionStart.setHours(sh, sm, 0, 0);
        
        const sessionEnd = new Date(current);
        sessionEnd.setHours(eh, em, 0, 0);

        sessions.push({
          projectId: project.id,
          roomId: body.roomId,
          startTime: sessionStart,
          endTime: sessionEnd,
        });

        current.setDate(current.getDate() + 7);
      }
    }

    if (sessions.length > 0) {
      await prisma.session.createMany({ data: sessions });
    }
  }

  // Notify committee if submitted
  if (submit) {
    const committeeMembers = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "COMMITTEE"] }, isActive: true },
    });
    await prisma.notification.createMany({
      data: committeeMembers.map((m) => ({
        userId: m.id,
        title: "New project submitted",
        content: `The project "${project.title}" was submitted for review by ${defaultAdmin.name}.`,
        link: `/projets/${project.id}`,
      })),
    });
  }

  return NextResponse.json(project, { status: 201 });
}
