# Examiner Cheatsheet

A quick-reference guide for evaluating the technical depth and implementation of DiplomaIQ.

## 🔑 Key Technical Achievements to Highlight

1. **Serverless Architecture (Next.js App Router):**
   - We did NOT build a standard MERN stack. We used React Server Components and Server Actions. 
   - *Why it matters:* Zero client-side API fetching. All database queries happen on the server, making it extremely secure and fast.

2. **Database Integrity (InsForge/PostgreSQL):**
   - We use PostgreSQL, not MongoDB/Firebase. 
   - *Why it matters:* Strict relational mapping (Foreign Keys mapping `semesters` to `student_profiles`). 
   - *Security:* Row Level Security (RLS) ensures students can never query data belonging to other UUIDs.

3. **Intelligent AI Constraints (RAG Pattern):**
   - The AI does not guess or predict ECET colleges. 
   - *Why it matters:* Prevents hallucinations. The Postgres database runs the deterministic logic. The AI only formats the explanation.

4. **Context Caching:**
   - We use React `cache()`.
   - *Why it matters:* If the Dashboard, Action Center, and Metrics all need the user's CGPA, the database is only queried **once**, not three times.

5. **Client-Side PDF Generation:**
   - We use `react-to-print` with `@media print` CSS.
   - *Why it matters:* Bypasses heavy server-side PDF generators (like Puppeteer) that often crash or timeout on serverless hosts like Vercel.

## ⚠️ Where to Direct Attention During Demo
- The **Action Center** on the Dashboard (shows dynamic prioritization based on backlogs).
- The **Generate Academic Report** button (proves the AI can read real-time database state).
- The **ECET Advisor** (proves deterministic DB querying paired with generative AI explanation).
