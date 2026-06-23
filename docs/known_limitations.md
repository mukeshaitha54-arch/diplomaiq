# Known Limitations

While DiplomaIQ is robust and architecturally sound, evaluators should be aware of the following known limitations in the current build:

## 1. Estimated ECET Dataset
Currently, the `ecet_cutoffs` database table is populated with placeholder/estimated data (`verified_flag = false`). The system logic is 100% complete and accurate, but the data itself will not reflect true real-world cutoffs until the official 2023, 2024, and 2025 TG ECET Last Rank Statement PDFs are parsed and ingested.

## 2. No Live ERP Webhooks
The "Sync SBTET Records" functionality simulates the data ingestion pipeline. In a true enterprise deployment, DiplomaIQ would require official API access or webhooks from the State Board of Technical Education and Training (SBTET) to fetch real-time student data.

## 3. Biometric Login / Attendance
Facial recognition for login and classroom attendance tracking was scoped in initial designs but is currently postponed to v2.0 due to hardware API constraints and privacy/GDPR considerations.

## 4. LLM Generation Latency
Because the AI Coach, Academic Report, and ECET Explanations rely on external APIs (OpenAI/Gemini), response times can occasionally take 3-6 seconds. This is a known constraint of current generation Large Language Models.
