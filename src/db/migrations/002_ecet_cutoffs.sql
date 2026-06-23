-- Migration: ECET Cutoffs Table

CREATE TABLE IF NOT EXISTS ecet_cutoffs (
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

-- Enable RLS
ALTER TABLE ecet_cutoffs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to ECET cutoffs
CREATE POLICY "Public read access for ecet_cutoffs" 
ON ecet_cutoffs FOR SELECT USING (true);
