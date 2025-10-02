# 2) API Specification (OpenAPI 3.1)

> **Notes**
> • Security uses **Bearer** (Supabase JWT).
> • All JSON bodies/returns use `ApiResponse<T>`.
> • Streaming endpoints support `text/event-stream` when `?stream=true`.
> • This spec covers v1 *surface area needed for v1 features*; DB schema comes later.

```yaml
openapi: 3.1.0
info:
  title: ResumePair API
  version: 1.0.0
  description: |
    REST API for AI-assisted resume & cover-letter creation.
    Auth: Supabase (Google OAuth only), pass Authorization: Bearer <JWT>.
servers:
  - url: https://{host}/api/v1
    variables:
      host:
        default: app.example.com
security:
  - bearerAuth: []
tags:
  - name: Me
  - name: Documents
  - name: AI
  - name: Import
  - name: Export
  - name: Score
  - name: Storage
  - name: Templates
paths:
  /me:
    get:
      tags: [Me]
      summary: Get authenticated user profile
      security: [ { bearerAuth: [] } ]
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ApiResponseUser' }
        "401": { $ref: '#/components/responses/Unauthorized' }

  /resumes:
    get:
      tags: [Documents]
      summary: List resume documents
      security: [ { bearerAuth: [] } ]
      parameters:
        - in: query
          name: page
          schema: { type: integer, minimum: 1, default: 1 }
        - in: query
          name: pageSize
          schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
        - in: query
          name: search
          schema: { type: string }
        - in: query
          name: sort
          schema: { type: string, enum: [createdAt, updatedAt, title], default: updatedAt }
        - in: query
          name: order
          schema: { type: string, enum: [asc, desc], default: desc }
      responses:
        "200":
          description: OK
          headers:
            X-Total-Count: { description: Total items, schema: { type: integer } }
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiResponseResumeList'
        "401": { $ref: '#/components/responses/Unauthorized' }
    post:
      tags: [Documents]
      summary: Create a resume document
      security: [ { bearerAuth: [] } ]
      headers:
        Idempotency-Key:
          description: Optional idempotency key to avoid duplicate creates.
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateResumeRequest'
      responses:
        "201":
          description: Created
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ApiResponseResumeDoc' }
        "400": { $ref: '#/components/responses/BadRequest' }
        "401": { $ref: '#/components/responses/Unauthorized' }

  /resumes/{id}:
    get:
      tags: [Documents]
      summary: Get a resume document by id
      security: [ { bearerAuth: [] } ]
      parameters:
        - $ref: '#/components/parameters/IdParam'
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ApiResponseResumeDoc' }
        "401": { $ref: '#/components/responses/Unauthorized' }
        "404": { $ref: '#/components/responses/NotFound' }
    put:
      tags: [Documents]
      summary: Replace a resume document (full update)
      security: [ { bearerAuth: [] } ]
      parameters:
        - $ref: '#/components/parameters/IdParam'
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/UpdateResumeRequest' }
      responses:
        "200":
          description: Updated
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ApiResponseResumeDoc' }
        "400": { $ref: '#/components/responses/BadRequest' }
        "401": { $ref: '#/components/responses/Unauthorized' }
        "404": { $ref: '#/components/responses/NotFound' }
    patch:
      tags: [Documents]
      summary: Patch a resume document (partial)
      security: [ { bearerAuth: [] } ]
      parameters:
        - $ref: '#/components/parameters/IdParam'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              description: Partial update of top-level fields (title, data, settings)
      responses:
        "200":
          description: Patched
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ApiResponseResumeDoc' }
        "400": { $ref: '#/components/responses/BadRequest' }
        "401": { $ref: '#/components/responses/Unauthorized' }
        "404": { $ref: '#/components/responses/NotFound' }
    delete:
      tags: [Documents]
      summary: Soft-delete a resume document
      security: [ { bearerAuth: [] } ]
      parameters:
        - $ref: '#/components/parameters/IdParam'
      responses:
        "204":
          description: Deleted
        "401": { $ref: '#/components/responses/Unauthorized' }
        "404": { $ref: '#/components/responses/NotFound' }

  /cover-letters:
    get:
      tags: [Documents]
      summary: List cover-letter documents
      security: [ { bearerAuth: [] } ]
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/PageSizeParam'
        - in: query
          name: search
          schema: { type: string }
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ApiResponseCoverLetterList' }
        "401": { $ref: '#/components/responses/Unauthorized' }
    post:
      tags: [Documents]
      summary: Create a cover-letter document
      security: [ { bearerAuth: [] } ]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/CreateCoverLetterRequest' }
      responses:
        "201":
          description: Created
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ApiResponseCoverLetterDoc' }
        "400": { $ref: '#/components/responses/BadRequest' }
        "401": { $ref: '#/components/responses/Unauthorized' }

  /cover-letters/{id}:
    get:
      tags: [Documents]
      summary: Get a cover-letter document by id
      security: [ { bearerAuth: [] } ]
      parameters: [ { $ref: '#/components/parameters/IdParam' } ]
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ApiResponseCoverLetterDoc' }
        "401": { $ref: '#/components/responses/Unauthorized' }
        "404": { $ref: '#/components/responses/NotFound' }
    put:
      tags: [Documents]
      summary: Replace a cover-letter document
      security: [ { bearerAuth: [] } ]
      parameters: [ { $ref: '#/components/parameters/IdParam' } ]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/UpdateCoverLetterRequest' }
      responses:
        "200":
          description: Updated
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ApiResponseCoverLetterDoc' }
        "400": { $ref: '#/components/responses/BadRequest' }
        "401": { $ref: '#/components/responses/Unauthorized' }
        "404": { $ref: '#/components/responses/NotFound' }
    patch:
      tags: [Documents]
      summary: Patch a cover-letter document
      security: [ { bearerAuth: [] } ]
      parameters: [ { $ref: '#/components/parameters/IdParam' } ]
      requestBody:
        required: true
        content:
          application/json:
            schema: { type: object }
      responses:
        "200":
          description: Patched
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ApiResponseCoverLetterDoc' }
        "400": { $ref: '#/components/responses/BadRequest' }
        "401": { $ref: '#/components/responses/Unauthorized' }
        "404": { $ref: '#/components/responses/NotFound' }
    delete:
      tags: [Documents]
      summary: Soft-delete a cover-letter document
      security: [ { bearerAuth: [] } ]
      parameters: [ { $ref: '#/components/parameters/IdParam' } ]
      responses:
        "204":
          description: Deleted
        "401": { $ref: '#/components/responses/Unauthorized' }
        "404": { $ref: '#/components/responses/NotFound' }

  /import/pdf:
    post:
      tags: [Import]
      summary: Import a résumé from PDF (with OCR fallback)
      security: [ { bearerAuth: [] } ]
      parameters:
        - in: query
          name: ocr
          schema: { type: boolean, default: false }
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
      responses:
        "200":
          description: Parsed
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ApiResponseImportResult' }
        "400": { $ref: '#/components/responses/BadRequest' }
        "401": { $ref: '#/components/responses/Unauthorized' }
        "413": { description: File too large }
        "422": { description: Could not extract meaningful text }

  /ai/draft/resume:
    post:
      tags: [AI]
      summary: Create a zero-to-draft ResumeJson from freeform input (SSE optional)
      security: [ { bearerAuth: [] } ]
      parameters:
        - in: query
          name: stream
          schema: { type: boolean, default: false }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/AiDraftResumeRequest' }
      responses:
        "200":
          description: OK (JSON or SSE)
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ApiResponseResumeJson' }
            text/event-stream:
              schema:
                type: string
                description: Server-Sent Events stream of JSON patches/chunks

  /ai/draft/cover-letter:
    post:
      tags: [AI]
      summary: Create a zero-to-draft CoverLetterJson from freeform input (SSE optional)
      security: [ { bearerAuth: [] } ]
      parameters:
        - in: query
          name: stream
          schema: { type: boolean, default: false }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/AiDraftCoverLetterRequest' }
      responses:
        "200":
          description: OK (JSON or SSE)
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ApiResponseCoverLetterJson' }
            text/event-stream:
              schema: { type: string }

  /score/resume:
    post:
      tags: [Score]
      summary: Compute composite score for a ResumeJson and optional JD
      security: [ { bearerAuth: [] } ]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/ScoreResumeRequest' }
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ApiResponseScore' }

  /score/cover-letter:
    post:
      tags: [Score]
      summary: Compute composite score for a CoverLetterJson and optional JD
      security: [ { bearerAuth: [] } ]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/ScoreCoverLetterRequest' }
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ApiResponseScore' }

  /export/pdf:
    post:
      tags: [Export]
      summary: Render a document as PDF (server-side HTML→PDF)
      security: [ { bearerAuth: [] } ]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/ExportPdfRequest' }
      responses:
        "200":
          description: PDF stream
          headers:
            Content-Disposition:
              schema: { type: string }
          content:
            application/pdf:
              schema: { type: string, format: binary }
        "400": { $ref: '#/components/responses/BadRequest' }
        "401": { $ref: '#/components/responses/Unauthorized' }
        "504": { description: Render timeout }

  /templates/resume:
    get:
      tags: [Templates]
      summary: List available resume templates
      security: [ { bearerAuth: [] } ]
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ApiResponseTemplateList' }

  /templates/cover-letter:
    get:
      tags: [Templates]
      summary: List available cover-letter templates
      security: [ { bearerAuth: [] } ]
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ApiResponseTemplateList' }

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  parameters:
    IdParam:
      in: path
      name: id
      required: true
      schema: { type: string, format: uuid }
      description: Document ID
    PageParam:
      in: query
      name: page
      schema: { type: integer, minimum: 1, default: 1 }
    PageSizeParam:
      in: query
      name: pageSize
      schema: { type: integer, minimum: 1, maximum: 100, default: 20 }

  responses:
    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ApiResponseError' }
    BadRequest:
      description: Bad Request
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ApiResponseError' }
    NotFound:
      description: Not Found
      content:
        application/json:
          schema: { $ref: '#/components/schemas/ApiResponseError' }

  schemas:
    # Envelope
    ApiResponse:
      type: object
      properties:
        success: { type: boolean }
        message: { type: string, nullable: true }
        error: { type: string, nullable: true }
        data: { nullable: true }
      required: [success]
      additionalProperties: false

    ApiResponseError:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            success: { const: false }
            error: { type: string }

    ApiResponseUser:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data:
              type: object
              properties:
                id: { type: string, format: uuid }
                email: { type: string, format: email }
                name: { type: string, nullable: true }

    ApiResponseResumeList:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data:
              type: array
              items: { $ref: '#/components/schemas/ResumeDocument' }

    ApiResponseCoverLetterList:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data:
              type: array
              items: { $ref: '#/components/schemas/CoverLetterDocument' }

    ApiResponseResumeDoc:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data: { $ref: '#/components/schemas/ResumeDocument' }

    ApiResponseCoverLetterDoc:
      allOf:
        - $ref: '#/components/schemas/ApiResponse' 
        - type: object
          properties:
            data: { $ref: '#/components/schemas/CoverLetterDocument' }

    ApiResponseResumeJson:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data: { $ref: '#/components/schemas/ResumeJson' }

    ApiResponseCoverLetterJson:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data: { $ref: '#/components/schemas/CoverLetterJson' }

    ApiResponseImportResult:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data: { $ref: '#/components/schemas/ImportResult' }

    ApiResponseTemplateList:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data:
              type: array
              items: { $ref: '#/components/schemas/TemplateDescriptor' }

    ApiResponseUploadResult:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data: { $ref: '#/components/schemas/UploadResult' }

    ApiResponseScore:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data: { $ref: '#/components/schemas/ScoreResult' }

    # Core documents
    ResumeDocument:
      type: object
      properties:
        id: { type: string, format: uuid }
        title: { type: string }
        ownerId: { type: string, format: uuid }
        type: { const: "resume" }
        version: { type: integer }
        schemaVersion: { type: string, example: "resume.v1" }
        data: { $ref: '#/components/schemas/ResumeJson' }
        score: { $ref: '#/components/schemas/ScoreResult', nullable: true }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
        deletedAt: { type: string, format: date-time, nullable: true }
      required: [id, title, ownerId, type, version, schemaVersion, data, createdAt, updatedAt]

    CoverLetterDocument:
      type: object
      properties:
        id: { type: string, format: uuid }
        title: { type: string }
        ownerId: { type: string, format: uuid }
        type: { const: "cover-letter" }
        version: { type: integer }
        schemaVersion: { type: string, example: "cover-letter.v1" }
        data: { $ref: '#/components/schemas/CoverLetterJson' }
        score: { $ref: '#/components/schemas/ScoreResult', nullable: true }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
        deletedAt: { type: string, format: date-time, nullable: true }
      required: [id, title, ownerId, type, version, schemaVersion, data, createdAt, updatedAt]

    # Runtime JSONs (simplified but complete for v1)
    ResumeJson:
      type: object
      properties:
        profile:
          type: object
          properties:
            fullName: { type: string }
            headline: { type: string, nullable: true }
            email: { type: string, format: email }
            phone: { type: string, nullable: true }
            location:
              type: object
              nullable: true
              properties:
                city: { type: string, nullable: true }
                region: { type: string, nullable: true }
                country: { type: string, nullable: true }
                postal: { type: string, nullable: true }
            links:
              type: array
              items:
                type: object
                properties:
                  type: { type: string, nullable: true }
                  label: { type: string, nullable: true }
                  url: { type: string, format: uri }
            photo:
              type: object
              nullable: true
              properties:
                bucket: { type: string }
                path: { type: string }
        summary: { type: string, nullable: true }
        work:
          type: array
          items:
            type: object
            properties:
              company: { type: string }
              role: { type: string }
              location: { type: string, nullable: true }
              startDate: { type: string }
              endDate: { type: string, nullable: true }
              descriptionBullets:
                type: array
                items: { type: string }
              achievements:
                type: array
                items: { type: string }
              techStack:
                type: array
                items: { type: string }
        education:
          type: array
          items:
            type: object
            properties:
              school: { type: string }
              degree: { type: string }
              field: { type: string, nullable: true }
              startDate: { type: string, nullable: true }
              endDate: { type: string, nullable: true }
              details:
                type: array
                items: { type: string }
        projects:
          type: array
          items:
            type: object
            properties:
              name: { type: string }
              link: { type: string, format: uri, nullable: true }
              summary: { type: string, nullable: true }
              bullets:
                type: array
                items: { type: string }
              techStack:
                type: array
                items: { type: string }
        skills:
          type: array
          items:
            type: object
            properties:
              category: { type: string }
              items:
                type: array
                items: { type: string }
        certifications:
          type: array
          items:
            type: object
            properties:
              name: { type: string }
              issuer: { type: string }
              date: { type: string, nullable: true }
        awards:
          type: array
          items:
            type: object
            properties:
              name: { type: string }
              org: { type: string, nullable: true }
              date: { type: string, nullable: true }
              summary: { type: string, nullable: true }
        languages:
          type: array
          items:
            type: object
            properties:
              name: { type: string }
              level: { type: string }
        extras:
          type: array
          items:
            type: object
            properties:
              label: { type: string }
              content: { type: string }
        settings:
          type: object
          properties:
            locale: { type: string }
            dateFormat: { type: string, enum: [US, ISO, EU] }
            addressFormat: { type: string, nullable: true }
            fontFamily: { type: string }
            fontSizeScale: { type: number }
            lineSpacing: { type: number }
            colorTheme: { type: string }
            iconSet: { type: string, enum: [lucide] }
            showIcons: { type: boolean }
            sectionOrder:
              type: array
              items: { type: string }
            pageSize: { type: string, enum: [A4, Letter] }
      required: [profile, settings]

    CoverLetterJson:
      type: object
      properties:
        from:
          type: object
          properties:
            fullName: { type: string }
            email: { type: string, format: email }
            phone: { type: string, nullable: true }
            address: { type: string, nullable: true }
        to:
          type: object
          properties:
            name: { type: string, nullable: true }
            role: { type: string, nullable: true }
            company: { type: string, nullable: true }
            address: { type: string, nullable: true }
        date: { type: string, format: date }
        salutation: { type: string }
        body:
          type: array
          description: List of content blocks (paragraphs, bullets)
          items:
            type: object
            properties:
              type: { type: string, enum: [paragraph, bullets] }
              text: { type: string, nullable: true }
              bullets:
                type: array
                items: { type: string }
              marks:
                type: array
                items: { type: string, enum: [bold, italic, underline] }
        closing:
          type: object
          properties:
            phrase: { type: string }
            name: { type: string }
            signatureImage:
              type: object
              nullable: true
              properties:
                bucket: { type: string }
                path: { type: string }
        settings:
          $ref: '#/components/schemas/ResumeJson/properties/settings'
      required: [from, to, date, salutation, body, closing, settings]

    # Requests
    CreateResumeRequest:
      type: object
      properties:
        title: { type: string }
        data: { $ref: '#/components/schemas/ResumeJson' }
      required: [title, data]

    UpdateResumeRequest:
      type: object
      properties:
        title: { type: string }
        data: { $ref: '#/components/schemas/ResumeJson' }
        version: { type: integer }
      required: [title, data, version]

    CreateCoverLetterRequest:
      type: object
      properties:
        title: { type: string }
        data: { $ref: '#/components/schemas/CoverLetterJson' }
      required: [title, data]

    UpdateCoverLetterRequest:
      type: object
      properties:
        title: { type: string }
        data: { $ref: '#/components/schemas/CoverLetterJson' }
        version: { type: integer }
      required: [title, data, version]

    AiDraftResumeRequest:
      type: object
      properties:
        input: { type: string, description: "Freeform text with personal info and optionally job description" }
        jobDescription: { type: string, nullable: true }
        locale: { type: string, nullable: true }
      required: [input]

    AiDraftCoverLetterRequest:
      type: object
      properties:
        input: { type: string }
        jobDescription: { type: string, nullable: true }
        tone: { type: string, enum: [formal, neutral], default: neutral }
        locale: { type: string, nullable: true }
      required: [input]

    ScoreResumeRequest:
      type: object
      properties:
        resume: { $ref: '#/components/schemas/ResumeJson' }
        jobDescription: { type: string, nullable: true }
        includeRubric: { type: boolean, default: true }
      required: [resume]

    ScoreCoverLetterRequest:
      type: object
      properties:
        coverLetter: { $ref: '#/components/schemas/CoverLetterJson' }
        jobDescription: { type: string, nullable: true }
        includeRubric: { type: boolean, default: true }
      required: [coverLetter]

    ExportPdfRequest:
      type: object
      properties:
        documentId: { type: string, format: uuid }
        templateSlug: { type: string }
        overrides:
          type: object
          description: "Optional settings override at render time"
      required: [documentId, templateSlug]

    ExportDocxRequest:
      type: object
      properties:
        documentId: { type: string, format: uuid }
        templateSlug: { type: string }
      required: [documentId, templateSlug]

    ImportResult:
      type: object
      properties:
        resume: { $ref: '#/components/schemas/ResumeJson' }
        confidence: { type: number, minimum: 0, maximum: 1 }
        ocrUsed: { type: boolean }

    TemplateDescriptor:
      type: object
      properties:
        slug: { type: string }
        name: { type: string }
        supportsPhoto: { type: boolean }
        description: { type: string }
        categories:
          type: array
          items: { type: string }

    UploadResult:
      type: object
      properties:
        bucket: { type: string }
        path: { type: string }
        url: { type: string, format: uri }

    ScoreResult:
      type: object
      properties:
        overall: { type: integer, minimum: 0, maximum: 100 }
        subs:
          type: object
          properties:
            atsReadiness: { type: integer }
            keywordMatch: { type: integer }
            contentStrength: { type: integer }
            formatQuality: { type: integer }
            completeness: { type: integer }
        suggestions:
          type: array
          items:
            type: object
            properties:
              severity: { type: string, enum: [info, warn, error] }
              message: { type: string }
              sectionRef: { type: string, nullable: true }
```

---

## Implementation Notes for the Agent

* **All endpoints** must be implemented using the **API utilities** (`withApiHandler`, `withAuth`, `apiSuccess`, `apiError`) and **never** as raw handlers.
* **Repositories**: `documents.ts` exposes CRUD that takes a Supabase client via DI; route handlers create the proper client (`server` variant).
* **Zod**: Mirror OpenAPI schemas in `libs/ai/schemas/*`. The AI SDK `generateObject/streamObject` uses these exact schemas.
* **Edge vs Node**:

  * Edge: `/ai/*`, `/me` (fast auth/profile), optional `/score` (when rubric only).
  * Node: `/import/pdf`, `/export/*`, CRUD routes (DB access patterns are fine on Node).
* **Streaming**: For `?stream=true` AI endpoints, send SSE frames with JSON patches (or chunked partials) and a final `{type:"done"}` event.
* **Rate limits**: Simple in-memory token bucket per user for now; return `429` with `Retry-After`.
* **Errors**: Always wrap with `ApiResponse` envelope (`success:false`, `error:string`), and set precise HTTP status.

---
