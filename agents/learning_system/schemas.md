# Learning System Schemas
*Version 1.0.0*

## Overview

This document defines all data structures used by the learning system. These schemas ensure consistency across observations, patterns, integrations, and metrics.

## Core Schemas

### 1. Observation Schema

Used for real-time capture during implementation.

```yaml
observation:
  # Unique identifier
  id: string                    # Format: "OBS-P[phase]-[timestamp]-[sequence]"
  phase: integer                # Phase number (1-8)
  timestamp: datetime           # ISO 8601 format: YYYY-MM-DDTHH:mm:ssZ

  # Classification
  trigger:                      # What prompted this observation
    type: enum                  # One of: error, warning, workaround, discovery, assumption, pattern
    confidence: float           # 0.0-1.0 confidence in classification

  severity: enum                # critical, high, medium, low

  # Context
  component:
    file: string                # File path affected
    line: integer?              # Line number if applicable
    function: string?           # Function/component name

  # Details
  description:
    what: string                # What happened (required)
    why: string?                # Why it happened (if known)
    how: string?                # How it was resolved/handled

  # Evidence
  evidence:
    code_before: string?        # Code that caused issue
    code_after: string?         # Code that fixed issue
    error_message: string?      # Exact error if applicable
    logs: string[]?             # Relevant log entries

  # Impact Assessment
  impact:
    scope: enum                 # local, module, phase, global
    blocking: boolean           # Was this a blocker?
    components_affected: string[] # Other affected components
    time_lost: integer?         # Minutes spent resolving

  # Learning Potential
  learning_potential:
    recurring: enum             # one_time, likely_recurring, definitely_recurring
    generalizable: boolean      # Can this be abstracted?
    preventable: boolean        # Could this have been avoided?
```

### 2. Pattern Schema

Output from pattern extraction analysis.

```yaml
pattern:
  # Identification
  id: string                    # Format: "PAT-P[phase]-[category]-[sequence]"
  phase: integer                # Source phase
  created: datetime             # When pattern identified

  # Classification
  category: enum                # technical, process, tool, knowledge, architecture
  type: enum                    # problem, solution, discovery, optimization

  # Pattern Details
  name: string                  # Short descriptive name
  description: string           # Detailed explanation

  # Evidence
  observations: string[]        # Source observation IDs
  frequency: integer            # Times observed
  confidence: float             # 0.0-1.0 pattern confidence

  # Characteristics
  context:
    when: string                # When this pattern appears
    where: string[]             # Where it appears (components)
    preconditions: string[]     # What must be true

  # Solutions
  resolution:
    approach: string            # How to handle
    prevention: string?         # How to prevent
    automation: string?         # Can this be automated?

  # Relationships
  related_patterns: string[]    # Related pattern IDs
  supersedes: string?           # Pattern this replaces
  superseded_by: string?        # Pattern that replaces this
```

### 3. Learning Schema

Generalized knowledge ready for integration.

```yaml
learning:
  # Metadata
  id: string                    # Format: "L-P[phase]-[sequence]"
  phase: integer                # Source phase
  timestamp: datetime           # Creation time
  version: string               # Schema version

  # Source
  source:
    pattern_ids: string[]       # Source patterns
    observation_ids: string[]   # Direct observations

  # Classification
  category: enum                # best_practice, anti_pattern, tool_discovery, process_improvement
  domain: string[]              # Affected domains: database, api, ui, testing, etc.

  # Core Learning
  title: string                 # Brief title (max 100 chars)
  summary: string               # One paragraph summary

  rule:
    if: string                  # Condition/context
    then: string                # Action/response
    because: string             # Reasoning

  # Details
  details:
    problem: string             # Problem this addresses
    solution: string            # Recommended solution
    evidence: string            # Why we know this works
    exceptions: string[]?       # When this doesn't apply

  # Application
  application:
    effort: enum                # trivial, minor, moderate, major
    risk: enum                  # none, low, medium, high
    automated: boolean          # Can be auto-applied?

  # Validation
  validation:
    tested: boolean             # Has this been tested?
    test_results: string?       # Test outcome
    prevents_recurrence: boolean # Prevents original issue?

  # Metadata
  metadata:
    author: string              # Agent or human who created
    confidence: float           # 0.0-1.0
    priority: enum              # critical, high, medium, low
    expiry: datetime?           # When this becomes stale
```

### 4. Integration Schema

Proposed documentation changes.

```yaml
integration:
  # Identification
  id: string                    # Format: "INT-P[phase]-[target]-[sequence]"
  learning_id: string           # Source learning
  phase: integer                # Phase number

  # Target
  target:
    document: string            # File path to update
    section: string?            # Section within document
    line_start: integer?        # Starting line
    line_end: integer?          # Ending line

  # Change
  action: enum                  # add, modify, replace, remove

  content:
    before: string?             # Current content (for modify/replace)
    after: string               # New content

  # Justification
  rationale: string             # Why this change
  impact: string                # Expected impact

  # Validation
  validation:
    conflicts: string[]         # Conflicting integrations
    dependencies: string[]      # Required integrations
    testable: boolean           # Can be tested?
    reversible: boolean         # Can be rolled back?

  # Priority
  priority: enum                # must_apply, should_apply, consider
  confidence: float             # 0.0-1.0

  # Status
  status: enum                  # proposed, approved, applied, rejected
  applied_at: datetime?         # When applied
  applied_by: string?           # Who approved
```

### 5. Proposal Schema

Human review document structure.

```yaml
proposal:
  # Metadata
  id: string                    # Format: "PROP-P[phase]-[date]"
  phase: integer                # Phase number
  generated: datetime           # When created
  generator: string             # System version

  # Summary
  executive_summary: string     # Brief overview

  statistics:
    observations: integer       # Total observations
    patterns: integer           # Patterns identified
    learnings: integer          # Learnings generated
    integrations: integer       # Proposed changes

  # Categorized Integrations
  critical_updates:             # Must apply
    - integration_id: string
      summary: string
      rationale: string

  recommended_updates:          # Should apply
    - integration_id: string
      summary: string
      rationale: string

  optional_updates:             # Consider
    - integration_id: string
      summary: string
      rationale: string

  # Impact Analysis
  impact:
    documents_affected: integer
    estimated_time: integer     # Minutes to apply
    risk_level: enum            # low, medium, high
    rollback_plan: string       # How to revert if needed

  # Metrics
  metrics:
    efficiency_score: float     # 0-100
    knowledge_score: float      # 0-100
    quality_score: float        # 0-100
    meta_learning_score: float  # 0-100

  # Approval
  approval:
    status: enum                # pending, approved, rejected, modified
    reviewer: string?           # Who reviewed
    reviewed_at: datetime?      # When reviewed
    modifications: string?      # Changes requested
    notes: string?              # Review notes
```

### 6. Metrics Schema

System performance tracking.

```yaml
metrics:
  # Identification
  phase: integer                # Phase number
  timestamp: datetime           # Measurement time

  # Efficiency Metrics
  efficiency:
    error_recurrence_rate: float     # % errors seen before
    implementation_velocity: float    # Items/hour trend
    retry_frequency: float            # Retries per implementation
    first_try_success_rate: float    # % working first time

  # Knowledge Metrics
  knowledge:
    pattern_coverage: float           # % problems with patterns
    documentation_completeness: float # % documented features
    learning_application_rate: float  # % patterns reused
    prediction_accuracy: float        # % predicted issues

  # Quality Metrics
  quality:
    code_review_issues: integer       # Issues found
    architecture_stability: float     # % unchanged
    standard_violations: integer      # Violations found
    technical_debt_ratio: float       # Debt added vs resolved

  # Meta-Learning Metrics
  meta_learning:
    learning_efficiency: float        # Insights per observation
    generalization_quality: float     # Reusability score
    integration_speed: float          # Time to integrate
    noise_ratio: float                # Signal vs noise

  # Trends (compared to previous phase)
  trends:
    efficiency_trend: enum            # improving, stable, declining
    knowledge_trend: enum             # improving, stable, declining
    quality_trend: enum               # improving, stable, declining
    meta_learning_trend: enum         # improving, stable, declining
```

## File Format Standards

### Pattern Files

Location: `/knowledge_base/patterns/[category]/[pattern_name].md`

```markdown
# Pattern: [Name]

**ID**: PAT-P[phase]-[category]-[sequence]
**Category**: [technical|process|tool|knowledge|architecture]
**Confidence**: [0.0-1.0]

## Problem
[What problem this pattern addresses]

## Context
[When and where this pattern applies]

## Solution
[The pattern itself]

## Example
[Concrete example of application]

## Consequences
[What happens when applied]

## Related Patterns
- [Pattern ID]: [Relationship]

## References
- Observation: [ID]
- Phase: [Number]
```

### Anti-Pattern Files

Location: `/knowledge_base/anti_patterns/[category]/[anti_pattern_name].md`

```markdown
# Anti-Pattern: [Name]

**ID**: ANTI-P[phase]-[category]-[sequence]
**Category**: [technical|process|tool|knowledge|architecture]
**Severity**: [critical|high|medium|low]

## Description
[What not to do]

## Why It's Bad
[Problems it causes]

## How It Happens
[Common ways this occurs]

## Better Alternative
[What to do instead]

## Detection
[How to identify this anti-pattern]

## References
- Observation: [ID]
- Pattern: [Better alternative ID]
```

### Tool Discovery Files

Location: `/knowledge_base/tool_discoveries/[tool_name].md`

```markdown
# Tool Discovery: [Name]

**ID**: TOOL-P[phase]-[sequence]
**Type**: [library|framework|service|utility]
**Language**: [typescript|python|sql|etc]

## Purpose
[What this tool does]

## Replaces
[What it replaces or improves upon]

## Benefits
- [Benefit 1]
- [Benefit 2]

## Implementation
```[language]
// Example usage
```

## Caveats
[Any limitations or considerations]

## References
- NPM: [package name]
- Docs: [URL]
- Discovery: Observation [ID]
```

### Process Improvement Files

Location: `/knowledge_base/process_improvements/[improvement_name].md`

```markdown
# Process Improvement: [Name]

**ID**: PROC-P[phase]-[sequence]
**Impact**: [high|medium|low]
**Effort**: [trivial|minor|moderate|major]

## Current Process
[How things work now]

## Improved Process
[How they should work]

## Benefits
- Time saved: [estimate]
- Errors prevented: [types]
- Quality improvement: [description]

## Implementation Steps
1. [Step 1]
2. [Step 2]

## Validation
[How to verify improvement]

## References
- Observation: [ID]
- Phase: [Number]
```

## Validation Rules

### Observation Validation
- `id` must be unique
- `timestamp` must be valid ISO 8601
- `severity` affects processing priority
- `impact.blocking` triggers immediate attention

### Pattern Validation
- Must reference at least one observation
- `frequency` > 1 for recurring patterns
- `confidence` > 0.7 for integration
- Cannot supersede and be superseded

### Learning Validation
- Must have source patterns or observations
- `rule` must have all three components
- `confidence` > 0.5 for proposal inclusion
- `priority` determines integration order

### Integration Validation
- `target.document` must exist
- `action` must match content structure
- Conflicts must be resolved before applying
- Dependencies applied in order

### Proposal Validation
- All integrations must be categorized
- Metrics must be calculated
- Impact analysis required
- Rollback plan mandatory for high risk

## Schema Evolution

### Version Control
- Major version: Breaking changes
- Minor version: New fields added
- Patch version: Clarifications

### Migration Rules
- Old schemas auto-upgrade when possible
- Breaking changes require migration script
- Backwards compatibility for 2 major versions

### Extension Points
- Custom fields prefixed with `x_`
- Additional categories via configuration
- Pluggable validation rules

---

*These schemas define the complete data model for the learning system. Adherence ensures consistency and reliability.*