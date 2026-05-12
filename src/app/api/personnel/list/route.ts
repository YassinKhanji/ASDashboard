import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 401 });
  const staff = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, role: true, email: true, phone: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(staff);
}
