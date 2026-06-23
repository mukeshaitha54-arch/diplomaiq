-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. student_profiles
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    pin VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    branch VARCHAR(10) NOT NULL,
    college_name VARCHAR(150),
    scheme VARCHAR(20) NOT NULL, -- e.g., 'C18', 'C21'
    current_semester INTEGER NOT NULL,
    ecet_score INTEGER DEFAULT 0,
    placement_score INTEGER DEFAULT 0,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. academic_summary (New)
CREATE TABLE academic_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE REFERENCES student_profiles(id) ON DELETE CASCADE,
    cgpa DECIMAL(4, 2) DEFAULT 0.00,
    total_backlogs INTEGER DEFAULT 0,
    health_score INTEGER DEFAULT 0,
    ecet_score INTEGER DEFAULT 0,
    placement_score INTEGER DEFAULT 0,
    strong_subjects TEXT[], -- Array of subject codes or names
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
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, semester_number)
);

-- 4. subjects
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
    subject_code VARCHAR(20) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    internal_marks INTEGER,
    external_marks INTEGER,
    total_marks INTEGER,
    grade VARCHAR(5),
    credits INTEGER DEFAULT 0,
    is_backlog BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(semester_id, subject_code)
);

-- 5. attendance_records
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL,
    total_classes INTEGER NOT NULL,
    attended_classes INTEGER NOT NULL,
    percentage DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN total_classes = 0 THEN 0 
        ELSE (attended_classes::DECIMAL / total_classes) * 100 END
    ) STORED,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. sync_logs
CREATE TABLE sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL, -- 'ATTENDANCE', 'RESULTS', 'FULL'
    status VARCHAR(20) NOT NULL, -- 'PENDING', 'SUCCESS', 'FAILED'
    records_synced INTEGER DEFAULT 0,
    duration_ms INTEGER,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 7. notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'ALERT', 'WARNING', 'INFO'
    priority VARCHAR(20) DEFAULT 'NORMAL', -- 'HIGH', 'NORMAL', 'LOW'
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. admin_profiles
CREATE TABLE admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES --

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- student_profiles
CREATE POLICY "Students can view own profile" 
ON student_profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Students can update own profile" 
ON student_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Students can insert own profile" 
ON student_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- academic_summary
CREATE POLICY "Students can view own summary" 
ON academic_summary FOR SELECT USING (auth.uid() = profile_id);

-- semesters
CREATE POLICY "Users can access own semesters" 
ON semesters FOR ALL USING (profile_id = auth.uid());

-- subjects
CREATE POLICY "Users can access own subjects" 
ON subjects FOR ALL USING (
    semester_id IN (SELECT id FROM semesters WHERE profile_id = auth.uid())
);

-- attendance_records
CREATE POLICY "Users can access own attendance" 
ON attendance_records FOR ALL USING (profile_id = auth.uid());

-- sync_logs
CREATE POLICY "Users can access own sync logs" 
ON sync_logs FOR ALL USING (profile_id = auth.uid());

-- notifications
CREATE POLICY "Users can access own notifications" 
ON notifications FOR ALL USING (profile_id = auth.uid());

-- admin_profiles
CREATE POLICY "Admins can view own profile" 
ON admin_profiles FOR SELECT USING (auth.uid() = id);

-- 9. ecet_cutoffs
CREATE TABLE ecet_cutoffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL,
    round INTEGER NOT NULL DEFAULT 1,
    college_code VARCHAR(20) NOT NULL,
    college_name VARCHAR(150) NOT NULL,
    branch_code VARCHAR(10) NOT NULL,
    branch_name VARCHAR(100) NOT NULL,
    category VARCHAR(10) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    closing_rank INTEGER NOT NULL,
    
    -- Source Tracking Fields
    source VARCHAR(255),
    source_type VARCHAR(50) DEFAULT 'unverified', -- 'official_pdf', 'unverified', 'estimated'
    confidence_score DECIMAL(5,2) DEFAULT 0.0,
    verified_flag BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ecet_cutoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for ecet_cutoffs" 
ON ecet_cutoffs FOR SELECT USING (true);
