# Assumptions & Risks

## Assumptions
1. Tailwind CLI (or equivalent script) can be invoked locally to regenerate the artboard bundle without external network dependencies. *Validation:* Inspect `package.json` scripts; run dry Tailwind build to confirm.
2. Reactive-Resume artboard CSS variables fully cover template needs; no hidden runtime mutations. *Validation:* Compare variable usage in template files vs emitted CSS; adjust if gaps surface.
3. Existing metadata mapping supplies sufficient data to compute new variables (margin, typography). *Validation:* Review typical `ResumeJson` samples; add defaults if fields are absent.

## Risks & Mitigations
- **Risk:** Regenerated CSS inflates bundle size significantly. *Mitigation:* Measure bundle diff; prune unused plugins/utilities if necessary while keeping required classes.
- **Risk:** Color conversion introduces inaccuracies (e.g., rounding). *Mitigation:* Write deterministic converter with tests or manual verification against reference HSL values; clamp outputs.
- **Risk:** PDF exporter caches old CSS. *Mitigation:* Ensure server render path references updated bundle/hash or inline styles; purge caches during deployment.
- **Risk:** Offline fonts still block build. *Mitigation:* If Tailwind build fetches fonts, replace with local font definitions or skip unnecessary imports.
