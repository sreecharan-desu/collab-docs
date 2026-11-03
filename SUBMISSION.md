# Submission

## Deliverables

- [x] Next.js + TypeScript + Tailwind + TipTap + Prisma/Postgres app
- [x] Credential auth (bcrypt + signed session cookie)
- [x] `postinstall` → `prisma generate`; `db:setup` → migrate + seed
- [x] README, ARCHITECTURE, AI_WORKFLOW, SUBMISSION, VIDEO_SCRIPT, VIDEO_URL.txt
- [x] Screenshots in `docs/screenshots/`
- [x] Silent demo video in `docs/demo/` (+ GIF preview)
- [x] GitHub Actions CI
- [x] Vitest tests for permissions and markdown import
- [ ] Narrated video URL (placeholder in `VIDEO_URL.txt`)

## Working features (verified)

- Register / login / logout
- Create, open, rename (title field), delete documents
- Dashboard: owned vs shared lists with badges
- Rich text toolbar + keyboard shortcuts (TipTap defaults)
- Autosave with status indicator
- Refresh preserves document content
- Upload `.txt` / `.md` with size/type validation
- Share by email as viewer or editor; revoke
- Viewer UI is read-only; server rejects edit attempts
- Seed users and sample shared document
- Dark mode toggle

## Environment variables for Vercel

| Name | Required |
| --- | --- |
| `DATABASE_URL` | Yes (Neon Postgres recommended) |
| `AUTH_SECRET` | Yes |

Run `npm run db:setup` once against the production database after first deploy.

## Limitations

- No live multi-user cursors or simultaneous editing (autosave only).
- Share targets must already have an account (email lookup).
- Markdown import supports common blocks, not every GFM edge case.
- No document version history or restore.
- No password reset email flow.
- Narrated walkthrough video not recorded yet (`VIDEO_URL.txt` = TBD).

## Suggested next steps

1. Deploy to Vercel + Neon; fill in live URL in README.
2. Record narrated video using `docs/VIDEO_SCRIPT.md`.
3. Add optional invite flow (email magic link) for users not yet registered.
4. Add Yjs / PartyKit or similar if true real-time co-editing is required.
5. Rate-limit auth and autosave endpoints; add structured logging.

## Pull request

Open the PR from branch `cursor/collaborative-document-editor-76c6` → `main`.
