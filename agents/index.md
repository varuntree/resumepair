# Agent Workspace Index

## Purpose
This directory serves as the workspace for all agent-generated artifacts during the implementation of ResumePair phases. Each phase will have its own subdirectory containing the outputs from various specialized agents.

## Directory Structure
```
agents/
├── index.md (this file)
├── phase_1/
│   ├── index.md (phase overview and status)
│   ├── context_gatherer_phase1_output.md
│   ├── systems_researcher_phase1_output.md
│   ├── planner_architect_phase1_output.md
│   ├── implementer_phase1_output.md
│   └── code_reviewer_phase1_output.md
├── phase_2/
│   └── ... (similar structure)
└── ... (continues for all phases)
```

## Agent Roles and Outputs

### 1. Context Gatherer
- **Input**: Project documentation, previous phase outputs
- **Output**: `context_gatherer_phase[N]_output.md`
- **Purpose**: Documents all requirements, constraints, and considerations for the phase

### 2. Systems Researcher
- **Input**: Project documentation, current phase requirements
- **Output**: `systems_researcher_phase[N]_output.md`
- **Purpose**: Research technical approaches, libraries, and implementation patterns

### 3. Planner Architect
- **Input**: Context and research outputs, standards, phase requirements
- **Output**: `planner_architect_phase[N]_output.md`
- **Purpose**: Creates detailed implementation plan with specific tasks and sequences

### 4. Implementer
- **Input**: Planning output, standards, all previous agent outputs
- **Output**: `implementer_phase[N]_output.md`
- **Purpose**: Executes the implementation and documents what was built

### 5. Code Reviewer
- **Input**: Implementation output, standards, phase requirements
- **Output**: `code_reviewer_phase[N]_output.md`
- **Purpose**: Reviews implementation for quality, security, and standards compliance

## Workflow Process

1. **Orchestrator reads context**: AI docs, standards, current phase requirements
2. **Phase folder creation**: Creates `phase_[N]/` with index
3. **Sequential agent execution**:
   - Context Gatherer → analyzes and documents
   - Systems Researcher → investigates solutions (if needed)
   - Planner Architect → creates implementation plan
   - Implementer → executes the plan
   - Code Reviewer → validates the implementation
4. **Orchestrator synthesis**: Combines outputs and prepares for next phase

## Status Tracking

Each phase folder will contain an `index.md` with:
- Phase name and number
- Start timestamp
- Current status (planning/implementing/reviewing/complete)
- Agent completion checklist
- Key decisions made
- Blockers or issues
- Next steps

## Important Notes

- Agents work sequentially, each building on previous outputs
- All artifacts remain in this workspace for traceability
- The orchestrator manages context passing between agents
- No direct modifications to root project files without orchestrator approval
- Each agent output should be self-contained and clearly structured

---
*Last Updated: Phase implementation beginning*
*Next Action: Awaiting orchestrator instructions for Phase 1*