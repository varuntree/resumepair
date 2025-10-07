# Reactive-Resume Rendering Pipeline & PDF Generation

## Overview

Reactive-Resume uses a **multi-stage rendering pipeline** with separate applications for editing (client) and rendering (artboard). PDF generation happens server-side using **Puppeteer** to screenshot and print the rendered React components.

---

## Architecture Diagram

```
┌─────────────────┐
│  Client App     │ (User edits resume)
│  (React)        │
└────────┬────────┘
         │ Resume Data
         │
         ↓
┌─────────────────────────────────────────────────┐
│  Artboard App (React - Separate Application)    │
│  ┌───────────────────────────────────────────┐  │
│  │  Builder Mode (Interactive Editor)         │  │
│  │  - Zoom/Pan controls                       │  │
│  │  - Live preview                            │  │
│  │  - Page animations                         │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │  Preview Mode (PDF Generation)             │  │
│  │  - Static rendering                        │  │
│  │  - No interactions                         │  │
│  │  - Optimized for Puppeteer                 │  │
│  └───────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │ HTML/CSS Output
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│  Server (NestJS)                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  Printer Service (Puppeteer)               │  │
│  │  1. Launch headless Chrome                 │  │
│  │  2. Navigate to /artboard/preview          │  │
│  │  3. Inject resume data via localStorage    │  │
│  │  4. Screenshot each page                   │  │
│  │  5. Generate PDF per page                  │  │
│  │  6. Merge PDFs with pdf-lib                │  │
│  │  7. Upload to storage                      │  │
│  └───────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │ PDF File
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│  Storage Service (S3/Local)                     │
└─────────────────────────────────────────────────┘
```

---

## Component Rendering Pipeline

### Stage 1: Data Initialization

**Builder Mode**:
```typescript
// Client sends resume data via iframe postMessage or direct navigation
// Data is stored in Zustand store

// /apps/artboard/src/store/artboard.ts:9-14
export const useArtboardStore = create<ArtboardStore>()((set) => ({
  resume: null as unknown as ResumeData,
  setResume: (resume) => {
    set({ resume });
  },
}));
```

**Preview Mode** (PDF Generation):
```typescript
// /apps/server/src/printer/printer.service.ts:127-134
await page.goto(`${url}/artboard/preview`, { waitUntil: "domcontentloaded" });

await page.evaluate((data) => {
  window.localStorage.setItem("resume", JSON.stringify(data));
}, resume.data);

await Promise.all([
  page.reload({ waitUntil: "load" }),
  page.waitForSelector('[data-page="1"]', { timeout: 15_000 }),
]);
```

**Key Difference**: Builder mode gets data via props/state, Preview mode gets data from localStorage.

---

### Stage 2: Template Selection & Layout Parsing

**Builder Layout** (`/apps/artboard/src/pages/builder.tsx:13-84`):

```typescript
export const BuilderLayout = () => {
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  const layout = useArtboardStore((state) => state.resume.metadata.layout);
  const format = useArtboardStore((state) => state.resume.metadata.page.format);
  const template = useArtboardStore((state) => state.resume.metadata.template as Template);

  const Template = useMemo(() => getTemplate(template), [template]);

  return (
    <TransformWrapper
      ref={transformRef}
      centerOnInit
      maxScale={2}
      minScale={0.4}
      initialScale={0.8}
      limitToBounds={false}
    >
      <TransformComponent>
        <AnimatePresence>
          {layout.map((columns, pageIndex) => (
            <motion.div
              key={pageIndex}
              layout
              initial={{ opacity: 0, x: -200, y: 0 }}
              animate={{ opacity: 1, x: 0, transition: { delay: pageIndex * 0.3 } }}
              exit={{ opacity: 0, x: -200 }}
            >
              <Page mode="builder" pageNumber={pageIndex + 1}>
                <Template isFirstPage={pageIndex === 0} columns={columns as SectionKey[][]} />
              </Page>
            </motion.div>
          ))}
        </AnimatePresence>
      </TransformComponent>
    </TransformWrapper>
  );
};
```

**Features**:
- **Zoom/Pan**: `react-zoom-pan-pinch` wrapper for interaction
- **Animations**: Framer Motion for page entry/exit
- **Multi-Page**: Loops through `layout` array (one element = one page)
- **Dynamic Scaling**: Responsive to `page.format` (A4 vs Letter)

---

**Preview Layout** (`/apps/artboard/src/pages/preview.tsx:9-24`):

```typescript
export const PreviewLayout = () => {
  const layout = useArtboardStore((state) => state.resume.metadata.layout);
  const template = useArtboardStore((state) => state.resume.metadata.template as Template);

  const Template = useMemo(() => getTemplate(template), [template]);

  return (
    <>
      {layout.map((columns, pageIndex) => (
        <Page key={pageIndex} mode="preview" pageNumber={pageIndex + 1}>
          <Template isFirstPage={pageIndex === 0} columns={columns as SectionKey[][]} />
        </Page>
      ))}
    </>
  );
};
```

**Differences from Builder**:
- ❌ No zoom/pan wrapper
- ❌ No animations
- ❌ No transform controls
- ✅ Simple static rendering
- ✅ Optimized for screenshot/print

---

### Stage 3: Page Component Rendering

**Page Wrapper** (`/apps/artboard/src/components/page.tsx:1-48`):

```typescript
export const MM_TO_PX = 3.78;

export const Page = ({ mode = "preview", pageNumber, children }: Props) => {
  const { isDarkMode } = useTheme();

  const page = useArtboardStore((state) => state.resume.metadata.page);
  const fontFamily = useArtboardStore((state) => state.resume.metadata.typography.font.family);

  return (
    <div
      data-page={pageNumber}
      className={cn("relative bg-background text-foreground", mode === "builder" && "shadow-2xl")}
      style={{
        fontFamily,
        width: `${pageSizeMap[page.format].width * MM_TO_PX}px`,
        minHeight: `${pageSizeMap[page.format].height * MM_TO_PX}px`,
      }}
    >
      {mode === "builder" && page.options.pageNumbers && (
        <div className={cn("absolute -top-7 left-0 font-bold", isDarkMode && "text-white")}>
          Page {pageNumber}
        </div>
      )}

      {children}

      {mode === "builder" && page.options.breakLine && (
        <div
          className="absolute inset-x-0 border-b border-dashed"
          style={{
            top: `${pageSizeMap[page.format].height * MM_TO_PX}px`,
          }}
        />
      )}
    </div>
  );
};
```

**Responsibilities**:
1. **Size Calculation**: Converts page format (A4/Letter) from mm to px
2. **Font Application**: Applies user-selected font family
3. **Page Numbers**: Shows page numbers in builder mode
4. **Break Lines**: Visual guides for page boundaries in builder
5. **Data Attribute**: `data-page={pageNumber}` for Puppeteer targeting

**Page Sizes**:
```typescript
// From @reactive-resume/utils
export const pageSizeMap = {
  a4: { width: 210, height: 297 },    // mm
  letter: { width: 216, height: 279 } // mm
};

// Converted to pixels: width * 3.78, height * 3.78
// A4: 794px × 1123px
// Letter: 816px × 1055px
```

---

### Stage 4: Template Component Execution

Templates follow this rendering order:

1. **Destructure columns prop**:
   ```typescript
   const [main, sidebar] = columns;
   ```

2. **Render header conditionally** (only on first page):
   ```typescript
   {isFirstPage && <Header />}
   ```

3. **Map section keys to components**:
   ```typescript
   {main.map((section) => (
     <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
   ))}
   ```

4. **Section components pull data from store**:
   ```typescript
   const section = useArtboardStore((state) => state.resume.sections.experience);
   ```

5. **Generic Section wrapper handles rendering logic**:
   - Visibility checks
   - Grid layout
   - Item iteration
   - Conditional sub-components

**File Reference**: See any template, e.g., `/apps/artboard/src/templates/azurill.tsx`

---

### Stage 5: Component Composition

Templates use these compositional patterns:

#### Pattern 1: Reusable Section Components

Every template defines ~15 section components:
- `<Header>` - Personal info
- `<Summary>` - Rich text summary
- `<Experience>` - Work history
- `<Education>` - Academic background
- `<Skills>` - Technical/soft skills
- `<Projects>` - Portfolio items
- `<Languages>` - Spoken languages
- `<Profiles>` - Social media links
- `<Awards>`, `<Certifications>`, `<Interests>`, `<Publications>`, `<Volunteer>`, `<References>`
- `<Custom>` - User-defined sections

#### Pattern 2: Generic Section Wrapper

Centralizes common logic:
```typescript
const Section = <T,>({
  section,
  children,      // Custom rendering per item
  urlKey,        // Property name for URL
  levelKey,      // Property name for skill level
  summaryKey,    // Property name for description
  keywordsKey,   // Property name for keywords
}: SectionProps<T>) => {
  // 1. Visibility check
  if (!section.visible || section.items.filter((item) => item.visible).length === 0)
    return null;

  return (
    <section id={section.id}>
      {/* 2. Section title */}
      <h4>{section.name}</h4>

      {/* 3. Grid layout based on section.columns */}
      <div style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}>
        {section.items
          .filter((item) => item.visible)
          .map((item) => {
            // 4. Extract common fields using lodash.get
            const url = (urlKey && get(item, urlKey)) as URL | undefined;
            const level = (levelKey && get(item, levelKey, 0)) as number | undefined;
            const summary = (summaryKey && get(item, summaryKey, "")) as string | undefined;
            const keywords = (keywordsKey && get(item, keywordsKey, [])) as string[] | undefined;

            return (
              <div key={item.id}>
                {/* 5. Custom item rendering */}
                {children?.(item as T)}

                {/* 6. Conditional sub-components */}
                {summary && <div dangerouslySetInnerHTML={{ __html: sanitize(summary) }} />}
                {level > 0 && <Rating level={level} />}
                {keywords?.length > 0 && <p>{keywords.join(", ")}</p>}
                {url && section.separateLinks && <Link url={url} />}
              </div>
            );
          })}
      </div>
    </section>
  );
};
```

#### Pattern 3: Helper Components

**Link Component**:
- Validates URL presence
- Supports custom icons
- Adds proper link attributes (target, rel)

**LinkedEntity Component**:
- Combines name + URL
- Respects `separateLinks` setting
- Inline link vs separate link display

**Rating Component**:
- Visual skill level indicator
- 5-dot scale (filled/unfilled)

**Picture Component**:
```typescript
// /apps/artboard/src/components/picture.tsx:9-33
export const Picture = ({ className }: PictureProps) => {
  const picture = useArtboardStore((state) => state.resume.basics.picture);
  const fontSize = useArtboardStore((state) => state.resume.metadata.typography.font.size);

  if (!isUrl(picture.url) || picture.effects.hidden) return null;

  return (
    <img
      src={picture.url}
      alt="Profile"
      className={cn(
        "relative z-20 object-cover",
        picture.effects.border && "border-primary",
        picture.effects.grayscale && "grayscale",
        className,
      )}
      style={{
        maxWidth: `${picture.size}px`,
        aspectRatio: `${picture.aspectRatio}`,
        borderRadius: `${picture.borderRadius}px`,
        borderWidth: `${picture.effects.border ? fontSize / 3 : 0}px`,
      }}
    />
  );
};
```

**Features**:
- Conditional rendering based on URL presence
- Dynamic sizing and aspect ratio
- Border and grayscale effects
- Font-size-relative border width

---

## PDF Generation Pipeline

### High-Level Flow

```
Server receives PDF request
    ↓
1. Launch Puppeteer (connect to Chrome instance)
2. Navigate to /artboard/preview
3. Inject resume data into localStorage
4. Reload page and wait for render
5. Wait for images to load (if profile picture exists)
6. Loop through each page:
   a. Target page by data-page attribute
   b. Extract page dimensions
   c. Clone page element to body
   d. Apply custom CSS (if enabled)
   e. Generate PDF with page.pdf()
   f. Restore original body
7. Merge all page PDFs using pdf-lib
8. Upload combined PDF to storage
9. Return URL
```

---

### Detailed Implementation

**File**: `/apps/server/src/printer/printer.service.ts`

#### Step 1: Browser Connection

```typescript
// Lines 33-44
private async getBrowser() {
  try {
    return await connect({
      browserWSEndpoint: this.browserURL,  // WebSocket URL to Chrome
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

**Infrastructure**: Uses **Browserless** (Chrome-as-a-Service) or self-hosted Chrome instance via WebSocket.

---

#### Step 2: Page Navigation & Data Injection

```typescript
// Lines 93-140
async generateResume(resume: ResumeDto) {
  const browser = await this.getBrowser();
  const page = await browser.newPage();

  const publicUrl = this.configService.getOrThrow<string>("PUBLIC_URL");
  const storageUrl = this.configService.getOrThrow<string>("STORAGE_URL");

  let url = publicUrl;

  // Handle localhost → host.docker.internal for Docker environments
  if ([publicUrl, storageUrl].some((url) => /https?:\/\/localhost(:\d+)?/.test(url))) {
    url = url.replace(
      /localhost(:\d+)?/,
      (_match, port) => `host.docker.internal${port ?? ""}`,
    );

    await page.setRequestInterception(true);

    page.on("request", (request) => {
      if (request.url().startsWith(storageUrl)) {
        const modifiedUrl = request
          .url()
          .replace(/localhost(:\d+)?/, (_match, port) => `host.docker.internal${port ?? ""}`);

        void request.continue({ url: modifiedUrl });
      } else {
        void request.continue();
      }
    });
  }

  const numberPages = resume.data.metadata.layout.length;

  // Navigate to preview page
  await page.goto(`${url}/artboard/preview`, { waitUntil: "domcontentloaded" });

  // Inject resume data into localStorage
  await page.evaluate((data) => {
    window.localStorage.setItem("resume", JSON.stringify(data));
  }, resume.data);

  // Reload to apply data
  await Promise.all([
    page.reload({ waitUntil: "load" }),
    page.waitForSelector('[data-page="1"]', { timeout: 15_000 }),
  ]);
```

**Key Points**:
- Uses `page.evaluate()` to run JS in browser context
- Stores entire resume object in localStorage
- Waits for first page to render (`data-page="1"`)

---

#### Step 3: Image Loading (Profile Picture)

```typescript
// Lines 142-156
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

**Purpose**: Ensures profile picture (and any other images) are fully loaded before screenshot/PDF generation.

---

#### Step 4: Page-by-Page PDF Generation

```typescript
// Lines 158-192
const pagesBuffer: Buffer[] = [];

const processPage = async (index: number) => {
  // 1. Target specific page element
  const pageElement = await page.$(`[data-page="${index}"]`);

  // 2. Get page dimensions
  const width = (await (await pageElement?.getProperty("scrollWidth"))?.jsonValue()) ?? 0;
  const height = (await (await pageElement?.getProperty("scrollHeight"))?.jsonValue()) ?? 0;

  // 3. Clone page element and replace body
  const temporaryHtml = await page.evaluate((element: HTMLDivElement) => {
    const clonedElement = element.cloneNode(true) as HTMLDivElement;
    const temporaryHtml_ = document.body.innerHTML;
    document.body.innerHTML = clonedElement.outerHTML;
    return temporaryHtml_;
  }, pageElement);

  // 4. Apply custom CSS (if enabled)
  const css = resume.data.metadata.css;
  if (css.visible) {
    await page.evaluate((cssValue: string) => {
      const styleTag = document.createElement("style");
      styleTag.textContent = cssValue;
      document.head.append(styleTag);
    }, css.value);
  }

  // 5. Generate PDF
  const uint8array = await page.pdf({ width, height, printBackground: true });
  const buffer = Buffer.from(uint8array);
  pagesBuffer.push(buffer);

  // 6. Restore original body
  await page.evaluate((temporaryHtml_: string) => {
    document.body.innerHTML = temporaryHtml_;
  }, temporaryHtml);
};

// Loop through all pages
for (let index = 1; index <= numberPages; index++) {
  await processPage(index);
}
```

**Why Clone & Replace Body?**
- Puppeteer's `page.pdf()` prints the entire page
- By isolating each page element, we get clean page breaks
- Restoring body after each PDF keeps subsequent pages intact

**PDF Options**:
- `width`, `height`: Exact dimensions from page element
- `printBackground: true`: Includes background colors/images

---

#### Step 5: PDF Merging

```typescript
// Lines 199-206
const pdf = await PDFDocument.create();

for (const element of pagesBuffer) {
  const page = await PDFDocument.load(element);
  const [copiedPage] = await pdf.copyPages(page, [0]);
  pdf.addPage(copiedPage);
}

const buffer = Buffer.from(await pdf.save());
```

Uses **pdf-lib** to:
1. Create empty PDF document
2. Load each page PDF buffer
3. Copy page to combined document
4. Save as single buffer

---

#### Step 6: Storage & Cleanup

```typescript
// Lines 208-222
const resumeUrl = await this.storageService.uploadObject(
  resume.userId,
  "resumes",
  buffer,
  resume.title,
);

await page.close();
await browser.disconnect();

return resumeUrl;
```

**Storage Options**:
- AWS S3
- Local filesystem
- Minio (S3-compatible)

---

### Preview Image Generation (JPEG)

Similar flow but simpler:

```typescript
// Lines 235-291
async generatePreview(resume: ResumeDto) {
  const browser = await this.getBrowser();
  const page = await browser.newPage();

  // ... (same URL handling and data injection)

  await page.setViewport({ width: 794, height: 1123 });  // A4 dimensions

  await page.goto(`${url}/artboard/preview`, { waitUntil: "networkidle0" });

  // Screenshot first page only
  const uint8array = await page.screenshot({ quality: 80, type: "jpeg" });
  const buffer = Buffer.from(uint8array);

  const previewUrl = await this.storageService.uploadObject(
    resume.userId,
    "previews",
    buffer,
    resume.id,
  );

  await page.close();
  await browser.disconnect();

  return previewUrl;
}
```

**Key Differences**:
- Screenshots first page only (for thumbnail)
- Uses `page.screenshot()` instead of `page.pdf()`
- JPEG format (compressed, lower quality)
- Faster execution

---

## Rendering Optimizations

### 1. Memoization of Template Component

```typescript
// /apps/artboard/src/pages/builder.tsx:22
const Template = useMemo(() => getTemplate(template), [template]);
```

Prevents re-creating template component on every render. Only changes when template selection changes.

### 2. Conditional Sub-Component Rendering

Templates avoid rendering empty components:
```typescript
{summary !== undefined && !isEmptyString(summary) && <SummaryComponent />}
{level !== undefined && level > 0 && <Rating level={level} />}
```

### 3. Lazy Image Loading (Not Implemented)

Currently, all images load immediately. Could optimize with:
```html
<img loading="lazy" ... />
```

### 4. CSS Containment

Page components use `relative` positioning to create isolated rendering contexts, improving browser paint performance.

### 5. Puppeteer Waits

Strategic use of `waitUntil`:
- `domcontentloaded`: Initial navigation (faster)
- `load`: After data injection (ensures scripts run)
- `networkidle0`: Preview images (ensures all assets load)

---

## Rendering Modes Comparison

| Feature | Builder Mode | Preview Mode | PDF Generation |
|---------|--------------|--------------|----------------|
| **Purpose** | Interactive editing | Static preview | Server-side rendering |
| **Interactions** | Zoom, pan, edit | None | None |
| **Animations** | Framer Motion | None | None |
| **Data Source** | Props/state | localStorage | localStorage |
| **Page Numbers** | Visible | Hidden | Hidden |
| **Break Lines** | Visible | Hidden | Hidden |
| **Shadow** | Yes (3D effect) | No | No |
| **Environment** | Client browser | Client browser | Headless Chrome |
| **Output** | Visual render | Visual render | PDF buffer |

---

## Performance Characteristics

### Builder Mode

- **Initial Render**: ~500-1000ms (template + data)
- **Page Switch**: ~200ms (animation duration)
- **Data Update**: ~50-100ms (React re-render)

### PDF Generation

From logs in printer service:
```typescript
// Line 68
this.logger.debug(`Chrome took ${duration}ms to print ${numberPages} page(s)`);
```

**Observed Timings** (from code comments):
- 1 page: ~2-5 seconds
- 2 pages: ~4-8 seconds
- 3+ pages: ~6-12 seconds

**Factors Affecting Speed**:
- Network latency (fetching page)
- Image loading (profile picture)
- Page complexity (number of sections/items)
- Server resources (CPU for PDF generation)

### Retry Logic

```typescript
// Lines 57-63
const url = await retry<string | undefined>(() => this.generateResume(resume), {
  retries: 3,
  randomize: true,
  onRetry: (_, attempt) => {
    this.logger.log(`Retrying to print resume #${resume.id}, attempt #${attempt}`);
  },
});
```

Handles transient failures (network issues, timeouts).

---

## Error Handling

### Template-Level

Templates handle missing data gracefully:
- Optional chaining: `basics?.name`
- Conditional rendering: `{field && <Component />}`
- Default values: `level ?? 0`

### Page-Level

Page component validates data:
```typescript
if (!isUrl(picture.url) || picture.effects.hidden) return null;
```

### PDF Generation-Level

```typescript
try {
  // ... PDF generation logic
} catch (error) {
  this.logger.error(error);

  throw new InternalServerErrorException(
    ErrorMessage.ResumePrinterError,
    (error as Error).message,
  );
}
```

Logs error and returns HTTP 500 with error message.

---

## Rendering Constraints & Trade-offs

### Why Separate Artboard App?

1. **Clean Build**: Artboard has minimal dependencies (no forms, auth, etc.)
2. **Faster Loading**: Smaller bundle for PDF generation
3. **Isolation**: Template changes don't affect main client
4. **Security**: Can sandbox artboard if needed

### Why Puppeteer over React-PDF?

| Approach | Pros | Cons |
|----------|------|------|
| **React-PDF** | Pure JS, no browser needed | Limited CSS support, manual layout calculations |
| **Puppeteer** | Full CSS/HTML support, WYSIWYG | Requires Chrome instance, slower |

Reactive-Resume chose **Puppeteer** for:
- Exact browser rendering
- Support for complex CSS (grid, flexbox, custom fonts)
- No need to rewrite templates in PDF-specific format

### Why pdf-lib for Merging?

Native Puppeteer can't generate multi-page PDFs with custom page sizes per page. pdf-lib allows:
- Merging multiple PDFs
- Fine-grained control over page dimensions
- Adding metadata

---

## CSS Rendering Considerations

### Print-Specific CSS

Templates don't use `@media print` because:
- Puppeteer captures screen rendering, not print styling
- Avoids discrepancies between builder preview and PDF output

### Font Loading

Fonts must be available in the browser:
- Webfonts loaded via `<link>` tags
- System fonts work out-of-box
- Custom fonts uploaded to CDN

**Typography Config**:
```typescript
typography: {
  font: {
    family: z.string().default("IBM Plex Serif"),
    subset: z.string().default("latin"),
    variants: z.array(z.string()).default(["regular"]),
    size: z.number().default(14),
  }
}
```

### Color Rendering

CSS variables mapped to theme config:
```css
:root {
  --color-background: #ffffff;
  --color-text: #000000;
  --color-primary: #dc2626;
}
```

Puppeteer renders these correctly in PDF with `printBackground: true`.

---

## Files Referenced

- **Builder Layout**: `/apps/artboard/src/pages/builder.tsx`
- **Preview Layout**: `/apps/artboard/src/pages/preview.tsx`
- **Page Component**: `/apps/artboard/src/components/page.tsx`
- **Picture Component**: `/apps/artboard/src/components/picture.tsx`
- **Printer Service**: `/apps/server/src/printer/printer.service.ts`
- **Artboard Store**: `/apps/artboard/src/store/artboard.ts`
- **Template Registry**: `/apps/artboard/src/templates/index.tsx`
- **Metadata Schema**: `/libs/schema/src/metadata/index.ts`

---

## Key Takeaways

✅ **Separate Rendering Contexts**: Builder (interactive) vs Preview (static)
✅ **Server-Side PDF**: Puppeteer for WYSIWYG accuracy
✅ **Page-by-Page Generation**: Isolates each page for clean PDFs
✅ **Image Pre-Loading**: Ensures pictures render in PDF
✅ **Retry Logic**: Handles transient failures
✅ **Performance Trade-offs**: Slower generation for higher fidelity
✅ **No Template-Specific Rendering**: Same components for builder and PDF
