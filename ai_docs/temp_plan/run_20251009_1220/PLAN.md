# Artboard Styling Remediation Plan (Base)

## Goal
Restore Reactive-Resume template styling in the preview and exporter by aligning our Tailwind build and CSS variable contract with the source project.

## Pillars
1. Adopt the source artboard Tailwind configuration and regenerate the iframe bundle.
2. Update `buildArtboardStyles` to emit the CSS variable contract expected by the regenerated bundle, including HSL-compatible values.
3. Ensure metadata mapping supplies the values required by the contract.
4. Align template registry typing with actual props.
5. Document the regeneration workflow.

## Constraints
- Offline-friendly tooling; Tailwind build must run locally without network font fetches.
- Keep existing template React components unchanged where possible.
- Preview iframe and PDF exporter share the same CSS contract.

## Milestones
- Tailwind config aligned and bundle regenerated.
- CSS variable injection updated with conversion helpers.
- Preview + PDF smoke tests demonstrate restored styling.
- Docs updated with build instructions.

