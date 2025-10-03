# Architecture Principles

**Core architectural rules governing ResumePair.**

---

## 1. Schema-Driven Architecture

**Rule**: Data schema drives ALL system behavior.

- Single JSON schema powers everything: editor → templates → AI → exports
- `ResumeJson` and `CoverLetterJson` are canonical
- Templates NEVER modify schema - they ONLY read it

---

## 2. Layered Architecture

```
Presentation (Components) → User interaction, UI logic
Application (Business Logic) → Use cases, workflows  
Domain (Core Models) → Business rules, validation
Infrastructure (External) → Database, AI, Storage
```

**Rule**: Dependencies point downward only.

---

## 3. Dependency Injection

**Rule**: Always pass dependencies explicitly.

```typescript
// ✅ CORRECT
export async function getDocument(
  supabase: SupabaseClient,
  documentId: string,
  userId: string
): Promise<Document> { }
```

---

## 4. Repository Pattern

- Pure functions only (no classes)
- Dependency injection (client passed as parameter)
- Server-only (never in client components)
- RLS enforcement (always filter by user_id)

---

## 5. Unidirectional Data Flow

```
User Action → State Update → UI Re-render
     ↑              ↓              ↓
     ←──── Side Effects ←── New State
```

---

## 6. Type Safety

**Rule**: Make invalid states unrepresentable.

```typescript
// ✅ CORRECT: Type-safe state machine
type EditorState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; document: Document }
  | { status: 'error'; error: Error }
```

---

## Key Takeaways

1. **Schema drives everything**
2. **Layers enforce boundaries**
3. **Dependencies are explicit**
4. **Data flows one direction**
5. **Repositories are pure**
6. **Types prevent bugs**

---

**See**: `/ai_docs/project/02_schemas.md` for schema details.
