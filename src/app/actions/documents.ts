"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth";
import {
  assertDocumentAccess,
  getDocumentForUser,
  listDocumentsForUser,
} from "@/lib/documents";
import {
  markdownToTipTapJson,
  plainTextToTipTapJson,
  validateUploadFile,
} from "@/lib/markdown-import";
import { documentTitleSchema, shareSchema } from "@/lib/validations";

const EMPTY_DOC = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export async function createDocumentAction(title?: string) {
  const user = await requireSessionUser().catch(() => {
    throw new Error("UNAUTHORIZED");
  });

  const parsedTitle = documentTitleSchema.safeParse({
    title: title?.trim() || "Untitled document",
  });
  if (!parsedTitle.success) {
    return { error: parsedTitle.error.issues[0]?.message };
  }

  const doc = await prisma.document.create({
    data: {
      title: parsedTitle.data.title,
      ownerId: user.id,
      content: EMPTY_DOC,
    },
  });

  revalidatePath("/");
  redirect(`/documents/${doc.id}`);
}

export async function renameDocumentAction(documentId: string, title: string) {
  const user = await requireSessionUser();
  await assertDocumentAccess(documentId, user.id, "rename");

  const parsed = documentTitleSchema.safeParse({ title: title.trim() });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { title: parsed.data.title },
  });

  revalidatePath("/");
  revalidatePath(`/documents/${documentId}`);
  return { ok: true as const };
}

export async function deleteDocumentAction(documentId: string) {
  const user = await requireSessionUser();
  await assertDocumentAccess(documentId, user.id, "delete");

  await prisma.document.delete({ where: { id: documentId } });
  revalidatePath("/");
  redirect("/");
}

export async function shareDocumentAction(
  documentId: string,
  email: string,
  role: "VIEWER" | "EDITOR"
) {
  const user = await requireSessionUser();
  await assertDocumentAccess(documentId, user.id, "share");

  const parsed = shareSchema.safeParse({ email, role });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const targetEmail = parsed.data.email.toLowerCase();
  if (targetEmail === user.email.toLowerCase()) {
    return { error: "You cannot share a document with yourself" };
  }

  const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });
  if (!targetUser) {
    return { error: "No user found with that email. They need an account first." };
  }

  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return { error: "Document not found" };
  if (doc.ownerId === targetUser.id) {
    return { error: "This user already owns the document" };
  }

  await prisma.documentShare.upsert({
    where: {
      documentId_userId: { documentId, userId: targetUser.id },
    },
    update: { role: parsed.data.role },
    create: {
      documentId,
      userId: targetUser.id,
      role: parsed.data.role,
    },
  });

  revalidatePath(`/documents/${documentId}`);
  return { ok: true as const };
}

export async function revokeShareAction(documentId: string, shareId: string) {
  const user = await requireSessionUser();
  await assertDocumentAccess(documentId, user.id, "share");

  const share = await prisma.documentShare.findUnique({ where: { id: shareId } });
  if (!share || share.documentId !== documentId) {
    return { error: "Share not found" };
  }

  await prisma.documentShare.delete({ where: { id: shareId } });
  revalidatePath(`/documents/${documentId}`);
  return { ok: true as const };
}

export async function uploadDocumentAction(formData: FormData) {
  const user = await requireSessionUser();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Choose a .txt or .md file to upload" };
  }

  const validation = validateUploadFile({
    name: file.name,
    size: file.size,
    type: file.type,
  });
  if (!validation.ok) {
    return { error: validation.error };
  }

  const text = await file.text();
  const baseName = file.name.replace(/\.(txt|md|markdown)$/i, "") || "Imported document";
  const content =
    validation.kind === "markdown" ? markdownToTipTapJson(text) : plainTextToTipTapJson(text);

  const doc = await prisma.document.create({
    data: {
      title: baseName.slice(0, 200),
      ownerId: user.id,
      content: content as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/");
  redirect(`/documents/${doc.id}`);
}

export async function getDashboardData() {
  const user = await requireSessionUser();
  return listDocumentsForUser(user.id);
}

export async function getDocumentPageData(documentId: string) {
  const user = await requireSessionUser();
  const doc = await getDocumentForUser(documentId, user.id);
  if (!doc) return null;
  return doc;
}
