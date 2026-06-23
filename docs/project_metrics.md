# Project Metrics

Quantitative data regarding the scale, complexity, and capabilities of the DiplomaIQ codebase.

## Codebase Statistics
- **Framework:** Next.js 14+ (App Router)
- **Primary Language:** TypeScript (`.ts`, `.tsx`)
- **Total Dependencies:** ~20 (Notable: `@insforge/sdk`, `lucide-react`, `react-markdown`, `react-to-print`, `recharts`, `tailwind-merge`)
- **Styling:** Tailwind CSS + Shadcn UI components

## Database (PostgreSQL)
- **Tables Designed:** 6
  - `student_profiles`
  - `academic_summary`
  - `semesters`
  - `attendance_records`
  - `ecet_cutoffs`
  - `usage_analytics`
- **Security:** 100% of sensitive tables protected by Row Level Security (RLS).

## Telemetry Events Tracked
Built-in event logging for future Admin Dashboards:
1. `ai_coach_use`
2. `academic_report_gen`
3. `study_plan_gen`
4. `ecet_search`
5. `pdf_export`
6. `demo_login`

## Performance Targets Achieved
- **Database Reads per Page Load:** Reduced from ~4 to exactly 1 using `getStudentContext()` React cache deduplication.
- **AI Token Usage:** Reduced ECET engine LLM calls by grouping college recommendations into arrays before sending them to the AI for explanation.
- **PDF Generation Compute Time:** 0ms on the server (offloaded entirely to client browser).
