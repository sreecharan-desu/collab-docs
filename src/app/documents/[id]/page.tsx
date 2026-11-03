import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDocumentPageData } from "@/app/actions/documents";
import { DocumentEditor } from "@/components/editor/document-editor";
import { ShareDialog } from "@/components/share-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { canEditDocument, canManageSharing } from "@/lib/permissions";
import type { JSONContent } from "@tiptap/core";
import { ArrowLeft, LogOut } from "lucide-react";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const doc = await getDocumentPageData(id);
  if (!doc) notFound();

  const readOnly = !canEditDocument(doc.accessRole);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="shrink-0">
              <Link href="/" aria-label="Back to dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{doc.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {doc.owner.email === user.email ? "You own this document" : `Owner · ${doc.owner.name}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={readOnly ? "secondary" : "default"}>
              {doc.accessRole === "owner"
                ? "Owner"
                : doc.accessRole === "editor"
                  ? "Editor"
                  : "Viewer"}
            </Badge>
            <ShareDialog
              documentId={doc.id}
              shares={doc.shares}
              canManage={canManageSharing(doc.accessRole)}
            />
            <ThemeToggle />
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 sm:py-8">
        <DocumentEditor
          documentId={doc.id}
          initialTitle={doc.title}
          initialContent={doc.content as JSONContent}
          readOnly={readOnly}
        />
      </main>
    </div>
  );
}
