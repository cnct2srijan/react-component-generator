import { test, expect, vi, beforeEach, describe } from "vitest";
import {
  setHasAnonWork,
  getHasAnonWork,
  getAnonWorkData,
  clearAnonWork,
} from "../anon-work-tracker";

const mockSessionStorage: Record<string, string> = {};

beforeEach(() => {
  Object.keys(mockSessionStorage).forEach(
    (key) => delete mockSessionStorage[key]
  );

  Object.defineProperty(globalThis, "sessionStorage", {
    value: {
      getItem: vi.fn((key: string) => mockSessionStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockSessionStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockSessionStorage[key];
      }),
    },
    writable: true,
    configurable: true,
  });
});

describe("setHasAnonWork", () => {
  test("stores work when messages exist", () => {
    const messages = [{ role: "user", content: "hello" }];
    const fileSystemData = {};

    setHasAnonWork(messages, fileSystemData);

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      "uigen_has_anon_work",
      "true"
    );
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      "uigen_anon_data",
      JSON.stringify({ messages, fileSystemData })
    );
  });

  test("stores work when file system has entries beyond root", () => {
    const messages: any[] = [];
    const fileSystemData = { "/": {}, "/file.js": {} };

    setHasAnonWork(messages, fileSystemData);

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      "uigen_has_anon_work",
      "true"
    );
  });

  test("does not store when no messages and only root in file system", () => {
    const messages: any[] = [];
    const fileSystemData = { "/": {} };

    setHasAnonWork(messages, fileSystemData);

    expect(sessionStorage.setItem).not.toHaveBeenCalled();
  });

  test("does not store when no messages and empty file system", () => {
    const messages: any[] = [];
    const fileSystemData = {};

    setHasAnonWork(messages, fileSystemData);

    expect(sessionStorage.setItem).not.toHaveBeenCalled();
  });
});

describe("getHasAnonWork", () => {
  test("returns true when work exists", () => {
    mockSessionStorage["uigen_has_anon_work"] = "true";

    expect(getHasAnonWork()).toBe(true);
  });

  test("returns false when no work exists", () => {
    expect(getHasAnonWork()).toBe(false);
  });
});

describe("getAnonWorkData", () => {
  test("returns stored data", () => {
    const data = {
      messages: [{ role: "user", content: "test" }],
      fileSystemData: { "/file.js": {} },
    };
    mockSessionStorage["uigen_anon_data"] = JSON.stringify(data);

    expect(getAnonWorkData()).toEqual(data);
  });

  test("returns null when no data exists", () => {
    expect(getAnonWorkData()).toBeNull();
  });

  test("returns null for invalid JSON", () => {
    mockSessionStorage["uigen_anon_data"] = "invalid json{";

    expect(getAnonWorkData()).toBeNull();
  });
});

describe("clearAnonWork", () => {
  test("removes all stored data", () => {
    mockSessionStorage["uigen_has_anon_work"] = "true";
    mockSessionStorage["uigen_anon_data"] = "{}";

    clearAnonWork();

    expect(sessionStorage.removeItem).toHaveBeenCalledWith(
      "uigen_has_anon_work"
    );
    expect(sessionStorage.removeItem).toHaveBeenCalledWith("uigen_anon_data");
  });
});
