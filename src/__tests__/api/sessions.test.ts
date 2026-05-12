import { describe, it, expect } from "vitest";
import { apiJSON } from "../setup";

describe("GET /api/sessions", () => {
  it("should return sessions", async () => {
    const { status, data } = await apiJSON<any[]>("/api/sessions");
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("GET /api/sessions/[id]", () => {
  it("should return 404 for non-existent session", async () => {
    const { status } = await apiJSON("/api/sessions/non-existent-id");
    expect(status).toBe(404);
  });
});

describe("POST /api/sessions", () => {
  it("should create a session or detect conflict", async () => {
    const { data: projects } = await apiJSON<any[]>("/api/projets");
    const { data: rooms } = await apiJSON<any[]>("/api/rooms");

    if (projects.length > 0 && rooms.length > 0) {
      // Use a unique far-future time to minimize conflict chance
      const uniqueDay = `2027-06-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`;
      const startTime = new Date(`${uniqueDay}T10:00:00Z`);
      const endTime = new Date(`${uniqueDay}T12:00:00Z`);

      const { status, data } = await apiJSON<any>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          projectId: projects[0].id,
          roomId: rooms[0].id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      });
      // Accept either created or conflict (room already booked)
      expect([201, 409]).toContain(status);
      if (status === 201) {
        expect(data).toHaveProperty("id");
      }
    }
  });
});

describe("PATCH /api/sessions/[id]", () => {
  it("should update session notes", async () => {
    const { data: sessions } = await apiJSON<any[]>("/api/sessions");
    if (sessions.length > 0) {
      const { status, data } = await apiJSON<any>(`/api/sessions/${sessions[0].id}`, {
        method: "PATCH",
        body: JSON.stringify({ notes: "Updated notes " + Date.now() }),
      });
      expect(status).toBe(200);
    }
  });
});

describe("POST /api/sessions/[id]/attendance", () => {
  it("should require records array", async () => {
    const { data: sessions } = await apiJSON<any[]>("/api/sessions");
    if (sessions.length > 0) {
      const { status } = await apiJSON(`/api/sessions/${sessions[0].id}/attendance`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      expect(status).toBe(400);
    }
  });

  it("should record attendance for valid data", async () => {
    const { data: sessions } = await apiJSON<any[]>("/api/sessions");
    const { data: students } = await apiJSON<any[]>("/api/etudiants");

    if (sessions.length > 0 && students.length > 0) {
      const { status, data } = await apiJSON<any[]>(`/api/sessions/${sessions[0].id}/attendance`, {
        method: "POST",
        body: JSON.stringify({
          records: [
            { studentId: students[0].id, status: "PRESENT" },
          ],
        }),
      });
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    }
  });
});

describe("GET /api/sessions/[id]/attendance", () => {
  it("should return attendance list", async () => {
    const { data: sessions } = await apiJSON<any[]>("/api/sessions");
    if (sessions.length > 0) {
      const { status, data } = await apiJSON<any[]>(`/api/sessions/${sessions[0].id}/attendance`);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    }
  });
});
