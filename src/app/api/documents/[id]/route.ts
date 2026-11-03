import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { assertDocumentAccess } from "@/lib/documents";
import { prisma } from "@/lib/db";
import { saveDocumentSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = saveDocumentSchema.safeParse({ ...body, documentId: id });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 }
    );
  }

  try {
    await assertDocumentAccess(id, user.id, "edit");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: { content: object; title?: string; updatedAt: Date } = {
    content: parsed.data.content,
    updatedAt: new Date(),
  };
  if (parsed.data.title) {
    data.title = parsed.data.title;
  }

  const updated = await prisma.document.update({
    where: { id },
    data,
    select: { id: true, updatedAt: true, title: true },
  });

  return NextResponse.json({ ok: true, document: updated });
}
