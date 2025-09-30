# 3) Database Schema & Data Model

**Goal:** A small, decoupled, **JSONB‑first** model that is easy to evolve and version, with strict RLS, soft deletes, optimistic concurrency, and minimal indexes that keep queries snappy without complexity.

> **Key decisions**
>
> * **Document store** (JSONB) for résumé/cover‑letter content with a thin relational shell (owner, title, versions).
> * **Version history** table for durability & “undo” beyond client‑side zundo.
> * **Score** stored inline (latest) + optional history (phase 2).
> * **Templates** live in code (React components). No template DB in v1.
> * **Media** goes to Supabase Storage with path‑based ownership (per‑user folder prefix).
> * **Search**: simple `ILIKE` on `title` now; optional `pg_trgm` index.
> * **Optimistic concurrency** using `version` in update queries (no heavyweight locks).

---

## 3.1 Entity Overview

| Entity                 | Purpose                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| **profiles**           | User profile & defaults (locale, page size, etc.). Mirrors Supabase `auth.users` via trigger. |
| **documents**          | Canonical store for résumés & cover letters (JSONB). Soft delete via `deleted_at`.            |
| **document_versions**  | Immutable history: snapshot of JSONB per version (for audit & restore).                       |
| **scores** *(phase 2)* | Optional score history; latest score stays in `documents.score`.                              |
| **storage.objects**    | Supabase Storage table; RLS policies enforce per‑user folders for `media`.                    |

> All user‑owned rows are protected with **RLS**. Only the owner (`auth.uid()`) can read/write their rows. Supabase RLS requires **SELECT** policies even when you intend to only update, otherwise updates won’t work. ([Supabase][1])

---

## 3.2 Migrations Plan (file‑only until you approve)

```
migrations/
├── phase1/
│   ├── 001_enable_extensions.sql
│   ├── 002_profiles.sql
│   ├── 003_documents.sql
│   ├── 004_document_versions.sql
│   ├── 005_rls_policies_profiles.sql
│   ├── 006_rls_policies_documents.sql
│   ├── 007_storage_buckets_and_policies.sql
│   └── 008_indexes.sql
└── phase2/
    ├── 009_scores_history.sql        # optional
    └── 010_more_indexes.sql          # optional tuning (e.g., pg_trgm)
```

> **Never** apply migrations automatically during development; we will wait for explicit approval to run them (per your rules).

---

## 3.3 SQL — Phase 1 (Core)

### 001_enable_extensions.sql

```sql
-- UUIDs and helper crypto
create extension if not exists "pgcrypto";

-- Optional: trigram index for fuzzy title search (phase 1 or phase 2)
create extension if not exists "pg_trgm";
```

### 002_profiles.sql

```sql
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  locale      text not null default 'en-US',
  date_format text not null default 'US',      -- US | ISO | EU
  page_size   text not null default 'Letter',  -- A4 | Letter
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_at trigger
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists set_updated_at_on_profiles on public.profiles;
create trigger set_updated_at_on_profiles
before update on public.profiles
for each row execute procedure public.tg_set_updated_at();

-- Create profile on new user (optional quality of life)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
```

### 003_documents.sql

```sql
-- document types (or use plain text + CHECK)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'doc_type') then
    create type public.doc_type as enum ('resume', 'cover-letter');
  end if;
end $$;

create table if not exists public.documents (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users(id) on delete cascade,
  type           public.doc_type not null,
  title          text not null,
  slug           text, -- optional, unique per owner if used
  version        integer not null default 1,               -- optimistic concurrency
  schema_version text not null,                            -- e.g., 'resume.v1'
  data           jsonb not null check (jsonb_typeof(data) = 'object'),
  score          jsonb,                                    -- latest composite score
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

-- Soft-delete is a flag; RLS filters it out from normal list queries on our side.

-- updated_at trigger
drop trigger if exists set_updated_at_on_documents on public.documents;
create trigger set_updated_at_on_documents
before update on public.documents
for each row execute procedure public.tg_set_updated_at();

-- Optional: ensure (owner_id, slug) uniqueness if slug is used
create unique index if not exists documents_owner_slug_unique
  on public.documents(owner_id, slug) where slug is not null;
```

### 004_document_versions.sql

```sql
create table if not exists public.document_versions (
  id           bigserial primary key,
  document_id  uuid not null references public.documents(id) on delete cascade,
  version      integer not null,
  data         jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at   timestamptz not null default now(),
  unique (document_id, version)
);
```

### 005_rls_policies_profiles.sql

```sql
alter table public.profiles enable row level security;

-- A user can select, insert (for themselves), and update only their own row.
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());
```

### 006_rls_policies_documents.sql

```sql
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;

-- List/read own documents (exclude soft-deleted in app query).
create policy "documents_select_own"
  on public.documents for select
  using (owner_id = auth.uid());

-- Create documents for yourself
create policy "documents_insert_own"
  on public.documents for insert
  with check (owner_id = auth.uid());

-- Update only your own docs
create policy "documents_update_own"
  on public.documents for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Soft-delete (delete policy optional; we use UPDATE to set deleted_at)
-- If you want hard delete:
create policy "documents_delete_own"
  on public.documents for delete
  using (owner_id = auth.uid());

-- Version history: read & write only your own
create policy "doc_versions_select_own"
  on public.document_versions for select
  using (
    exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid())
  );

create policy "doc_versions_insert_own"
  on public.document_versions for insert
  with check (
    exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid())
  );
```

### 007_storage_buckets_and_policies.sql

```sql
-- Buckets (private by default)
select storage.create_bucket('media', public := false);

-- RLS: path-based ownership: all object names must start with '<user_id>/...'
-- storage.objects has: bucket_id, name, owner, etc.

-- READ own files
create policy "storage_read_own"
  on storage.objects for select
  using (
    bucket_id in ('media')
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- INSERT: only to your own folder
create policy "storage_insert_own"
  on storage.objects for insert
  with check (
    bucket_id in ('media')
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- UPDATE own files
create policy "storage_update_own"
  on storage.objects for update
  using (
    bucket_id in ('media')
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id in ('media')
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- DELETE own files
create policy "storage_delete_own"
  on storage.objects for delete
  using (
    bucket_id in ('media')
    and split_part(name, '/', 1) = auth.uid()::text
  );
```

> Storage RLS is configured via policies on `storage.objects`. Private buckets + path‑prefix policy (first path segment = `auth.uid()`) give each user a silo without extra tables. ([Supabase][2])

### 008_indexes.sql

```sql
-- Common filters
create index if not exists documents_owner_idx on public.documents(owner_id);
create index if not exists documents_type_updated_idx on public.documents(type, updated_at desc);
create index if not exists documents_not_deleted_idx on public.documents(owner_id) where deleted_at is null;

-- Optional: faster title search (ILIKE) when using pg_trgm
create index if not exists documents_title_trgm on public.documents using gin (title gin_trgm_ops);
```

---

## 3.4 Optional Phase 2 (Score history)

### 009_scores_history.sql

```sql
create table if not exists public.scores (
  id              bigserial primary key,
  document_id     uuid not null references public.documents(id) on delete cascade,
  overall         int not null check (overall between 0 and 100),
  ats_readiness   int not null check (ats_readiness between 0 and 100),
  keyword_match   int not null check (keyword_match between 0 and 100),
  content_strength int not null check (content_strength between 0 and 100),
  format_quality  int not null check (format_quality between 0 and 100),
  completeness    int not null check (completeness between 0 and 100),
  suggestions     jsonb,
  created_at      timestamptz not null default now()
);

alter table public.scores enable row level security;

create policy "scores_select_own"
  on public.scores for select
  using (
    exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid())
  );

create policy "scores_insert_own"
  on public.scores for insert
  with check (
    exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid())
  );
```

---

## 3.5 Access Patterns & Concurrency

* **Optimistic concurrency:** Repositories update with `WHERE id = $1 AND version = $current`, then set `version = version + 1`. If `rowCount = 0`, return **409 Conflict** and the client reloads newest copy.

  ```sql
  update public.documents
     set title = $2,
         data = $3,
         version = version + 1,
         updated_at = now()
   where id = $1 and version = $4
  returning *;
  ```
* **Version snapshots:** On each successful update, repositories also insert into `document_versions(document_id, version, data)` with the **previous** version/data.
* **Search:** `ILIKE` on `title` with optional `pg_trgm` index. Keep it simple.

---

## 3.6 Data Validation (Runtime)

* All inbound document payloads are validated in API layer using **Zod** schemas (`ResumeJson`, `CoverLetterJson`).
* DB constraints ensure `data` is a JSON object and types are valid where possible, but schema enforcement lives in code to keep migrations light.

---

## 3.7 Security & Privacy

* RLS everywhere; **no cross‑tenant access**.
* Storage is private; signed URLs issued by server routes.
* No PII in logs.
* No email integrations.
* Google OAuth only (Supabase Auth).

---

## 3.8 What we **don’t** model (v1)

* **Templates** in DB (kept in code for stability and speed).
* **Share/collaboration** tables.
* **Job applications/ATS pipelines**.
* **Analytics** (per your fixed decisions).

---
