import { marked, type Token, type Tokens } from "marked";

marked.setOptions({ gfm: true, breaks: true });

type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

function textNode(text: string, marks?: TipTapNode["marks"]): TipTapNode {
  return marks?.length ? { type: "text", text, marks } : { type: "text", text };
}

function paragraph(content: TipTapNode[]): TipTapNode {
  return { type: "paragraph", content: content.length ? content : undefined };
}

function applyInlineMarks(
  children: TipTapNode[],
  marks: TipTapNode["marks"]
): TipTapNode[] {
  if (!marks?.length) return children;
  return children.map((child) => {
    if (child.type !== "text") return child;
    const existing = child.marks ?? [];
    return { ...child, marks: [...existing, ...marks] };
  });
}

function inlineFromTokens(tokens: Token[]): TipTapNode[] {
  const nodes: TipTapNode[] = [];
  for (const token of tokens) {
    switch (token.type) {
      case "text":
        nodes.push(textNode(token.text));
        break;
      case "strong":
        nodes.push(...applyInlineMarks(inlineFromTokens(token.tokens ?? []), [{ type: "bold" }]));
        break;
      case "em":
        nodes.push(...applyInlineMarks(inlineFromTokens(token.tokens ?? []), [{ type: "italic" }]));
        break;
      case "del":
        nodes.push(
          ...applyInlineMarks(inlineFromTokens(token.tokens ?? []), [{ type: "strike" }])
        );
        break;
      case "codespan":
        nodes.push(textNode(token.text, [{ type: "code" }]));
        break;
      case "link": {
        const fallback: Token[] = [{ type: "text", text: token.text, raw: token.text }];
        const linkContent = inlineFromTokens(token.tokens ?? fallback);
        nodes.push(
          ...applyInlineMarks(linkContent, [{ type: "link", attrs: { href: token.href } }])
        );
        break;
      }
      case "br":
        break;
      default:
        if ("text" in token && typeof token.text === "string") {
          nodes.push(textNode(token.text));
        }
        break;
    }
  }
  return nodes;
}

function blockFromToken(token: Token): TipTapNode | TipTapNode[] | null {
  switch (token.type) {
    case "heading": {
      const level = Math.min(3, Math.max(1, token.depth)) as 1 | 2 | 3;
      const inline = inlineFromTokens(token.tokens ?? []);
      return {
        type: "heading",
        attrs: { level },
        content: inline.length ? inline : [textNode("")],
      };
    }
    case "paragraph":
      return paragraph(inlineFromTokens(token.tokens ?? []));
    case "list": {
      const listType = token.ordered ? "orderedList" : "bulletList";
      const items = token.items.map((item: Tokens.ListItem) => ({
        type: "listItem",
        content: [paragraph(inlineFromTokens(item.tokens ?? []))],
      }));
      return { type: listType, content: items };
    }
    case "blockquote": {
      const inner = (token.tokens ?? [])
        .map(blockFromToken)
        .flat()
        .filter(Boolean) as TipTapNode[];
      return {
        type: "blockquote",
        content: inner.length ? inner : [paragraph([])],
      };
    }
    case "code":
      return {
        type: "codeBlock",
        content: [textNode(token.text)],
      };
    case "hr":
      return { type: "horizontalRule" };
    case "space":
      return null;
    default:
      return null;
  }
}

export function markdownToTipTapJson(markdown: string): Record<string, unknown> {
  const trimmed = markdown.trim();
  if (!trimmed) {
    return { type: "doc", content: [paragraph([])] };
  }

  const tokens = marked.lexer(trimmed);
  const content: TipTapNode[] = [];

  for (const token of tokens) {
    const node = blockFromToken(token);
    if (!node) continue;
    if (Array.isArray(node)) content.push(...node);
    else content.push(node);
  }

  if (!content.length) {
    content.push(paragraph([textNode(trimmed)]));
  }

  return { type: "doc", content };
}

export function plainTextToTipTapJson(text: string): Record<string, unknown> {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const content: TipTapNode[] = lines.map((line) =>
    paragraph(line ? [textNode(line)] : [])
  );
  if (!content.length) content.push(paragraph([]));
  return { type: "doc", content };
}

export const MAX_UPLOAD_BYTES = 1024 * 1024;

export function validateUploadFile(file: { name: string; size: number; type: string }): {
  ok: true;
  kind: "markdown" | "text";
} | { ok: false; error: string } {
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "File must be 1MB or smaller." };
  }
  const lower = file.name.toLowerCase();
  const isMd = lower.endsWith(".md") || lower.endsWith(".markdown");
  const isTxt = lower.endsWith(".txt");
  if (!isMd && !isTxt) {
    return { ok: false, error: "Only .txt and .md files are supported." };
  }
  const allowedTypes = ["text/plain", "text/markdown", "application/octet-stream", ""];
  if (file.type && !allowedTypes.includes(file.type) && !isMd && !isTxt) {
    return { ok: false, error: "Invalid file type. Upload .txt or .md only." };
  }
  return { ok: true, kind: isMd ? "markdown" : "text" };
}
