# Orchestrator Instructions for Phase Implementation

## Overview
This document provides the complete instructions for the orchestrator to execute any phase of the ResumePair project. The orchestrator serves as the prime coordinator, managing context and directing specialized agents through each phase of development.

## Pre-Phase Preparation

### 1. Context Loading
Before starting any phase, the orchestrator MUST:

1. **Read all files in `/ai_docs/`**:
   - `coding_patterns.md` - Understanding architectural decisions
   - `development_decisions.md` - Non-negotiable constraints
   - Project documentation files in `project_documentation/`
   - All standards files (originally in `/standards/`, now in `/ai_docs/`)

2. **Read the phase index**: `/phases/index.md`
   - Understand the overall phase structure
   - Identify dependencies between phases
   - Note the validation gates

3. **Read the current phase document**: `/phases/phase_[N].md`
   - Comprehend all requirements and scope
   - Identify test specifications
   - Note edge cases and constraints

### 2. Workspace Preparation
```
1. Create phase folder: /agents/phase_[N]/
2. Create phase index: /agents/phase_[N]/index.md
3. Document phase metadata:
   - Phase number and name
   - Start timestamp
   - Expected deliverables
   - Success criteria from validation gate
```

## Agent Execution Workflow

### Phase 1: Context Gathering

**Agent**: context-gatherer
**Agent Capability**: Excels at comprehensive context gathering, removing ambiguity, surfacing constraints, and producing definitive context documentation that implementers can rely on without follow-ups.
**When to invoke**: Always, at the start of every phase

**Context to provide**:
1. Project overview from `/ai_docs/project_documentation/`
2. Previous phase outputs (if any) from `/agents/phase_[N-1]/`
3. Current phase requirements from `/phases/phase_[N].md`
4. Phase name and number

**Output location**: `/agents/phase_[N]/context_gatherer_phase[N]_output.md`

### Phase 2: Systems Research

**Agent**: systems-researcher
**Agent Capability**: Provides authoritative technical research on implementation approaches, architecture patterns, and technology selection. Specializes in investigating open-source solutions with concrete code references and making defensible technology recommendations with evidence.
**When to invoke**: For phases requiring technical investigation and solution discovery

**SPECIAL EXECUTION**: The orchestrator can deploy up to 3 parallel systems-researcher agents for different research areas within the same phase to accelerate the research process.

**Context to provide**:
1. Phase requirements from context gatherer output at `/agents/phase_[N]/`
2. Technical constraints from `/ai_docs/development_decisions.md`
3. Current tech stack and architectural patterns from `/ai_docs/coding_patterns.md`
4. Specific phase document from `/phases/phase_[N].md`
5. The orchestrator should identify and communicate the key technical challenges that need research

**Output location**:
- Single agent: `/agents/phase_[N]/systems_researcher_phase[N]_output.md`
- Multiple agents: `/agents/phase_[N]/systems_researcher_phase[N]_[topic]_output.md`
  - Example: `systems_researcher_phase5_pdf_generation_output.md`
  - Example: `systems_researcher_phase5_docx_generation_output.md`
  - Example: `systems_researcher_phase5_export_queue_output.md`

**Note**: The orchestrator should analyze the phase requirements and identify ALL areas needing research, not limiting to predefined topics. Examples of research areas by phase (non-exhaustive):
- Phase 1: Database schema patterns, migration strategies
- Phase 2: State management libraries, undo/redo implementations, form validation approaches
- Phase 3: Template rendering engines, HTML-to-React patterns, live preview architectures, pagination algorithms
- Phase 4: AI SDK patterns, streaming implementations, rate limiting strategies, prompt engineering techniques
- Phase 5: PDF generation libraries, serverless Puppeteer setups, DOCX generation approaches, export queuing systems
- Phase 6: Scoring algorithms, real-time calculation strategies, keyword matching algorithms
- Phase 7: Rich text editors, content sanitization libraries, document linking patterns
- Phase 8: Performance optimization techniques, monitoring solutions, analytics implementations

### Phase 3: Planning Architecture

**Agent**: planner-architect
**Agent Capability**: Converts high-level objectives into comprehensive, actionable implementation plans. Creates detailed technical blueprints that engineers can execute without ambiguity.
**When to invoke**: Always, after context (and research if applicable)

**Context to provide**:
1. All standards and patterns from `/ai_docs/`
2. Context gatherer output from `/agents/phase_[N]/context_gatherer_phase[N]_output.md`
3. Systems researcher output from `/agents/phase_[N]/systems_researcher_phase[N]_output.md` (if exists)
4. Phase requirements from `/phases/phase_[N].md`
5. Previous phase implementation summaries (if any)

**Output location**: `/agents/phase_[N]/planner_architect_phase[N]_output.md`

### Phase 4: Implementation

**Agent**: implementer
**Agent Capability**: Transforms objectives and plans into complete, production-ready implementations. Excels at autonomous end-to-end delivery with minimal guidance.
**When to invoke**: After planning is complete

**Context to provide**:
1. Implementation plan from `/agents/phase_[N]/planner_architect_phase[N]_output.md`
2. All standards from `/ai_docs/` (especially coding patterns and standards documents)
3. Context gatherer output from `/agents/phase_[N]/context_gatherer_phase[N]_output.md`
4. Systems researcher output (if exists) from `/agents/phase_[N]/systems_researcher_phase[N]_output.md`
5. Test specifications from the phase document `/phases/phase_[N].md`
6. Current codebase state and existing patterns

**Output location**: `/agents/phase_[N]/implementer_phase[N]_output.md`

### Phase 5: Code Review

**Agent**: code-reviewer
**Agent Capability**: Performs principal-level code auditing across correctness, security, performance, reliability, and maintainability dimensions.
**When to invoke**: After implementation is complete

**Context to provide**:
1. Implementation output from `/agents/phase_[N]/implementer_phase[N]_output.md`
2. All standards from `/ai_docs/`
3. Phase requirements and test specifications from `/phases/phase_[N].md`
4. Planning document from `/agents/phase_[N]/planner_architect_phase[N]_output.md`
5. Original context from `/agents/phase_[N]/context_gatherer_phase[N]_output.md`

**Output location**: `/agents/phase_[N]/code_reviewer_phase[N]_output.md`

**Review categorization**: The agent should categorize findings as:
- 🔴 MUST FIX (blocking issues)
- 🟡 SHOULD FIX (important improvements)
- 🟢 CONSIDER (nice to have)

## Orchestrator Decision Points

### 1. Research Agent Invocation
Invoke systems-researcher for phases involving:
- Phase 3: Template system (rendering approaches)
- Phase 4: AI integration (SDK patterns, streaming)
- Phase 5: Export system (PDF/DOCX generation)
- Phase 6: Scoring algorithms
- Phase 7: Rich text editing
- Phase 8: Production optimization

### 2. Parallel vs Sequential Execution
- Context must complete first (always)
- Research agents can run in parallel (up to 3) if multiple research areas identified
- Planning must wait for both context and all research outputs
- Implementation must wait for planning
- Review must wait for implementation

### 3. Iteration Handling
If code-reviewer identifies 🔴 MUST FIX issues:
1. Send issues back to implementer with specific fixes
2. Re-run relevant parts of implementation
3. Re-review only the changed sections

## Phase Completion Protocol

### 1. Validation Gate Check
After code review approval:
```markdown
Phase [N] Validation Checklist:
□ All unit tests defined and passing
□ Integration tests complete
□ E2E tests implemented
□ Performance benchmarks met
□ Accessibility requirements satisfied
□ Security validation passed
□ Documentation complete
```

### 2. Phase Summary Creation
Create `/agents/phase_[N]/phase_summary.md`:
- What was built
- Key decisions made
- Deviations from plan
- Lessons learned
- Ready for next phase confirmation

### 3. Handoff Preparation
- Update main project documentation if needed
- Note any technical debt incurred
- Document any new patterns established
- Prepare context for next phase

## Special Instructions by Phase

### Phase 1: Foundation & Core Data Model
- No research needed (standard setup)
- Focus on getting base structure right
- Emphasize schema design review

### Phase 2: Document CRUD & Editor
- Research: Form state management patterns
- Critical: Undo/redo implementation
- Watch for: Performance with large documents

### Phase 3: Template System & Live Preview
- Research: Template rendering strategies
- Critical: Performance optimization
- Watch for: Memory leaks in preview

### Phase 4: AI Integration
- Research: Streaming patterns, rate limiting
- Critical: Error handling, cost management
- Watch for: API key security

### Phase 5: Export System
- Research: Serverless PDF generation
- Critical: Memory limits, timeout handling
- Watch for: Font embedding issues

### Phase 6: Scoring & Optimization
- Research: Scoring algorithms from competitors
- Critical: Real-time performance
- Watch for: Calculation accuracy

### Phase 7: Cover Letters
- Research: Rich text editors
- Critical: XSS prevention
- Watch for: Format preservation

### Phase 8: Production Polish
- No research needed (optimization)
- Critical: Performance metrics
- Watch for: Security audit findings

## Error Recovery

If any agent fails:
1. Capture the error context
2. Determine if it's a blocker
3. Options:
   - Retry with modified instructions
   - Skip non-critical research
   - Escalate to user for decision
   - Document as known limitation

## Success Metrics

Each phase is successful when:
1. All agents complete their tasks
2. Code reviewer has no 🔴 MUST FIX issues
3. Validation gate tests pass
4. Phase summary is documented
5. Next phase can begin with clear context

---

## Quick Reference: Agent Context Matrix

| Agent | Needs Standards | Needs Project Docs | Needs Previous Phase | Needs Current Phase |
|-------|----------------|-------------------|---------------------|-------------------|
| context-gatherer | No | Yes | Yes | Yes |
| systems-researcher | No | Yes | No | Yes |
| planner-architect | Yes | Yes | Yes | Yes |
| implementer | Yes | Yes | Yes | Yes |
| code-reviewer | Yes | No | No | Yes |

## Execution Command Template

```
For Phase [N]:
1. Load context from /ai_docs/
2. Read /phases/phase_[N].md
3. Create /agents/phase_[N]/
4. Execute agents in sequence
5. Validate completion
6. Prepare for Phase [N+1]
```

This document serves as the complete playbook for orchestrating any phase implementation. Follow these instructions systematically for consistent, high-quality delivery.