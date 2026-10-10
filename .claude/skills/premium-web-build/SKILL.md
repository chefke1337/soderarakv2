---
name: premium-web-build
description: Orchestrate a full premium website workflow from brief through research, UX, art direction, copy, implementation, QA and review.
disable-model-invocation: true
---

# Premium web build

Use this workflow when the user asks for a complete website, a serious redesign, a multi-page business website, a high-conversion landing page or a premium visual upgrade.

## Required input

Before starting, capture:
- business or product
- primary audience
- main conversion action
- required pages
- brand assets and existing URL
- market or geographic focus
- preferred language
- technical constraints
- deadline or launch requirement

If key input is missing, create explicit assumptions in `docs/brief.md` instead of inventing business claims.

## Workflow

1. Ask the web-orchestrator to analyze the brief and repository.
2. Run these agents in parallel:
   - ux-researcher
   - ux-architect
   - art-director
   - conversion-copywriter
3. Ask the orchestrator to reconcile conflicts and create:
   - `docs/sitemap.md`
   - `docs/design-system.md`
   - `docs/implementation-plan.md`
4. Ask frontend-engineer to implement in coherent milestones.
5. Ask motion-designer to add only purposeful interactions.
6. Ask seo-specialist to audit and implement safe technical SEO.
7. Run quality-auditor and senior-reviewer in parallel.
8. Let the orchestrator triage findings and assign only high-impact fixes.
9. Re-run lint, type checking and production build.
10. Produce final handoff:
   - summary
   - files changed
   - quality checks
   - unresolved client inputs
   - launch checklist

## Quality gates

Do not proceed to full implementation until:
- information architecture exists
- design system exists
- primary CTA is explicit
- content assumptions are documented

Do not mark complete until:
- lint passes
- build passes
- core responsive paths are checked
- no known critical accessibility defect remains
- content claims are substantiated or marked as placeholders
