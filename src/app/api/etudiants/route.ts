import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const students = await prisma.student.findMany({
    orderBy: { lastName: "asc" },
    include: { _count: { select: { enrollments: true } } },
  });
  return NextResponse.json(students);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const student = await prisma.student.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      parentName: body.parentName,
      parentEmail: body.parentEmail,
      parentPhone: body.parentPhone,
      notes: body.notes,
      flags: body.flags,
    },
  });

  // Notify admins of new student
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "COMMITTEE"] }, isActive: true },
  });
  
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        title: "New student registered",
        content: `${student.firstName} ${student.lastName} has been added to the database.`,
        link: "/etudiants",
      })),
    });
  }

  return NextResponse.json(student, { status: 201 });
}
