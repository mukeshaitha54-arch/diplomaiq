CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. student_profiles
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    pin VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    branch VARCHAR(10) NOT NULL,
    college_name VARCHAR(150),
    scheme VARCHAR(20) NOT NULL, 
    current_semester INTEGER NOT NULL,
    ecet_score INTEGER DEFAULT 0,
    placement_score INTEGER DEFAULT 0,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. academic_summary
CREATE TABLE academic_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE REFERENCES student_profiles(id) ON DELETE CASCADE,
    cgpa DECIMAL(4, 2) DEFAULT 0.00,
    total_backlogs INTEGER DEFAULT 0,
    health_score INTEGER DEFAULT 0,
    ecet_score INTEGER DEFAULT 0,
    placement_score INTEGER DEFAULT 0,
    strong_subjects TEXT[],
    weak_subjects TEXT[],
    last_calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. semesters
CREATE TABLE semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL,
    sgpa DECIMAL(4, 2),
    total_credits INTEGER DEFAULT 0,
    is_passed BOOLEAN DEFAULT false,
    published_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, semester_number)
);

-- 4. subjects
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL,
    subject_code VARCHAR(20) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    internal_marks INTEGER,
    external_marks INTEGER,
    total_marks INTEGER,
    grade VARCHAR(5),
    credits INTEGER DEFAULT 0,
    result_status VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, semester_number, subject_code)
);

-- 5. attendance_records
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    total_working_days INTEGER NOT NULL,
    days_present INTEGER NOT NULL,
    attendance_percentage DECIMAL(5, 2) NOT NULL,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, semester)
);

-- 6. sync_logs
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, 
    records_synced INTEGER DEFAULT 0,
    duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
