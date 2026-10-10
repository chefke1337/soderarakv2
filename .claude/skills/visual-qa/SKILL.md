---
name: visual-qa
description: Run a critical visual and UX quality review against the project's design system.
context: fork
agent: quality-auditor
---

# Visual QA workflow

Audit the current implementation against:
- `CLAUDE.md`
- `docs/design-system.md`
- `docs/sitemap.md`
- `docs/copy-deck.md`

Focus on:
- hierarchy at first viewport
- CTA clarity
- spacing rhythm
- typography consistency
- responsive layout
- contrast
- focus states
- interaction feedback
- visual clutter
- generic or accidental AI appearance
- unfinished states

Write findings to `docs/qa-report.md`.
Do not change source code.
