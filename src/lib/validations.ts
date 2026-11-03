import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const documentTitleSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
});

export const shareSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(["VIEWER", "EDITOR"]),
});

export const saveDocumentSchema = z.object({
  documentId: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  content: z.record(z.string(), z.unknown()),
});
