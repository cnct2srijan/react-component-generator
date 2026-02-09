import { test, expect, vi, beforeEach, describe } from "vitest";
import { buildStrReplaceTool } from "../str-replace";
import { VirtualFileSystem } from "@/lib/file-system";

const mockFileSystem = {
  viewFile: vi.fn(),
  createFileWithParents: vi.fn(),
  replaceInFile: vi.fn(),
  insertInFile: vi.fn(),
} as unknown as VirtualFileSystem;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildStrReplaceTool", () => {
  test("returns a tool with correct id and parameters", () => {
    const tool = buildStrReplaceTool(mockFileSystem);
    expect(tool.id).toBe("str_replace_editor");
    expect(tool.parameters).toBeDefined();
    expect(tool.execute).toBeDefined();
  });

  describe("view command", () => {
    test("calls viewFile without range", async () => {
      const tool = buildStrReplaceTool(mockFileSystem);
      vi.mocked(mockFileSystem.viewFile).mockReturnValue("file contents");

      const result = await tool.execute({
        command: "view",
        path: "/test.js",
      });

      expect(mockFileSystem.viewFile).toHaveBeenCalledWith("/test.js", undefined);
      expect(result).toBe("file contents");
    });

    test("calls viewFile with range", async () => {
      const tool = buildStrReplaceTool(mockFileSystem);
      vi.mocked(mockFileSystem.viewFile).mockReturnValue("lines 1-5");

      const result = await tool.execute({
        command: "view",
        path: "/test.js",
        view_range: [1, 5],
      });

      expect(mockFileSystem.viewFile).toHaveBeenCalledWith("/test.js", [1, 5]);
      expect(result).toBe("lines 1-5");
    });
  });

  describe("create command", () => {
    test("calls createFileWithParents with content", async () => {
      const tool = buildStrReplaceTool(mockFileSystem);
      vi.mocked(mockFileSystem.createFileWithParents).mockReturnValue("File created");

      const result = await tool.execute({
        command: "create",
        path: "/new-file.js",
        file_text: "const x = 1;",
      });

      expect(mockFileSystem.createFileWithParents).toHaveBeenCalledWith(
        "/new-file.js",
        "const x = 1;"
      );
      expect(result).toBe("File created");
    });

    test("uses empty string when file_text is not provided", async () => {
      const tool = buildStrReplaceTool(mockFileSystem);
      vi.mocked(mockFileSystem.createFileWithParents).mockReturnValue("File created");

      await tool.execute({
        command: "create",
        path: "/empty.js",
      });

      expect(mockFileSystem.createFileWithParents).toHaveBeenCalledWith("/empty.js", "");
    });
  });

  describe("str_replace command", () => {
    test("calls replaceInFile with old and new strings", async () => {
      const tool = buildStrReplaceTool(mockFileSystem);
      vi.mocked(mockFileSystem.replaceInFile).mockReturnValue("Replaced successfully");

      const result = await tool.execute({
        command: "str_replace",
        path: "/test.js",
        old_str: "const x = 1;",
        new_str: "const x = 2;",
      });

      expect(mockFileSystem.replaceInFile).toHaveBeenCalledWith(
        "/test.js",
        "const x = 1;",
        "const x = 2;"
      );
      expect(result).toBe("Replaced successfully");
    });

    test("uses empty strings when old_str and new_str are not provided", async () => {
      const tool = buildStrReplaceTool(mockFileSystem);
      vi.mocked(mockFileSystem.replaceInFile).mockReturnValue("Replaced");

      await tool.execute({
        command: "str_replace",
        path: "/test.js",
      });

      expect(mockFileSystem.replaceInFile).toHaveBeenCalledWith("/test.js", "", "");
    });
  });

  describe("insert command", () => {
    test("calls insertInFile with line number and text", async () => {
      const tool = buildStrReplaceTool(mockFileSystem);
      vi.mocked(mockFileSystem.insertInFile).mockReturnValue("Inserted");

      const result = await tool.execute({
        command: "insert",
        path: "/test.js",
        insert_line: 5,
        new_str: "const y = 2;",
      });

      expect(mockFileSystem.insertInFile).toHaveBeenCalledWith(
        "/test.js",
        5,
        "const y = 2;"
      );
      expect(result).toBe("Inserted");
    });

    test("uses defaults when insert_line and new_str are not provided", async () => {
      const tool = buildStrReplaceTool(mockFileSystem);
      vi.mocked(mockFileSystem.insertInFile).mockReturnValue("Inserted");

      await tool.execute({
        command: "insert",
        path: "/test.js",
      });

      expect(mockFileSystem.insertInFile).toHaveBeenCalledWith("/test.js", 0, "");
    });
  });

  describe("undo_edit command", () => {
    test("returns an error message", async () => {
      const tool = buildStrReplaceTool(mockFileSystem);

      const result = await tool.execute({
        command: "undo_edit",
        path: "/test.js",
      });

      expect(result).toContain("Error");
      expect(result).toContain("undo_edit command is not supported");
    });
  });
});
