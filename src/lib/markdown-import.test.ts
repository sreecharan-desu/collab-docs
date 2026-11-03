import { describe, expect, it } from "vitest";
import {
  markdownToTipTapJson,
  plainTextToTipTapJson,
  validateUploadFile,
} from "@/lib/markdown-import";

describe("validateUploadFile", () => {
  it("accepts txt and md under size limit", () => {
    expect(
      validateUploadFile({ name: "notes.txt", size: 100, type: "text/plain" })
    ).toEqual({ ok: true, kind: "text" });
    expect(
      validateUploadFile({ name: "readme.md", size: 100, type: "text/markdown" })
    ).toEqual({ ok: true, kind: "markdown" });
  });

  it("rejects unsupported extensions and large files", () => {
    expect(
      validateUploadFile({ name: "photo.png", size: 10, type: "image/png" }).ok
    ).toBe(false);
    expect(
      validateUploadFile({ name: "big.txt", size: 1024 * 1024 + 1, type: "text/plain" }).ok
    ).toBe(false);
  });
});

describe("markdownToTipTapJson", () => {
  it("converts headings, emphasis, and lists", () => {
    const doc = markdownToTipTapJson("# Title\n\nHello **world**\n\n- one\n- two") as {
      type: string;
      content: Array<{ type: string; attrs?: { level?: number }; content?: unknown[] }>;
    };

    expect(doc.type).toBe("doc");
    expect(doc.content[0]?.type).toBe("heading");
    expect(doc.content[0]?.attrs?.level).toBe(1);

    const paragraph = doc.content.find((n) => n.type === "paragraph");
    expect(paragraph).toBeTruthy();

    const list = doc.content.find((n) => n.type === "bulletList");
    expect(list).toBeTruthy();
  });
});

describe("plainTextToTipTapJson", () => {
  it("maps lines to paragraphs", () => {
    const doc = plainTextToTipTapJson("Line one\nLine two") as {
      content: Array<{ type: string }>;
    };
    expect(doc.content).toHaveLength(2);
    expect(doc.content.every((n) => n.type === "paragraph")).toBe(true);
  });
});
