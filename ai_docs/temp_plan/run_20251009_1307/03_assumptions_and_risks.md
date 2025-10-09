# Assumptions & Risks

## Assumptions
- **Manual pagination remains acceptable** — Users manage page count via layout editor; no auto-splitting required.  
  _Validation:_ Confirm with product owner or check backlog before implementation; if auto-pagination is mandated, adjust plan.
- **`MM_TO_PX = 3.78` remains accurate enough** — Consistency across preview and PDF exporters already relies on this value.  
  _Validation:_ Compare rendered dimensions with PDF output after fixes; adjust conversion if discrepancy observed.
- **Regenerating `artboard` Tailwind bundle is safe** — Build tooling (`npm run artboard:css`) produces deterministic output without network needs.  
  _Validation:_ Execute command in sandbox; verify git diff only touches expected files.
- **Templates share common section components** — Page-break utilities can be applied centrally.  
  _Validation:_ Audit templates for custom layouts before applying shared styles; note outliers in tracking log.
- **Server exporter consumes same registry signature** — No additional layers expect `{ document }`.  
  _Validation:_ Trace call sites of `renderArtboardToHtml` to ensure no other wrappers depend on old props.

## Risks
- **Template regressions** — Enforcing `overflow:hidden` may clip content lacking proper spacing.  
  _Mitigation:_ Manual smoke for each flagship template; adjust template spacing where necessary.
- **Zoom interaction complexity** — Extending zoom logic could introduce jitter or performance degradation.  
  _Mitigation:_ Profile interactions, throttle state updates, or fallback to simpler zoom if issues surface.
- **Navigation scroll conflicts** — Smooth scrolling may interfere with iframe sizing or parent scroll.  
  _Mitigation:_ Test on various viewport sizes; consider scroll snapping or alternate focusing if issues occur.
- **Tailwind bundle drift** — Regeneration might inadvertently drop utilities if config diverged.  
  _Mitigation:_ Cross-compare generated CSS with previous version; keep command logs in tracking file.
- **Server renderer parity gaps** — Even after passing correct props, missing CSS variables could still affect exports.  
  _Mitigation:_ Run end-to-end PDF export tests and inspect artifacts; document follow-up tasks if additional styling fixes required.
