# Architecture

## Overview

Collab Docs is a single Next.js application. The browser talks to React Server Components and Server Actions for mutations; the editor autosaves through a small JSON API route. All authorization happens on the server against Postgres via Prisma.

```
Browser
  ├─ Dashboard / auth pages (RSC + Server Actions)
  ├─ Document page (RSC shell + client TipTap editor)
  └─ PATCH /api/documents/:id  (debounced autosave)

Middleware (edge)
  └─ Session cookie verification → redirect unauthenticated users

Postgres
  ├─ User
  ├─ Document (TipTap JSON in `content`)
  └─ DocumentShare (viewer | editor)
```

## Project structure

| Path | Role |
| --- | --- |
| `src/app/` | App Router pages, server actions, API route |
| `src/components/` | Dashboard, editor, auth UI, shadcn-style primitives |
| `src/lib/permissions.ts` | Pure permission helpers (unit tested) |
| `src/lib/documents.ts` | Document fetch + list queries with access checks |
| `src/lib/markdown-import.ts` | `.md` → TipTap JSON, upload validation |
| `src/lib/auth.ts` | bcrypt + JWT session cookie (`jose`) |
| `prisma/` | Schema, migrations, seed |

## Data model

- **User** — email (unique), bcrypt password hash, display name.
- **Document** — title, TipTap JSON `content`, `ownerId`, timestamps.
- **DocumentShare** — `(documentId, userId)` unique, role `VIEWER` | `EDITOR`.

Shares reference existing users by email at invite time (no magic-link invites in this scope).

## Permission model

Access is derived per request:

1. If `userId === ownerId` → **owner**
2. Else if a share row exists → **editor** or **viewer**
3. Else → **none**

Capabilities:

| Action | Owner | Editor | Viewer |
| --- | --- | --- | --- |
| Read | ✓ | ✓ | ✓ |
| Edit content / title | ✓ | ✓ | |
| Rename (via title field) | ✓ | ✓ | |
| Share / revoke | ✓ | | |
| Delete | ✓ | | |

Helpers live in `src/lib/permissions.ts`. Server actions and the autosave API call `assertDocumentAccess` before writing.

## Key decisions

**Signed cookie sessions instead of NextAuth** — fewer moving parts for a credentials-only demo; middleware validates the same JWT the server uses.

**TipTap JSON in Postgres** — simple persistence, easy autosave, no CRDT/websocket layer in a 4–6 hour scope.

**Server Actions for CRUD + REST PATCH for autosave** — actions fit form flows (login, share, upload); PATCH keeps the editor decoupled and debounced on the client.

**Share by registered email** — avoids building invite tokens and email delivery; error message tells the owner to ask the colleague to register first.

**Markdown import via `marked` lexer** — converts common blocks (headings, lists, emphasis) to TipTap JSON; not a full GFM parity layer.

## Tradeoffs

- **No real-time co-editing** — last write wins on autosave; no presence cursors.
- **No email notifications** — sharing is immediate in DB only.
- **Single-tenant style auth** — no orgs/teams.
- **Middleware JWT verify on edge** — duplicate verify vs server; acceptable for small app.

## Deprioritized (see SUBMISSION.md)

Operational transforms, version history, comments, public links, OAuth providers, full-text search, and mobile-native apps were out of scope for the time box.
