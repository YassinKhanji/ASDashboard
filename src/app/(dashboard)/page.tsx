import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage({ searchParams }: { searchParams: any }) {
  const range = searchParams?.range || "week";
  const now = new Date();
  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  const [
    projectCount,
    activeProjectCount,
    pendingReviewCount,
    studentCount,
    staffCount,
    upcomingSessions,
    recentProjects,
    recentEnrollments,
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
    // Fetch sessions for the next 7 days for the activity chart
    prisma.session.findMany({
      where: {
        startTime: { gte: now, lte: sevenDaysLater },
        isCancelled: false,
      },
      select: {
        startTime: true,
      },
    }),
  ]);

  // Process sessions into daily counts for the next 7 days
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const next7Days: { label: string; dateLabel: string; count: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    next7Days.push({
      label: dayLabels[d.getDay()],
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
      count: 0,
    });
  }

  recentEnrollments.forEach((s) => {
    const sDate = new Date(s.startTime);
    const sDateStr = `${sDate.getMonth() + 1}/${sDate.getDate()}`;
    const match = next7Days.find(d => d.dateLabel === sDateStr);
    if (match) match.count++;
  });

  const maxCount = Math.max(5, ...next7Days.map(d => d.count));
  const chartData = next7Days.map(d => ({
    label: d.label,
    dateLabel: d.dateLabel,
    val: d.count.toString(),
    height: `${Math.max(5, Math.round((d.count / maxCount) * 100))}%`,
  }));

  return (
    <DashboardClient
      stats={{
        projectCount,
        activeProjectCount,
        pendingReviewCount,
        studentCount,
        staffCount,
      }}
      activityData={chartData}
      currentRange={range}
      upcomingSessions={JSON.parse(JSON.stringify(upcomingSessions))}
      recentProjects={JSON.parse(JSON.stringify(recentProjects))}
      userRole={"ADMIN"}
    />
  );
}
