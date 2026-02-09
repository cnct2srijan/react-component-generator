import { test, expect, vi, beforeEach, describe } from "vitest";
import { buildFileManagerTool } from "../file-manager";
import { VirtualFileSystem } from "@/lib/file-system";

vi.mock("ai", () => ({
  tool: vi.fn((config) => ({
    ...config,
    execute: config.execute,
  })),
}));

const mockFileSystem = {
  rename: vi.fn(),
  deleteFile: vi.fn(),
} as unknown as VirtualFileSystem;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildFileManagerTool", () => {
  describe("rename command", () => {
    test("renames a file successfully", async () => {
      vi.mocked(mockFileSystem.rename).mockReturnValue(true);
      const tool = buildFileManagerTool(mockFileSystem);

      const result = await tool.execute({
        command: "rename",
        path: "/old.js",
        new_path: "/new.js",
      });

      expect(mockFileSystem.rename).toHaveBeenCalledWith("/old.js", "/new.js");
      expect(result).toEqual({
        success: true,
        message: "Successfully renamed /old.js to /new.js",
      });
    });

    test("returns error when new_path is not provided", async () => {
      const tool = buildFileManagerTool(mockFileSystem);

      const result = await tool.execute({
        command: "rename",
        path: "/old.js",
      });

      expect(mockFileSystem.rename).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        error: "new_path is required for rename command",
      });
    });

    test("returns error when rename fails", async () => {
      vi.mocked(mockFileSystem.rename).mockReturnValue(false);
      const tool = buildFileManagerTool(mockFileSystem);

      const result = await tool.execute({
        command: "rename",
        path: "/nonexistent.js",
        new_path: "/new.js",
      });

      expect(result).toEqual({
        success: false,
        error: "Failed to rename /nonexistent.js to /new.js",
      });
    });
  });

  describe("delete command", () => {
    test("deletes a file successfully", async () => {
      vi.mocked(mockFileSystem.deleteFile).mockReturnValue(true);
      const tool = buildFileManagerTool(mockFileSystem);

      const result = await tool.execute({
        command: "delete",
        path: "/test.js",
      });

      expect(mockFileSystem.deleteFile).toHaveBeenCalledWith("/test.js");
      expect(result).toEqual({
        success: true,
        message: "Successfully deleted /test.js",
      });
    });

    test("returns error when delete fails", async () => {
      vi.mocked(mockFileSystem.deleteFile).mockReturnValue(false);
      const tool = buildFileManagerTool(mockFileSystem);

      const result = await tool.execute({
        command: "delete",
        path: "/nonexistent.js",
      });

      expect(result).toEqual({
        success: false,
        error: "Failed to delete /nonexistent.js",
      });
    });
  });

  describe("invalid command", () => {
    test("returns error for unknown command", async () => {
      const tool = buildFileManagerTool(mockFileSystem);

      const result = await tool.execute({
        command: "unknown" as any,
        path: "/test.js",
      });

      expect(result).toEqual({
        success: false,
        error: "Invalid command",
      });
    });
  });
});
