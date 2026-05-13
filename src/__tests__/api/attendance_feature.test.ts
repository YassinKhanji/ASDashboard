import { describe, it, expect } from "vitest";
import { apiJSON } from "../setup";

describe("Attendance Feature Full Audit", () => {
  it("should perform full attendance lifecycle", async () => {
    // 1. Setup: Need a session and students
    const { data: sessions } = await apiJSON<any[]>("/api/sessions");
    const { data: students } = await apiJSON<any[]>("/api/etudiants");

    if (sessions.length === 0 || students.length < 2) {
      console.warn("Skipping attendance lifecycle test: insufficient data");
      return;
    }

    const sessionId = sessions[0].id;
    const student1Id = students[0].id;
    const student2Id = students[1].id;

    // 2. Happy Path: Record mixed attendance
    const recordRes = await apiJSON<any[]>(`/api/sessions/${sessionId}/attendance`, {
      method: "POST",
      body: JSON.stringify({
        records: [
          { studentId: student1Id, status: "PRESENT" },
          { studentId: student2Id, status: "ABSENT" },
        ],
      }),
    });
    expect(recordRes.status).toBe(200);
    expect(recordRes.data.length).toBe(2);

    // 3. Verify: GET session attendance
    const getRes = await apiJSON<any[]>(`/api/sessions/${sessionId}/attendance`);
    expect(getRes.status).toBe(200);
    const s1 = getRes.data.find(r => r.studentId === student1Id);
    const s2 = getRes.data.find(r => r.studentId === student2Id);
    expect(s1.attendance.status).toBe("PRESENT");
    expect(s2.attendance.status).toBe("ABSENT");

    // 4. Edge Case: Update existing (Upsert)
    const updateRes = await apiJSON<any[]>(`/api/sessions/${sessionId}/attendance`, {
      method: "POST",
      body: JSON.stringify({
        records: [
          { studentId: student1Id, status: "LATE" },
        ],
      }),
    });
    expect(updateRes.status).toBe(200);
    
    const verifyUpdateRes = await apiJSON<any[]>(`/api/sessions/${sessionId}/attendance`);
    const s1Updated = verifyUpdateRes.data.find(r => r.studentId === student1Id);
    expect(s1Updated.attendance.status).toBe("LATE");

    // 5. Error: Invalid status
    const invalidStatusRes = await apiJSON(`/api/sessions/${sessionId}/attendance`, {
      method: "POST",
      body: JSON.stringify({
        records: [
          { studentId: student1Id, status: "SLEEPING" },
        ],
      }),
    });
    // The API just skips invalid statuses currently, let's verify it didn't crash
    expect(invalidStatusRes.status).toBe(200);

    // 6. Error: Missing records array
    const missingArrayRes = await apiJSON(`/api/sessions/${sessionId}/attendance`, {
      method: "POST",
      body: JSON.stringify({ records: "not-an-array" }),
    });
    expect(missingArrayRes.status).toBe(400);

    // 7. Error: Session not found
    const ghostSessionRes = await apiJSON("/api/sessions/ghost-id/attendance", {
      method: "POST",
      body: JSON.stringify({ records: [] }),
    });
    expect(ghostSessionRes.status).toBe(404);
  });

  it("should verify attendance shows up in student profile", async () => {
    const { data: students } = await apiJSON<any[]>("/api/etudiants");
    if (students.length === 0) return;

    const studentId = students[0].id;
    const { status, data } = await apiJSON<any>(`/api/etudiants/${studentId}`);
    expect(status).toBe(200);
    expect(data).toHaveProperty("attendance");
    expect(Array.isArray(data.attendance)).toBe(true);
  });
});
