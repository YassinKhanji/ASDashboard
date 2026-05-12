import { describe, it, expect } from "vitest";
import { apiJSON } from "../setup";

describe("GET /api/search", () => {
  it("should return empty results for short queries", async () => {
    const { status, data } = await apiJSON<any>("/api/search?q=a");
    expect(status).toBe(200);
    expect(data.projects).toEqual([]);
    expect(data.students).toEqual([]);
    expect(data.staff).toEqual([]);
    expect(data.discussions).toEqual([]);
  });

  it("should return matching projects", async () => {
    const { status, data } = await apiJSON<any>("/api/search?q=arabic");
    expect(status).toBe(200);
    expect(data.projects.length).toBeGreaterThan(0);
    expect(data.projects[0]).toHaveProperty("title");
  });

  it("should return matching students", async () => {
    const { status, data } = await apiJSON<any>("/api/search?q=hassan");
    expect(status).toBe(200);
    expect(data.students.length).toBeGreaterThan(0);
  });

  it("should return matching staff", async () => {
    const { status, data } = await apiJSON<any>("/api/search?q=admin");
    expect(status).toBe(200);
    expect(data.staff.length).toBeGreaterThan(0);
  });

  it("should return results across all categories", async () => {
    const { status, data } = await apiJSON<any>("/api/search?q=avenir");
    expect(status).toBe(200);
    // Should have at least the structure
    expect(data).toHaveProperty("projects");
    expect(data).toHaveProperty("students");
    expect(data).toHaveProperty("staff");
    expect(data).toHaveProperty("discussions");
  });
});

describe("GET /api/notifications", () => {
  it("should return notifications array", async () => {
    const { status, data } = await apiJSON<any[]>("/api/notifications");
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("GET /api/rooms", () => {
  it("should return rooms array", async () => {
    const { status, data } = await apiJSON<any[]>("/api/rooms");
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it("each room should have required fields", async () => {
    const { data } = await apiJSON<any[]>("/api/rooms");
    if (data.length > 0) {
      expect(data[0]).toHaveProperty("id");
      expect(data[0]).toHaveProperty("name");
      expect(data[0]).toHaveProperty("capacity");
      expect(data[0]).toHaveProperty("color");
    }
  });
});

describe("GET /api/personnel/list", () => {
  it("should return active staff members", async () => {
    const { status, data } = await apiJSON<any[]>("/api/personnel/list");
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });
});

describe("GET /api/personnel/[id]", () => {
  it("should return 404 for non-existent staff", async () => {
    const { status } = await apiJSON("/api/personnel/non-existent-id");
    expect(status).toBe(404);
  });

  it("should return staff with project assignments", async () => {
    const { data: staff } = await apiJSON<any[]>("/api/personnel/list");
    if (staff.length > 0) {
      const { status, data } = await apiJSON<any>(`/api/personnel/${staff[0].id}`);
      expect(status).toBe(200);
      expect(data).toHaveProperty("projectAssignments");
      expect(data).toHaveProperty("upcomingSessions");
    }
  });
});

describe("GET /api/parametres/users", () => {
  it("should return users list (admin only)", async () => {
    const { status, data } = await apiJSON<any[]>("/api/parametres/users");
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("PUT /api/rooms/[id]", () => {
  it("should return 404 for non-existent room", async () => {
    const { status } = await apiJSON("/api/rooms/non-existent-id", {
      method: "PUT",
      body: JSON.stringify({ name: "Test" }),
    });
    expect(status).toBe(404);
  });
});

describe("DELETE /api/rooms/[id]", () => {
  it("should return 404 for non-existent room", async () => {
    const { status } = await apiJSON("/api/rooms/non-existent-id", {
      method: "DELETE",
    });
    expect(status).toBe(404);
  });
});
