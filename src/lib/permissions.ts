import type { ShareRole } from "@prisma/client";

export type DocumentAccessRole = "owner" | "editor" | "viewer" | "none";

export type AccessContext = {
  userId: string | null;
  ownerId: string;
  shareRole: ShareRole | null;
};

export function resolveDocumentAccess(ctx: AccessContext): DocumentAccessRole {
  if (!ctx.userId) return "none";
  if (ctx.userId === ctx.ownerId) return "owner";
  if (ctx.shareRole === "EDITOR") return "editor";
  if (ctx.shareRole === "VIEWER") return "viewer";
  return "none";
}

export function canReadDocument(role: DocumentAccessRole): boolean {
  return role === "owner" || role === "editor" || role === "viewer";
}

export function canEditDocument(role: DocumentAccessRole): boolean {
  return role === "owner" || role === "editor";
}

export function canManageSharing(role: DocumentAccessRole): boolean {
  return role === "owner";
}

export function canDeleteDocument(role: DocumentAccessRole): boolean {
  return role === "owner";
}

export function canRenameDocument(role: DocumentAccessRole): boolean {
  return role === "owner" || role === "editor";
}
