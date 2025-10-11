# Assumptions
- Local manual Node tests require a TypeScript loader (ts-node/tsx); not available in sandbox.
- API curl smokes assume dev server on localhost:3000.
- Repository uses lowercase `ai_docs/` despite instructions referencing `AI_docs/`; treat existing path as canonical and note discrepancy in TRACKING.
- Environment has valid `GOOGLE_GENERATIVE_AI_API_KEY` for manual tests; if unavailable, smoke tests relying on live API will note failure but plan continues with documented limitation.
- Existing docs expect structured `ResumeJson`; no schema version bump required.
- No other services consume `libs/sanitization/resume.ts` outside this repo snapshot.

# Risks & Mitigations
- **Structured output drift** — Mitigation: use `repairText` fallback; if unresolved, log failure and return 422 with context.
- **Manual tests hitting rate limits** — Mitigation: monitor `warnings` and Supabase quota; space out test calls.
- **PDF parsing differences** — Mitigation: test with provided `agents/temp/temp_resume.pdf` and inspect warnings for missing sections.
- **Time constraints for quality gates** — Mitigation: prioritize lint/build early, rerun after each major part.

# Validation Strategy
- After each risk-related step, record outcome in Part Logs and TRACKING Heartbeats.
- Document unmet assumptions explicitly in TRACKING under Decisions.
