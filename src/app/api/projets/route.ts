import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const projects = await prisma.project.findMany({
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
  const { submit, leadInstructorId, coInstructorIds, helperIds, roomId, sessionTimes, ...projectData } = body;

  const project = await prisma.project.create({
    data: {
      ...projectData,
      status: submit ? "SUBMITTED" : "DRAFT",
      startDate: projectData.startDate ? new Date(projectData.startDate) : null,
      endDate: projectData.endDate ? new Date(projectData.endDate) : null,
      enrollmentOpen: projectData.enrollmentOpen ? new Date(projectData.enrollmentOpen) : null,
      enrollmentClose: projectData.enrollmentClose ? new Date(projectData.enrollmentClose) : null,
      createdById: session.user.id,
    },
  });

  // Assign lead instructor
  if (leadInstructorId) {
    await prisma.projectStaff.create({
      data: { projectId: project.id, userId: leadInstructorId, role: "LEAD" },
    });
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
        content: `The project "${project.title}" was submitted for review by ${session.user?.name}.`,
        link: `/projets/${project.id}`,
      })),
    });
  }

  return NextResponse.json(project, { status: 201 });
}
