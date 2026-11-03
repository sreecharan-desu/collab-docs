import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@demo.com" },
    update: { name: "Alice", passwordHash },
    create: {
      email: "alice@demo.com",
      name: "Alice",
      passwordHash,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@demo.com" },
    update: { name: "Bob", passwordHash },
    create: {
      email: "bob@demo.com",
      name: "Bob",
      passwordHash,
    },
  });

  const existing = await prisma.document.findFirst({
    where: { ownerId: alice.id, title: "Welcome to Collab Docs" },
  });

  const doc =
    existing ??
    (await prisma.document.create({
      data: {
        title: "Welcome to Collab Docs",
        ownerId: alice.id,
        content: {
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Welcome to Collab Docs" }],
            },
            {
              type: "paragraph",
              content: [
                { type: "text", text: "This sample document is owned by " },
                { type: "text", marks: [{ type: "bold" }], text: "Alice" },
                { type: "text", text: " and shared with Bob as a viewer." },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Try formatting text, uploading a markdown file, or sharing with a teammate.",
                },
              ],
            },
          ],
        },
      },
    }));

  await prisma.documentShare.upsert({
    where: {
      documentId_userId: { documentId: doc.id, userId: bob.id },
    },
    update: { role: "VIEWER" },
    create: {
      documentId: doc.id,
      userId: bob.id,
      role: "VIEWER",
    },
  });

  console.log("Seed complete:");
  console.log("  alice@demo.com / demo1234");
  console.log("  bob@demo.com / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
