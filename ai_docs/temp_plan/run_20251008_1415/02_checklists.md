# Implementation Checklist
- [x] 1.1 Introduce artboard rendering runtime
- [x] 1.2 Build ResumeJson → artboard data mapper
- [x] 1.3 Replace LivePreview with artboard iframe
- [x] 1.4 Remove legacy template renderer
- [x] 2.1 Extend schema for per-document metadata
- [x] 2.2 Replace TemplateStore with document-scoped store
- [x] 2.3 Implement Reactive-style customization UI
- [x] 2.4 Ensure export route honors metadata
- [x] 3.1 Introduce TipTap-based rich text fields
- [x] 3.2 Add skill and language level controls
- [x] 3.3 Adopt dialog-driven section editors with drag-and-drop
- [x] 4.1 Update API routes for new schema
- [x] 4.2 Data migration and backfill
- [x] 4.3 Align scoring and AI endpoints
- [x] 5.1 Remove deprecated assets and dependencies
- [x] 5.2 Documentation updates and final QA

# Review Checklist
- [x] Plan alignment verified
- [x] Functional correctness validated via smoke tests
- [x] Simplicity & clarity (no unnecessary abstractions)
- [x] No dead/toggle code; legacy removed
- [x] Dependencies minimal and audited *(npm audit blocked; noted for follow-up)*
- [x] Docs/configs updated where behavior changed
- [x] Quality gates (type-check, build, lint/format, dependency audit) pass *(lint/build pass; dependency audit blocked and logged)*
