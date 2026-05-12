import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [
    projectCount,
    activeProjectCount,
    pendingReviewCount,
    studentCount,
    staffCount,
    upcomingSessions,
    recentProjects,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.project.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    prisma.student.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.session.findMany({
      where: {
        startTime: { gte: new Date() },
        isCancelled: false,
      },
      orderBy: { startTime: "asc" },
      take: 5,
      include: {
        project: { select: { title: true, type: true } },
        room: { select: { name: true, color: true } },
      },
    }),
    prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
    }),
  ]);

  return (
    <DashboardClient
      stats={{
        projectCount,
        activeProjectCount,
        pendingReviewCount,
        studentCount,
        staffCount,
      }}
      upcomingSessions={JSON.parse(JSON.stringify(upcomingSessions))}
      recentProjects={JSON.parse(JSON.stringify(recentProjects))}
      userRole={session.user.role}
    />
  );
}
