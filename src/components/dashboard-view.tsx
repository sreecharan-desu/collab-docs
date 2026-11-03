"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import {
  createDocumentAction,
  deleteDocumentAction,
  uploadDocumentAction,
} from "@/app/actions/documents";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatRelativeTime } from "@/lib/utils";
import { FilePlus2, FileUp, LogOut, Plus, Trash2 } from "lucide-react";

type DocRow = {
  id: string;
  title: string;
  updatedAt: Date | string;
  owner: { name: string; email: string };
  accessRole?: "owner" | "editor" | "viewer";
};

type Props = {
  user: { name: string; email: string };
  owned: DocRow[];
  shared: DocRow[];
};

export function DashboardView({ user, owned, shared }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const createDoc = () => {
    startTransition(async () => {
      await createDocumentAction();
    });
  };

  const onUpload = (file: File | null) => {
    if (!file) return;
    setUploadError(null);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadDocumentAction(formData);
      if (result?.error) {
        setUploadError(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold tracking-tight">Collab Docs</p>
            <p className="text-xs text-muted-foreground">Signed in as {user.name}</p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your workspace</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create, upload, and share documents with your team.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,text/plain"
              className="hidden"
              onChange={(e) => {
                onUpload(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="h-4 w-4" />
              Upload .txt / .md
            </Button>
            <Button type="button" disabled={pending} className="gap-2" onClick={createDoc}>
              <Plus className="h-4 w-4" />
              New document
            </Button>
          </div>
        </div>

        {uploadError ? (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {uploadError}
          </div>
        ) : null}

        <section className="space-y-4">
          <SectionHeader title="My documents" count={owned.length} />
          <DocumentList
            docs={owned}
            emptyMessage="No documents yet. Create one or upload a file to get started."
            showOwnerBadge
            onDelete={(id) =>
              startTransition(async () => {
                await deleteDocumentAction(id);
              })
            }
            pending={pending}
          />
        </section>

        <section className="mt-10 space-y-4">
          <SectionHeader title="Shared with me" count={shared.length} />
          <DocumentList
            docs={shared}
            emptyMessage="When someone shares a document with you, it will show up here."
            pending={pending}
          />
        </section>
      </main>
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        {count}
      </span>
    </div>
  );
}

function DocumentList({
  docs,
  emptyMessage,
  showOwnerBadge,
  onDelete,
  pending,
}: {
  docs: DocRow[];
  emptyMessage: string;
  showOwnerBadge?: boolean;
  onDelete?: (id: string) => void;
  pending?: boolean;
}) {
  if (!docs.length) {
    return (
      <Card className="border-dashed bg-background/50">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <FilePlus2 className="h-8 w-8 text-muted-foreground/60" />
          <p className="max-w-sm text-sm text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="grid gap-3">
      {docs.map((doc) => (
        <li key={doc.id}>
          <Card className="group transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <Link href={`/documents/${doc.id}`} className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{doc.title}</p>
                  {showOwnerBadge ? <Badge>Owner</Badge> : null}
                  {!showOwnerBadge && doc.accessRole ? (
                    <Badge variant="secondary">
                      {doc.accessRole === "editor" ? "Editor" : "Viewer"}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {showOwnerBadge ? "Updated" : `Shared by ${doc.owner.name} · Updated`}{" "}
                  {formatRelativeTime(new Date(doc.updatedAt))}
                </p>
              </Link>
              {onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  disabled={pending}
                  aria-label={`Delete ${doc.title}`}
                  onClick={() => onDelete(doc.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
