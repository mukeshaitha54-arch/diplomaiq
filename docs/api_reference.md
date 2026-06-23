# Internal API Reference

DiplomaIQ relies on Next.js Server Actions rather than traditional REST APIs, ensuring absolute type safety and eliminating network overhead for the client.

## Core Services

### 1. Context Cache API
**File:** `src/lib/actions/context.ts`

```typescript
export async function getStudentContext(): Promise<StudentContext | null>
```
**Description:** The single source of truth. Retrieves the `StudentProfile`, `AcademicSummary`, `Semesters`, and `AttendanceRecords` in a single server pass. Cached via React `cache()` to prevent redundant queries.

### 2. AI Action API
**File:** `src/lib/actions/ai.ts`

```typescript
export async function getPersonalizedCoachAdvice(): Promise<string>
export async function generateAcademicReport(): Promise<string>
export async function generateStudyPlan(planType: 'exam' | 'daily' | 'recovery'): Promise<string>
```
**Description:** Interfaces with OpenAI/Gemini. Automatically fetches the student's context, injects it into a strict prompt template, and returns markdown-formatted text. Automatically triggers telemetry.

### 3. ECET Engine API
**File:** `src/lib/actions/ecet.ts`

```typescript
export async function getECETRecommendations(params: ECETParams): Promise<{
  recommendations: ECETRecommendation[];
  explanations: string[];
}>
```
**Description:** Queries `ecet_cutoffs` using the provided rank, branch, category, and gender. Groups results into Dream, Moderate, and Safe buckets. Passes the grouped arrays to the AI for hallucination-free explanations.

### 4. Telemetry API
**File:** `src/lib/actions/analytics.ts`

```typescript
export async function logUsageAnalytics(actionType: string, featureName: string, metadata?: any): Promise<boolean>
export async function logClientUsage(actionType: string, featureName: string): Promise<boolean>
```
**Description:** Asynchronously writes to the `usage_analytics` table for tracking feature engagement.
