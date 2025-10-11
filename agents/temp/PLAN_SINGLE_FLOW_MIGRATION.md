# Single-Flow AI Generation Plan (Convenience Copy)

This is a copy of the root plan placed here for quick reference while testing with `agents/temp/temp_resume.pdf`.

Please see the canonical plan at `PLAN_SINGLE_FLOW_MIGRATION.md` in the repository root for full details, success criteria, file change list, and rollback steps.

Expect API responses to include a merged `warnings` array sourced from both generator normalization and server heuristics; review it when validating outputs.

## Quick Test Commands (API, PDF path pre-set)

1) PDF import via unified route (ensure dev server is running):

```bash
node -e "const fs=require('fs');console.log(JSON.stringify({docType:'resume',fileData:fs.readFileSync('agents/temp/temp_resume.pdf','base64'),mimeType:'application/pdf'}))" \
| curl -sS -X POST http://localhost:3000/api/v1/ai/unified \
    -H 'Content-Type: application/json' \
    -d @- | jq .
```

2) Text-only run:

```bash
curl -sS -X POST http://localhost:3000/api/v1/ai/unified \
  -H 'Content-Type: application/json' \
  -d '{
    "docType":"resume",
    "text":"Hiring Senior Frontend Engineer (React, TypeScript, Accessibility)",
    "personalInfo":{"name":"Alex Doe","email":"alex@example.com"}
  }' | jq .
```

3) Manual Node script adjustment

Edit `scripts/manual/test-resume.ts` and set:

```ts
const pdfPath = 'agents/temp/temp_resume.pdf';
```

Then run:

```bash
node --env-file=.env.local scripts/manual/test-resume.ts
```

For the complete rationale and step-by-step implementation, refer to the root plan.
