# ResumePair Learning System
*Version 1.0.0*

## What Is This?

The Learning System is an automated knowledge capture pipeline that ensures **no lesson is learned twice**. It runs transparently after each phase, transforming implementation experiences into actionable wisdom that improves future work.

## Why It Exists

**Problem**: Manual documentation is forgotten, lessons are repeated, mistakes happen twice.

**Solution**: Automated observation capture → pattern analysis → knowledge integration → better documentation.

**Result**: Each phase builds on accumulated wisdom. Implementations get faster, better, and more reliable.

## How It Works

### For You (Human)
1. Implement phase normally
2. System captures insights automatically
3. After validation, review one proposal document
4. Approve changes
5. Documentation updates automatically

**Your only interaction**: 5-minute proposal review per phase.

### For AI Orchestrators
1. **During Implementation**: Capture observations in `/agents/phase_[N]/learnings/observations.md`
2. **After Validation**: Execute 4-agent pipeline
3. **Generate Proposal**: Create `/agents/learning_system/proposals/phase_[N]_proposal.md`
4. **Apply Changes**: Update documentation after approval

## Quick Start

### Step 1: Setup (One-Time)
```bash
# Folders created during initial setup:
/agents/learning_system/knowledge_base/
  ├── patterns/
  ├── anti_patterns/
  ├── tool_discoveries/
  └── process_improvements/
/agents/learning_system/proposals/
```

### Step 2: During Implementation
Observations auto-captured when you encounter:
- ❌ Errors or unexpected failures
- 🔄 Workarounds or alternative approaches
- 💡 Better tools or approaches discovered
- ❓ Assumptions that proved incorrect

### Step 3: After Phase Completion
```markdown
1. Execute learning pipeline (see EXECUTION.md)
2. Review generated proposal
3. Approve integration
4. Changes apply automatically
```

## File Structure

```
/agents/learning_system/
├── README.md           # This file - overview and quick start
├── EXECUTION.md        # Complete execution guide
├── AGENTS.md          # Agent deployment instructions
├── SCHEMAS.md         # Data structure definitions
│
├── knowledge_base/    # Accumulated wisdom
│   ├── patterns/              # Successful approaches
│   ├── anti_patterns/         # Avoided mistakes
│   ├── tool_discoveries/      # Better libraries found
│   └── process_improvements/  # Workflow optimizations
│
└── proposals/         # Human review documents
    └── phase_[N]_proposal.md
```

## System Components

### 1. Observation Layer
- **Location**: `/agents/phase_[N]/learnings/observations.md`
- **Triggers**: Errors, workarounds, discoveries, patterns
- **Purpose**: Real-time capture during implementation

### 2. Analysis Pipeline (4 Agents)
1. **Pattern Extractor**: Identifies recurring themes
2. **Knowledge Generalizer**: Creates reusable wisdom
3. **Integration Mapper**: Determines update targets
4. **Validation Orchestrator**: Generates review proposal

### 3. Knowledge Base
- **Patterns**: What works
- **Anti-patterns**: What to avoid
- **Tool Discoveries**: Better approaches
- **Process Improvements**: Workflow optimizations

### 4. Integration System
- **Proposals**: Pending changes for human review
- **Auto-Apply**: Updates documentation after approval
- **Validation**: Ensures no conflicts or breaks

## Success Metrics (Targets)

| Metric | Target | Meaning |
|--------|--------|---------|
| Error Recurrence Rate | < 5% | Same errors not repeated |
| First-Try Success Rate | > 80% | Code works without fixes |
| Pattern Coverage | > 70% | Problems have documented solutions |
| Learning Application Rate | > 60% | Patterns are reused |
| Integration Speed | < 24h | Fast knowledge transfer |

## Example: Phase 1 Walkthrough

### During Implementation
You encounter an error:
```typescript
// RLS policy fails
CREATE POLICY "users_own_documents" ON documents
  FOR ALL USING (auth.uid() = ANY(user_ids));
// Error: "operator does not exist: uuid = uuid[]"
```

System captures observation:
```markdown
## Observation 1-2025-09-28T10:30:00Z-001

**Trigger**: Error
**Severity**: High
**Component**: migrations/phase1/006_rls_policies.sql

### What Happened
Supabase RLS policy failed - doesn't support ANY() with arrays

### Resolution
Changed to Supabase-specific syntax:
user_ids @> ARRAY[auth.uid()]

### Learning Potential
- Recurring: Definite (all array RLS policies)
- Generalizable: Yes
- Preventable: Yes
```

### After Phase Validation
Pipeline automatically:
1. **Extracts Pattern**: "Database platform-specific SQL syntax"
2. **Generalizes Knowledge**:
   ```
   IF: Using array operations in Supabase
   THEN: Use @> operator instead of ANY()
   BECAUSE: Supabase PostgreSQL has custom syntax
   ```
3. **Maps Integration**: → `/ai_docs/coding_patterns.md` Database Migration section
4. **Creates Proposal**: Single document with all changes

### You Review Proposal
```markdown
# Phase 1 Learning Integration Proposal

## Executive Summary
3 learnings captured. Most critical: Supabase array syntax prevents all future RLS failures.

## Critical Updates (Must Apply)
1. Add Supabase array syntax to coding_patterns.md
   - Prevents: RLS policy failures
   - Saves: ~2 hours in Phase 2

## Approval
[✓] Approve All
```

### System Applies Changes
- Updates `/ai_docs/coding_patterns.md` automatically
- Adds pattern to knowledge base
- Records metrics

### Phase 2 Benefits
- Developer sees Supabase syntax in patterns → no error
- 2 hours saved, no debugging needed
- Pattern reused across all future RLS policies

## Integration with Orchestrator

✅ **Fully Integrated** - Learning system is **Step 3** of the official Phase Completion Protocol:

```
Phase Workflow:
1. Context Gathering
2. Implementation (with observation capture)
3. Code Review
4. Validation ✓

Phase Completion Protocol:
1. Validation Checklist
2. Phase Summary
3. Learning System Pipeline ← Automated execution
4. Handoff Preparation
```

See `/ai_docs/orchestrator_instructions.md` lines 191-198 and 249-280 for complete integration details.

## Key Features

### Automatic Capture
- No manual documentation required
- Real-time observation logging
- Context preserved with insights

### Intelligent Analysis
- Pattern recognition across phases
- Root cause identification
- Generalization of specific incidents

### Targeted Integration
- Updates specific documents
- Maintains consistency
- Prevents conflicts

### Continuous Improvement
- Meta-learning capabilities
- Performance metrics tracking
- Self-optimization

## Best Practices

1. **Let it run**: Don't intervene during capture
2. **Trust the process**: System improves over time
3. **Review thoughtfully**: Quality over speed
4. **Track metrics**: Monitor effectiveness
5. **Evolve gradually**: Small improvements compound

## Maintenance

### Adding Patterns Manually
1. Create file in appropriate `knowledge_base/` subdirectory
2. Follow schema in `SCHEMAS.md`
3. Link to source observation or phase

### Reviewing Proposals
1. Check proposal completeness
2. Verify no conflicts with standards
3. Approve, modify, or reject
4. System applies automatically

### System Optimization
- Review metrics after each phase
- Identify bottlenecks or declining trends
- Update pipeline based on meta-learnings
- Document changes

## Troubleshooting

**No observations captured**
- Check observation file exists
- Verify triggers were encountered
- Review capture format in EXECUTION.md

**Poor pattern quality**
- Need more observations (minimum 2 per pattern)
- Check confidence scores
- Review generalization in AGENTS.md

**Integration conflicts**
- Check existing documentation
- Apply priority rules (latest phase wins)
- Manually resolve if needed

## Documentation

- **EXECUTION.md**: Complete step-by-step execution guide
- **AGENTS.md**: Agent deployment and context requirements
- **SCHEMAS.md**: Data structures and validation rules

---

*The Learning System is a living component of ResumePair that ensures every implementation makes the next one better. Each phase compounds knowledge, creating a continuously improving development process.*