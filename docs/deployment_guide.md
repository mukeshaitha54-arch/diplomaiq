# Deployment Guide

DiplomaIQ is designed to be easily deployed using modern GitOps workflows.

## 1. Prerequisites
- Node.js (v18+)
- InsForge CLI installed globally (`npm i -g @insforge/cli`)
- Vercel Account connected to GitHub

## 2. Backend Provisioning (InsForge)
1. Navigate to the project root.
2. Initialize the project: `npx insforge init`
3. Push the migrations to the cloud:
   ```bash
   npx insforge db push
   ```
4. Copy the API keys generated into your local `.env.local` file:
   ```env
   NEXT_PUBLIC_INSFORGE_URL="https://[YOUR_PROJECT_ID].insforge.app"
   NEXT_PUBLIC_INSFORGE_ANON_KEY="your_anon_key"
   INSFORGE_API_KEY="your_service_role_key"
   ```

## 3. Frontend Deployment (Vercel)
1. Push the repository to GitHub.
2. Log into Vercel and Import the Repository.
3. In the Vercel Dashboard, go to **Settings > Environment Variables**.
4. Add all three keys from step 2, plus your LLM API Key:
   - `OPENAI_API_KEY` or `GEMINI_API_KEY`
5. Click **Deploy**.

## 4. Post-Deployment
- Navigate to the InsForge dashboard to configure the SMTP settings (in `insforge.toml`) to ensure Auth verification emails are sent properly.
- Run the initial `verified_flag = true` dataset ingestion script when the official ECET PDFs are parsed.
