import { test, expect, vi, beforeEach, describe } from "vitest";
import { MockLanguageModel, getLanguageModel } from "../provider";
import type { LanguageModelV1Message } from "@ai-sdk/provider";

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn(() => ({ modelId: "claude-haiku-4-5", provider: "anthropic" })),
}));

describe("MockLanguageModel", () => {
  let model: MockLanguageModel;

  beforeEach(() => {
    model = new MockLanguageModel("mock-model");
  });

  test("has correct specification properties", () => {
    expect(model.specificationVersion).toBe("v1");
    expect(model.provider).toBe("mock");
    expect(model.modelId).toBe("mock-model");
    expect(model.defaultObjectGenerationMode).toBe("tool");
  });

  describe("doGenerate", () => {
    test("generates text and tool calls for initial request", async () => {
      const messages: LanguageModelV1Message[] = [
        {
          role: "user",
          content: [{ type: "text", text: "Create a counter component" }],
        },
      ];

      const result = await model.doGenerate({
        prompt: messages,
        mode: { type: "regular" },
        inputFormat: "messages",
      } as any);

      expect(result.text).toBeDefined();
      expect(result.toolCalls).toBeDefined();
      expect(result.finishReason).toBe("tool-calls");
      expect(result.usage.promptTokens).toBe(100);
      expect(result.usage.completionTokens).toBe(200);
    });

    test("detects form component from user prompt", async () => {
      const messages: LanguageModelV1Message[] = [
        {
          role: "user",
          content: [{ type: "text", text: "Create a contact form" }],
        },
      ];

      const result = await model.doGenerate({
        prompt: messages,
        mode: { type: "regular" },
        inputFormat: "messages",
      } as any);

      expect(result.toolCalls.length).toBeGreaterThan(0);
      const toolCall = result.toolCalls[0];
      const args = JSON.parse(toolCall.args);
      expect(args.path).toBe("/App.jsx");
    });

    test("detects card component from user prompt", async () => {
      const messages: LanguageModelV1Message[] = [
        {
          role: "user",
          content: [{ type: "text", text: "Create a card" }],
        },
      ];

      const result = await model.doGenerate({
        prompt: messages,
        mode: { type: "regular" },
        inputFormat: "messages",
      } as any);

      expect(result.toolCalls.length).toBeGreaterThan(0);
    });

    test("returns final summary after enough tool steps", async () => {
      const messages: LanguageModelV1Message[] = [
        {
          role: "user",
          content: [{ type: "text", text: "Create a counter" }],
        },
        { role: "tool", content: [{ type: "tool-result", toolCallId: "1", toolName: "str_replace_editor", result: "ok" }] },
        { role: "tool", content: [{ type: "tool-result", toolCallId: "2", toolName: "str_replace_editor", result: "ok" }] },
        { role: "tool", content: [{ type: "tool-result", toolCallId: "3", toolName: "str_replace_editor", result: "ok" }] },
      ];

      const result = await model.doGenerate({
        prompt: messages,
        mode: { type: "regular" },
        inputFormat: "messages",
      } as any);

      expect(result.finishReason).toBe("stop");
      expect(result.text).toContain("Counter");
    }, 15000);

    test("handles string content in user messages", async () => {
      const messages: LanguageModelV1Message[] = [
        {
          role: "user",
          content: "Create a counter" as any,
        },
      ];

      const result = await model.doGenerate({
        prompt: messages,
        mode: { type: "regular" },
        inputFormat: "messages",
      } as any);

      expect(result.text).toBeDefined();
    });
  });

  describe("doStream", () => {
    test("returns a readable stream", async () => {
      const messages: LanguageModelV1Message[] = [
        {
          role: "user",
          content: [{ type: "text", text: "Create a counter" }],
        },
      ];

      const result = await model.doStream({
        prompt: messages,
        mode: { type: "regular" },
        inputFormat: "messages",
      } as any);

      expect(result.stream).toBeInstanceOf(ReadableStream);
      expect(result.warnings).toEqual([]);
      expect(result.rawCall).toBeDefined();
    });

    test("stream emits text deltas and finishes", async () => {
      const messages: LanguageModelV1Message[] = [
        {
          role: "user",
          content: [{ type: "text", text: "Create a counter" }],
        },
      ];

      const result = await model.doStream({
        prompt: messages,
        mode: { type: "regular" },
        inputFormat: "messages",
      } as any);

      const reader = result.stream.getReader();
      const chunks: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      expect(chunks.length).toBeGreaterThan(0);
      const types = chunks.map((c) => c.type);
      expect(types).toContain("text-delta");
      expect(types).toContain("tool-call");
      expect(types).toContain("finish");
    });
  });
});

describe("getLanguageModel", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  test("returns MockLanguageModel when no API key is set", () => {
    delete process.env.ANTHROPIC_API_KEY;
    const model = getLanguageModel();
    expect(model).toBeInstanceOf(MockLanguageModel);
  });

  test("returns MockLanguageModel when API key is empty string", () => {
    process.env.ANTHROPIC_API_KEY = "";
    const model = getLanguageModel();
    expect(model).toBeInstanceOf(MockLanguageModel);
  });

  test("returns MockLanguageModel when API key is whitespace", () => {
    process.env.ANTHROPIC_API_KEY = "   ";
    const model = getLanguageModel();
    expect(model).toBeInstanceOf(MockLanguageModel);
  });

  test("returns anthropic model when API key is provided", () => {
    process.env.ANTHROPIC_API_KEY = "sk-test-key";
    const model = getLanguageModel();
    expect(model).not.toBeInstanceOf(MockLanguageModel);
  });
});
