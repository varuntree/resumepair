# Learning System Agent Instructions
*Version 1.0.0*

## Overview

This document provides detailed instructions for each agent in the 4-agent analysis pipeline. These agents transform raw observations into actionable knowledge proposals.

## Pipeline Architecture

```
Observations → Pattern Extractor → Knowledge Generalizer → Integration Mapper → Validation Orchestrator → Proposal
```

Each agent builds on the previous agent's output, creating an increasingly refined knowledge integration proposal.

## Important: Agent Invocation

**All agents use the `general-purpose` agent type.** There are no "modified" agents. The specialization comes from:
1. The specific context provided
2. The detailed instructions given
3. The expected output format

---

# Agent 1: Pattern Extractor

## Purpose
Analyze observations and identify recurring themes, common root causes, and repeated patterns that can be generalized into knowledge.

## Invocation

**Agent Type**: `general-purpose`

**Task Description**: "Analyze Phase [N] observations to extract recurring patterns"

## Context to Provide

```markdown
You are analyzing observations from Phase [N]: [PHASE_NAME].

Your task is to identify patterns from raw observations - recurring issues, common solutions, and themes that appear multiple times.

## Input Files

### Primary Input
- **Observations**: /agents/phase_[N]/learnings/observations.md
  Contains all captured observations from implementation

### Supporting Context
- **Phase Outputs**: /agents/phase_[N]/*.md
  All other agent outputs from this phase
- **Previous Patterns**: /agents/learning_system/knowledge_base/patterns/
  Existing patterns to reference or build upon
- **Phase Document**: /phases/phase_[N].md
  Original phase requirements for context

## Project Context
- **Tech Stack**: [From /ai_docs/development_decisions.md]
- **Standards**: [From /ai_docs/coding_patterns.md]
- **Architecture**: [From /ai_docs/standards/1_architecture_principles.md]
```

## Detailed Instructions

Provide these instructions to the agent:

```markdown
# Pattern Extraction Task

## Objective
Identify recurring patterns from Phase [N] observations that represent common issues, solutions, or discoveries worth documenting.

## Analysis Steps

### 1. Parse All Observations
Read each observation and extract:
- Trigger type (error, workaround, discovery, etc.)
- Component/file affected
- Root cause (if identified)
- Resolution approach taken
- Time impact and severity

### 2. Identify Patterns

Look for **repetition** across observations:
- Same error in multiple places
- Similar workarounds for different issues
- Common root causes
- Repeated tool/library challenges
- Workflow bottlenecks mentioned multiple times

### 3. Categorize Patterns

**Technical Patterns**: Implementation issues
- Type mismatches
- API incompatibilities
- Database query problems
- Performance bottlenecks

**Process Patterns**: Workflow issues
- Documentation gaps
- Testing challenges
- Integration difficulties
- Tool limitations

**Knowledge Patterns**: Understanding issues
- Missing information
- Incorrect assumptions
- Learning curves
- Unclear requirements

### 4. Assess Each Pattern

For every pattern identified:

**Frequency**
- How many observations support this? (Need 2+ minimum)
- Is it likely to recur in future phases?
- Is it phase-specific or project-wide?

**Impact**
- Total time lost across all instances
- Number of components affected
- Was it blocking progress?
- Severity of consequences

**Root Cause**
- What's the underlying issue?
- Technical, process, or knowledge problem?
- Can it be prevented?

**Confidence**
- How certain are you this is a real pattern? (0.0-1.0)
- Is the evidence strong enough?

### 5. Classify Pattern Type

- **Problem Pattern**: Recurring issue needing solution
- **Solution Pattern**: Successful approach to common problem
- **Discovery Pattern**: Better way found through experimentation
- **Anti-Pattern**: Approach that consistently fails

## Output Format

Create: `/agents/phase_[N]/learnings/patterns.md`

Use this exact structure:

```yaml
# Phase [N] Pattern Analysis

## Summary
- Total Observations Analyzed: [X]
- Patterns Identified: [Y]
- High-Priority Patterns: [Z]
- Categories: Technical [A], Process [B], Knowledge [C]

---

## Pattern 1: [Clear, Descriptive Name]

**ID**: PAT-P[N]-[CATEGORY]-001
**Category**: [technical|process|knowledge]
**Type**: [problem|solution|discovery|anti-pattern]
**Frequency**: [X] occurrences
**Confidence**: [0.0-1.0]

### Description
[Clear explanation of what this pattern represents]

### Evidence
Referenced observations:
- **Observation [ID]**: [One-line summary]
- **Observation [ID]**: [One-line summary]
[Continue for all observations]

### Impact Analysis
- **Time Lost**: [X] hours total
- **Components Affected**: [List specific files/modules]
- **Severity**: [critical|high|medium|low]
- **Blocking**: [Yes|No]

### Root Cause
[Deep analysis of why this pattern exists - the underlying reason]

### Recommended Action
[What should be done to address or leverage this pattern]

---

[Repeat structure for each pattern]

---

## Pattern Relationships

[Describe how patterns relate to each other]
[Example: "Pattern 2 is a solution to Pattern 1"]
[Example: "Patterns 3 and 4 share the same root cause"]

## Priority Rankings

### Must Address (Critical)
1. [Pattern name] - [One-line reason]

### Should Address (High)
1. [Pattern name] - [One-line reason]

### Consider (Medium)
1. [Pattern name] - [One-line reason]
```

## Quality Criteria

Before completing, verify:
- [ ] Every pattern has 2+ observations as evidence
- [ ] Confidence scores are justified by evidence strength
- [ ] Root causes are identified (not just symptoms)
- [ ] Recommendations are specific and actionable
- [ ] Patterns are not too specific (generalizable)
- [ ] Patterns are not too broad (actionable)
```

## Expected Output

A comprehensive pattern analysis that:
- Identifies all significant patterns (not every observation, but themes)
- Provides clear evidence for each pattern
- Assesses real impact and priority
- Offers specific remediation approaches
- Groups related patterns together

---

# Agent 2: Knowledge Generalizer

## Purpose
Transform specific patterns into broadly applicable wisdom that can be reused across phases and projects.

## Invocation

**Agent Type**: `general-purpose`

**Task Description**: "Transform Phase [N] patterns into generalizable knowledge and best practices"

## Context to Provide

```markdown
You are generalizing patterns from Phase [N]: [PHASE_NAME] into reusable knowledge.

Your task is to abstract specific incidents into broad principles that apply beyond this phase.

## Input Files

### Primary Input
- **Patterns**: /agents/phase_[N]/learnings/patterns.md
  Extracted patterns from observations

### Supporting Context
- **Project Standards**: /ai_docs/coding_patterns.md
- **Development Decisions**: /ai_docs/development_decisions.md
- **All Standards**: /ai_docs/standards/*.md
- **Existing Knowledge Base**: /agents/learning_system/knowledge_base/

## Project Context
[Same tech stack and architecture context as Pattern Extractor]
```

## Detailed Instructions

```markdown
# Knowledge Generalization Task

## Objective
Abstract specific patterns into universal principles using if-then-because rules.

## Generalization Process

### 1. Pattern Abstraction

Transform from specific to general:

**Example**:
```
Specific: "Supabase RLS policy failed with user_ids array"
    ↓
General: "Database array operations require platform-specific syntax"
    ↓
Principle: "Always verify platform SQL extensions for security policies"
```

### 2. Create If-Then-Because Rules

For each pattern, create a rule:

```yaml
IF: [Condition/Context when this applies]
THEN: [Action/Response to take]
BECAUSE: [Reasoning/Evidence why this works]
```

**Example**:
```yaml
IF: Implementing RLS policies with array columns
THEN: Use platform-specific operators (e.g., @> for PostgreSQL/Supabase)
BECAUSE: Standard SQL array operators may not be supported in all database contexts
```

### 3. Categorize Knowledge

Place each learning into the right category:

**Best Practices**: Approaches that should become standard
**Anti-Patterns**: Approaches to avoid
**Tool Discoveries**: Better libraries or tools found
**Process Improvements**: Workflow optimizations

### 4. Define Application Context

For each learning:

**When It Applies**
- Specific conditions or preconditions
- Which components or phases affected
- Technology stack requirements

**When It Doesn't Apply**
- Exceptions to the rule
- Edge cases where it breaks
- Conflicting scenarios

**Dependencies**
- What must be in place first
- Related learnings or patterns
- Required tools or setup

### 5. Create Validation Tests

Define how to verify this learning works:

```yaml
Given: [Setup/Context]
When: [Action taken using the learning]
Then: [Expected result that proves it works]
```

## Output Format

Create: `/agents/phase_[N]/learnings/generalized.md`

```yaml
# Phase [N] Generalized Knowledge

## Summary
- Patterns Processed: [X]
- Learnings Generated: [Y]
- Categories: Best Practices [A], Anti-Patterns [B], Tools [C], Process [D]

---

## Learning 1: [Clear Title - What This Teaches]

**ID**: L-P[N]-001
**Source**: PAT-P[N]-[TYPE]-[SEQ]
**Category**: [best_practice|anti_pattern|tool_discovery|process_improvement]
**Confidence**: [0.0-1.0]

### Rule
```yaml
IF: [When/where this applies]
THEN: [What to do]
BECAUSE: [Why it works/evidence]
```

### Details

**Problem This Addresses**
[What original issue this solves]

**Solution Provided**
[How this helps]

**Evidence**
[Why we know this works - reference patterns and observations]

### Application

**Contexts Where This Applies**
- [Context 1]
- [Context 2]

**Exceptions**
- [When NOT to use this]

**Dependencies**
- [What's required first]

### Validation

**Test**
```yaml
Given: [Setup]
When: [Apply learning]
Then: [Expected result]
```

**Metrics to Track**
- [How to measure if this helps]

### Integration Priority

**Urgency**: [critical|high|medium|low]
- Critical: Prevents blockers
- High: Significant improvement
- Medium: Nice optimization
- Low: Future-proofing

**Effort**: [trivial|minor|moderate|major]
**Risk**: [none|low|medium|high]

---

[Repeat for each learning]

---

## Cross-Cutting Themes

[Broader insights spanning multiple learnings]
[Example: "All database issues stem from platform-specific syntax"]

## Recommendations

Prioritized list of what to integrate first:
1. [Most important] - [Why]
2. [Second priority] - [Why]
3. [Third priority] - [Why]
```

## Quality Criteria

- [ ] Learnings are broadly applicable (not project-specific)
- [ ] Clear cause-and-effect logic in rules
- [ ] Testable and measurable
- [ ] Exceptions documented
- [ ] Integration priority justified
```

## Expected Output

A knowledge catalog that:
- Generalizes all significant patterns
- Provides clear if-then-because rules anyone can follow
- Includes validation tests
- Prioritizes what to integrate first
- Removes all project-specific details from rules (unless necessary)

---

# Agent 3: Integration Mapper

## Purpose
Map each generalized learning to the specific documentation file and section where it should be integrated.

## Invocation

**Agent Type**: `general-purpose`

**Task Description**: "Map Phase [N] learnings to specific documentation updates"

## Context to Provide

```markdown
You are mapping Phase [N] learnings to exact documentation locations.

Your task is to determine WHERE and HOW each learning integrates into project documentation.

## Input Files

### Primary Input
- **Generalized Knowledge**: /agents/phase_[N]/learnings/generalized.md
  The learnings to integrate

### Documentation Structure
- **Coding Patterns**: /ai_docs/coding_patterns.md
- **Development Decisions**: /ai_docs/development_decisions.md
- **Orchestrator Instructions**: /ai_docs/orchestrator_instructions.md
- **Standards**: /ai_docs/standards/*.md
- **Phase Documents**: /phases/phase_[N].md

## Integration Rules

See EXECUTION.md → Document Mapping Rules for:
- Primary integration targets by learning type
- Specificity hierarchy
- Single source of truth principle
- Cross-reference rules
```

## Detailed Instructions

```markdown
# Integration Mapping Task

## Objective
Create specific, actionable documentation updates for each learning with exact file paths and sections.

## Mapping Process

### 1. Identify Target Documents

For each learning, determine:

**Primary Target** (where full content goes):
- Database patterns → `/ai_docs/coding_patterns.md` (Database section)
- API patterns → `/ai_docs/coding_patterns.md` (API section)
- Security → `/ai_docs/standards/6_security_checklist.md`
- Performance → `/ai_docs/standards/7_performance_guidelines.md`
- Tools → `/ai_docs/development_decisions.md`
- Process → `/ai_docs/orchestrator_instructions.md`

**Secondary Targets** (where references go):
- Related sections in other documents
- Cross-references for context

### 2. Locate Integration Point

For each target:
1. Read the document
2. Find the relevant section
3. Identify exact line numbers or section names
4. Determine integration type:
   - **add**: New subsection
   - **modify**: Update existing content
   - **replace**: Outdated information
   - **note**: Warning or callout

### 3. Check for Conflicts

Before proposing integration:
- Does this contradict existing content?
- Are there dependencies that must be updated first?
- Will this break cross-references?
- Is there already similar content?

### 4. Create Change Specification

For each integration:

```yaml
Target: [Exact file path]
Section: [Section name or "after line X"]
Lines: [Start-end if modifying, or "N/A" if adding new]
Action: [add|modify|replace]

Current Content:
[Existing content if modifying/replacing, or "N/A" if adding new]

New Content:
[Exact markdown to add/replace]

Rationale: [Why this change is needed]
Impact: [What this affects - other files, references, etc.]
Dependencies: [Other changes that must happen first, or "None"]
Conflicts: [Potential conflicts, or "None"]
```

### 5. Assign Priorities

**Must Apply** (Critical):
- Prevents future blockers
- Fixes security issues
- Corrects major errors
- Enables upcoming phases

**Should Apply** (Recommended):
- Significant efficiency improvement
- Important quality enhancement
- Reduces common confusion
- Saves substantial time

**Consider** (Optional):
- Nice-to-have enhancement
- Minor optimization
- Style improvement
- Future-proofing

## Output Format

Create: `/agents/phase_[N]/learnings/integration_map.md`

```yaml
# Phase [N] Integration Map

## Summary
- Total Learnings: [X]
- Documents to Update: [Y]
- Critical Updates: [Z]
- Total Integrations: [A]

---

## Document: /ai_docs/coding_patterns.md

### Integration 1: [Learning Title]

**Learning ID**: L-P[N]-001
**Priority**: [must|should|consider]
**Section**: [Section name]
**Action**: [add|modify|replace]

**Rationale**: [Why this update is critical]

**Current Content**:
```markdown
[Existing section content if modifying]
[Or "N/A - new section" if adding]
```

**New Content**:
```markdown
### [New Subsection from Phase [N]]

[Full content to add including examples]
```

**Impact**: [What this affects]
**Dependencies**: [What must be done first, or "None"]

---

[Repeat for each integration in this document]

---

## Document: /ai_docs/development_decisions.md

[Same structure as above]

---

[Repeat for all documents]

---

## Conflict Resolution

### Conflict 1
**Between**: [INT-1, INT-2]
**Nature**: [What conflicts]
**Resolution**: [How to resolve - which takes precedence]
**Decision**: [Final decision with rationale]

---

## Application Sequence

Apply integrations in this order to resolve dependencies:

1. **First**: [Integration] - [Why first]
2. **Second**: [Integration] - [Depends on first]
3. **Third**: [Integration] - [Independent, high priority]
[Continue...]

---

## Validation Checklist

Before finalizing:
- [ ] Every learning has integration target
- [ ] No unresolved conflicts
- [ ] Dependencies identified and sequenced
- [ ] All file paths verified to exist
- [ ] Section names/line numbers accurate
```

## Quality Criteria

- [ ] Specific line numbers or clear section identifiers provided
- [ ] Clear before/after content for modifications
- [ ] All conflicts explicitly resolved
- [ ] Dependencies mapped and sequenced
- [ ] Every integration has clear rationale

## Expected Output

An integration map that:
- Maps every learning to specific location (file + section)
- Provides exact content changes
- Resolves all conflicts with clear decisions
- Sequences integrations to handle dependencies
- Ready for automated or manual application

---

# Agent 4: Validation Orchestrator

## Purpose
Validate all proposed changes, calculate metrics, assess risks, and create the final human-readable proposal.

## Invocation

**Agent Type**: `general-purpose`

**Task Description**: "Validate Phase [N] learning integration and create approval proposal"

## Context to Provide

```markdown
You are creating the final Phase [N] learning integration proposal for human review.

Your task is to validate everything, assess risks, calculate metrics, and create a clear, one-click approval document.

## Input Files

### Primary Inputs
- **Patterns**: /agents/phase_[N]/learnings/patterns.md
- **Generalized Knowledge**: /agents/phase_[N]/learnings/generalized.md
- **Integration Map**: /agents/phase_[N]/learnings/integration_map.md

### Supporting Context
- **Phase Summary**: /agents/phase_[N]/phase_summary.md
- **Current Metrics**: Check EXECUTION.md for target metrics
- **Previous Proposals**: /agents/learning_system/proposals/ (for comparison)
```

## Detailed Instructions

```markdown
# Validation and Proposal Task

## Objective
Create a human-readable proposal that clearly communicates what was learned, what should change, and why - ready for single-click approval.

## Validation Steps

### 1. Validate Learnings

For each learning, check:
- [ ] Sufficient evidence (2+ observations minimum)
- [ ] Appropriate generalization (not too specific or too broad)
- [ ] Testable and measurable
- [ ] No internal contradictions
- [ ] Confidence score justified

### 2. Validate Integrations

For each integration:
- [ ] Target document exists
- [ ] Section/line numbers accurate
- [ ] Content is syntactically correct
- [ ] No breaking changes to existing functionality
- [ ] Dependencies are available

### 3. Resolve Conflicts

Check all conflicts resolved:
- [ ] All identified in integration map
- [ ] Resolutions are logical
- [ ] Precedence is clear
- [ ] No circular dependencies

### 4. Calculate Metrics

Based on observations and patterns:

**Efficiency Metrics**:
- Error patterns identified: [X]
- Estimated time saved in future: [Y hours]
- Issues prevented: [Z types]

**Knowledge Metrics**:
- New patterns documented: [X]
- Documentation gaps filled: [Y]
- Coverage improvement: [Z%]

**Quality Metrics**:
- Best practices added: [X]
- Anti-patterns identified: [Y]
- Process improvements: [Z]

**Confidence Scores**:
- Average learning confidence: [X]
- Integration risk: [Low|Medium|High]
- Rollback complexity: [Simple|Moderate|Complex]

### 5. Assess Risks

**Integration Risks**:
- Breaking changes: [List any]
- Backward compatibility: [Any issues?]
- Dependency chains: [Complex or simple?]

**Mitigation**:
- Testing required: [What to test]
- Staged rollout: [If needed]
- Monitoring: [What to watch]

## Output Format

Create: `/agents/learning_system/proposals/phase_[N]_proposal.md`

```markdown
# Phase [N] Learning Integration Proposal
*Generated: [ISO 8601 TIMESTAMP]*
*Phase: [N] - [PHASE_NAME]*
*System Version: 1.0.0*

## Executive Summary

This proposal contains **[X] learnings** from Phase [N] implementation, addressing **[Y] observed issues** and discovering **[Z] improvements**.

**Key Highlights**:
- 🔴 **Critical**: [Most critical finding in one sentence]
- 🟡 **Important**: [Important discovery in one sentence]
- 🟢 **Optimization**: [Useful optimization in one sentence]

**Expected Impact**:
- **Time Savings**: [X] hours in future phases
- **Errors Prevented**: [Y] types of issues
- **Quality Improvements**: [Z] areas enhanced

---

## Statistics

| Metric | Count |
|--------|-------|
| Observations Captured | [X] |
| Patterns Identified | [Y] |
| Learnings Generated | [Z] |
| Documents to Update | [A] |
| Critical Updates | [B] |
| Recommended Updates | [C] |
| Optional Updates | [D] |
| Estimated Apply Time | [E] minutes |

---

## Critical Updates (Must Apply)

These changes prevent blockers, fix security issues, or correct major errors.

### 1. [Learning Title]

**File**: [Path]
**Section**: [Name]
**Learning ID**: L-P[N]-001

**Why Critical**: [Explanation of why this must be applied]

**Current State**:
[Problem this addresses or gap this fills]

**Proposed Change**:
```markdown
[Exact content to add/modify]
```

**Impact**: [What this prevents or enables]
**Evidence**: [Pattern IDs and observation IDs]

---

[Repeat for each critical update]

---

## Recommended Updates (Should Apply)

These changes significantly improve efficiency, quality, or knowledge.

### 1. [Learning Title]

[Same structure as critical updates]

---

## Optional Updates (Consider)

These are nice-to-have enhancements or future-proofing.

### 1. [Learning Title]

[Same structure]

---

## Metrics Report

### Efficiency Improvements
- **Error Recurrence Rate**: Expected decrease of [X]%
- **Implementation Velocity**: Expected increase of [Y]%
- **First-Try Success Rate**: Expected improvement to [Z]%

### Knowledge Coverage
- **Documented Patterns**: [Before] → [After]
- **Coverage Gaps Filled**: [X] of [Y] identified
- **Reusable Learnings**: [+X] added

### Quality Indicators
- **Code Review Issues**: [Trend analysis]
- **Architecture Stability**: [Assessment]
- **Technical Debt**: [Net position]

---

## Risk Analysis

**Overall Integration Risk**: [Low|Medium|High]
**Confidence Level**: [X]%
**Rollback Complexity**: [Simple|Moderate|Complex]

### Potential Issues
1. [Risk 1] → **Mitigation**: [How to handle]
2. [Risk 2] → **Mitigation**: [How to handle]

**Rollback Plan**:
If issues arise after applying:
1. [Specific revert step]
2. [Verification step]
3. [Alternative approach]

---

## Implementation Plan

### Application Sequence
1. [First change] - **Reason**: [Why first]
2. [Second change] - **Reason**: [Dependency or priority]
3. [Continue in order]

### Validation Steps
After applying:
1. [Test to run]
2. [Verification to perform]
3. [Improvement to check]

---

## Meta-Learning Insights

The learning system itself observed:
- [Insight about the capture process]
- [Pattern about patterns]
- [Improvement for next phase]

---

## Approval Section

**Decision Required - Choose One**:

- [ ] ✅ **Approve All** - Apply all proposed changes as specified
- [ ] 📝 **Approve with Modifications** - Apply with changes noted below
- [ ] ❌ **Reject** - Do not apply (provide reason)

**Modifications** (if applicable):
```
[Space for human to specify changes]
```

**Reviewer Notes**:
```
[Space for any comments or concerns]
```

**Approved By**: _______________
**Date**: _______________

---

*This proposal was automatically generated by the ResumePair Learning System v1.0.0. Review carefully before approving. All changes are reversible via git.*
```

## Quality Criteria

- [ ] Executive summary is clear and concise
- [ ] All changes categorized correctly
- [ ] Metrics calculated accurately
- [ ] Risks identified with mitigations
- [ ] One-click approval ready
- [ ] Rollback plan is clear
```

## Expected Output

A complete, professional proposal document that:
- Summarizes everything clearly for quick review
- Categorizes changes by priority
- Provides complete details for each change
- Assesses risks honestly
- Makes approval easy (single checkbox)
- Inspires confidence in the system's recommendations

---

*These agent instructions ensure consistent, high-quality transformation of observations into actionable knowledge. Use the general-purpose agent type with these detailed instructions for each agent in the pipeline.*