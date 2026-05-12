import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ projects: [], students: [], staff: [], discussions: [] });
  }

  const query = q.toLowerCase();

  const [projects, students, staff, discussions] = await Promise.all([
    prisma.project.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, status: true, type: true },
      take: 5,
    }),
    prisma.student.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: "insensitive" } },
          { lastName: { contains: query, mode: "insensitive" } },
          { parentName: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, firstName: true, lastName: true },
      take: 5,
    }),
    prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, role: true },
      take: 5,
    }),
    prisma.discussion.findMany({
      where: {
        title: { contains: query, mode: "insensitive" },
      },
      select: { id: true, title: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({ projects, students, staff, discussions });
}
