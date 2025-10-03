# State & Data Management

**State management, forms, caching, and data flow patterns.**

---

## 1. State Types

- **Server State**: Database truth (fetched from API)
- **Client State**: UI-specific (selectedTool, previewZoom)
- **Form State**: User input (fields, errors, touched)

---

## 2. Zustand Store Pattern

```typescript
import create from 'zustand'
import { immer } from 'zustand/middleware/immer'

const useDocumentStore = create()(
  immer((set, get) => ({
    document: null,
    isDirty: false,
    
    updateField: (path, value) => set((state) => {
      _.set(state.document, path, value)
      state.isDirty = true
    }),
  }))
)
```

---

## 3. Undo/Redo with Zundo

```typescript
import { temporal } from 'zundo'

const useDocumentStore = create()(
  temporal(
    immer((set) => ({ /*...*/ })),
    {
      limit: 50,
      partialize: (state) => ({ document: state.document }),
    }
  )
)

// Usage
const undo = useDocumentStore.temporal.getState().undo
const redo = useDocumentStore.temporal.getState().redo
```

---

## 4. Form State Management

```typescript
const {
  values,
  errors,
  handleChange,
  handleBlur,
  isValid,
  isDirty
} = useForm(initialValues)
```

**Rules**:
- Validate on blur
- Clear errors on change
- Debounce autosave (2s)

---

## 5. Optimistic Updates

```typescript
// Update UI immediately
setProfile({ ...profile, ...updates })

try {
  const updated = await api.updateProfile(updates)
  setProfile(updated)
} catch (error) {
  setProfile(previous) // Rollback
  toast.error("Failed to update")
}
```

---

## 6. Caching Strategy

| Data Type | Cache? | Where | TTL |
|-----------|--------|-------|-----|
| Active edits | Yes | Memory | Session |
| AI responses | Yes | Memory | 5 min |
| User prefs | Yes | LocalStorage | Forever |
| Documents list | No | - | - |

**Rule**: Browser-only caching, no server-side.

---

**Next**: Design System (`04_design_system.md`)
