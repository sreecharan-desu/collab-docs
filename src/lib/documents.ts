import { prisma } from "@/lib/db";
import type { ShareRole } from "@prisma/client";
import {
  canDeleteDocument,
  canEditDocument,
  canManageSharing,
  canReadDocument,
  canRenameDocument,
  resolveDocumentAccess,
  type DocumentAccessRole,
} from "@/lib/permissions";

export type DocumentWithAccess = {
  id: string;
  title: string;
  content: unknown;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  owner: { id: string; name: string; email: string };
  shares: {
    id: string;
    role: ShareRole;
    user: { id: string; name: string; email: string };
  }[];
  accessRole: DocumentAccessRole;
};

async function loadDocument(documentId: string) {
  return prisma.document.findUnique({
    where: { id: documentId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
}

export async function getDocumentForUser(
  documentId: string,
  userId: string | null
): Promise<DocumentWithAccess | null> {
  const doc = await loadDocument(documentId);
  if (!doc) return null;

  const share = userId
    ? doc.shares.find((s) => s.userId === userId)?.role ?? null
    : null;

  const accessRole = resolveDocumentAccess({
    userId,
    ownerId: doc.ownerId,
    shareRole: share,
  });

  if (!canReadDocument(accessRole)) return null;

  return { ...doc, accessRole };
}

export async function assertDocumentAccess(
  documentId: string,
  userId: string,
  check: "read" | "edit" | "share" | "delete" | "rename"
): Promise<DocumentWithAccess> {
  const doc = await getDocumentForUser(documentId, userId);
  if (!doc) {
    throw new Error("NOT_FOUND");
  }

  const allowed =
    (check === "read" && canReadDocument(doc.accessRole)) ||
    (check === "edit" && canEditDocument(doc.accessRole)) ||
    (check === "share" && canManageSharing(doc.accessRole)) ||
    (check === "delete" && canDeleteDocument(doc.accessRole)) ||
    (check === "rename" && canRenameDocument(doc.accessRole));

  if (!allowed) {
    throw new Error("FORBIDDEN");
  }

  return doc;
}

export async function listDocumentsForUser(userId: string) {
  const owned = await prisma.document.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  const shared = await prisma.document.findMany({
    where: {
      shares: { some: { userId } },
      NOT: { ownerId: userId },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: { where: { userId }, select: { role: true } },
    },
  });

  return {
    owned: owned.map((d) => ({ ...d, accessRole: "owner" as const })),
    shared: shared.map((d) => ({
      ...d,
      accessRole: (d.shares[0]?.role === "EDITOR" ? "editor" : "viewer") as
        | "editor"
        | "viewer",
    })),
  };
}
