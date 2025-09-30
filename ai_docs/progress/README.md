# Progress Tracking Structure

This directory contains progress tracking and validation documentation for each phase of the ResumePair development.

## Directory Structure

```
progress/
├── README.md (this file)
├── phase_1/
│   ├── screenshots/
│   │   ├── desktop/         # Desktop screenshots (1440px)
│   │   └── mobile/          # Mobile screenshots (375px)
│   ├── visual_review.md     # Visual quality verification results
│   └── playbook_results.md  # Playbook execution results
├── phase_2/
│   └── (same structure)
└── ... (phase_3 through phase_8)
```

## Purpose

This structure supports the **Puppeteer MCP-based testing workflow** (see `ai_docs/testing/README.md`).

Each phase folder contains:
1. **Screenshots** - Visual proof of feature completion
2. **Visual Review** - Analysis against design system standards
3. **Playbook Results** - Test execution outcomes

## How to Use

### During Phase Development

When working on a phase, agents should:

1. **Capture Screenshots** after implementing UI features
   - Desktop (1440px): Save to `phase_N/screenshots/desktop/`
   - Mobile (375px): Save to `phase_N/screenshots/mobile/`
   - Use descriptive names: `feature_name_desktop.png`, `feature_name_mobile.png`

2. **Document Visual Quality** in `visual_review.md`
   - Analyze screenshots against Visual Quality Checklist
   - List design tokens used
   - Note any issues found
   - Mark Pass/Needs Refinement/Fail

3. **Record Playbook Results** in `playbook_results.md`
   - Execute all playbooks for the phase
   - Mark each test as Pass/Fail
   - Document issues found
   - Make gate decision (Approved / Not Approved)

### At Phase Gate

Before moving to next phase, verify:
- [ ] All playbook tests passed
- [ ] Visual review completed and approved
- [ ] Screenshots saved and documented
- [ ] Critical issues resolved
- [ ] `playbook_results.md` shows "Gate Status: Approved"

**Time estimate**: 20-30 minutes per phase gate

## File Templates

### visual_review.md

Sections for each feature group in the phase:
- Screenshots (desktop + mobile paths)
- Visual Quality Checklist
- Design tokens used
- Issues found
- Status (Pass/Needs Refinement/Fail)

### playbook_results.md

Sections for each playbook in the phase:
- Test results (Pass/Fail for each test)
- Overall pass count
- Issues found
- Gate decision
- Approval signature

## Example Workflow

```bash
# Phase 1 Development
1. Implement authentication feature
2. Start dev server: npm run dev
3. Navigate to feature: mcp__puppeteer__puppeteer_navigate
4. Capture screenshots: mcp__puppeteer__puppeteer_screenshot
5. Analyze against checklist
6. Document in visual_review.md
7. Execute playbooks
8. Document in playbook_results.md
9. Make gate decision
```

## Integration with Testing System

This progress structure is part of the complete testing workflow:

```
ai_docs/testing/          # Testing system documentation
├── README.md             # Overview of testing approach
├── mcp_patterns.md       # Reusable MCP commands
└── playbooks/            # Phase-specific test playbooks
    ├── phase_1_auth.md
    ├── phase_1_navigation.md
    └── ... (more playbooks)

ai_docs/progress/         # THIS DIRECTORY - Results tracking
├── phase_1/
│   ├── screenshots/      # Visual proof
│   ├── visual_review.md  # Analysis
│   └── playbook_results.md  # Outcomes
```

## Related Documentation

- **Testing README**: `ai_docs/testing/README.md` - Complete testing workflow
- **Visual Verification Workflow**: `ai_docs/standards/9_visual_verification_workflow.md` - Step-by-step process
- **Component Standards**: `ai_docs/standards/3_component_standards.md` - Visual quality standards
- **MCP Patterns**: `ai_docs/testing/mcp_patterns.md` - Reusable commands

## Notes

- Phase 1 has template files (`visual_review.md`, `playbook_results.md`) as examples
- Other phases should follow the same structure
- Screenshots must be saved before marking phase complete
- Visual verification is mandatory for all UI features
- Gate decision requires all three components: playbooks ✅, visual ✅, documentation ✅