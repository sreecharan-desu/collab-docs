# AI workflow

This project was built with AI coding agents (Cursor Cloud Agent) as accelerators—not as an unquestioned source of truth.

## Where AI helped

- **Scaffolding** — Next.js layout, Prisma schema, CI workflow, and shadcn-style UI primitives were generated quickly from the take-home spec.
- **Boilerplate** — TipTap toolbar wiring, server action patterns, and Playwright walkthrough test structure.
- **Docs skeleton** — README sections and architecture outline, then edited for accuracy and tone.

## What I reviewed or changed manually

- **Permission model** — Centralized in `src/lib/permissions.ts` with explicit Vitest cases; server routes must call `assertDocumentAccess`.
- **Markdown import** — Custom lexer → TipTap JSON mapping; types and edge cases fixed after TypeScript failures.
- **Autosave** — Debounced PATCH with visible status states; verified via Playwright reload step.
- **UX copy and visual design** — Palette, paper layout, empty states, and error strings tuned to feel intentional rather than generic template output.

## How correctness was verified

| Check | Result |
| --- | --- |
| `npm test` | 12 unit tests (permissions + markdown/upload) |
| `npm run typecheck` | Clean |
| `npm run lint` | Clean (no errors) |
| `npm run build` | Production build succeeds |
| `npm run db:setup` | Migrations + seed on local Postgres |
| `npm run demo:record` | End-to-end login → edit → persist → upload → share → viewer read-only; screenshots + webm/mp4/gif |

I did not claim features as working without running the above. CI mirrors the same lint/typecheck/test/build pipeline with a Postgres service container.

## Honest limits

AI-first drafts occasionally introduced unused imports, over-generic wording, or flaky Playwright typing steps; those were corrected after local runs failed. Real-time collaboration and production hardening (rate limits, audit logs) still need human design if this were a product.
