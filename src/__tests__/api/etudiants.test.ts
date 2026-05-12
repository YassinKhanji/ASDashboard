import { describe, it, expect } from "vitest";
import { apiJSON } from "../setup";

describe("GET /api/etudiants", () => {
  it("should return an array of students", async () => {
    const { status, data } = await apiJSON<any[]>("/api/etudiants");
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it("each student should have required fields", async () => {
    const { data } = await apiJSON<any[]>("/api/etudiants");
    if (data.length > 0) {
      const student = data[0];
      expect(student).toHaveProperty("id");
      expect(student).toHaveProperty("firstName");
      expect(student).toHaveProperty("lastName");
    }
  });
});

describe("GET /api/etudiants/[id]", () => {
  it("should return 404 for non-existent student", async () => {
    const { status } = await apiJSON("/api/etudiants/non-existent-id");
    expect(status).toBe(404);
  });

  it("should return student with enrollments and attendance for valid ID", async () => {
    const { data: students } = await apiJSON<any[]>("/api/etudiants");
    if (students.length > 0) {
      const { status, data } = await apiJSON<any>(`/api/etudiants/${students[0].id}`);
      expect(status).toBe(200);
      expect(data).toHaveProperty("enrollments");
      expect(data).toHaveProperty("attendance");
      expect(Array.isArray(data.enrollments)).toBe(true);
      expect(Array.isArray(data.attendance)).toBe(true);
    }
  });
});

describe("PATCH /api/etudiants/[id]", () => {
  it("should update student info", async () => {
    const { data: students } = await apiJSON<any[]>("/api/etudiants");
    if (students.length > 0) {
      const newNotes = "Test notes " + Date.now();
      const { status, data } = await apiJSON<any>(`/api/etudiants/${students[0].id}`, {
        method: "PATCH",
        body: JSON.stringify({ notes: newNotes }),
      });
      expect(status).toBe(200);
      expect(data.notes).toBe(newNotes);
    }
  });
});

describe("POST /api/etudiants/[id]/enrollments", () => {
  it("should require projectId", async () => {
    const { data: students } = await apiJSON<any[]>("/api/etudiants");
    if (students.length > 0) {
      const { status } = await apiJSON(`/api/etudiants/${students[0].id}/enrollments`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      expect(status).toBe(400);
    }
  });

  it("should return 404 for non-existent project", async () => {
    const { data: students } = await apiJSON<any[]>("/api/etudiants");
    if (students.length > 0) {
      const { status } = await apiJSON(`/api/etudiants/${students[0].id}/enrollments`, {
        method: "POST",
        body: JSON.stringify({ projectId: "non-existent-project-id" }),
      });
      expect(status).toBe(404);
    }
  });

  it("should handle duplicate enrollment gracefully", async () => {
    const { data: students } = await apiJSON<any[]>("/api/etudiants");
    if (students.length > 0) {
      // Get a student with existing enrollments
      const { data: student } = await apiJSON<any>(`/api/etudiants/${students[0].id}`);
      if (student.enrollments.length > 0) {
        const { status } = await apiJSON(`/api/etudiants/${students[0].id}/enrollments`, {
          method: "POST",
          body: JSON.stringify({ projectId: student.enrollments[0].project.id }),
        });
        expect(status).toBe(409); // Conflict — already enrolled
      }
    }
  });
});
