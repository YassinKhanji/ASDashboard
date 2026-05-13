import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage({ searchParams }: { searchParams: any }) {
  const range = searchParams?.range || "week";
  const days = range === "month" ? 30 : range === "year" ? 365 : 7;

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
    // Fetch recent enrollments to calculate activity for the selected range
    prisma.enrollment.findMany({
      where: {
        enrolledAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - days)),
        },
      },
      select: {
        enrolledAt: true,
      },
    }),
  ]);

  // Process enrollments into daily counts for the last 7 days
  const activityData = [
    { label: "Sun", count: 0 },
    { label: "Mon", count: 0 },
    { label: "Tue", count: 0 },
    { label: "Wed", count: 0 },
    { label: "Thu", count: 0 },
    { label: "Fri", count: 0 },
    { label: "Sat", count: 0 },
  ];

  recentEnrollments.forEach((e) => {
    const day = e.enrolledAt.getDay(); // 0 is Sunday
    activityData[day].count++;
  });

  // Calculate percentage height based on max count (with a minimum max of 10 for visual scale)
  const maxCount = Math.max(10, ...activityData.map(d => d.count));
  const chartData = activityData.map(d => ({
    label: d.label,
    val: d.count.toString(),
    height: `${Math.max(5, Math.round((d.count / maxCount) * 100))}%`, // Min height 5% for visibility
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
