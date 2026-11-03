"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Heading from "@tiptap/extension-heading";
import type { JSONContent } from "@tiptap/core";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type Props = {
  documentId: string;
  initialContent: JSONContent;
  initialTitle: string;
  readOnly?: boolean;
  onTitleChange?: (title: string) => void;
};

export function DocumentEditor({
  documentId,
  initialContent,
  initialTitle,
  readOnly = false,
  onTitleChange,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string>(JSON.stringify(initialContent));
  const pendingPayload = useRef<{ content: JSONContent; title: string } | null>(null);

  const persist = useCallback(async () => {
    if (readOnly || !pendingPayload.current) return;
    const payload = pendingPayload.current;
    pendingPayload.current = null;
    setSaveStatus("saving");

    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: payload.content,
          title: payload.title,
        }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      lastSaved.current = JSON.stringify(payload.content);
      setSaveStatus("saved");
    } catch {
      pendingPayload.current = payload;
      setSaveStatus("error");
    }
  }, [documentId, readOnly]);

  const scheduleSave = useCallback(
    (content: JSONContent, nextTitle: string) => {
      if (readOnly) return;
      pendingPayload.current = { content, title: nextTitle };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persist();
      }, 1000);
    },
    [persist, readOnly]
  );

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      Underline,
      Placeholder.configure({
        placeholder: readOnly ? "" : "Start writing…",
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: cn(
          "max-w-none min-h-[60vh] focus:outline-none text-[15px] leading-relaxed",
          readOnly && ""
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      const json = ed.getJSON();
      if (JSON.stringify(json) === lastSaved.current) return;
      setSaveStatus("idle");
      scheduleSave(json, title);
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const handleTitleBlur = () => {
    const trimmed = title.trim() || "Untitled document";
    setTitle(trimmed);
    onTitleChange?.(trimmed);
    if (readOnly || !editor) return;
    scheduleSave(editor.getJSON(), trimmed);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          readOnly={readOnly}
          aria-label="Document title"
          className={cn(
            "w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground",
            readOnly && "cursor-default"
          )}
          placeholder="Untitled document"
        />
        <SaveIndicator status={saveStatus} onRetry={() => void persist()} readOnly={readOnly} />
      </div>

      <EditorToolbar editor={editor} disabled={readOnly} />

      <div
        className={cn(
          "rounded-xl border border-border/70 bg-paper px-6 py-8 shadow-paper transition-shadow sm:px-10 sm:py-10",
          readOnly && "opacity-95"
        )}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function SaveIndicator({
  status,
  onRetry,
  readOnly,
}: {
  status: SaveStatus;
  onRetry: () => void;
  readOnly?: boolean;
}) {
  if (readOnly) {
    return <span className="text-xs text-muted-foreground">View only</span>;
  }

  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving…
      </span>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-2 text-xs text-destructive">
        Couldn&apos;t save
        <Button type="button" variant="outline" size="sm" className="h-7 px-2" onClick={onRetry}>
          <RefreshCw className="h-3 w-3" />
          Retry
        </Button>
      </div>
    );
  }

  if (status === "saved") {
    return <span className="text-xs text-muted-foreground">Saved</span>;
  }

  return <span className="text-xs text-muted-foreground">Unsaved changes</span>;
}
