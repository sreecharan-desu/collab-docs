"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo2,
  Redo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  editor: Editor | null;
  disabled?: boolean;
};

function ToolButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className={cn("h-8 w-8 shrink-0", active && "bg-accent text-accent-foreground")}
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function EditorToolbar({ editor, disabled }: Props) {
  if (!editor) return null;

  const run = (fn: () => boolean) => {
    if (disabled) return;
    fn();
  };

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 rounded-xl border border-border/80 bg-background/95 p-1.5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <ToolButton
        label="Bold (Ctrl+B)"
        active={editor.isActive("bold")}
        disabled={disabled}
        onClick={() => run(() => editor.chain().focus().toggleBold().run())}
      >
        <Bold />
      </ToolButton>
      <ToolButton
        label="Italic (Ctrl+I)"
        active={editor.isActive("italic")}
        disabled={disabled}
        onClick={() => run(() => editor.chain().focus().toggleItalic().run())}
      >
        <Italic />
      </ToolButton>
      <ToolButton
        label="Underline (Ctrl+U)"
        active={editor.isActive("underline")}
        disabled={disabled}
        onClick={() => run(() => editor.chain().focus().toggleUnderline().run())}
      >
        <Underline />
      </ToolButton>

      <div className="mx-1 h-6 w-px bg-border" />

      <ToolButton
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        disabled={disabled}
        onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
      >
        <Heading1 />
      </ToolButton>
      <ToolButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        disabled={disabled}
        onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
      >
        <Heading2 />
      </ToolButton>
      <ToolButton
        label="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        disabled={disabled}
        onClick={() => run(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
      >
        <Heading3 />
      </ToolButton>

      <div className="mx-1 h-6 w-px bg-border" />

      <ToolButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        disabled={disabled}
        onClick={() => run(() => editor.chain().focus().toggleBulletList().run())}
      >
        <List />
      </ToolButton>
      <ToolButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        disabled={disabled}
        onClick={() => run(() => editor.chain().focus().toggleOrderedList().run())}
      >
        <ListOrdered />
      </ToolButton>

      <div className="mx-1 h-6 w-px bg-border" />

      <ToolButton
        label="Undo (Ctrl+Z)"
        disabled={disabled || !editor.can().undo()}
        onClick={() => run(() => editor.chain().focus().undo().run())}
      >
        <Undo2 />
      </ToolButton>
      <ToolButton
        label="Redo (Ctrl+Shift+Z)"
        disabled={disabled || !editor.can().redo()}
        onClick={() => run(() => editor.chain().focus().redo().run())}
      >
        <Redo2 />
      </ToolButton>
    </div>
  );
}
