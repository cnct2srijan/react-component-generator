import { test, expect, vi, beforeEach, describe } from "vitest";
import { signUp, signIn, signOut, getUser } from "../index";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { createSession, deleteSession, getSession } from "@/lib/auth";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("signUp", () => {
  test("returns error when email is empty", async () => {
    const result = await signUp("", "password123");
    expect(result).toEqual({
      success: false,
      error: "Email and password are required",
    });
  });

  test("returns error when password is empty", async () => {
    const result = await signUp("test@test.com", "");
    expect(result).toEqual({
      success: false,
      error: "Email and password are required",
    });
  });

  test("returns error when password is too short", async () => {
    const result = await signUp("test@test.com", "short");
    expect(result).toEqual({
      success: false,
      error: "Password must be at least 8 characters",
    });
  });

  test("returns error when email already exists", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "1",
      email: "test@test.com",
      password: "hashed",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await signUp("test@test.com", "password123");
    expect(result).toEqual({
      success: false,
      error: "Email already registered",
    });
  });

  test("creates user and session on success", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "user-1",
      email: "new@test.com",
      password: "hashed-password",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await signUp("new@test.com", "password123");

    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "new@test.com",
        password: "hashed-password",
      },
    });
    expect(createSession).toHaveBeenCalledWith("user-1", "new@test.com");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(result).toEqual({ success: true });
  });

  test("handles unexpected errors", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("DB error"));

    const result = await signUp("test@test.com", "password123");
    expect(result).toEqual({
      success: false,
      error: "An error occurred during sign up",
    });
  });
});

describe("signIn", () => {
  test("returns error when email is empty", async () => {
    const result = await signIn("", "password");
    expect(result).toEqual({
      success: false,
      error: "Email and password are required",
    });
  });

  test("returns error when password is empty", async () => {
    const result = await signIn("test@test.com", "");
    expect(result).toEqual({
      success: false,
      error: "Email and password are required",
    });
  });

  test("returns error when user not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const result = await signIn("nonexistent@test.com", "password");
    expect(result).toEqual({
      success: false,
      error: "Invalid credentials",
    });
  });

  test("returns error when password is invalid", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "1",
      email: "test@test.com",
      password: "hashed",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const result = await signIn("test@test.com", "wrong-password");
    expect(result).toEqual({
      success: false,
      error: "Invalid credentials",
    });
  });

  test("creates session on valid credentials", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@test.com",
      password: "hashed",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const result = await signIn("test@test.com", "password123");

    expect(createSession).toHaveBeenCalledWith("user-1", "test@test.com");
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(result).toEqual({ success: true });
  });

  test("handles unexpected errors", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("DB error"));

    const result = await signIn("test@test.com", "password");
    expect(result).toEqual({
      success: false,
      error: "An error occurred during sign in",
    });
  });
});

describe("signOut", () => {
  test("deletes session and redirects", async () => {
    await signOut();

    expect(deleteSession).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(redirect).toHaveBeenCalledWith("/");
  });
});

describe("getUser", () => {
  test("returns null when no session exists", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const user = await getUser();
    expect(user).toBeNull();
  });

  test("returns user data when session exists", async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: "user-1",
      email: "test@test.com",
      expiresAt: new Date(),
    });
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "test@test.com",
      createdAt: new Date(),
    } as any);

    const user = await getUser();
    expect(user).toEqual({
      id: "user-1",
      email: "test@test.com",
      createdAt: expect.any(Date),
    });
  });

  test("returns null when user lookup fails", async () => {
    vi.mocked(getSession).mockResolvedValue({
      userId: "user-1",
      email: "test@test.com",
      expiresAt: new Date(),
    });
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("DB error"));

    const user = await getUser();
    expect(user).toBeNull();
  });
});
