# Phase 6 Generalized Knowledge

**Generated**: 2025-10-02T23:12:00Z
**Phase**: 6 - Scoring & Optimization
**Agent**: Knowledge Generalizer

## Summary
- Patterns Processed: 8
- Learnings Generated: 8
- Categories: Best Practices [4], Anti-Patterns [1], Tools [0], Process [3]

---

## Learning 1: Start Simple, Optimize Later

**ID**: L-P6-001
**Source**: PAT-P6-TECHNICAL-001
**Category**: best_practice
**Confidence**: 0.95

### Rule
```yaml
IF: Implementing feature with performance requirement
THEN: Start with simplest algorithmic approach and measure performance
BECAUSE: Simple solutions often meet requirements without complexity overhead, and premature optimization wastes time
```

### Details

**Problem This Addresses**
Over-engineering tendency when developers see strict performance budgets. Assumption that complex solutions (ML, NLP, advanced algorithms) are required without first measuring baseline.

**Solution Provided**
Start with basic approach (string operations, simple algorithms), measure against budget, optimize only if needed. In Phase 6, basic keyword matching beat 500ms budget by 5x.

**Evidence**
- Pattern PAT-P6-TECHNICAL-001: Simple algorithms achieved 100ms vs 500ms budget
- User request: Simple algorithms instead of TF-IDF/NLP/ML
- Result: 4+ hours saved by avoiding complex implementation

### Application

**Contexts Where This Applies**
- Performance-critical features with defined budgets
- Search/matching algorithms
- Data processing pipelines
- Any feature where "fast enough" is defined

**Exceptions**
- Proven bottlenecks from profiling data
- Features explicitly requiring advanced algorithms (e.g., ML-based recommendations)
- External dependencies already available (don't reinvent)

**Dependencies**
- Performance measurement tools available
- Clear performance budget defined
- Ability to profile and measure

### Validation

**Test**
```yaml
Given: Feature with <500ms performance requirement
When: Implement simplest approach first
Then: Measure performance before adding complexity
```

**Metrics to Track**
- Time spent on initial implementation
- Performance vs budget
- Time saved by avoiding complex approach

### Integration Priority

**Urgency**: high
- Prevents wasted development time
- Proven in Phase 6 to save 4+ hours

**Effort**: trivial (add one guideline to development_decisions.md)
**Risk**: none

---

## Learning 2: Enforce Design Tokens via Code Review Checklist

**ID**: L-P6-002
**Source**: PAT-P6-TECHNICAL-002
**Category**: anti_pattern
**Confidence**: 0.90

### Rule
```yaml
IF: Creating or modifying UI components
THEN: Use design tokens only (no hardcoded colors/spacing); add automated check to code review
BECAUSE: Manual enforcement is insufficient; hardcoded values recur despite documentation
```

### Details

**Problem This Addresses**
Design token violations recurring in Phase 6 despite Phase 5 lessons. Pattern not internalized due to lack of systematic enforcement.

**Solution Provided**
1. Add design token check to code review standards
2. Create reusable shadcn variants instead of custom classes
3. Consider automated linting for hardcoded Tailwind colors

**Evidence**
- Pattern PAT-P6-TECHNICAL-002: Hardcoded colors in 2 components
- Time lost: 1 hour in code review + fixes
- Root cause: No systematic enforcement

### Application

**Contexts Where This Applies**
- All UI component development
- Template modifications
- Styling updates
- Any code touching Tailwind classes

**Exceptions**
- None - design tokens should always be used

**Dependencies**
- Design token system exists (globals.css)
- shadcn/ui configured
- Code review process in place

### Validation

**Test**
```yaml
Given: New component with styling
When: Code review executed
Then: No hardcoded colors or spacing values found
```

**Metrics to Track**
- Design token violations per phase
- Code review findings (should decrease)
- Time spent on fixes (should decrease)

### Integration Priority

**Urgency**: critical
- Recurring issue despite previous lessons
- Needs enforcement mechanism

**Effort**: minor (add to code review standards + example)
**Risk**: none

---

## Learning 3: RLS Policy Completeness Checklist

**ID**: L-P6-003
**Source**: PAT-P6-TECHNICAL-003
**Category**: best_practice
**Confidence**: 0.85

### Rule
```yaml
IF: Creating new user-scoped database table
THEN: Create all 4 CRUD RLS policies (SELECT, INSERT, UPDATE, DELETE)
BECAUSE: Missing policies create security gaps and are easy to forget without checklist
```

### Details

**Problem This Addresses**
Missing DELETE policy in Phase 6 migration. Easy to forget one of 4 CRUD operations when writing RLS policies manually.

**Solution Provided**
Systematic checklist for RLS policies:
```sql
-- Required policies for user-scoped tables:
- SELECT: USING (user_id = auth.uid())
- INSERT: WITH CHECK (user_id = auth.uid())
- UPDATE: USING + WITH CHECK (user_id = auth.uid())
- DELETE: USING (user_id = auth.uid())
```

**Evidence**
- Pattern PAT-P6-TECHNICAL-003: Missing DELETE policy
- Severity: High (security issue)
- Time lost: 30 minutes
- Caught by code review (blocked merge)

### Application

**Contexts Where This Applies**
- All new tables with user_id column
- Tables requiring row-level security
- Multi-tenant data isolation

**Exceptions**
- Public read-only tables (no user_id)
- Admin-only tables (different RLS logic)
- Tables with custom security requirements

**Dependencies**
- Supabase RLS enabled on database
- user_id column in table
- auth.uid() function available

### Validation

**Test**
```yaml
Given: New user-scoped table migration
When: Migration reviewed
Then: All 4 CRUD policies present and correct
```

**Metrics to Track**
- RLS policy completeness per migration
- Security issues found in review
- Time spent on security fixes

### Integration Priority

**Urgency**: critical
- Security issue
- Easy to miss without checklist

**Effort**: trivial (add checklist to coding_patterns.md)
**Risk**: none

---

## Learning 4: Denormalize user_id for RLS Performance

**ID**: L-P6-004
**Source**: PAT-P6-TECHNICAL-004
**Category**: best_practice
**Confidence**: 0.80

### Rule
```yaml
IF: Creating child table in user-scoped data model
THEN: Store user_id directly in child table (denormalize from parent)
BECAUSE: RLS policies execute on every query; joins add overhead; direct column eliminates joins
```

### Details

**Problem This Addresses**
Performance overhead of RLS policies that need to join to parent table to check user_id. Every query pays join cost.

**Solution Provided**
Denormalize user_id from parent table (resumes) to child table (resume_scores). Slight data redundancy for significant performance gain.

**Evidence**
- Pattern PAT-P6-TECHNICAL-004: user_id in resume_scores despite being in resumes
- Trade-off: Small redundancy for RLS performance
- Future queries avoid join overhead

### Application

**Contexts Where This Applies**
- All child tables in user-scoped hierarchies
- Tables with frequent RLS policy checks
- Performance-sensitive queries

**Exceptions**
- Very wide tables where extra column matters
- Tables rarely queried (join cost insignificant)
- Shared data (not user-scoped)

**Dependencies**
- Parent table has user_id
- RLS policies active
- Application handles consistency

### Validation

**Test**
```yaml
Given: Child table with RLS policy
When: Query performance measured
Then: Direct user_id check faster than join to parent
```

**Metrics to Track**
- Query performance (with vs without denormalization)
- RLS policy execution time
- Database query patterns

### Integration Priority

**Urgency**: high
- Significant performance impact
- Standard pattern for all child tables

**Effort**: trivial (add to development_decisions.md)
**Risk**: low (requires consistency handling)

---

## Learning 5: Component Composition Pattern for Complex Features

**ID**: L-P6-005
**Source**: PAT-P6-TECHNICAL-005
**Category**: best_practice
**Confidence**: 0.90

### Rule
```yaml
IF: Implementing complex UI feature (like scoring dashboard)
THEN: Create small, focused components (<100 lines) that compose together
BECAUSE: Single responsibility components are easier to maintain, test, and debug than monolithic components with 20+ props
```

### Details

**Problem This Addresses**
Temptation to create single large component with extensive configuration. Results in hard-to-maintain, hard-to-test code.

**Solution Provided**
Break into focused components:
- ScoreRing: Display single score with visual ring
- ScoreDashboard: Compose multiple ScoreRings
- ScoreBreakdown: Detailed score breakdown

Each component <100 lines, single purpose.

**Evidence**
- Pattern PAT-P6-TECHNICAL-005: 3 components, all <100 lines
- Clear boundaries
- Easy to understand and modify

### Application

**Contexts Where This Applies**
- Complex UI features (dashboards, forms, visualizations)
- Features with multiple sub-parts
- Reusable UI patterns

**Exceptions**
- Truly simple components (single element wrappers)
- Tight coupling where split adds complexity
- One-off UI elements unlikely to change

**Dependencies**
- Component framework (React)
- Clear separation of concerns

### Validation

**Test**
```yaml
Given: Complex UI feature implementation
When: Component structure reviewed
Then: Each component <100 lines with single responsibility
```

**Metrics to Track**
- Average component size
- Component reuse count
- Maintenance time per component

### Integration Priority

**Urgency**: medium
- Good practice to document
- Not blocking future work

**Effort**: minor (add examples to coding_patterns.md)
**Risk**: none

---

## Learning 6: Knowledge Transfer Validation

**ID**: L-P6-006
**Source**: PAT-P6-PROCESS-001
**Category**: process_improvement
**Confidence**: 0.85

### Rule
```yaml
IF: Learning documented in previous phase
THEN: Check if pattern successfully applied in current phase
BECAUSE: Validates learning system effectiveness; proves knowledge is being transferred
```

### Details

**Problem This Addresses**
Uncertainty about whether learning system is working. Need evidence that lessons are internalized.

**Solution Provided**
Track "negative evidence" - absence of errors that occurred in previous phases. Phase 6 had zero apiError parameter order mistakes after Phase 5 lesson.

**Evidence**
- Pattern PAT-P6-PROCESS-001: No parameter order errors in Phase 6
- Phase 5 lesson successfully transferred
- Time saved: ~30 minutes debugging

### Application

**Contexts Where This Applies**
- Learning system validation
- Process improvement measurement
- Knowledge transfer assessment

**Exceptions**
- First occurrence of issue (no baseline)
- Different context where lesson doesn't apply

**Dependencies**
- Previous phase learnings documented
- Ability to track absence of errors

### Validation

**Test**
```yaml
Given: Learning from Phase N
When: Phase N+1 implementation completed
Then: Error from Phase N does not recur
```

**Metrics to Track**
- Error recurrence rate
- First-try success rate
- Learning application rate

### Integration Priority

**Urgency**: low
- Validation metric, not critical path
- Proves system works

**Effort**: trivial (note in proposal)
**Risk**: none

---

## Learning 7: Self-Fix Workflow for Small Issues

**ID**: L-P6-007
**Source**: PAT-P6-PROCESS-002
**Category**: process_improvement
**Confidence**: 0.75

### Rule
```yaml
IF: Code review finds small, isolated, non-architectural issue (<30 min fix)
THEN: Reviewer can fix directly instead of returning to implementer
BECAUSE: Faster iteration, reduces context switching overhead
```

### Details

**Problem This Addresses**
Context switching overhead when returning small fixes to original implementer. Can take longer to explain than to fix.

**Solution Provided**
Workflow: Implementer → Code Review → [Self-Fix Small Issues] → Visual Verification

Appropriate for:
- Design token violations
- Missing RLS policies
- Simple bug fixes
- Documentation updates

**Evidence**
- Pattern PAT-P6-PROCESS-002: Self-fix applied in Phase 6
- Time saved: 15-20 minutes per small issue
- Faster than context switch back to implementer

### Application

**Contexts Where This Applies**
- Small isolated fixes (<30 min)
- Non-architectural changes
- Clear fix path
- Reviewer has context

**Exceptions**
- Architectural decisions needed
- Complex fixes requiring deep context
- Learning opportunity for implementer
- Fix might break other code

**Dependencies**
- Reviewer has editing permissions
- Clear fix scope
- Testing capability

### Validation

**Test**
```yaml
Given: Code review finding small issue
When: Reviewer fixes directly
Then: Total time < 30 minutes, issue resolved
```

**Metrics to Track**
- Time saved per self-fix
- Success rate (no rework needed)
- Reviewer confidence

### Integration Priority

**Urgency**: medium
- Process optimization
- Not critical path

**Effort**: minor (document guidelines)
**Risk**: low (limited scope)

---

## Learning 8: Granular Types for Domain Values

**ID**: L-P6-008
**Source**: PAT-P6-KNOWLEDGE-001
**Category**: best_practice
**Confidence**: 0.80

### Rule
```yaml
IF: Implementing domain-specific values with business rules
THEN: Create explicit TypeScript types instead of generic primitives
BECAUSE: Type system enforces business rules at compile time, preventing runtime errors
```

### Details

**Problem This Addresses**
Using generic primitives (number, string) for domain values with specific rules. Runtime errors when rules violated.

**Solution Provided**
Explicit types with structure:
```typescript
interface ScoreDimensions {
  atsScore: number      // 0-30
  keywordScore: number  // 0-25
  contentScore: number  // 0-20
  formatScore: number   // 0-15
  completenessScore: number // 0-10
}
```

Instead of: `{ [key: string]: number }`

**Evidence**
- Pattern PAT-P6-KNOWLEDGE-001: ScoreDimensions interface
- Type system catches missing fields at compile time
- Business rules documented in types

### Application

**Contexts Where This Applies**
- Domain-specific values (scores, statuses, configurations)
- Values with validation rules
- Multi-field structures
- Business logic enforcement

**Exceptions**
- Truly generic data (arbitrary key-value)
- Dynamically structured data
- External API responses (use runtime validation)

**Dependencies**
- TypeScript strict mode
- Clear business rules
- Type definitions maintained

### Validation

**Test**
```yaml
Given: Domain value with business rules
When: Implemented with explicit type
Then: Type errors at compile time for invalid values
```

**Metrics to Track**
- Runtime errors prevented
- Type errors caught at compile time
- Code clarity improvement

### Integration Priority

**Urgency**: high
- Prevents entire class of runtime errors
- Improves code quality

**Effort**: trivial (add to coding_patterns.md)
**Risk**: none

---

## Cross-Cutting Themes

### Theme 1: Simplicity Over Complexity
Multiple learnings emphasize starting simple:
- Learning 1: Simple algorithms first
- Learning 5: Small focused components
- Learning 7: Direct fixes for small issues

**Underlying Principle**: Complexity should be justified by measurement, not assumption.

### Theme 2: Systematic Enforcement Needed
Multiple patterns show manual enforcement fails:
- Learning 2: Design tokens need automated checks
- Learning 3: RLS policies need checklists
- Learning 6: Knowledge transfer needs validation

**Underlying Principle**: Important patterns need systematic enforcement, not just documentation.

### Theme 3: Performance Through Architecture
Performance comes from good design, not complex algorithms:
- Learning 1: Simple algorithms sufficient
- Learning 4: Denormalization for RLS performance
- Learning 5: Component composition for maintainability

**Underlying Principle**: Architectural decisions have bigger performance impact than algorithmic complexity.

---

## Recommendations

Prioritized list of what to integrate first:

1. **Learning 3 (RLS Checklist)** - Critical security issue, easy to apply
   - Why: Prevents security gaps, caught blocking issue in Phase 6

2. **Learning 2 (Design Token Enforcement)** - Critical recurring issue
   - Why: Pattern recurring despite previous lessons, needs systematic fix

3. **Learning 1 (Simple First)** - High value, prevents wasted time
   - Why: Proven to save 4+ hours in Phase 6

4. **Learning 4 (User ID Denormalization)** - High value for performance
   - Why: Standard pattern for all future child tables

5. **Learning 8 (Granular Types)** - High value for quality
   - Why: Prevents runtime errors across codebase

6. **Learning 5 (Component Composition)** - Medium value, good documentation
   - Why: Best practice worth capturing with examples

7. **Learning 7 (Self-Fix Workflow)** - Medium value, process optimization
   - Why: Documents successful workflow discovery

8. **Learning 6 (Knowledge Transfer)** - Low urgency, validation metric
   - Why: Proves system works, not actionable

---

**Knowledge Generalization Complete**

All 8 patterns transformed into reusable if-then-because rules with clear application contexts, exceptions, and validation criteria. Ready for integration mapping.
