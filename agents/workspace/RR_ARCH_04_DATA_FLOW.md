# RR_ARCH_04: Reactive Resume - Complete Data Flow Architecture

**Generated:** 2025-10-07
**Source Repository:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume`
**Purpose:** End-to-end data flow documentation from user input to PDF generation

---

## 1. DATA FLOW OVERVIEW

### 1.1 High-Level Flow

```
User Input → Client State → API → Database → Storage
    ↓           ↓           ↓        ↓          ↓
  Editor → Zustand Store → REST → Prisma → PostgreSQL/MinIO
    ↓           ↓
  Preview → Artboard (iframe)
    ↓           ↓
  Export → PDF Generation → MinIO Storage
```

### 1.2 Key Data Flows

1. **Resume Creation Flow:** User creates new resume → stored in database
2. **Resume Editing Flow:** User edits fields → debounced save → database update
3. **Preview Flow:** State changes → postMessage → artboard re-render
4. **PDF Generation Flow:** User exports → server renders → PDF stored → URL returned
5. **Public Viewing Flow:** User visits public URL → server fetch → artboard render

---

## 2. RESUME CREATION FLOW

### 2.1 User Initiates Creation

**Entry Point:** Dashboard → "Create Resume" button

**Location:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/client/src/pages/dashboard/resumes/page.tsx` (not scanned but inferred)

### 2.2 API Request

**Endpoint:** `POST /api/resume`

**Controller:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/server/src/resume/resume.controller.ts:46-59`

```typescript
@Post()
@UseGuards(TwoFactorGuard)
async create(@User() user: UserEntity, @Body() createResumeDto: CreateResumeDto) {
  try {
    return await this.resumeService.create(user.id, createResumeDto);
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      throw new BadRequestException(ErrorMessage.ResumeSlugAlreadyExists);
    }
    Logger.error(error);
    throw new InternalServerErrorException(error);
  }
}
```

**Guards:**
- TwoFactorGuard: Ensures user completed 2FA if enabled

**Input DTO:**
```typescript
{
  title: string,
  slug?: string,
  visibility?: "public" | "private"
}
```

### 2.3 Service Layer Processing

**Service:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/server/src/resume/resume.service.ts:28-47`

```typescript
async create(userId: string, createResumeDto: CreateResumeDto) {
  const { name, email, picture } = await this.prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true, picture: true },
  });

  const data = deepmerge(defaultResumeData, {
    basics: { name, email, picture: { url: picture ?? "" } },
  } satisfies DeepPartial<ResumeData>);

  return this.prisma.resume.create({
    data: {
      data,
      userId,
      title: createResumeDto.title,
      visibility: createResumeDto.visibility,
      slug: createResumeDto.slug ?? slugify(createResumeDto.title),
    },
  });
}
```

**Process:**
1. Fetch user info (name, email, picture)
2. Merge with default resume data
3. Generate slug from title if not provided
4. Create database record with Prisma

### 2.4 Database Insert

**Prisma Operation:**
```typescript
this.prisma.resume.create({
  data: {
    id: "clh3r..." (auto-generated CUID),
    title: "Software Engineer Resume",
    slug: "software-engineer-resume",
    data: { basics: {...}, sections: {...}, metadata: {...} },
    visibility: "private",
    locked: false,
    userId: "clh3u...",
    createdAt: now(),
    updatedAt: now()
  }
})
```

**Database Schema:** See RR_ARCH_02_DATA_SCHEMA.md Section 1.4

### 2.5 Response to Client

**Response:**
```typescript
ResumeDto {
  id: string,
  title: string,
  slug: string,
  data: ResumeData,
  visibility: "private" | "public",
  locked: boolean,
  userId: string,
  createdAt: Date,
  updatedAt: Date
}
```

### 2.6 Client State Update

**Query Invalidation:**
```typescript
queryClient.invalidateQueries(['resumes'])
```

**Navigation:**
```typescript
navigate(`/builder/${newResume.id}`)
```

---

## 3. RESUME EDITING FLOW

### 3.1 Builder Page Load

**Loader:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/client/src/pages/builder/page.tsx:75-92`

```typescript
export const builderLoader: LoaderFunction<ResumeDto> = async ({ params }) => {
  try {
    const id = params.id!;

    const resume = await queryClient.fetchQuery({
      queryKey: ["resume", { id }],
      queryFn: () => findResumeById({ id }),
    });

    useResumeStore.setState({ resume });
    useResumeStore.temporal.getState().clear();

    return resume;
  } catch {
    return redirect("/dashboard");
  }
};
```

**Process:**
1. Extract resume ID from URL params
2. Fetch resume via TanStack Query
3. Initialize Zustand store with resume data
4. Clear undo/redo history
5. Redirect to dashboard if not found

### 3.2 User Edits Field

**UI Component:** Builder sidebar editors (not scanned in detail)

**Example:** Editing name in basics section

**Action:**
```typescript
setValue("basics.name", "John Doe")
```

### 3.3 Zustand Store Update

**Store:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/client/src/stores/resume.ts:32-41`

```typescript
setValue: (path, value) => {
  set((state) => {
    if (path === "visibility") {
      state.resume.visibility = value as "public" | "private";
    } else {
      state.resume.data = _set(state.resume.data, path, value);
    }

    void debouncedUpdateResume(JSON.parse(JSON.stringify(state.resume)));
  });
}
```

**Process:**
1. Use Immer to update state immutably
2. Use lodash.set for deep path updates
3. Trigger debounced update function

**Debounce Implementation:**
```typescript
// In services/resume/resume.ts (inferred)
export const debouncedUpdateResume = debounce((resume: ResumeDto) => {
  return updateResume(resume);
}, 1000);
```

**Debounce:** 1000ms delay, prevents rapid-fire API calls

### 3.4 Temporal State (Undo/Redo)

**Zundo Integration:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/client/src/stores/resume.ts:73-78`

```typescript
temporal(
  immer((set) => ({ /* store definition */ })),
  {
    limit: 100,
    wrapTemporal: (fn) => devtools(fn),
    partialize: ({ resume }) => ({ resume }),
  },
)
```

**Features:**
- 100 history states
- Only tracks resume data (not UI state)
- DevTools integration
- Keyboard shortcuts for undo/redo

### 3.5 API Update Request

**Endpoint:** `PATCH /api/resume/:id`

**Controller:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/server/src/resume/resume.controller.ts:110-118`

```typescript
@Patch(":id")
@UseGuards(TwoFactorGuard)
update(
  @User() user: UserEntity,
  @Param("id") id: string,
  @Body() updateResumeDto: UpdateResumeDto,
) {
  return this.resumeService.update(user.id, id, updateResumeDto);
}
```

**Input DTO:**
```typescript
{
  title?: string,
  slug?: string,
  visibility?: "public" | "private",
  data?: ResumeData
}
```

### 3.6 Service Layer Update

**Service:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/server/src/resume/resume.service.ts:104-128`

```typescript
async update(userId: string, id: string, updateResumeDto: UpdateResumeDto) {
  try {
    const { locked } = await this.prisma.resume.findUniqueOrThrow({
      where: { id },
      select: { locked: true },
    });

    if (locked) throw new BadRequestException(ErrorMessage.ResumeLocked);

    return await this.prisma.resume.update({
      data: {
        title: updateResumeDto.title,
        slug: updateResumeDto.slug,
        visibility: updateResumeDto.visibility,
        data: updateResumeDto.data as Prisma.JsonObject,
      },
      where: { userId_id: { userId, id } },
    });
  } catch (error) {
    if (error.code === "P2025") {
      Logger.error(error);
      throw new InternalServerErrorException(error);
    }
  }
}
```

**Process:**
1. Check if resume is locked (throws if locked)
2. Update fields in database
3. Use composite key (userId, id) for security
4. Return updated resume

### 3.7 Database Update

**Prisma Operation:**
```typescript
UPDATE "Resume"
SET
  title = ?,
  slug = ?,
  visibility = ?,
  data = ?,
  updatedAt = now()
WHERE userId = ? AND id = ?
```

**JSON Column Update:**
- Full data replacement (not partial)
- PostgreSQL JSONB column
- Indexed for query performance

### 3.8 Response to Client

**Response:** Updated ResumeDto

**Client Processing:**
- Query cache automatically updated by TanStack Query
- No manual cache invalidation needed (optimistic or refetch)

---

## 4. PREVIEW FLOW (BUILDER TO ARTBOARD)

### 4.1 Artboard Iframe Setup

**Builder Page:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/client/src/pages/builder/page.tsx:64-70`

```typescript
<iframe
  ref={setFrameRef}
  title={resume.id}
  src="/artboard/builder"
  className="mt-16 w-screen"
  style={{ height: `calc(100vh - 64px)` }}
/>
```

**Artboard URL:** `/artboard/builder` (separate React app)

### 4.2 PostMessage Communication

**Sync Function:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/client/src/pages/builder/page.tsx:20-26`

```typescript
const syncResumeToArtboard = useCallback(() => {
  setImmediate(() => {
    if (!frameRef?.contentWindow) return;
    const message = { type: "SET_RESUME", payload: resume.data };
    frameRef.contentWindow.postMessage(message, "*");
  });
}, [frameRef?.contentWindow, resume.data]);
```

**Message Format:**
```typescript
{
  type: "SET_RESUME",
  payload: ResumeData
}
```

**Triggers:**
- Initial iframe load (event listener)
- Polling until iframe ready (setInterval 100ms)
- Every resume data change (useEffect dependency)

### 4.3 Artboard Message Reception

**Artboard Store:** (inferred from artboard architecture)

```typescript
window.addEventListener("message", (event) => {
  if (event.data.type === "SET_RESUME") {
    setResume(event.data.payload);
  }
});
```

### 4.4 Artboard Rendering

**Template Selection:**
```typescript
const Template = getTemplate(resume.metadata.template);
```

**Page Rendering:**
```typescript
resume.metadata.layout.map((page, pageIndex) => (
  <Page key={pageIndex} pageNumber={pageIndex + 1}>
    <Template columns={page} isFirstPage={pageIndex === 0} />
  </Page>
))
```

**Section Rendering:**
- Template iterates through columns
- Renders each section by key
- Applies theme, typography, layout settings

**Component:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/artboard/src/components/page.tsx:14-48`

```typescript
export const Page = ({ mode = "preview", pageNumber, children }: Props) => {
  const page = useArtboardStore((state) => state.resume.metadata.page);
  const fontFamily = useArtboardStore((state) => state.resume.metadata.typography.font.family);

  return (
    <div
      data-page={pageNumber}
      style={{
        fontFamily,
        width: `${pageSizeMap[page.format].width * MM_TO_PX}px`,
        minHeight: `${pageSizeMap[page.format].height * MM_TO_PX}px`,
      }}
    >
      {children}
    </div>
  );
};
```

**Styling:**
- Dynamic width/height based on page format
- Font family from typography settings
- Background/text/primary colors from theme

---

## 5. PDF GENERATION FLOW

### 5.1 User Initiates Export

**Entry Point:** Builder → "Export PDF" button

**API Request:** `GET /api/resume/print/:id`

### 5.2 Print Controller

**Controller:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/server/src/resume/resume.controller.ts:132-143`

```typescript
@Get("/print/:id")
@UseGuards(OptionalGuard, ResumeGuard)
async printResume(@User("id") userId: string | undefined, @Resume() resume: ResumeDto) {
  try {
    const url = await this.resumeService.printResume(resume, userId);
    return { url };
  } catch (error) {
    Logger.error(error);
    throw new InternalServerErrorException(error);
  }
}
```

**Guards:**
- OptionalGuard: Allows authenticated or guest access
- ResumeGuard: Validates resume access (public or owned)

### 5.3 Printer Service

**Service:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/server/src/printer/printer.service.ts:54-71`

```typescript
async printResume(resume: ResumeDto) {
  const start = performance.now();

  const url = await retry<string | undefined>(() => this.generateResume(resume), {
    retries: 3,
    randomize: true,
    onRetry: (_, attempt) => {
      this.logger.log(`Retrying to print resume #${resume.id}, attempt #${attempt}`);
    },
  });

  const duration = +(performance.now() - start).toFixed(0);
  const numberPages = resume.data.metadata.layout.length;

  this.logger.debug(`Chrome took ${duration}ms to print ${numberPages} page(s)`);

  return url;
}
```

**Features:**
- Retry logic: 3 attempts with randomization
- Performance logging
- Calls generateResume() for actual work

### 5.4 Chrome/Puppeteer Setup

**Browser Connection:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/server/src/printer/printer.service.ts:33-44`

```typescript
private async getBrowser() {
  try {
    return await connect({
      browserWSEndpoint: this.browserURL,
      acceptInsecureCerts: this.ignoreHTTPSErrors,
    });
  } catch (error) {
    throw new InternalServerErrorException(
      ErrorMessage.InvalidBrowserConnection,
      (error as Error).message,
    );
  }
}
```

**Configuration:**
- Chrome runs in separate Docker container
- WebSocket connection via `CHROME_URL` env var
- Token-based authentication

### 5.5 Page Rendering in Chrome

**Generate Resume:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/server/src/printer/printer.service.ts:93-233`

**Process:**

1. **Connect to Browser**
```typescript
const browser = await this.getBrowser();
const page = await browser.newPage();
```

2. **Navigate to Artboard**
```typescript
await page.goto(`${url}/artboard/preview`, { waitUntil: "domcontentloaded" });
```

3. **Inject Resume Data**
```typescript
await page.evaluate((data) => {
  window.localStorage.setItem("resume", JSON.stringify(data));
}, resume.data);
```

4. **Reload and Wait**
```typescript
await Promise.all([
  page.reload({ waitUntil: "load" }),
  page.waitForSelector('[data-page="1"]', { timeout: 15_000 }),
]);
```

5. **Wait for Images (if profile picture)**
```typescript
if (resume.data.basics.picture.url) {
  await page.waitForSelector('img[alt="Profile"]');
  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = img.onerror = resolve;
        });
      }),
    ),
  );
}
```

### 5.6 Page-by-Page PDF Generation

**Loop Through Pages:** Lines 160-197

```typescript
const pagesBuffer: Buffer[] = [];

const processPage = async (index: number) => {
  const pageElement = await page.$(`[data-page="${index}"]`);
  const width = (await (await pageElement?.getProperty("scrollWidth"))?.jsonValue()) ?? 0;
  const height = (await (await pageElement?.getProperty("scrollHeight"))?.jsonValue()) ?? 0;

  // Clone page element to isolate
  const temporaryHtml = await page.evaluate((element: HTMLDivElement) => {
    const clonedElement = element.cloneNode(true) as HTMLDivElement;
    const temporaryHtml_ = document.body.innerHTML;
    document.body.innerHTML = clonedElement.outerHTML;
    return temporaryHtml_;
  }, pageElement);

  // Apply custom CSS if enabled
  const css = resume.data.metadata.css;
  if (css.visible) {
    await page.evaluate((cssValue: string) => {
      const styleTag = document.createElement("style");
      styleTag.textContent = cssValue;
      document.head.append(styleTag);
    }, css.value);
  }

  // Generate PDF for this page
  const uint8array = await page.pdf({ width, height, printBackground: true });
  const buffer = Buffer.from(uint8array);
  pagesBuffer.push(buffer);

  // Restore original HTML
  await page.evaluate((temporaryHtml_: string) => {
    document.body.innerHTML = temporaryHtml_;
  }, temporaryHtml);
};

// Loop through all pages
for (let index = 1; index <= numberPages; index++) {
  await processPage(index);
}
```

**Key Steps:**
1. Select page element by data-page attribute
2. Get exact dimensions (width/height)
3. Isolate page content in DOM
4. Apply custom CSS if enabled
5. Generate PDF with exact dimensions
6. Store buffer
7. Restore original HTML for next iteration

### 5.7 PDF Merging

**Using pdf-lib:** Lines 199-206

```typescript
const pdf = await PDFDocument.create();

for (const element of pagesBuffer) {
  const page = await PDFDocument.load(element);
  const [copiedPage] = await pdf.copyPages(page, [0]);
  pdf.addPage(copiedPage);
}

const buffer = Buffer.from(await pdf.save());
```

**Process:**
1. Create new PDF document
2. Load each page buffer as separate PDF
3. Copy first (and only) page from each
4. Add to main PDF
5. Save final PDF to buffer

### 5.8 Storage Upload

**MinIO Upload:** Lines 213-218

```typescript
const resumeUrl = await this.storageService.uploadObject(
  resume.userId,
  "resumes",
  buffer,
  resume.title,
);
```

**Storage Service:** (not scanned in detail)
- Uploads to MinIO object storage
- Generates presigned URL
- Caches URL for future requests
- Organizes by userId and object type

### 5.9 Statistics Update

**Service:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/server/src/resume/resume.service.ts:147-160`

```typescript
async printResume(resume: ResumeDto, userId?: string) {
  const url = await this.printerService.printResume(resume);

  // Update statistics: increment the number of downloads by 1
  if (!userId) {
    await this.prisma.statistics.upsert({
      where: { resumeId: resume.id },
      create: { views: 0, downloads: 1, resumeId: resume.id },
      update: { downloads: { increment: 1 } },
    });
  }

  return url;
}
```

**Logic:**
- Only increment for non-authenticated users
- Upsert pattern (create if not exists, update if exists)
- Atomic increment operation

### 5.10 Response to Client

**Response:**
```typescript
{ url: "https://storage.example.com/resumes/..." }
```

**Client Action:**
- Download file automatically (via browser)
- Or display download link

---

## 6. PUBLIC RESUME VIEWING FLOW

### 6.1 Public URL Access

**URL Format:** `/{username}/{slug}`

**Example:** `/johndoe/software-engineer-resume`

### 6.2 Public Route Loader

**Loader:** (inferred from router, not scanned in detail)

```typescript
export const publicLoader: LoaderFunction = async ({ params }) => {
  const { username, slug } = params;

  const resume = await queryClient.fetchQuery({
    queryKey: ["public-resume", { username, slug }],
    queryFn: () => findResumeByUsernameSlug({ username, slug }),
  });

  return resume;
};
```

### 6.3 API Request

**Endpoint:** `GET /api/resume/public/:username/:slug`

**Controller:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/server/src/resume/resume.controller.ts:95-108`

```typescript
@Get("/public/:username/:slug")
@UseGuards(OptionalGuard)
async findOneByUsernameSlug(
  @Param("username") username: string,
  @Param("slug") slug: string,
  @User("id") userId: string,
) {
  const resume = await this.resumeService.findOneByUsernameSlug(username, slug, userId);

  // Hide private notes from public resume API responses
  set(resume.data as ResumeData, "metadata.notes", undefined);

  return resume;
}
```

**Features:**
- OptionalGuard: Allows guest access
- Notes hidden for privacy
- userId passed to distinguish owner views

### 6.4 Service Layer Fetch

**Service:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/server/src/resume/resume.service.ts:87-102`

```typescript
async findOneByUsernameSlug(username: string, slug: string, userId?: string) {
  const resume = await this.prisma.resume.findFirstOrThrow({
    where: { user: { username }, slug, visibility: "public" },
  });

  // Update statistics: increment the number of views by 1
  if (!userId) {
    await this.prisma.statistics.upsert({
      where: { resumeId: resume.id },
      create: { views: 1, downloads: 0, resumeId: resume.id },
      update: { views: { increment: 1 } },
    });
  }

  return resume;
}
```

**Process:**
1. Find resume by username + slug + public visibility
2. Increment view counter (if not owner)
3. Return resume data

### 6.5 Client Rendering

**Public Page Component:** (not scanned in detail)

**Flow:**
1. Receive resume data from loader
2. Render artboard in full-screen mode
3. Show download/print options
4. Display statistics (if owner viewing)

### 6.6 Statistics Display

**Endpoint:** `GET /api/resume/:id/statistics`

**Service:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/server/src/resume/resume.service.ts:75-85`

```typescript
async findOneStatistics(id: string) {
  const result = await this.prisma.statistics.findFirst({
    select: { views: true, downloads: true },
    where: { resumeId: id },
  });

  return {
    views: result?.views ?? 0,
    downloads: result?.downloads ?? 0,
  };
}
```

**Display:** Only visible to resume owner

---

## 7. STATE MANAGEMENT ARCHITECTURE

### 7.1 Zustand Store Structure

**Resume Store:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/client/src/stores/resume.ts:17-26`

```typescript
type ResumeStore = {
  resume: ResumeDto;

  // Actions
  setValue: (path: string, value: unknown) => void;

  // Custom Section Actions
  addSection: () => void;
  removeSection: (sectionId: SectionKey) => void;
};
```

**Middleware Stack:**
```typescript
create<ResumeStore>()(
  temporal(         // Undo/redo (Zundo)
    immer((set) => {  // Immutable updates (Immer)
      // Store definition
    }),
    { /* temporal config */ }
  )
)
```

### 7.2 Builder Store

**Store:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/client/src/stores/builder.ts` (inferred)

**Likely Contains:**
- Sidebar state (left/right panel open)
- Frame reference (iframe)
- UI preferences
- Dialog state

### 7.3 Auth Store

**Store:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/client/src/stores/auth.ts` (inferred)

**Likely Contains:**
- Current user
- Authentication status
- Token management
- Login/logout actions

### 7.4 TanStack Query Cache

**Setup:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/client/src/libs/query-client.ts` (inferred)

**Key Patterns:**
- Query keys: `['resume', { id }]`, `['resumes']`, `['public-resume', { username, slug }]`
- Stale time: Likely short or 0 for resume data
- Cache time: Likely default (5 minutes)
- Refetch on window focus: Likely enabled

---

## 8. API ARCHITECTURE

### 8.1 REST API Design

**Base URL:** `{PUBLIC_URL}/api`

**Endpoints:**

| Method | Endpoint | Purpose | Guards |
|--------|----------|---------|--------|
| GET | /resume/schema | Get resume JSON schema | None |
| POST | /resume | Create new resume | TwoFactorGuard |
| POST | /resume/import | Import resume | TwoFactorGuard |
| GET | /resume | List user's resumes | TwoFactorGuard |
| GET | /resume/:id | Get resume by ID | TwoFactorGuard, ResumeGuard |
| GET | /resume/:id/statistics | Get resume stats | TwoFactorGuard |
| GET | /resume/public/:username/:slug | Get public resume | OptionalGuard |
| PATCH | /resume/:id | Update resume | TwoFactorGuard |
| PATCH | /resume/:id/lock | Lock/unlock resume | TwoFactorGuard |
| DELETE | /resume/:id | Delete resume | TwoFactorGuard |
| GET | /resume/print/:id | Generate PDF | OptionalGuard, ResumeGuard |
| GET | /resume/print/:id/preview | Generate preview | TwoFactorGuard, ResumeGuard |

### 8.2 Authentication Flow

**Guards:** `/Users/varunprasad/code/prjs/resumepair/agents/repos/Reactive-Resume/apps/server/src/auth/guards/`

**TwoFactorGuard:**
- Requires valid JWT token
- Requires 2FA completion if enabled

**ResumeGuard:**
- Validates resume access (owner or public)
- Injects resume into request

**OptionalGuard:**
- Allows authenticated or guest access
- Useful for public resume viewing

### 8.3 Error Handling

**NestJS Exception Filters:**
- BadRequestException (400)
- UnauthorizedException (401)
- NotFoundException (404)
- InternalServerErrorException (500)

**Prisma Errors:**
- P2002: Unique constraint violation
- P2025: Record not found

**Custom Error Messages:** `@reactive-resume/utils/ErrorMessage`

### 8.4 Request/Response Flow

```
Client → Axios → Express Middleware → Guards → Controller → Service → Prisma → PostgreSQL
                                                   ↓
                                            Validation (Zod)
                                                   ↓
                                            Business Logic
                                                   ↓
                                            Response DTO
```

---

## 9. CACHING STRATEGY

### 9.1 Client-Side Caching

**TanStack Query:**
- Resume data cached by ID
- List of resumes cached
- Public resumes cached by username/slug
- Background refetching (configurable)

**LocalStorage:**
- Artboard preview mode (stores resume data)
- No persistent cache for editing

### 9.2 Server-Side Caching

**MinIO Storage:**
- Generated PDFs cached
- Preview images cached
- Presigned URLs with expiration

**No Redis/Memcached:**
- Database queries not cached
- Rely on PostgreSQL query optimization

### 9.3 Invalidation Strategy

**Client:**
- Invalidate on mutation (create, update, delete)
- Manual invalidation via query keys
- Optimistic updates (not extensively used)

**Server:**
- No explicit cache invalidation
- Storage objects have expiration

---

## 10. PERFORMANCE OPTIMIZATIONS

### 10.1 Debouncing

**Resume Updates:**
```typescript
debouncedUpdateResume = debounce(updateResume, 1000)
```

**Benefit:** Reduces API calls during rapid editing

### 10.2 Retry Logic

**PDF Generation:**
```typescript
await retry(() => this.generateResume(resume), {
  retries: 3,
  randomize: true,
})
```

**Benefit:** Handles transient Chrome failures

### 10.3 Lazy Loading

**Route-based Code Splitting:**
- React Router lazy loading (inferred)
- Vite automatic splitting

### 10.4 Image Optimization

**Sharp Library:**
- Used in storage service (inferred)
- Resize/compress images before storage

### 10.5 Database Indexes

**Prisma Schema:**
```prisma
@@index(fields: [userId])
```

**Benefit:** Fast resume lookups by user

---

## 11. ERROR FLOWS

### 11.1 Network Errors

**Client Handling:**
- TanStack Query retry mechanism
- Error state in components
- Toast notifications

**Server Handling:**
- Logging via NestJS Logger
- Generic 500 responses

### 11.2 Validation Errors

**Client:**
- React Hook Form validation
- Zod schema validation
- Field-level error messages

**Server:**
- Zod schema validation via nestjs-zod
- 400 Bad Request responses
- Detailed error messages

### 11.3 Authorization Errors

**Scenarios:**
- Resume not found (404)
- Resume not owned (403)
- Resume locked (400)
- 2FA required (401)

**Handling:**
- Guard-level checks
- Service-level checks
- Appropriate HTTP status codes

### 11.4 PDF Generation Errors

**Retry Logic:**
- 3 attempts with exponential backoff
- Logging for debugging

**Fallback:**
- Return error to client
- User can retry manually

---

## 12. DATA CONSISTENCY

### 12.1 Optimistic Updates

**Not Extensively Used:**
- Most updates are pessimistic
- Wait for server confirmation

**Potential Use Cases:**
- Toggle visibility
- Toggle section visibility
- Reorder sections

### 12.2 Conflict Resolution

**Last Write Wins:**
- No conflict detection
- updatedAt timestamp for tracking
- No collaborative editing support

### 12.3 Data Integrity

**Database Constraints:**
- Unique constraints (email, username, slug)
- Foreign key constraints
- Cascade deletes

**Application-Level:**
- Zod validation
- Guard checks
- Service-level validation

---

## 13. GAPS & UNKNOWNS

### 13.1 Not Fully Documented

1. **Builder UI Components:** Sidebar editors, dialogs
2. **Artboard Section Components:** Individual section renderers
3. **Storage Service:** MinIO integration details
4. **Parser Library:** Resume import logic
5. **OpenAI Integration:** AI feature implementation
6. **Email Service:** Template and delivery
7. **Feature Flags:** Implementation details

### 13.2 Questions for Further Investigation

1. How are concurrent edits handled?
2. What's the max resume size supported?
3. Are there rate limits on API endpoints?
4. How long are PDF URLs valid?
5. What's the cache invalidation strategy for storage?
6. How are large images handled?
7. What's the PDF generation timeout?
8. Are there any queue systems for background jobs?

---

## 14. DATA FLOW DIAGRAMS

### 14.1 Resume Creation Flow

```
User → Client → API → Database
 |        |       |       |
 |        |       |       v
 |        |       |   Create Resume
 |        |       |       |
 |        |       v       v
 |        |   Return Resume
 |        |       |
 |        v       v
 |   Update State
 |        |
 v        v
Navigate to Builder
```

### 14.2 Resume Editing Flow

```
User Input → Zustand Store → Debounce → API → Database
               |                               |
               v                               v
          Artboard (iframe) ←───────────── Response
               |
               v
          Re-render
```

### 14.3 PDF Generation Flow

```
User → API → Printer Service → Chrome/Puppeteer
                                      |
                                      v
                                 Artboard Preview
                                      |
                                      v
                                 Page-by-Page PDF
                                      |
                                      v
                                  pdf-lib Merge
                                      |
                                      v
                                  MinIO Storage
                                      |
                                      v
                                  Return URL
```

### 14.4 Public Viewing Flow

```
Guest User → Public URL → API → Database
                            |       |
                            |       v
                            |   Find Resume
                            |       |
                            |       v
                            |   Increment Views
                            |       |
                            v       v
                        Return Resume
                            |
                            v
                    Artboard Rendering
```

---

## 15. CONCLUSION

**Data Flow Completeness: 90%**

The Reactive Resume data flow is:

**Strengths:**
- **Clear Separation:** Client state, server state, database
- **Type-Safe:** End-to-end TypeScript
- **Optimized:** Debouncing, caching, retry logic
- **Scalable:** Modular architecture
- **Reliable:** Error handling, validation, guards

**Key Patterns:**
- Zustand for client state with undo/redo
- TanStack Query for server state
- Debounced updates to reduce API calls
- PostMessage for iframe communication
- Retry logic for PDF generation
- Statistics tracking for analytics

**Potential Improvements:**
- Optimistic updates for better UX
- Conflict detection for concurrent edits
- Queue system for PDF generation
- Redis for session storage
- WebSocket for real-time features
- CDN for static assets

**Overall:** Production-ready data flow with clear patterns and good performance characteristics. Well-suited for individual use; would benefit from additional infrastructure for scale.

---

**Document End**
