import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting calendar import...");

  // 1. Create/Upsert Rooms
  const roomData = [
    { id: "classroom-1", name: "Classroom 1 (Main)", capacity: 20, color: "#d2b48c" }, // Tan
    { id: "classroom-2", name: "Classroom 2", capacity: 20, color: "#94a3b8" }, // Slate
    { id: "classroom-3", name: "Classroom 3", capacity: 20, color: "#22c55e" }, // Green
  ];

  for (const room of roomData) {
    await prisma.room.upsert({
      where: { id: room.id },
      update: room,
      create: room,
    });
  }
  console.log("✅ Rooms initialized.");

  // 2. Create/Upsert Projects
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    throw new Error("No admin user found to associate with projects.");
  }

  const courseProject = await prisma.project.upsert({
    where: { id: "courses-2026" },
    update: {},
    create: {
      id: "courses-2026",
      title: "Courses 2026",
      type: "COURSE",
      status: "ACTIVE",
      createdById: admin.id,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
    },
  });

  const halakaProject = await prisma.project.upsert({
    where: { id: "halakas-2026" },
    update: {},
    create: {
      id: "halakas-2026",
      title: "Halakas 2026",
      type: "ACTIVITY",
      status: "ACTIVE",
      createdById: admin.id,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
    },
  });
  console.log("✅ Projects initialized.");

  // 3. Parse .ics file
  const icsPath = path.join(__dirname, "..", "Calendar_2026 (1).ics");
  const content = fs.readFileSync(icsPath, "utf-8");

  const events = content.split("BEGIN:VEVENT");
  events.shift(); // Remove first part before first VEVENT

  let sessionCount = 0;
  let eventCount = 0;

  for (const eventStr of events) {
    const lines = eventStr.split(/\r?\n/);
    const event: any = {};
    for (const line of lines) {
      if (line.startsWith("SUMMARY:")) event.summary = line.substring(8);
      if (line.startsWith("DTSTART:")) event.dtstart = line.substring(8);
      if (line.startsWith("DTEND:")) event.dtend = line.substring(6);
      if (line.startsWith("DESCRIPTION:")) event.description = line.substring(12);
      if (line.startsWith("UID:")) event.uid = line.substring(4);
    }

    if (!event.summary || !event.dtstart) continue;

    const parseDate = (d: string) => {
      if (d.includes("T")) {
        // format 20260102T093000
        const year = d.substring(0, 4);
        const month = d.substring(4, 6);
        const day = d.substring(6, 8);
        const hour = d.substring(9, 11);
        const min = d.substring(11, 13);
        const sec = d.substring(13, 15);
        return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}`);
      } else {
        // format 20260101
        const year = d.substring(0, 4);
        const month = d.substring(4, 6);
        const day = d.substring(6, 8);
        return new Date(`${year}-${month}-${day}T00:00:00`);
      }
    };

    const startTime = parseDate(event.dtstart);
    const endTime = event.dtend ? parseDate(event.dtend) : new Date(startTime.getTime() + 3600000);

    const summary = event.summary.toLowerCase();
    const isAllDay = !event.dtstart.includes("T");

    if (summary.includes("course") || summary.includes("halaka")) {
      // It's a session
      let projectId = halakaProject.id;
      let roomId = "classroom-1";

      if (summary.includes("course")) {
        projectId = courseProject.id;
        roomId = "classroom-3";
      }

      // Check if description specifies room
      if (event.description && event.description.includes("Classroom 3")) roomId = "classroom-3";
      if (event.description && event.description.includes("Classroom 1")) roomId = "classroom-1";
      if (event.description && event.description.includes("Classroom 2")) roomId = "classroom-2";

      await prisma.session.create({
        data: {
          projectId,
          roomId,
          startTime,
          endTime,
          notes: event.description || null,
        }
      });
      sessionCount++;
    } else {
      // It's a CalendarEvent
      let type = "OBSERVANCE";
      let color = "#fb923c"; // Orange for Islamic

      if (event.uid && event.uid.includes("holiday")) {
        type = "HOLIDAY";
        color = "#f87171"; // Red/Terracotta
      } else if (event.uid && event.uid.includes("islamic")) {
        type = "ISLAMIC";
        color = "#fb923c"; // Orange
        if (summary.includes("ramadan")) color = "#78350f"; // Brown
      } else if (event.uid && event.uid.includes("academic")) {
        type = "ACADEMIC";
        color = "#facc15"; // Yellow
      }

      await prisma.calendarEvent.create({
        data: {
          title: event.summary,
          description: event.description || null,
          type,
          startTime,
          endTime,
          allDay: isAllDay,
          color,
        }
      });
      eventCount++;
    }
  }

  console.log(`✅ Import finished. Created ${sessionCount} sessions and ${eventCount} calendar events.`);
}

main()
  .catch((e) => {
    console.error("❌ Import error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
