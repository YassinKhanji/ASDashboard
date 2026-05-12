import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Check for duplicate email if email is being changed
  if (body.email && body.email !== existing.email) {
    const duplicate = await prisma.user.findUnique({ where: { email: body.email } });
    if (duplicate) {
      return NextResponse.json({ error: "This email address is already in use." }, { status: 409 });
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.role !== undefined && { role: body.role }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
    select: { id: true, name: true, email: true, role: true, phone: true, isActive: true },
  });

  return NextResponse.json(updated);
}

// Toggle active status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Prevent deactivating self
  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot deactivate your own account." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !existing.isActive },
    select: { id: true, name: true, email: true, role: true, phone: true, isActive: true },
  });

  return NextResponse.json(updated);
}
