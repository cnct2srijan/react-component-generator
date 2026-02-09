import { test, expect, describe } from "vitest";
import { cn } from "../utils";

describe("cn", () => {
  test("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  test("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  test("handles undefined and null values", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });

  test("merges tailwind classes correctly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  test("handles conflicting tailwind classes", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  test("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  test("handles array input", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  test("handles object input", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });
});
