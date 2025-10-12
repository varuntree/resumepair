# Assumptions & Risks

## Assumptions
1. **Template compatibility** — Existing resume/cover letter templates can be instrumented with `data-flow-*` markers without altering visual output; will validate by rendering each template after instrumentation.
2. **PDF generator parity** — Headless Chromium renders the new paginated HTML identically to the iframe output; will confirm by exporting multi-page resumes post-change.
3. **react-zoom-pan-pinch capability** — Library supports the required event configuration (disabling wheel zoom while retaining pinch); will test during PreviewContainer overhaul and fall back to manual zoom logic if necessary.
4. **Performance budget** — Pagination + rendering stays within 120 ms after instrumentation; will profile during manual smoke tests and optimise if exceeded.
5. **AI tooling integration** — Unified AI flows can consume the new renderer without API/schema changes; will verify by running AI generation after integration.

## Risks & Mitigations
1. **Incorrect pagination splitting** — Items may break mid-component leading to visual regressions. *Mitigation:* implement guarded splitting logic with widow/orphan checks and manual template QA.
2. **Regression in exports** — PDF output might degrade if paginator diverges. *Mitigation:* align server renderer code path and run export smoke tests.
3. **Event isolation gaps** — Browser-specific gestures (e.g., Safari pinch) could leak. *Mitigation:* add capture-phase handlers and test on multiple browsers; include feature detection fallbacks.
4. **State restoration bugs** — Intra-page ratio restore might misbehave causing jumpy scroll. *Mitigation:* instrument logging in development and adjust store logic promptly.
5. **Scope creep/time overrun** — Template refactor touches many files. *Mitigation:* tackle template instrumentation per template family, checking in intermediate states and marking completion in checklist.
