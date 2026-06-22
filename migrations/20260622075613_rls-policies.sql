-- Enable RLS for all tables
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- 1. student_profiles (id maps directly to auth.users.id)
CREATE POLICY "Users can view their own profile" ON student_profiles
    FOR SELECT USING (auth.uid() = id);
    
CREATE POLICY "Users can insert their own profile" ON student_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
    
CREATE POLICY "Users can update their own profile" ON student_profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
    
CREATE POLICY "Users can delete their own profile" ON student_profiles
    FOR DELETE USING (auth.uid() = id);

-- 2. academic_summary (uses profile_id)
CREATE POLICY "Users can view their own academic_summary" ON academic_summary
    FOR SELECT USING (auth.uid() = profile_id);
    
CREATE POLICY "Users can insert their own academic_summary" ON academic_summary
    FOR INSERT WITH CHECK (auth.uid() = profile_id);
    
CREATE POLICY "Users can update their own academic_summary" ON academic_summary
    FOR UPDATE USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
    
CREATE POLICY "Users can delete their own academic_summary" ON academic_summary
    FOR DELETE USING (auth.uid() = profile_id);

-- 3. semesters (uses profile_id)
CREATE POLICY "Users can view their own semesters" ON semesters
    FOR SELECT USING (auth.uid() = profile_id);
    
CREATE POLICY "Users can insert their own semesters" ON semesters
    FOR INSERT WITH CHECK (auth.uid() = profile_id);
    
CREATE POLICY "Users can update their own semesters" ON semesters
    FOR UPDATE USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
    
CREATE POLICY "Users can delete their own semesters" ON semesters
    FOR DELETE USING (auth.uid() = profile_id);

-- 4. subjects (uses profile_id)
CREATE POLICY "Users can view their own subjects" ON subjects
    FOR SELECT USING (auth.uid() = profile_id);
    
CREATE POLICY "Users can insert their own subjects" ON subjects
    FOR INSERT WITH CHECK (auth.uid() = profile_id);
    
CREATE POLICY "Users can update their own subjects" ON subjects
    FOR UPDATE USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
    
CREATE POLICY "Users can delete their own subjects" ON subjects
    FOR DELETE USING (auth.uid() = profile_id);

-- 5. attendance_records (uses profile_id)
CREATE POLICY "Users can view their own attendance_records" ON attendance_records
    FOR SELECT USING (auth.uid() = profile_id);
    
CREATE POLICY "Users can insert their own attendance_records" ON attendance_records
    FOR INSERT WITH CHECK (auth.uid() = profile_id);
    
CREATE POLICY "Users can update their own attendance_records" ON attendance_records
    FOR UPDATE USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
    
CREATE POLICY "Users can delete their own attendance_records" ON attendance_records
    FOR DELETE USING (auth.uid() = profile_id);

-- 6. sync_logs (uses profile_id)
CREATE POLICY "Users can view their own sync_logs" ON sync_logs
    FOR SELECT USING (auth.uid() = profile_id);
    
CREATE POLICY "Users can insert their own sync_logs" ON sync_logs
    FOR INSERT WITH CHECK (auth.uid() = profile_id);
    
CREATE POLICY "Users can update their own sync_logs" ON sync_logs
    FOR UPDATE USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
    
CREATE POLICY "Users can delete their own sync_logs" ON sync_logs
    FOR DELETE USING (auth.uid() = profile_id);
