---
description: Create a complete yet tightly relevant context pack for an external LLM—writing agents/temp/pack.xml and agents/temp/TASK_CONTEXT.md—focused on the issue or feature you describe, while staying under 45k tokens.
argument-hint: [short issue, error snippet, or feature request] $ARGUMENT
model: inherit
---

# /pack_context — Comprehensive-but-Relevant Context Pack

## Purpose
You are preparing two artifacts so the user can paste them into a high-capacity external LLM:
1) `agents/temp/pack.xml` — a RepoMix bundle containing all and only the code and assets needed to reason about the described task.
2) `agents/temp/TASK_CONTEXT.md` — a concise brief that states the problem, scoping intent, constraints, and what output is desired from the external model.

The user’s description is in **$ARGUMENTS**. Interpret it as the *source of truth* for what must be included.

---

## Selection Philosophy (what to include)
Be **comprehensive across layers** that touch the task, while excluding unrelated code. Strike the balance as follows:

- **If the user mentions a feature, capability, route, job, screen, or API:** include every module that directly implements it **and** any indirectly involved layers (interfaces, adapters, wiring, dependency injection, middleware, serializers, migrations, configuration, feature flags, env-driven switches, and build/runtime glue) that would be immediately affected by changes to that feature.
- **If the user mentions an error, symbol, or stack trace:** include the defining module(s), primary callers/callees, the initialization and lifecycle wiring, and any configuration/flags that influence those code paths. Prefer current implementations and their thin seams (ports, interfaces, contracts, schema).
- **Cross-cutting concerns** required for the task to compile or run locally (types/interfaces, minimal config, build recipes) are relevant; unrelated packages and large assets are not.
- **Tests:** include only tests that exercise the implicated behavior or serve as minimal execution harnesses/mocks for the affected code. Omit unrelated test suites.
- **Docs and ADRs:** include brief design notes/ADRs that define invariants, contracts, or trade-offs for the affected area. Omit long narrative docs unless they define required constraints.
- **Evidence:** include the smallest useful logs/diffs needed to understand the issue (recent commits touching the area, trimmed logs with the key lines, and identifiers such as PR numbers or migration IDs).

Always aim for **maximal signal with minimal noise**.

---

## Exclusions (what to avoid)
- Secrets, private keys, raw env files, credentials, and large binary assets.
- Generated, vendor, cache, or build outputs unless they encode an interface contract critical to the task.
- Unreferenced utilities, legacy modules not reachable from the task’s execution path, and large fixtures that do not change behavior.

---

## Token Budget (hard limit: ≤ 45k tokens)
- Create the best possible selection first. **Only if the pack would exceed 45k tokens**, reduce size by removing *irrelevant* content or compressing *non-essential* parts.
- Prefer intelligent **compression** over omission:
  - Keep public interfaces, type signatures, function/class skeletons, and comments that encode intent.
  - Replace repetitious or boilerplate bodies with compact stubs that preserve signatures and control-flow markers.
  - Trim tests to the minimal assertions that demonstrate the contract under discussion.
  - Drop large, non-critical docs and fixtures first.
- Stop pruning as soon as the pack fits under the budget.

---

## Deliverables
1) **`agents/temp/TASK_CONTEXT.md`** — a brief the external model reads *first*. It should include:
   - **Problem / Goal:** restate the task from **$ARGUMENTS** in plain language.
   - **Scope intent:** a short note that we included everything *directly and indirectly* touching the feature or error, plus immediately affected neighbors.
   - **Evidence:** key logs, stack traces, and commit/PR identifiers (trimmed).
   - **Constraints:** performance/latency expectations, compatibility, security/privacy, licensing, platform/framework versions.
   - **What to return:** specify one (plan only, patch diff, patch+tests, API/design only, or refactor plan) and any formatting rules (e.g., unified diff rooted at repo root).
   - **If you need more:** instruct the external model to name exact paths to add; we will re-pack.

2) **`agents/temp/pack.xml`** — the code bundle described above, formatted for robust parsing by external models.

---

## Packing (RepoMix)
Use RepoMix to generate the bundle. Produce `agents/temp/pack.xml` with XML formatting and size-aware flags that preserve structure while reducing noise. If `agents/temp/TASK_CONTEXT.md` exists, embed it as instructions for redundancy.

**Recommended invocation:**
```bash
# Input: newline-delimited list of selected files on stdin
cat agents/temp/files.selected | npx -y repomix --stdin \
  --style xml -o agents/temp/pack.xml \
  --compress --remove-comments --remove-empty-lines \
  --include-logs --include-logs-count 20 \
  --instruction-file-path agents/temp/TASK_CONTEXT.md
