-- ==========================================
-- MIGRATION: Fix Critical Database Issues
-- Date: 2026-05-09
-- Purpose: Fix transactions, foreign keys, indexes
-- ==========================================

-- Step 1: Add missing CASCADE rules
-- ==========================================

-- Drop existing constraints that don't have CASCADE
ALTER TABLE smart_tracker_sessions 
DROP CONSTRAINT IF EXISTS smart_tracker_sessions_teacher_id_fkey;

ALTER TABLE smart_tracker_student_states
DROP CONSTRAINT IF EXISTS smart_tracker_student_states_student_id_fkey;

ALTER TABLE attendance_records
DROP CONSTRAINT IF EXISTS attendance_records_student_id_fkey;

ALTER TABLE student_score_logs
DROP CONSTRAINT IF EXISTS student_score_logs_student_id_fkey;

ALTER TABLE referrals
DROP CONSTRAINT IF EXISTS referrals_student_id_fkey,
DROP CONSTRAINT IF EXISTS referrals_teacher_id_fkey;

-- Re-add with proper CASCADE rules
-- For sessions: If teacher deleted, keep session but set teacher_id to NULL (historical data)
ALTER TABLE smart_tracker_sessions
ADD CONSTRAINT smart_tracker_sessions_teacher_id_fkey 
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL;

-- For student states: If student deleted, CASCADE delete their states
ALTER TABLE smart_tracker_student_states
ADD CONSTRAINT smart_tracker_student_states_student_id_fkey
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- For attendance: If student deleted, CASCADE delete their attendance
ALTER TABLE attendance_records
ADD CONSTRAINT attendance_records_student_id_fkey
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- For score logs: If student deleted, CASCADE delete their logs
ALTER TABLE student_score_logs
ADD CONSTRAINT student_score_logs_student_id_fkey
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- For referrals: If student deleted, CASCADE delete their referrals
ALTER TABLE referrals
ADD CONSTRAINT referrals_student_id_fkey
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- For referrals: If teacher deleted, keep referral but set to NULL (historical)
ALTER TABLE referrals
ADD CONSTRAINT referrals_teacher_id_fkey
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL;


-- Step 2: Fix smart_grade_records_v2 to use student_id instead of national_id
-- ==========================================

-- Add student_id column
ALTER TABLE smart_grade_records_v2 
ADD COLUMN IF NOT EXISTS student_id INTEGER;

-- Populate student_id from national_id
UPDATE smart_grade_records_v2 gr
SET student_id = s.id
FROM students s
WHERE gr.student_national_id = s.national_id;

-- Add foreign key with CASCADE
ALTER TABLE smart_grade_records_v2
ADD CONSTRAINT smart_grade_records_v2_student_id_fkey
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- Create index on new column
CREATE INDEX IF NOT EXISTS idx_smart_grade_records_student_id 
ON smart_grade_records_v2(student_id);

-- Note: Keep student_national_id for now for backward compatibility
-- In future migration, can drop it after confirming all code uses student_id


-- Step 3: Add Performance Indexes
-- ==========================================

-- Foreign key indexes (critical for performance)
CREATE INDEX IF NOT EXISTS idx_attendance_student_id 
ON attendance_records(student_id);

CREATE INDEX IF NOT EXISTS idx_attendance_teacher_id 
ON attendance_records(teacher_id);

CREATE INDEX IF NOT EXISTS idx_attendance_date 
ON attendance_records(date);

CREATE INDEX IF NOT EXISTS idx_smart_tracker_sessions_teacher 
ON smart_tracker_sessions(teacher_id);

CREATE INDEX IF NOT EXISTS idx_smart_tracker_sessions_date 
ON smart_tracker_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_smart_tracker_student_states_session 
ON smart_tracker_student_states(session_id);

CREATE INDEX IF NOT EXISTS idx_smart_tracker_student_states_student 
ON smart_tracker_student_states(student_id);

CREATE INDEX IF NOT EXISTS idx_smart_grade_records_national_id 
ON smart_grade_records_v2(student_national_id);

CREATE INDEX IF NOT EXISTS idx_smart_grade_records_task 
ON smart_grade_records_v2(task_id);

CREATE INDEX IF NOT EXISTS idx_smart_grade_records_updated_at 
ON smart_grade_records_v2(updated_at);

CREATE INDEX IF NOT EXISTS idx_referrals_student 
ON referrals(student_id);

CREATE INDEX IF NOT EXISTS idx_referrals_teacher 
ON referrals(teacher_id);

CREATE INDEX IF NOT EXISTS idx_referrals_status 
ON referrals(status);

CREATE INDEX IF NOT EXISTS idx_student_score_logs_student 
ON student_score_logs(student_id);

CREATE INDEX IF NOT EXISTS idx_student_score_logs_created_at 
ON student_score_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user 
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_reference 
ON notifications(reference_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_students_grade_section 
ON students(grade, section);

CREATE INDEX IF NOT EXISTS idx_students_school 
ON students(school_id);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_subject 
ON teacher_assignments(teacher_id, subject_id);


-- Step 4: Add created_by tracking where missing
-- ==========================================

ALTER TABLE smart_tracker_sessions 
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE smart_tracker_sessions 
ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE smart_tracker_sessions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- Step 5: Add soft delete support (optional - for data recovery)
-- ==========================================

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Indexes for soft delete
CREATE INDEX IF NOT EXISTS idx_students_deleted_at 
ON students(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_deleted_at 
ON users(deleted_at) WHERE deleted_at IS NOT NULL;


-- Step 6: Add audit triggers (optional - for tracking changes)
-- ==========================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record 
ON audit_log(table_name, record_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at 
ON audit_log(created_at);


-- Step 7: Add constraints for data integrity
-- ==========================================

-- Ensure grade and section are not empty
ALTER TABLE students 
ADD CONSTRAINT students_grade_not_empty CHECK (grade IS NOT NULL AND grade != '');

ALTER TABLE students 
ADD CONSTRAINT students_section_not_empty CHECK (section IS NOT NULL AND section != '');

-- Ensure attendance status is valid
ALTER TABLE attendance_records
ADD CONSTRAINT attendance_status_valid 
CHECK (status IN ('حاضر', 'غائب', 'متأخر'));

-- Ensure score is within valid range
ALTER TABLE smart_grade_records_v2
ADD CONSTRAINT smart_grade_score_valid 
CHECK (score >= 0 AND score <= max_score);


-- Step 8: Vacuum and analyze for performance
-- ==========================================

VACUUM ANALYZE students;
VACUUM ANALYZE attendance_records;
VACUUM ANALYZE smart_grade_records_v2;
VACUUM ANALYZE smart_tracker_sessions;
VACUUM ANALYZE smart_tracker_student_states;
VACUUM ANALYZE referrals;
VACUUM ANALYZE student_score_logs;


-- Migration complete!
-- ==========================================
-- Next steps:
-- 1. Update application code to use transactions
-- 2. Update queries to use new student_id in smart_grade_records_v2
-- 3. Test all delete operations with CASCADE
-- 4. Monitor query performance with new indexes
