import { describe, expect, it } from "vitest";
import {
  canDeleteDocument,
  canEditDocument,
  canManageSharing,
  canReadDocument,
  canRenameDocument,
  resolveDocumentAccess,
} from "@/lib/permissions";

describe("resolveDocumentAccess", () => {
  it("returns none when unauthenticated", () => {
    expect(
      resolveDocumentAccess({ userId: null, ownerId: "owner", shareRole: "EDITOR" })
    ).toBe("none");
  });

  it("returns owner for document owner", () => {
    expect(
      resolveDocumentAccess({ userId: "u1", ownerId: "u1", shareRole: null })
    ).toBe("owner");
  });

  it("returns editor or viewer from share role", () => {
    expect(
      resolveDocumentAccess({ userId: "u2", ownerId: "u1", shareRole: "EDITOR" })
    ).toBe("editor");
    expect(
      resolveDocumentAccess({ userId: "u2", ownerId: "u1", shareRole: "VIEWER" })
    ).toBe("viewer");
  });

  it("returns none without share", () => {
    expect(
      resolveDocumentAccess({ userId: "u2", ownerId: "u1", shareRole: null })
    ).toBe("none");
  });
});

describe("permission helpers", () => {
  it("read access for owner, editor, viewer only", () => {
    expect(canReadDocument("owner")).toBe(true);
    expect(canReadDocument("editor")).toBe(true);
    expect(canReadDocument("viewer")).toBe(true);
    expect(canReadDocument("none")).toBe(false);
  });

  it("edit access for owner and editor only", () => {
    expect(canEditDocument("owner")).toBe(true);
    expect(canEditDocument("editor")).toBe(true);
    expect(canEditDocument("viewer")).toBe(false);
    expect(canEditDocument("none")).toBe(false);
  });

  it("sharing and delete are owner-only", () => {
    expect(canManageSharing("owner")).toBe(true);
    expect(canManageSharing("editor")).toBe(false);
    expect(canDeleteDocument("owner")).toBe(true);
    expect(canDeleteDocument("editor")).toBe(false);
  });

  it("rename allowed for owner and editor", () => {
    expect(canRenameDocument("owner")).toBe(true);
    expect(canRenameDocument("editor")).toBe(true);
    expect(canRenameDocument("viewer")).toBe(false);
  });
});
