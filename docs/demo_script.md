# Demo Script: DiplomaIQ

This document provides two scripts for presenting DiplomaIQ: a rapid 5-minute version and a comprehensive 10-15 minute version.

---

## The 5-Minute Pitch

**0:00 - Introduction**
"Hello, our project is DiplomaIQ—an AI-powered Academic Command Center for diploma students. We solve the problem of fragmented student data and generic counseling."

**1:00 - Demo Login**
"Rather than typing in records manually, I will click 'Login as Demo Student'. This instantly provisions a rich profile in our database, bypassing the manual SBTET sync."
*(Click the button. The dashboard loads.)*

**2:00 - The Command Center**
"Notice the Command Center. The AI has already analyzed the student's records and generated prioritized Action Items. The student's CGPA is 8.75, and the SGPA trend chart proves they are improving."

**3:00 - The Academic Report (PDF Export)**
"If a student wants deep insights, they click the Coach tab. I'll click 'Generate Academic Report'. The AI, knowing this student struggles with Math but excels in Java, generates a custom 11-point report. Let's export it as a PDF."
*(Click PDF Export)*.

**4:00 - ECET Engine**
"Finally, the ECET Engine. Instead of raw ranks, we feed historical data to our algorithm. I'll enter Rank 1800 for CSE. Look at the results: Dream, Moderate, and Safe colleges. The AI doesn't invent colleges; it just explains the historical trends."

**5:00 - Conclusion**
"DiplomaIQ is secure, serverless, and ready for deployment. Thank you."

---

## The 10-15 Minute Deep Dive

*Follow the 5-minute pitch, but add these technical explanations:*

**During Demo Login (Minute 3):**
"Under the hood, we are using Next.js Server Actions and InsForge, a Postgres-based BaaS. When I clicked Demo, a backend script seeded relational tables—`student_profiles`, `semesters`, `attendance`—and secured them using Row Level Security (RLS)."

**During the Command Center (Minute 6):**
"Performance is critical. Instead of querying the database 10 times for the dashboard, we use a React `cache()` function called `getStudentContext()`. It fetches everything once and distributes it, cutting database reads by 80%."

**During the Academic Report (Minute 9):**
"Notice how fast the AI responds. We don't send the AI raw math to do. We have a 'Derived Metrics Layer' that calculates the health score, weak subjects, and averages *before* calling the LLM. The AI is strictly used for text generation, saving tokens and money."

**During the ECET Engine (Minute 12):**
"One major problem with AI is hallucination. We solved this with strict prompt engineering. The database queries the historical cutoffs, and passes *only* those results to the LLM. The prompt explicitly forbids the AI from inventing colleges. It acts only as a counselor explaining the data."

**Conclusion (Minute 14):**
"We also built telemetry to track usage analytics. Our architecture is decoupled, meaning when the official 2025 ECET data is released, we can ingest it directly into the database without touching the frontend code. This makes DiplomaIQ a true production-ready platform."
