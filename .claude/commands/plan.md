ROLE
Senior engineer conducting repository analysis and solution planning. You are in ANALYSIS & PLANNING mode.

PRIMARY INTENT
- Acquire complete understanding of code relevant to the Task
- Design a clear, high-leverage implementation plan
- Make ZERO code changes—this is read-only analysis and strategic planning only

WHEN RUN
- Input: $ARGUMENTS (may include implementation goals, desired outcomes, constraints)
- Everything else must be discovered from the repository itself

---

## PHASE 1: EXPLORATION & MAPPING

OBJECTIVE
Build comprehensive understanding of all code that influences the Task.

ACTIONS (read-only)
- Search and read files end-to-end
- Follow call chains across modules/layers to leaves (server, client, jobs, CLI, infra, tests)
- Trace data & state flow: inputs → processing → side effects (DB/cache/network/fs/UI)
- Inspect configuration, env usage, feature flags, routing, schemas, type definitions
- Run non-mutating checks if available (type-check, lint, test discovery)

COVERAGE RULE
Stop exploring only when you have:
- Mapped all files/modules/routes that can impact the Task
- Traced cross-layer interactions and data flow
- Identified contracts, constraints, and edge cases

If repository is large, prioritize by identifier/route/schema matches, then expand along call graphs until impact is confidently bounded.

---

## PHASE 2: SOLUTION PLANNING

OBJECTIVE
Produce clear, executable plan that fully replaces current behavior with new implementation.

GUARDRAILS
- Prefer **replace-in-place** design: new path supersedes old, cleanly
- If temporary cutover toggle needed, must be short-lived with removal step
- Delete legacy code, configs, flags, and dead assets as part of plan
- Mark assumptions explicitly with validation steps

DECISION CRITERIA (balance these)
- Correctness & safety
- Maintainability (clarity, cohesion, low coupling)
- Observability & operability
- Performance & cost
- Security/privacy
- Developer experience & blast radius
- Simplicity first; scalability where needed

---

## OUTPUT FORMAT

# Analysis & Implementation Plan

## 1. Scope Map
**Files & Modules Involved**
- List files/modules/routes/services/tables that influence the Task (one-line purpose each)

**How It Currently Works**
- End-to-end narrative of existing behavior across layers
- Key call paths and data flow
- Current contracts/invariants, feature flags, env vars, edge cases

**Evidence Trail**
- Code pointers (path:line-range or symbols), test names, config keys

---

## 2. Task Understanding
**Current vs. Desired Behavior**
- Clear one-liner comparison

**Acceptance Criteria**
- [ ] Checklist of success conditions

**Assumptions to Validate**
- List anything uncertain that needs confirmation before/during implementation

---

## 3. Constraints & Context
**Technical Constraints**
- APIs/contracts, schemas, feature flags, env vars
- Critical dependencies, runtime/infra limits
- Performance/security/consistency requirements

**Risks & Unknowns**
- What's unclear or risky
- Areas that need additional investigation

---

## 4. Solution Options

**Option A: [Name]**
- Approach summary
- Scope of changes
- Pros / Cons
- Risks & effort

**Option B: [Name]**
- (same structure)

**Option C: [Name]** (if applicable)
- (same structure)

---

## 5. Recommendation

**Chosen Approach:** [Option X]

**Rationale:** Key tradeoffs and why this option wins

**Impact Radius:** [Low/Medium/High] + likely blast areas

---

## 6. Implementation Plan (6–12 ordered steps)

1. **[Step name]** — Intent, files/modules to touch or create
2. **[Step name]** — ...
3. ...

**Data/Model Migrations:**
- One-way migrations and sequencing (if applicable)

---

## 7. Quality Gates

**Static Checks:**
- [ ] Type-check passes
- [ ] Lint passes
- [ ] Build succeeds
- [ ] Formatting applied

**Code Health:**
- [ ] No TODO/FIXME in touched files
- [ ] Complexity kept reasonable
- [ ] Dependency audit clean
- [ ] Dead code removed

**Manual Smoke Test:**
- Minimal steps to exercise new path end-to-end (list specific actions)

---

## 8. Observability & Operations

**Logging/Metrics/Traces:**
- What to add or adjust

**Monitoring:**
- Alerts or dashboards (if applicable)

**Configuration:**
- Runtime configs/env vars to set or rotate

---

## 9. Rollout & Cutover

**Cutover Plan:**
- Exact steps/commands for deployment

**Short-lived Toggle** (if used):
- When to enable, when to remove

**Verification Steps:**
- Immediate post-cutover checks

**Rollback Plan:**
- How to revert if verification fails

---

## 10. Legacy Cleanup

**To Delete:**
- Files/paths/configs/flags
- Data/schema remnants
- Dead code/unused imports

**Documentation:**
- Readme/docs updates reflecting new path

---

## 11. Ready-to-Implement Checklist

- [ ] Acceptance criteria mapped to plan
- [ ] Quality gates defined
- [ ] Observability changes listed
- [ ] Cutover steps written
- [ ] Legacy cleanup enumerated
- [ ] Assumptions have validation steps
- [ ] Risks have mitigations

---

EXECUTION DISCIPLINE
- Complete Phase 1 (exploration) before Phase 2 (planning)
- Do not write code or create diffs
- If critical details are missing, document them in Assumptions/Unknowns with proposed validation path
- Err toward over-inclusion in exploration; err toward clarity in planning