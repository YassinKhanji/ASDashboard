import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@avenirsouriant.ca" },
    update: {},
    create: {
      name: "ASC Administrator",
      email: "admin@avenirsouriant.ca",
      passwordHash: adminPassword,
      role: "ADMIN",
      phone: "514-555-0100",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Create committee member
  const committeePassword = await hash("comite123", 12);
  const committee = await prisma.user.upsert({
    where: { email: "comite@avenirsouriant.ca" },
    update: {},
    create: {
      name: "Marie Dupont",
      email: "comite@avenirsouriant.ca",
      passwordHash: committeePassword,
      role: "COMMITTEE",
      phone: "514-555-0101",
    },
  });
  console.log("✅ Committee member created:", committee.email);

  // Create instructor
  const instructorPassword = await hash("instruct123", 12);
  const instructor = await prisma.user.upsert({
    where: { email: "instructeur@avenirsouriant.ca" },
    update: {},
    create: {
      name: "Ahmed Ben Ali",
      email: "instructeur@avenirsouriant.ca",
      passwordHash: instructorPassword,
      role: "INSTRUCTOR",
      phone: "514-555-0102",
    },
  });
  console.log("✅ Instructor created:", instructor.email);

  // Create rooms
  const rooms = [
    { name: "Room A", capacity: 20, color: "#3b82f6" },
    { name: "Room B", capacity: 15, color: "#8b5cf6" },
    { name: "Room C", capacity: 30, color: "#059669" },
    { name: "Multipurpose room", capacity: 50, color: "#d97706" },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { id: room.name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        id: room.name.toLowerCase().replace(/\s+/g, "-"),
        ...room,
      },
    });
  }
  console.log("✅ Rooms created:", rooms.map((r) => r.name).join(", "));

  // Create a sample project
  const project = await prisma.project.upsert({
    where: { id: "sample-project" },
    update: {},
    create: {
      id: "sample-project",
      title: "Arabic for beginners",
      description: "An introductory Arabic course for children ages 6–10. Covers the alphabet, basic greetings, and everyday vocabulary.",
      type: "COURSE",
      targetAgeGroup: "Ages 6–10",
      language: "Arabic",
      status: "ACTIVE",
      registrationFee: 150,
      projectedCosts: 500,
      revenueEstimate: 3000,
      maxCapacity: 20,
      publicDescription: "Introduce your child to the Arabic language in a fun, engaging environment.",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-08-31"),
      enrollmentOpen: new Date("2026-05-01"),
      enrollmentClose: new Date("2026-05-30"),
      createdById: instructor.id,
      roomId: "room-a",
      sessionPatternsJson: JSON.stringify([
        { days: [1, 3], startTime: "16:00", endTime: "17:30" },
      ]),
    },
  });
  console.log("✅ Sample project created:", project.title);

  // Add staff to project
  await prisma.projectStaff.upsert({
    where: { projectId_userId: { projectId: project.id, userId: instructor.id } },
    update: {},
    create: {
      projectId: project.id,
      userId: instructor.id,
      role: "LEAD",
    },
  });

  // Create sample students
  const students = [
    { firstName: "Leila", lastName: "Hassan", parentName: "Fatima Hassan", parentEmail: "fatima@email.com", parentPhone: "514-555-0200" },
    { firstName: "Omar", lastName: "Khalil", parentName: "Youssef Khalil", parentEmail: "youssef@email.com", parentPhone: "514-555-0201" },
    { firstName: "Nour", lastName: "Said", parentName: "Amina Said", parentEmail: "amina@email.com", parentPhone: "514-555-0202" },
  ];

  for (const student of students) {
    const s = await prisma.student.create({ data: student });
    await prisma.enrollment.create({
      data: {
        studentId: s.id,
        projectId: project.id,
        status: "CONFIRMED",
      },
    });
  }
  console.log("✅ Sample students created and enrolled");

  console.log("\n🎉 Seeding complete!\n");
  console.log("📧 Login credentials:");
  console.log("   Admin:       admin@avenirsouriant.ca / admin123");
  console.log("   Committee:   comite@avenirsouriant.ca / comite123");
  console.log("   Instructor:  instructeur@avenirsouriant.ca / instruct123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
