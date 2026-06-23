# Viva Q&A Bank

Anticipated questions from examiners and evaluators during project defense.

### Q: Why did you use Next.js instead of traditional React + Node.js/Express?
**A:** Next.js allows us to use React Server Components (RSC) and Server Actions. This means we don't have to build and maintain a separate REST API layer. We can query the InsForge database securely from the server, entirely bypassing client-side network waterfalls, resulting in a much faster and more secure application.

### Q: What is InsForge, and why not use Firebase?
**A:** InsForge is a unified Backend-as-a-Service built on PostgreSQL. Unlike Firebase, which uses a NoSQL document store, PostgreSQL gives us strict relational integrity (Primary/Foreign keys). This is critical for academic data, where a semester row *must* belong to a specific student profile. 

### Q: How do you prevent the AI from giving wrong college advice (Hallucinations)?
**A:** We use a "RAG" (Retrieval-Augmented Generation) style approach. The AI is NOT allowed to pick colleges. Our Postgres database runs a deterministic SQL query to find colleges based on historical cutoffs. We pass *that exact list* to the AI, and the prompt strictly instructs the AI to only explain the provided list and never invent new options.

### Q: How is the application secured? What stops me from seeing another student's SGPA?
**A:** We use Row Level Security (RLS) policies directly on the PostgreSQL database. Even if someone intercepts the API or tries to modify the frontend code, the database itself checks the JWT token (`auth.uid()`) and will outright reject any `SELECT` or `UPDATE` queries for rows that do not belong to that specific authenticated user.

### Q: AI APIs can be expensive and slow. How did you optimize this?
**A:** Two ways. First, we built a `Derived Metrics Layer`. We do all the heavy math (calculating averages, finding weak subjects) in basic TypeScript before calling the AI, so the AI requires fewer tokens to understand the context. Second, in the ECET Engine, instead of asking the AI to explain 15 individual colleges, we group them into 3 buckets (Dream/Moderate/Safe) and make only 3 parallel AI calls using `Promise.all()`.

### Q: How does the PDF Export work? Do you generate it on the server?
**A:** No, server-side PDF generation (like Puppeteer) is heavy and prone to timeouts on serverless platforms like Vercel. We use `react-to-print` combined with `@media print` CSS rules. The browser natively converts the DOM into a high-quality PDF on the client side, which is fast and costs nothing in server compute.
