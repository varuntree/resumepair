# Learning System Execution Guide
*Version 1.0.0*

## Overview

This is the complete step-by-step guide for executing the learning system. It covers observation capture, pipeline execution, integration, and validation.

## Execution Timeline

The learning system operates at two key points:

```
┌─────────────────────────────────────────────────┐
│ DURING IMPLEMENTATION                           │
│ Capture observations in real-time               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ AFTER VALIDATION                                │
│ Execute pipeline → Review → Apply               │
└─────────────────────────────────────────────────┘
```

---

# Phase 1: Observation Capture (During Implementation)

## When to Capture

### Primary Triggers (Always Capture)

#### 🔴 **Errors** - Capture Immediately
Any unexpected failure, exception, or crash:
- Build failures, runtime errors, test failures
- Deployment issues, API errors, database errors
- Type errors, integration failures

**Examples**:
```
- "TypeError: Cannot read property 'x' of undefined"
- "Migration failed: syntax error at line 45"
- "Build error: Module '@/components/Foo' not found"
```

#### 🔄 **Workarounds** - Capture with Solution
Alternative approaches to overcome obstacles:
- Using different library/method than planned
- Implementing custom solution when native doesn't work
- Manual processes when automation fails
- Temporary fixes or polyfills

**Examples**:
```
- "Used pdf-lib instead of jsPDF due to serverless limitations"
- "Implemented custom validation - library doesn't support async"
- "Added polyfill for Array.at() - not available in target"
```

#### 💡 **Discoveries** - Capture for Future
Better approaches or tools found during work:
- More efficient algorithms or patterns
- Better libraries than initially chosen
- Cleaner implementation approaches
- Built-in methods that replace custom code

**Examples**:
```
- "Found native structuredClone() replaces lodash.cloneDeep"
- "Discovered React.memo() solves re-render performance issue"
- "Pattern X significantly cleaner than current approach"
```

#### ❓ **Assumptions Violated**
When expected behavior doesn't match reality:
- API responses different than documented
- Library behavior unexpected
- Framework limitations discovered
- Environment differences (dev vs prod)

**Capture when**: Impact is significant or likely to recur

## How to Capture

### Location
Always write to: `/agents/phase_[N]/learnings/observations.md`

### Standard Template

```markdown
## Observation [PHASE]-[TIMESTAMP]-[SEQUENCE]

**Trigger**: [Error|Workaround|Discovery|Assumption|Pattern]
**Severity**: [Critical|High|Medium|Low]
**Component**: [Specific file/module affected]
**Time Impact**: [Minutes spent addressing]

### What Happened
[Clear, concise description of the observation]

### Root Cause
[If known, why this happened]

### Context
```[language]
// Relevant code or configuration
// Include enough context to understand the issue
```

### Evidence
```
// Error messages, logs, or screenshots
// Exact output that demonstrates the issue
```

### Resolution
[How it was resolved or worked around]
```[language]
// Code that fixed the issue
```

### Learning Potential
- **Recurring**: [One-time|Likely|Definite]
- **Generalizable**: [Yes|No]
- **Preventable**: [Yes|No|Maybe]

---
```

### Complete Example

```markdown
## Observation 1-2025-09-28T10:30:45Z-001

**Trigger**: Error
**Severity**: High
**Component**: /libs/repositories/profile.ts
**Time Impact**: 45 minutes

### What Happened
Supabase client methods returning different types between server and client versions, causing TypeScript errors in repositories.

### Root Cause
Server and client Supabase clients have slightly different type signatures for the same methods, making unified repository patterns difficult.

### Context
```typescript
// This pattern doesn't work due to type differences
export async function getProfile(
  client: SupabaseClient,  // Type incompatible between server/client
  userId: string
) {
  return client.from('profiles').select().eq('user_id', userId).single()
}
```

### Evidence
```
Type error: Argument of type 'SupabaseServerClient' is not assignable to parameter of type 'SupabaseClient'.
  Types of property 'auth' are incompatible.
```

### Resolution
Created union type to handle both:
```typescript
type SupabaseAnyClient = SupabaseClient | SupabaseServerClient

export async function getProfile(
  client: SupabaseAnyClient,
  userId: string
) {
  return client.from('profiles').select().eq('user_id', userId).single()
}
```

### Learning Potential
- **Recurring**: Definite (will affect all repositories)
- **Generalizable**: Yes (pattern applies to all Supabase projects)
- **Preventable**: Yes (with proper type setup from start)

---
```

## Severity Guidelines

| Severity | When to Use | Action Required |
|----------|-------------|-----------------|
| 🔴 **Critical** | Blocks implementation, data loss, security issue | Stop and capture immediately with full detail |
| 🟠 **High** | Major functionality broken, substantial workaround needed | Capture before moving to next task |
| 🟡 **Medium** | Minor issues, simple workaround, limited scope | Capture within the session |
| 🟢 **Low** | Nice-to-have improvements, minor optimizations | Capture if time permits |

## What NOT to Capture

Skip these to maintain signal-to-noise ratio:
- ❌ Simple typos (unless they caused significant issues)
- ❌ Personal preferences or code style opinions
- ❌ Expected errors (user input validation)
- ❌ Temporary issues (network blips, transient failures)
- ❌ Debug/console statements added during development

---

# Phase 2: Analysis Pipeline (After Validation)

## Prerequisites

Before starting the pipeline, ensure:
- ✅ Phase implementation complete
- ✅ Validation tests passed
- ✅ Code review completed
- ✅ Observations file exists (even if empty)
- ✅ Phase summary created

## Pipeline Setup

### Create Analysis Workspace
```bash
# If not already created during implementation
mkdir -p /agents/phase_[N]/learnings/
```

### Gather Context
Before deploying agents, prepare:
1. Phase number and name
2. Observations file: `/agents/phase_[N]/learnings/observations.md`
3. All agent outputs from phase: `/agents/phase_[N]/*.md`
4. Current standards: `/ai_docs/**/*.md`
5. Existing knowledge base: `/agents/learning_system/knowledge_base/`

## Agent Deployment Sequence

Execute these 4 agents sequentially:

### Agent 1: Pattern Extractor

**Purpose**: Identify recurring themes from observations

**Agent Type**: `general-purpose`

**Context to Provide**:
```markdown
You are analyzing Phase [N] observations to extract patterns.

Input Files:
- Observations: /agents/phase_[N]/learnings/observations.md
- Phase Outputs: /agents/phase_[N]/*.md
- Previous Patterns: /agents/learning_system/knowledge_base/patterns/

Task: Identify recurring themes, common root causes, and patterns that can be generalized.
```

**Instructions**: See detailed instructions in `AGENTS.md` → Pattern Extractor section

**Output**: `/agents/phase_[N]/learnings/patterns.md`

**Success Criteria**:
- All observations analyzed
- Patterns have 2+ observations as evidence
- Confidence scores assigned
- Clear actionable recommendations

---

### Agent 2: Knowledge Generalizer

**Purpose**: Transform patterns into reusable wisdom

**Agent Type**: `general-purpose`

**Context to Provide**:
```markdown
You are transforming Phase [N] patterns into generalizable knowledge.

Input Files:
- Patterns: /agents/phase_[N]/learnings/patterns.md
- Standards: /ai_docs/*.md
- Knowledge Base: /agents/learning_system/knowledge_base/

Task: Create if-then-because rules and reusable principles from specific patterns.
```

**Instructions**: See detailed instructions in `AGENTS.md` → Knowledge Generalizer section

**Output**: `/agents/phase_[N]/learnings/generalized.md`

**Success Criteria**:
- All patterns abstracted to principles
- Clear if-then-because rules
- Application contexts defined
- Exceptions documented

---

### Agent 3: Integration Mapper

**Purpose**: Map learnings to specific documentation updates

**Agent Type**: `general-purpose`

**Context to Provide**:
```markdown
You are mapping Phase [N] learnings to documentation updates.

Input Files:
- Generalized Knowledge: /agents/phase_[N]/learnings/generalized.md
- Documentation: /ai_docs/**/*.md
- Integration Rules: See below

Task: Identify exactly where and how to integrate each learning.
```

**Instructions**: See detailed instructions in `AGENTS.md` → Integration Mapper section

**Output**: `/agents/phase_[N]/learnings/integration_map.md`

**Success Criteria**:
- Every learning mapped to location
- Specific line numbers or sections
- Conflicts identified and resolved
- Dependencies mapped

---

### Agent 4: Validation Orchestrator

**Purpose**: Validate all changes and create human-review proposal

**Agent Type**: `general-purpose`

**Context to Provide**:
```markdown
You are validating Phase [N] learning integration proposal.

Input Files:
- Patterns: /agents/phase_[N]/learnings/patterns.md
- Knowledge: /agents/phase_[N]/learnings/generalized.md
- Integration Map: /agents/phase_[N]/learnings/integration_map.md

Task: Validate all changes and create the final human-readable proposal.
```

**Instructions**: See detailed instructions in `AGENTS.md` → Validation Orchestrator section

**Output**: `/agents/learning_system/proposals/phase_[N]_proposal.md`

**Success Criteria**:
- All learnings validated
- Changes categorized by priority
- Metrics calculated
- One-click approval ready

---

# Phase 3: Integration & Application

## Document Mapping Rules

### Primary Integration Targets

| Learning Type | Primary Document | Section |
|---------------|------------------|---------|
| Database patterns | `/ai_docs/coding_patterns.md` | Database Access/Migration |
| API patterns | `/ai_docs/coding_patterns.md` | API Route Pattern |
| UI/Component patterns | `/ai_docs/coding_patterns.md` | Component Pattern |
| Testing patterns | `/ai_docs/coding_patterns.md` | Testing Pattern |
| Security issues | `/ai_docs/standards/6_security_checklist.md` | Relevant checkpoint |
| Performance issues | `/ai_docs/standards/7_performance_guidelines.md` | Relevant metric |
| Tool decisions | `/ai_docs/development_decisions.md` | Tool category |
| Process improvements | `/ai_docs/orchestrator_instructions.md` | Workflow section |
| Architecture decisions | `/ai_docs/standards/1_architecture_principles.md` | Principle category |

### Integration Priority Rules

**Rule 1: Specificity Hierarchy**
More specific locations take precedence:
1. Standards file (most specific)
2. Coding patterns section
3. Development decisions
4. Project documentation

**Rule 2: Single Source of Truth**
Each piece of information exists in ONE primary location:
- Technical how-to → `coding_patterns.md`
- What to use → `development_decisions.md`
- Quality standards → `standards/` files
- Agent instructions → `orchestrator_instructions.md`

**Rule 3: Cross-References**
When information relates to multiple areas:
- Put full content in primary location
- Add brief references in related documents
- Use format: "See [Topic] in [Document]"

### Integration Patterns

#### Pattern 1: New Best Practice
```yaml
Learning Type: Best Practice
Primary: /ai_docs/coding_patterns.md
Action: Add subsection to relevant pattern
Format:
  ### [New Best Practice]
  **From Phase [N]**

  [Description and implementation]
```

#### Pattern 2: Tool Discovery
```yaml
Learning Type: Tool Discovery
Primary: /ai_docs/development_decisions.md
Secondary: /ai_docs/coding_patterns.md (update examples)
Action: Update tool choice and implementation examples
```

#### Pattern 3: Anti-Pattern
```yaml
Learning Type: Anti-Pattern
Primary: /ai_docs/coding_patterns.md → Prohibited Patterns
Secondary: /ai_docs/standards/8_code_review_standards.md → Add checkpoint
Action: Document what NOT to do and add to review checklist
```

#### Pattern 4: Process Improvement
```yaml
Learning Type: Process Improvement
Primary: /ai_docs/orchestrator_instructions.md
Action: Update workflow section with improved process
```

## Human Review

### Proposal Structure

The generated proposal has this structure:

```markdown
# Phase [N] Learning Integration Proposal

## Executive Summary
[Brief overview of key learnings]

## Statistics
- Observations: X
- Patterns: Y
- Learnings: Z
- Documents to Update: A
- Estimated Time: B minutes

## Critical Updates (Must Apply)
[Changes that prevent blockers or fix security issues]

## Recommended Updates (Should Apply)
[Improvements to efficiency and quality]

## Optional Updates (Consider)
[Nice-to-have enhancements]

## Metrics Report
[System performance indicators]

## Approval
[ ] ✅ Approve All
[ ] 📝 Approve with Modifications
[ ] ❌ Reject
```

### Review Guidelines

**Approve All** when:
- No conflicts with existing patterns
- All changes make sense
- Risk is low
- Time to apply is reasonable

**Approve with Modifications** when:
- Some changes need adjustment
- Priority needs reordering
- Specific integrations should be skipped

**Reject** when:
- Learnings don't apply broadly
- Too risky to apply
- Better addressed differently

## Application Workflow

Once approved, the system automatically:

### Step 1: Apply Document Updates
For each integration:
```python
1. Read target document
2. Locate insertion/modification point
3. Apply change with timestamp comment
4. Validate document structure
5. Verify no broken links
```

### Step 2: Update Knowledge Base
For each new pattern:
```python
1. Determine category (pattern/anti-pattern/tool/process)
2. Create entry in appropriate folder
3. Link to source observation
4. Add to searchable index
```

### Step 3: Record Metrics
```python
1. Update phase metrics
2. Calculate improvement trends
3. Record application success
4. Note any issues
```

### Step 4: Create Changelog Entry
```markdown
## Phase [N] - [Date]
- Learnings: X patterns, Y discoveries, Z improvements
- Integrations: A documents updated, B patterns added
- Impact: C hours saved in future, D issues prevented
```

---

# Metrics & Validation

## Key Success Metrics

Track these metrics to measure system effectiveness:

### Efficiency Metrics

**Error Recurrence Rate (ERR)**
- Formula: `(Repeated Errors / Total Errors) × 100`
- Target: < 5%
- Meaning: Same errors not repeated across phases

**First-Try Success Rate (FTSR)**
- Formula: `(Successful First Attempts / Total Attempts) × 100`
- Target: > 80%
- Meaning: Code works without rework

**Implementation Velocity**
- Formula: `Features Completed / Time Spent`
- Target: Increasing trend
- Meaning: Getting faster over time

### Knowledge Metrics

**Pattern Coverage (PC)**
- Formula: `(Problems with Patterns / Total Problems) × 100`
- Target: > 70%
- Meaning: Most problems have documented solutions

**Learning Application Rate (LAR)**
- Formula: `(Applied Learnings / Total Learnings) × 100`
- Target: > 60%
- Meaning: Patterns are actually reused

**Documentation Completeness**
- Formula: `(Documented Items / Total Items) × 100`
- Target: > 90%
- Meaning: Comprehensive coverage

### Quality Metrics

**Code Review Issues**
- Target: Decreasing trend
- Meaning: Fewer issues found over time

**Standard Violations**
- Target: 0
- Meaning: No deviations from established patterns

**Architecture Stability**
- Formula: `(Unchanged Components / Total) × 100`
- Target: > 80% after Phase 3
- Meaning: Architecture solidified early

### Meta-Learning Metrics

**Learning Efficiency**
- Formula: `Valuable Learnings / Total Observations`
- Target: > 0.5
- Meaning: High signal-to-noise ratio

**Integration Speed**
- Target: < 24 hours
- Meaning: Fast knowledge transfer

**Noise Ratio**
- Formula: `Valuable Observations / Total Observations`
- Target: > 0.7
- Meaning: Quality capture

## Validation Checklist

### Pre-Integration
- [ ] All learnings have observations as evidence
- [ ] Generalizations are broadly applicable
- [ ] Integration targets exist
- [ ] No circular dependencies
- [ ] Changes are reversible
- [ ] Rollback plan defined

### Post-Integration
- [ ] Documents still valid
- [ ] No broken references
- [ ] Tests still pass
- [ ] Knowledge base searchable
- [ ] Metrics updated
- [ ] Changelog updated

## Success Indicators

The system is working well when:
- ✅ Error recurrence < 5%
- ✅ First-try success > 80%
- ✅ Pattern coverage > 70%
- ✅ Learning application > 60%
- ✅ Integration speed < 24h
- ✅ Noise ratio > 0.7

---

# Error Recovery & Troubleshooting

## Pipeline Failures

### Agent Fails to Complete

**If Pattern Extractor fails**:
1. Use raw observations directly
2. Flag as "unprocessed" in proposal
3. Continue with manual pattern identification

**If Knowledge Generalizer fails**:
1. Use specific patterns without generalization
2. Flag as "not generalized"
3. Continue with specific fixes only

**If Integration Mapper fails**:
1. Provide learnings without specific targets
2. Flag for manual mapping
3. Human determines integration locations

**If Validation Orchestrator fails**:
1. Provide raw integration map
2. Flag as "unvalidated"
3. Require extra careful human review

### Recovery Protocol

```yaml
On Agent Failure:
1. Capture error in observations for meta-learning
2. Attempt retry with modified prompt (once)
3. If retry fails, proceed with partial data
4. Flag proposal as "degraded quality"
5. Note gaps explicitly
6. Request human intervention for gaps
```

## Common Issues

### No Observations Captured
**Symptom**: Empty observations.md after phase
**Causes**:
- File not created
- Triggers not recognized
- Observations not formatted correctly

**Solutions**:
1. Check file exists: `/agents/phase_[N]/learnings/observations.md`
2. Review trigger conditions in this document
3. Verify observation format matches template
4. Retrospectively capture from memory if critical

### Poor Pattern Quality
**Symptom**: Low confidence scores, patterns too specific
**Causes**:
- Not enough observations (need 2+ per pattern)
- Observations lack detail
- Patterns too narrowly defined

**Solutions**:
1. Capture more observations in next phase
2. Review observation quality guidelines
3. Manually review and adjust generalizations
4. Lower confidence threshold temporarily

### Integration Conflicts
**Symptom**: Multiple learnings target same location differently
**Causes**:
- Overlapping learnings
- Precedence rules unclear
- Documentation structure changed

**Solutions**:
1. Apply precedence rules (newer > older, critical > low)
2. Merge if possible
3. Apply highest priority only
4. Document conflict resolution in changelog

### Low Metrics
**Symptom**: Targets not being met
**Causes**:
- System not being used consistently
- Learnings not being applied
- Observations too noisy

**Solutions**:
1. Review capture discipline
2. Verify proposal applications
3. Improve observation filtering
4. Adjust targets if unrealistic

---

# Quick Reference

## Observation Capture

```markdown
Location: /agents/phase_[N]/learnings/observations.md

Triggers: Error | Workaround | Discovery | Assumption | Pattern

Template:
## Observation [PHASE]-[TIMESTAMP]-[SEQ]
**Trigger**: [Type]
**Severity**: [Critical|High|Medium|Low]
**Component**: [File/module]
**Time Impact**: [Minutes]

### What Happened
[Description]

### Resolution
[How fixed]

### Learning Potential
- Recurring: [One-time|Likely|Definite]
- Generalizable: [Yes|No]
- Preventable: [Yes|No|Maybe]
---
```

## Pipeline Execution

```bash
# After phase validation

# 1. Create workspace
mkdir -p /agents/phase_[N]/learnings/

# 2. Deploy agents (use general-purpose agent)
# See AGENTS.md for detailed context for each

# 3. Review proposal
cat /agents/learning_system/proposals/phase_[N]_proposal.md

# 4. Approve and apply
# System handles automatically
```

## Document Targets

| What | Where |
|------|-------|
| Technical patterns | `/ai_docs/coding_patterns.md` |
| Tool choices | `/ai_docs/development_decisions.md` |
| Security | `/ai_docs/standards/6_security_checklist.md` |
| Performance | `/ai_docs/standards/7_performance_guidelines.md` |
| Process | `/ai_docs/orchestrator_instructions.md` |
| Architecture | `/ai_docs/standards/1_architecture_principles.md` |

## Metrics Targets

| Metric | Target |
|--------|--------|
| Error Recurrence | < 5% |
| First-Try Success | > 80% |
| Pattern Coverage | > 70% |
| Learning Application | > 60% |
| Integration Speed | < 24h |
| Noise Ratio | > 0.7 |

---

*This execution guide provides everything needed to run the learning system successfully. Follow these steps for consistent, high-quality knowledge capture and integration.*