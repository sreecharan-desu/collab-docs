# Video script (~4 minutes)

Tone: first person, conversational. Record screen alongside this narration.

---

**0:00 — Intro**

Hi — this is Collab Docs, a lightweight collaborative editor I built for a take-home. It’s Next.js on the front, Postgres on the back, with email-based sharing and rich text editing. I’ll walk through what works end to end, what I skipped, and how I used AI tools without trusting them blindly.

**0:20 — Sign in and dashboard**

I’m signing in as Alice with the seeded demo account. The dashboard splits **My documents** and **Shared with me**, with badges for owner, editor, or viewer. I can create a blank doc or upload a text or Markdown file from here.

**0:45 — Create and format**

I’ll create a new document. The editor has a sticky toolbar — bold, italic, underline, headings, lists, undo and redo — plus keyboard shortcuts. I’ll type some notes and apply a heading to show formatting. The page is a centered “paper” sheet on a calm gray canvas, with dark mode if I toggle it.

**1:15 — Persistence and autosave**

Watch the status line: after I stop typing, autosave kicks in within about a second — Saving, then Saved. I’ll refresh the browser… and the content is still here, loaded from TipTap JSON stored in Postgres.

**1:40 — Upload Markdown**

Back on the dashboard, I upload a `.md` file. The app validates extension and size — one megabyte max — and converts Markdown into editable rich text in a new document.

**2:05 — Sharing**

As the owner, I open Share, enter Bob’s email, and add him as a viewer. The server checks I’m the owner before writing the share row. I can revoke access from the same dialog.

**2:30 — Bob’s view**

I sign out and log in as Bob. Alice’s document shows under **Shared with me**. When I open it, the toolbar is disabled and the badge says Viewer — read only. If I tried to PATCH content, the API would return forbidden; that’s enforced server-side, not just in the UI.

**2:55 — What works**

So the full loop works: auth, CRUD, rich text, autosave, upload, share, and role-based access with tests on the permission helpers and markdown import. CI runs lint, typecheck, tests, and build on push.

**3:15 — Deprioritized**

I intentionally skipped real-time cursors, CRDT merging, version history, comments, and email invite links — those are a much bigger slice than a focused take-home. Sharing assumes the colleague already registered.

**3:35 — Architecture**

Documents store TipTap JSON. Shares are a join table with viewer or editor roles. Sessions are signed cookies; Prisma talks to Postgres. Autosave uses a small PATCH route so the editor can debounce independently of server actions.

**3:50 — AI workflow**

I used AI coding agents to scaffold quickly — layout, Prisma, CI — then ran tests, Playwright, and manual flows to verify. I fixed permission checks, import typing, and flaky demo steps myself. Nothing went into the README as “working” until those commands passed.

**4:05 — Close**

Thanks for watching. Links to the repo, screenshots, and silent demo are in the README. Narrated URL is TBD until I record the final take.
