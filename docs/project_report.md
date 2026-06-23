# DiplomaIQ: AI-Powered Academic Command Center

## 1. Abstract
DiplomaIQ is a robust web application designed to bridge the gap between fragmented academic records and actionable student success strategies. By integrating directly with Telangana SBTET records, the platform provides real-time academic tracking, AI-driven study planning, and an intelligent ECET (Engineering Common Entrance Test) recommendation engine.

## 2. Introduction
Navigating diploma studies and preparing for higher education entrance exams (ECET) is often overwhelming for students due to scattered data and generic advice. DiplomaIQ consolidates a student's entire academic footprint—attendance, backlogs, and SGPA trends—into a single "Command Center."

## 3. Problem Statement
1. **Fragmented Data:** Students lack a unified dashboard to view their historical academic performance and attendance.
2. **Generic Advice:** Standard study plans do not account for individual weak subjects or backlog counts.
3. **ECET Uncertainty:** Predicting college admissions based on raw ranks without historical context leads to poor counseling choices.

## 4. Solution Proposed
DiplomaIQ solves these challenges through three core pillars:
1. **Academic Analytics:** Automated ingestion of SBTET records to visualize SGPA trends, compute health scores, and track attendance.
2. **AI Coach & Study Planner:** Generative AI tools (powered by OpenAI/Gemini) that output highly personalized markdown reports and actionable study schedules based on dynamic database records.
3. **ECET Advisor:** A deterministic matching engine backed by historical cutoff data, supplemented with AI explanations to categorize recommendations into Dream, Moderate, and Safe buckets.

## 5. Core Architecture
The system employs a modern, serverless stack:
- **Frontend/Backend:** Next.js 14+ (App Router, Server Actions)
- **Database & Auth:** InsForge (PostgreSQL BaaS wrapper)
- **Styling:** Tailwind CSS + Shadcn UI
- **Deployment:** Vercel

## 6. Conclusion
DiplomaIQ successfully transitions a student's academic journey from a reactive process to a proactive strategy. By eliminating data silos and wrapping historical performance in highly contextual AI insights, it serves as an indispensable digital counselor.
