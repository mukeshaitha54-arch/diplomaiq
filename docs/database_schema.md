# Database Schema (ER Diagram)

The underlying PostgreSQL database is hosted on InsForge and enforces strict relational integrity.

## Entity-Relationship Diagram

```mermaid
erDiagram
    auth_users ||--o| student_profiles : "has profile"
    student_profiles ||--o| academic_summary : "has summary"
    student_profiles ||--o{ semesters : "has many"
    student_profiles ||--o| attendance_records : "has attendance"
    student_profiles ||--o{ usage_analytics : "generates"

    auth_users {
        uuid id PK
        string email
    }

    student_profiles {
        uuid id PK, FK
        string full_name
        string branch
        int current_semester
        jsonb metadata
    }

    academic_summary {
        uuid id PK
        uuid profile_id FK
        float cgpa
        int total_backlogs
        jsonb strong_subjects
        jsonb weak_subjects
    }

    semesters {
        uuid id PK
        uuid profile_id FK
        string semester_code
        float sgpa
        int backlogs
    }

    attendance_records {
        uuid id PK
        uuid profile_id FK
        float percentage
        timestamp last_updated_at
    }

    ecet_cutoffs {
        uuid id PK
        string college_code
        string college_name
        string branch_code
        string category
        string gender
        int closing_rank
        string phase
        int year
        boolean verified_flag
    }

    usage_analytics {
        uuid id PK
        uuid profile_id FK
        string action_type
        string feature_name
        jsonb metadata
        timestamp created_at
    }
```

## Security Posture
All tables (except read-only public tables like `ecet_cutoffs`) have **Row Level Security (RLS)** enabled, ensuring users can only `SELECT`, `INSERT`, or `UPDATE` rows where `profile_id = auth.uid()`.
