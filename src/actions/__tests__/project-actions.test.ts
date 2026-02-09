import { test, expect, vi, beforeEach, describe } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createProject } from "../create-project";
import { getProject } from "../get-project";
import { getProjects } from "../get-projects";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createProject", () => {
  test("throws when user is not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    await expect(
      createProject({ name: "Test", messages: [], data: {} })
    ).rejects.toThrow("Unauthorized");
  });

  test("creates a project with serialized data", async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: "user-1",
      email: "test@test.com",
      expiresAt: new Date(),
    });

    const mockProject = {
      id: "proj-1",
      name: "Test Project",
      userId: "user-1",
      messages: "[]",
      data: "{}",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.project.create).mockResolvedValue(mockProject);

    const result = await createProject({
      name: "Test Project",
      messages: [{ role: "user", content: "hello" }],
      data: { key: "value" },
    });

    expect(prisma.project.create).toHaveBeenCalledWith({
      data: {
        name: "Test Project",
        userId: "user-1",
        messages: JSON.stringify([{ role: "user", content: "hello" }]),
        data: JSON.stringify({ key: "value" }),
      },
    });
    expect(result).toBe(mockProject);
  });
});

describe("getProject", () => {
  test("throws when user is not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    await expect(getProject("proj-1")).rejects.toThrow("Unauthorized");
  });

  test("throws when project is not found", async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: "user-1",
      email: "test@test.com",
      expiresAt: new Date(),
    });
    vi.mocked(prisma.project.findUnique).mockResolvedValue(null);

    await expect(getProject("nonexistent")).rejects.toThrow("Project not found");
  });

  test("returns deserialized project data", async () => {
    const now = new Date();
    vi.mocked(getSession).mockResolvedValue({
      userId: "user-1",
      email: "test@test.com",
      expiresAt: new Date(),
    });
    vi.mocked(prisma.project.findUnique).mockResolvedValue({
      id: "proj-1",
      name: "Test Project",
      userId: "user-1",
      messages: JSON.stringify([{ role: "user", content: "hello" }]),
      data: JSON.stringify({ key: "value" }),
      createdAt: now,
      updatedAt: now,
    });

    const result = await getProject("proj-1");

    expect(prisma.project.findUnique).toHaveBeenCalledWith({
      where: {
        id: "proj-1",
        userId: "user-1",
      },
    });
    expect(result).toEqual({
      id: "proj-1",
      name: "Test Project",
      messages: [{ role: "user", content: "hello" }],
      data: { key: "value" },
      createdAt: now,
      updatedAt: now,
    });
  });
});

describe("getProjects", () => {
  test("throws when user is not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    await expect(getProjects()).rejects.toThrow("Unauthorized");
  });

  test("returns projects ordered by updatedAt desc", async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: "user-1",
      email: "test@test.com",
      expiresAt: new Date(),
    });

    const projects = [
      { id: "1", name: "Project 1", createdAt: new Date(), updatedAt: new Date() },
      { id: "2", name: "Project 2", createdAt: new Date(), updatedAt: new Date() },
    ];
    vi.mocked(prisma.project.findMany).mockResolvedValue(projects as any);

    const result = await getProjects();

    expect(prisma.project.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(result).toEqual(projects);
  });

  test("returns empty array when no projects exist", async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: "user-1",
      email: "test@test.com",
      expiresAt: new Date(),
    });
    vi.mocked(prisma.project.findMany).mockResolvedValue([]);

    const result = await getProjects();
    expect(result).toEqual([]);
  });
});
