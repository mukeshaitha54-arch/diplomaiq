# System Architecture

DiplomaIQ utilizes a decoupled, modern serverless architecture.

## High-Level Architecture Diagram

```mermaid
flowchart TD
    Client[Client / Browser]
    NextJS[Next.js App Router on Vercel]
    InsForge[(InsForge Backend)]
    SBTET[SBTET Portal]
    LLM[OpenAI / Gemini API]

    Client <-->|React Components / RSC| NextJS
    NextJS <-->|Server Actions / SDK| InsForge
    NextJS -->|Puppeteer / Axios| SBTET
    NextJS <-->|Prompts & Context| LLM

    subgraph InsForge Backend [InsForge Platform]
        DB[(PostgreSQL)]
        Auth[GoTrue Auth]
        RLS[Row Level Security]
        Auth --> RLS --> DB
    end

    subgraph NextJS [Next.js App Router]
        Pages[UI Components]
        Actions[Server Actions]
        ContextCache[React Cache]
        Pages --> Actions
        Actions --> ContextCache
    end
```

## Component Breakdown

1. **Next.js (App Router):** Handles routing, rendering (SSR/CSR), and secure backend communication via Server Actions.
2. **React Cache:** Used within `getStudentContext()` to deduplicate database queries during a single request lifecycle, drastically improving performance.
3. **InsForge:** Provides secure JWT-based authentication and a managed PostgreSQL database protected by Row Level Security (RLS) policies.
4. **AI Layer:** Converts deterministic DB queries (like weak subjects or ECET cutoffs) into human-readable strategies and explanations without hallucinating facts.
