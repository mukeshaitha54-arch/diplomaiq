# Future Scope & v2.0 Roadmap

DiplomaIQ's decoupled architecture makes it highly extensible. The following features are slated for future development:

## 1. Official Dataset Ingestion Pipeline
The immediate next step is building the Python/Node script to parse the official TG ECET PDF Last Rank Statements. Because the frontend relies entirely on the database, replacing the mock data with official data will require zero UI changes.

## 2. Facial Recognition Suite
Implementing browser-based biometric APIs to allow for password-less student logins. Additionally, this module could be extended to classroom settings to automatically update the `attendance_records` table without manual teacher input.

## 3. Career & Placement Module
Currently, the system focuses solely on higher education (ECET). v2.0 will introduce an AI Resume Analyzer and a Tech Interview Coach. It will cross-reference the student's `strong_subjects` with current market demands to suggest specific job roles.

## 4. Admin & Faculty Dashboard
A dedicated view for college administrators to view aggregate analytics. Using the `usage_analytics` table, administrators can see which features students rely on the most, and identify at-risk students before final exams using the SGPA trend data.
