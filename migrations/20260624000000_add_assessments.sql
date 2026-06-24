-- Unified Assessment Tracking Schema

CREATE TABLE IF NOT EXISTS assessment_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    assessment_type VARCHAR(20) NOT NULL, -- semester, mid1, mid2, internal, supply, current
    aggregate_score DECIMAL(5,2) DEFAULT 0,
    total_failed_subjects INTEGER DEFAULT 0,
    strong_subjects TEXT[],
    weak_subjects TEXT[],
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, assessment_type)
);

CREATE TABLE IF NOT EXISTS assessment_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    assessment_type VARCHAR(20) NOT NULL,
    semester_number INTEGER NOT NULL,
    performance_index DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, assessment_type, semester_number)
);

CREATE TABLE IF NOT EXISTS assessment_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_instance_id UUID REFERENCES assessment_instances(id) ON DELETE CASCADE,
    subject_code VARCHAR(20) NOT NULL,
    subject_name VARCHAR(150) NOT NULL,
    marks_obtained DECIMAL(5,2) DEFAULT 0,
    max_marks INTEGER DEFAULT 20,
    grade VARCHAR(5),
    is_failed BOOLEAN DEFAULT false,
    attempt_number INTEGER DEFAULT 1,
    UNIQUE(assessment_instance_id, subject_code, attempt_number)
);

CREATE TABLE IF NOT EXISTS prediction_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    predicted_sgpa DECIMAL(4,2),
    predicted_cgpa DECIMAL(4,2),
    predicted_backlogs INTEGER DEFAULT 0,
    pass_probability DECIMAL(5,2),
    confidence_score DECIMAL(5,2),
    confidence_level VARCHAR(20),
    subject_risk_scores JSONB DEFAULT '{}',
    weak_subject_alerts TEXT[],
    improvement_opportunities TEXT[],
    risk_level VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
