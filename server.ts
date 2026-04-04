import express from "express";
import { createServer as createViteServer } from "vite";
import { neon } from "@neondatabase/serverless";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
import * as XLSX from "xlsx";

// تعريف مسارات النظام لتجنب مشكلة Render
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);

// Initialize database
async function initDb() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT, -- 'teacher', 'vice_principal', 'counselor', 'admin'
        is_active BOOLEAN DEFAULT TRUE,
        phone_number TEXT,
        whatsapp_enabled BOOLEAN DEFAULT TRUE,
        sync_code TEXT
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS schools (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        subscription_end_date TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        greenapi_instance_id TEXT,
        greenapi_token TEXT
      )
    `;

    // Check if default school exists
    const defaultSchool = await sql`SELECT id FROM schools WHERE id = 1`;
    if (defaultSchool.length === 0) {
      await sql`
        INSERT INTO schools (name, subscription_end_date, is_active)
        VALUES ('ثانوية أم القرى', '1446-12-30', true)
      `;
    }

    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id),
        name TEXT,
        national_id TEXT UNIQUE,
        grade TEXT,
        section TEXT,
        parent_phone TEXT
      )
    `;

    try {
      await sql`ALTER TABLE students ADD CONSTRAINT students_national_id_key UNIQUE (national_id)`;
    } catch (e) {
      // Constraint might already exist
    }

    try {
      await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id)`;
      await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone TEXT`;
    } catch (e) {
      // Column might already exist, ignore
    }

    await sql`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id),
        teacher_id INTEGER REFERENCES users(id),
        assigned_to_id INTEGER REFERENCES users(id),
        type TEXT, -- 'behavior', 'academic', 'attendance', 'uniform'
        severity TEXT, -- 'low', 'medium', 'high'
        reason TEXT,
        teacher_notes TEXT,
        remedial_plan TEXT,
        status TEXT, -- 'pending_vp', 'pending_counselor', 'resolved', 'closed'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`ALTER TABLE referrals ADD COLUMN IF NOT EXISTS remedial_plan TEXT`;
    await sql`ALTER TABLE referrals ADD COLUMN IF NOT EXISTS remedial_plan_file TEXT`;
    await sql`ALTER TABLE referrals ADD COLUMN IF NOT EXISTS evidence_file TEXT`;
    await sql`ALTER TABLE referrals ADD COLUMN IF NOT EXISTS is_exported_to_noor BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id)`;
    await sql`UPDATE users SET school_id = 1 WHERE school_id IS NULL`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT TRUE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE'`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id TEXT`;

    // New Columns for Students (Behavior & Attendance)
    await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS behavior_score INT DEFAULT 80`;
    await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS bonus_score INT DEFAULT 0`;
    await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS attendance_score INT DEFAULT 100`;
    await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS parent_phone TEXT`;

    // Behavioral Violations Dictionary Table (Official 1447 AH)
    await sql`
      CREATE TABLE IF NOT EXISTS behavioral_violations_dict (
        id SERIAL PRIMARY KEY,
        category TEXT NOT NULL, -- 'تجاه الطلبة والمدرسة' / 'تجاه الهيئة التعليمية'
        violation_name TEXT NOT NULL,
        degree INTEGER NOT NULL,
        deduction_points INTEGER NOT NULL,
        procedures JSON
      )
    `;

    // Update Referrals with Violation ID and Remedial Actions
    // Drop old constraint if it exists and add the correct one
    try {
      await sql`ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_violation_id_fkey`;
    } catch (e) {}
    
    await sql`ALTER TABLE referrals ADD COLUMN IF NOT EXISTS violation_id INTEGER`;
    
    try {
      await sql`ALTER TABLE referrals ADD CONSTRAINT referrals_violation_id_fkey FOREIGN KEY (violation_id) REFERENCES behavioral_violations_dict(id)`;
    } catch (e) {
      // Constraint might already exist
    }
    
    await sql`ALTER TABLE referrals ADD COLUMN IF NOT EXISTS applied_remedial_actions JSON`;

    // Student Score Logs Table
    await sql`
      CREATE TABLE IF NOT EXISTS student_score_logs (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id),
        action_type TEXT, -- 'deduction', 'bonus', 'compensation'
        points_changed INTEGER,
        reason_or_evidence TEXT,
        created_by_user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Ensure national_id is unique if table already exists
    try {
      await sql`ALTER TABLE students ADD CONSTRAINT students_national_id_key UNIQUE (national_id)`;
    } catch (e) {
      // Constraint might already exist
    }

    await sql`
      CREATE TABLE IF NOT EXISTS referral_logs (
        id SERIAL PRIMARY KEY,
        referral_id INTEGER REFERENCES referrals(id),
        user_id INTEGER REFERENCES users(id),
        action TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`ALTER TABLE referral_logs ADD COLUMN IF NOT EXISTS evidence_file TEXT`;
    await sql`ALTER TABLE referral_logs ADD COLUMN IF NOT EXISTS evidence_text TEXT`;

    await sql`
      CREATE TABLE IF NOT EXISTS user_grades (
        user_id INTEGER REFERENCES users(id),
        grade TEXT,
        PRIMARY KEY (user_id, grade)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        school_id INTEGER,
        user_id INTEGER REFERENCES users(id),
        sender_id INTEGER REFERENCES users(id),
        title TEXT,
        message TEXT,
        reference_id INTEGER REFERENCES referrals(id),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id),
        teacher_id INTEGER REFERENCES users(id),
        class_id TEXT,
        date DATE DEFAULT CURRENT_DATE,
        period INTEGER,
        status TEXT, -- 'حاضر', 'غائب', 'متأخر', 'مستأذن'
        is_excused BOOLEAN DEFAULT FALSE,
        excuse_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `;

    try {
      await sql`ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS excuse_reason TEXT`;
      await sql`ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS modified_by INTEGER REFERENCES users(id)`;
      await sql`ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS modified_at TIMESTAMP`;
    } catch (e) {
      // Ignore if column already exists or other error
    }

    await sql`
      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        is_elective BOOLEAN DEFAULT FALSE,
        grade TEXT,
        semester TEXT
      )
    `;

    try {
      await sql`ALTER TABLE subjects ADD COLUMN IF NOT EXISTS is_elective BOOLEAN DEFAULT FALSE`;
      await sql`ALTER TABLE subjects ADD COLUMN IF NOT EXISTS grade TEXT`;
      await sql`ALTER TABLE subjects ADD COLUMN IF NOT EXISTS semester TEXT`;
    } catch (e) {
      // Ignore if columns already exist
    }

    await sql`
      CREATE TABLE IF NOT EXISTS teacher_assignments (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
        class_id TEXT NOT NULL
      )
    `;

    // Smart Tracker Tables
    await sql`
      CREATE TABLE IF NOT EXISTS smart_tracker_sessions (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER REFERENCES users(id),
        grade TEXT,
        section TEXT,
        subject TEXT,
        date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(teacher_id, grade, section, subject, date)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS smart_tracker_tasks (
        id TEXT PRIMARY KEY,
        session_id INTEGER REFERENCES smart_tracker_sessions(id) ON DELETE CASCADE,
        category TEXT,
        name TEXT,
        max_grade INTEGER,
        type TEXT,
        date DATE
      )
    `;

    try {
      await sql`ALTER TABLE smart_tracker_tasks ADD COLUMN date DATE`;
    } catch (e) {
      // Ignore if column already exists
    }

    await sql`
      CREATE TABLE IF NOT EXISTS smart_tracker_student_states (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES smart_tracker_sessions(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id),
        attendance TEXT,
        behavior_chips JSONB DEFAULT '[]'::jsonb,
        UNIQUE(session_id, student_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS smart_tracker_templates (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        tasks JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS smart_tracker_student_grades (
        id SERIAL PRIMARY KEY,
        student_state_id INTEGER REFERENCES smart_tracker_student_states(id) ON DELETE CASCADE,
        task_id TEXT REFERENCES smart_tracker_tasks(id) ON DELETE CASCADE,
        grade NUMERIC,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_state_id, task_id)
      )
    `;

    // New Identity-Centric Architecture Tables
    await sql`
      CREATE TABLE IF NOT EXISTS smart_tasks_v2 (
        id TEXT PRIMARY KEY,
        title TEXT,
        max_score INTEGER,
        noor_category TEXT,
        term TEXT,
        subject TEXT,
        grade TEXT,
        teacher_id INTEGER REFERENCES users(id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS smart_grade_records_v2 (
        id SERIAL PRIMARY KEY,
        student_national_id TEXT REFERENCES students(national_id),
        task_id TEXT REFERENCES smart_tasks_v2(id) ON DELETE CASCADE,
        score NUMERIC,
        teacher_id INTEGER REFERENCES users(id),
        recorded_at_class_id TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_national_id, task_id)
      )
    `;

    try {
      await sql`ALTER TABLE smart_tracker_student_grades ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
    } catch (e) {
      // Ignore if column already exists
    }

    try {
      await sql`ALTER TABLE users ADD COLUMN sync_code TEXT`;
    } catch (e) {
      // Ignore if column already exists
    }

    // Fix existing users created by admin before the fix
    await sql`UPDATE users SET is_phone_verified = TRUE WHERE status = 'ACTIVE' AND is_phone_verified = FALSE`;

    await sql`
      CREATE TABLE IF NOT EXISTS passes (
        id TEXT PRIMARY KEY,
        student_id TEXT,
        student_name TEXT NOT NULL,
        teacher_id TEXT,
        teacher_name TEXT NOT NULL,
        teacher_phone TEXT,
        period TEXT,
        type TEXT NOT NULL,
        reason TEXT,
        timestamp TEXT NOT NULL,
        date TEXT,
        status TEXT DEFAULT 'pending',
        agent_name TEXT,
        school_id INTEGER REFERENCES schools(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
      )
    `;

    try {
      await sql`ALTER TABLE passes ADD COLUMN IF NOT EXISTS date TEXT`;
    } catch (e) {
      // Ignore if column already exists
    }

    try {
      await sql`ALTER TABLE passes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`;
    } catch (e) {
      // Ignore if column already exists
    }

    try {
      await sql`ALTER TABLE passes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`;
    } catch (e) {
      // Ignore if column already exists
    }

    // Seed data if empty
    const usersCount = await sql`SELECT COUNT(*) as count FROM users`;
    if (parseInt(usersCount[0].count) === 0) {
      await sql`INSERT INTO users (name, email, password, role) VALUES ('أ. محمد الأحمد', 'teacher@school.edu', 'password', 'teacher')`;
      await sql`INSERT INTO users (name, email, password, role) VALUES ('أ. فهد السالم', 'vp@school.edu', 'password', 'vice_principal')`;
      await sql`INSERT INTO users (name, email, password, role) VALUES ('أ. محمد الفهيد', 'counselor@school.edu', 'password', 'counselor')`;
      await sql`INSERT INTO users (name, email, password, role) VALUES ('د. خالد المنصور', 'principal@school.edu', 'password', 'principal')`;
      await sql`INSERT INTO users (name, email, password, role) VALUES ('مدير النظام', 'admin@school.edu', 'password', 'admin')`;

      await sql`INSERT INTO students (name, national_id, grade, section) VALUES ('أحمد محمد', '1100223344', 'الصف الثالث', 'أ')`;
      await sql`INSERT INTO students (name, national_id, grade, section) VALUES ('خالد علي', '1100223355', 'الصف الثاني', 'ب')`;
      await sql`INSERT INTO students (name, national_id, grade, section) VALUES ('سعد عبدالله', '1100223366', 'الصف الأول', 'ج')`;
      await sql`INSERT INTO students (name, national_id, grade, section) VALUES ('فهد ناصر', '1100223377', 'الصف الثاني', 'أ')`;
      await sql`INSERT INTO students (name, national_id, grade, section) VALUES ('عمر يوسف', '1100223388', 'الصف الثالث', 'ج')`;
    }

    // Ensure admin user exists
    const adminExists = await sql`SELECT * FROM users WHERE role = 'admin'`;
    if (adminExists.length === 0) {
      await sql`INSERT INTO users (name, email, password, role) VALUES ('مدير النظام', 'admin@school.edu', 'password', 'admin')`;
    }

    // Ensure principal user exists
    const principalExists = await sql`SELECT * FROM users WHERE role = 'principal'`;
    if (principalExists.length === 0) {
      await sql`INSERT INTO users (name, email, password, role) VALUES ('د. خالد المنصور', 'principal@school.edu', 'password', 'principal')`;
    }

    // Ensure test teachers exist
    const testTeacher1 = await sql`SELECT * FROM users WHERE email = 'teacher@test.com'`;
    if (testTeacher1.length === 0) {
      await sql`INSERT INTO users (name, email, password, role, is_active, is_phone_verified, status, national_id) VALUES ('معلم تجربة', 'teacher@test.com', '123', 'teacher', true, true, 'ACTIVE', '1000000001')`;
    }
    
    const testTeacher2 = await sql`SELECT * FROM users WHERE email = 'teacher2@test.com'`;
    if (testTeacher2.length === 0) {
      await sql`INSERT INTO users (name, email, password, role, is_active, is_phone_verified, status, national_id) VALUES ('معلم تجربة 2', 'teacher2@test.com', '123', 'teacher', true, true, 'ACTIVE', '1000000006')`;
    }

    // Seed official subjects
    const subjectsCount = await sql`SELECT COUNT(*) as count FROM subjects`;
    if (parseInt(subjectsCount[0].count) === 0) {
      const defaultSchoolId = 1;
      const officialSubjects = [
        // Grade 1, Semester 1
        { name: 'القرآن الكريم وتفسيره', grade: 'الصف الأول', semester: 'الفصل الأول', is_elective: false },
        { name: 'الرياضيات', grade: 'الصف الأول', semester: 'الفصل الأول', is_elective: false },
        { name: 'اللغة الإنجليزية', grade: 'الصف الأول', semester: 'الفصل الأول', is_elective: false },
        { name: 'التقنية الرقمية', grade: 'الصف الأول', semester: 'الفصل الأول', is_elective: false },
        { name: 'الأحياء', grade: 'الصف الأول', semester: 'الفصل الأول', is_elective: false },
        { name: 'الكيمياء', grade: 'الصف الأول', semester: 'الفصل الأول', is_elective: false },
        { name: 'الكفايات اللغوية', grade: 'الصف الأول', semester: 'الفصل الأول', is_elective: false },
        { name: 'التفكير الناقد', grade: 'الصف الأول', semester: 'الفصل الأول', is_elective: false },
        { name: 'التربية الصحية والبدنية', grade: 'الصف الأول', semester: 'الفصل الأول', is_elective: false },
        // Grade 1, Semester 2
        { name: 'الحديث', grade: 'الصف الأول', semester: 'الفصل الثاني', is_elective: false },
        { name: 'الرياضيات', grade: 'الصف الأول', semester: 'الفصل الثاني', is_elective: false },
        { name: 'اللغة الإنجليزية', grade: 'الصف الأول', semester: 'الفصل الثاني', is_elective: false },
        { name: 'التقنية الرقمية', grade: 'الصف الأول', semester: 'الفصل الثاني', is_elective: false },
        { name: 'علم البيئة', grade: 'الصف الأول', semester: 'الفصل الثاني', is_elective: false },
        { name: 'التربية المهنية', grade: 'الصف الأول', semester: 'الفصل الثاني', is_elective: false },
        { name: 'الفيزياء', grade: 'الصف الأول', semester: 'الفصل الثاني', is_elective: false },
        { name: 'الكفايات اللغوية', grade: 'الصف الأول', semester: 'الفصل الثاني', is_elective: false },
        { name: 'التربية الصحية والبدنية', grade: 'الصف الأول', semester: 'الفصل الثاني', is_elective: false },
        // Grade 2, Semester 1
        { name: 'الرياضيات', grade: 'الصف الثاني', semester: 'الفصل الأول', is_elective: false },
        { name: 'اللغة الإنجليزية', grade: 'الصف الثاني', semester: 'الفصل الأول', is_elective: false },
        { name: 'الأحياء', grade: 'الصف الثاني', semester: 'الفصل الأول', is_elective: false },
        { name: 'الكيمياء', grade: 'الصف الثاني', semester: 'الفصل الأول', is_elective: false },
        { name: 'الفيزياء', grade: 'الصف الثاني', semester: 'الفصل الأول', is_elective: false },
        { name: 'الكفايات اللغوية', grade: 'الصف الثاني', semester: 'الفصل الأول', is_elective: false },
        { name: 'التاريخ', grade: 'الصف الثاني', semester: 'الفصل الأول', is_elective: false },
        { name: 'المعرفة المالية', grade: 'الصف الثاني', semester: 'الفصل الأول', is_elective: false },
        { name: 'الدراسات الاجتماعية', grade: 'الصف الثاني', semester: 'الفصل الأول', is_elective: false },
        { name: 'اللياقة والثقافة الصحية', grade: 'الصف الثاني', semester: 'الفصل الأول', is_elective: false },
        // Grade 2, Semester 2
        { name: 'التوحيد', grade: 'الصف الثاني', semester: 'الفصل الثاني', is_elective: false },
        { name: 'الرياضيات', grade: 'الصف الثاني', semester: 'الفصل الثاني', is_elective: false },
        { name: 'اللغة الإنجليزية', grade: 'الصف الثاني', semester: 'الفصل الثاني', is_elective: false },
        { name: 'التقنية الرقمية', grade: 'الصف الثاني', semester: 'الفصل الثاني', is_elective: false },
        { name: 'علوم الأرض والفضاء', grade: 'الصف الثاني', semester: 'الفصل الثاني', is_elective: false },
        { name: 'الكيمياء', grade: 'الصف الثاني', semester: 'الفصل الثاني', is_elective: false },
        { name: 'الفيزياء', grade: 'الصف الثاني', semester: 'الفصل الثاني', is_elective: false },
        { name: 'الفنون', grade: 'الصف الثاني', semester: 'الفصل الثاني', is_elective: false },
        { name: 'التربية الصحية والبدنية', grade: 'الصف الثاني', semester: 'الفصل الثاني', is_elective: false },
        { name: 'البحث ومصادر المعلومات', grade: 'الصف الثاني', semester: 'الفصل الثاني', is_elective: false },
        // Grade 3, Semester 1
        { name: 'الفقه', grade: 'الصف الثالث', semester: 'الفصل الأول', is_elective: false },
        { name: 'الرياضيات', grade: 'الصف الثالث', semester: 'الفصل الأول', is_elective: false },
        { name: 'اللغة الإنجليزية', grade: 'الصف الثالث', semester: 'الفصل الأول', is_elective: false },
        { name: 'المواطنة الرقمية', grade: 'الصف الثالث', semester: 'الفصل الأول', is_elective: false },
        { name: 'علوم الأرض والفضاء', grade: 'الصف الثالث', semester: 'الفصل الأول', is_elective: false },
        { name: 'الفيزياء', grade: 'الصف الثالث', semester: 'الفصل الأول', is_elective: false },
        { name: 'الدراسات الأدبية', grade: 'الصف الثالث', semester: 'الفصل الأول', is_elective: false },
        { name: 'المهارات الحياتية', grade: 'الصف الثالث', semester: 'الفصل الأول', is_elective: false },
        { name: 'الجغرافيا', grade: 'الصف الثالث', semester: 'الفصل الأول', is_elective: false },
        { name: 'الدراسات النفسية والاجتماعية', grade: 'الصف الثالث', semester: 'الفصل الأول', is_elective: false },
        // Grade 3, Semester 2
        { name: 'الرياضيات', grade: 'الصف الثالث', semester: 'الفصل الثاني', is_elective: false },
        { name: 'اللغة الإنجليزية', grade: 'الصف الثالث', semester: 'الفصل الثاني', is_elective: false },
        { name: 'الفيزياء', grade: 'الصف الثالث', semester: 'الفصل الثاني', is_elective: false },
        // Electives
        { name: 'التصميم الرقمي', grade: null, semester: null, is_elective: true },
        { name: 'المهارات الإدارية', grade: null, semester: null, is_elective: true },
        { name: 'التنمية المستدامة', grade: null, semester: null, is_elective: true },
        { name: 'الكتابة الوظيفية والإبداعية', grade: null, semester: null, is_elective: true },
        { name: 'فن تصميم الأزياء', grade: null, semester: null, is_elective: true },
        { name: 'الإسعافات الأولية', grade: null, semester: null, is_elective: true },
        { name: 'الأمن السيبراني', grade: null, semester: null, is_elective: true },
        { name: 'السياحة والضيافة', grade: null, semester: null, is_elective: true },
        { name: 'الذكاء الاصطناعي', grade: null, semester: null, is_elective: true }
      ];

      for (const sub of officialSubjects) {
        await sql`INSERT INTO subjects (name, school_id, grade, semester, is_elective) VALUES (${sub.name}, ${defaultSchoolId}, ${sub.grade}, ${sub.semester}, ${sub.is_elective})`;
      }
    }

    // Seed mock attendance data for today if empty
    const attendanceCount = await sql`SELECT COUNT(*) as count FROM attendance_records WHERE date = CURRENT_DATE`;
    if (parseInt(attendanceCount[0].count) === 0) {
      const teacher = await sql`SELECT id FROM users WHERE role = 'teacher' LIMIT 1`;
      const students = await sql`SELECT id, grade, section FROM students WHERE grade = 'الصف الثالث' AND section = 'أ'`;
      
      if (teacher.length > 0 && students.length > 0) {
        const teacherId = teacher[0].id;
        for (const student of students) {
          await sql`
            INSERT INTO attendance_records (student_id, teacher_id, class_id, date, period, status, created_at)
            VALUES (${student.id}, ${teacherId}, 'الصف الثالث-أ', CURRENT_DATE, 3, 'حاضر', CURRENT_TIMESTAMP - INTERVAL '2 hours')
          `;
        }
      }
    }

    // Seed Behavioral Violations Dictionary
    const behavioralViolationsCount = await sql`SELECT COUNT(*) as count FROM behavioral_violations_dict`;
    if (parseInt(behavioralViolationsCount[0].count) === 0) {
      const generalProcedures: string[] = [];

      const degree1Procedures = [
        "الإجراء الأول: التنبيه الشفهي الأول من المعلم أو إدارة المدرسة للطالب عن السلوك وأضراره المترتبة، وكونه يعد سلوكا غير مرغوب بأسلوب تربوي حكيم.",
        "الإجراء الثاني: التنبيه الشفهي الثاني من المعلم، أو إدارة المدرسة عند مباشرة الموقف بأسلوب تربوي حكيم، وتعزيز السلوك الإيجابي. ملاحظة الطالب وحصر السلوكيات السلبية والإيجابية، ومسببات حدوثها، والبدء بالحد من مسببات السلوك السلبي، وتعزيز السلوك الإيجابي.",
        "الإجراء الثالث (بدء الحسم): تدوين المشكلة السلوكية من المعلم المباشر للموقف، وتوقيع الطالب عليها. إشعار ولي أمر الطالب هاتفيًا بمشكلة الطالب السلوكية، والتنسيق معه لتعديل السلوك المخالف. حسم درجة من درجات السلوك الإيجابي للطالب من قبل إدارة المدرسة، مع تمكينه من فرص التعويض وإشعار ولي الأمر بذلك. تحويل الطالب إلى الموجه الطلابي لدراسة حالته.",
        "الإجراء الرابع: دعوة ولي أمر الطالب واخطاره بسلوك الطالب غير المرغوب فيه، والاتفاق على خطة لتعديل السلوك بين الأسرة والمدرسة يقوم بها الموجه الطلابي. حسم درجة من درجات السلوك الإيجابي للطالب، مع تمكينه من فرص التعويض وإشعار ولي الأمر بذلك. تحويل الطالب إلى لجنة التوجيه الطلابي في المدرسة لبحث أسباب عدم استجابة الطالب لإجراءات تعديل السلوك. يتابع الموجه الطلابي حالته لتقديم الخدمات التربوية."
      ];

      const degree2Procedures = [
        "الإجراء الأول: تحويل الطالب إلى إدارة المدرسة. إشعار ولي الأمر هاتفيا بمشكلة الطالب السلوكية والإجراءات المتخذة. حسم درجتين من درجات السلوك الإيجابي للطالب مع تمكينه من فرص التعويض. أخذ تعهد خطي على الطالب بعدم تكرار المخالفة. تحويل الطالب إلى الموجه الطلابي لدراسة حالته.",
        "الإجراء الثاني: جميع ما ذكر في الإجراء الأول. دعوة ولي أمر الطالب حضوريا، ومناقشته في خطة تعديل السلوك، ووضع برنامج وقائي مشترك مع الأسرة، وتوقيع ولي الأمر بالعلم. متابعة حالة الطالب من قبل الموجه الطلابي لتقديم الخدمات التربوية.",
        "الإجراء الثالث: تنفيذ جميع ما ذكر في الإجراء الثاني. نقل الطالب إلى فصل آخر وفقا لقرار لجنة التوجيه الطلابي في المدرسة."
      ];

      const degree3Procedures = [
        "الإجراء الأول: دعوة ولي أمر الطالب، وتوضيح الإجراءات ومناقشته في خطة تعديل السلوك، وأخذ تعهد خطي على الطالب بعدم تكرار السلوك وتوقيع ولي الأمر بالعلم. حسم ثلاث درجات من درجات السلوك الإيجابي للطالب. الاعتذار إلى من أساء إليهم. إصلاح ما أتلفه الطالب، أو إحضار بديل عنه. مصادرة ما بحوزة الطالب من مواد ممنوعة وإتلافها وإعداد محضر بذلك. تحويل الطالب إلى الموجه الطلابي لدراسة حالته.",
        "الإجراء الثاني: تنفيذ جميع ما ورد في الإجراء الأول. إنذار الطالب كتابيا بالنقل إلى مدرسة أخرى في حال تكرار المخالفة، وتوقيع ولي الأمر بالعلم بذلك. تحويل الحالة إلى لجنة التوجيه الطلابي في المدرسة. نقل الطالب المخالف سلوكيا إلى فصل آخر. متابعة حالة الطالب من قبل الموجه الطلابي.",
        "الإجراء الثالث: تنفيذ جميع ما ورد في الإجراء الأول. ترفع إدارة المدرسة رسميًا وبصفة عاجلة لإدارة التعليم محضر اجتماع لجنة التوجيه بخصوص القضية. يصدر مدير التعليم قرار بنقل الطالب إلى مدرسة أخرى."
      ];

      const degree4Procedures = [
        "الإجراء الأول: إحالة الطالب إلى لجنة التوجيه الطلابي. دعوة ولي أمر الطالب، وأخذ تعهد خطي على الطالب وإنذاره بالنقل إلى مدرسة أخرى وتوقيع ولي الأمر بالعلم. حسم عشر درجات من السلوك. تقديم الاعتذار لمن أسيء إليهم. إصلاح ما أتلفه الطالب أو إحضار بديل عنه. مصادرة ما بحوزة الطالب من مواد ممنوعة وإتلافها. نقل الطالب من فصل إلى آخر. متابعة الحالة من الموجه الطلابي.",
        "الإجراء الثاني: تنفيذ جميع ما ورد في الإجراء الأول، باستثناء نقل الطالب من الفصل. رفع محضر اجتماع لجنة التوجيه إلى إدارة التعليم رسميًا وبصفة عاجلة. إصدار قرار من مدير التعليم بنقل الطالب إلى مدرسة أخرى."
      ];

      const degree5Procedures = [
        "تدون إدارة المدرسة محضر لإثبات الواقعة. دعوة ولي أمر الطالب وتبليغه بمشكلة الطالب. حسم خمس عشرة درجة من درجات السلوك. اجتماع لجنة التوجيه الطلابي بعد وقوع القضية مباشرة. إصلاح ما أتلفه الطالب (إن وجد). تقديم الاعتذار لمن أسيء إليهم. رفع محضر اجتماع لجنة التوجيه رسميًا وبصفة عاجلة إلى إدارة التعليم. إصدار قرار من مدير التعليم بنقل الطالب إلى مدرسة أخرى. متابعة الحالة من الموجه الطلابي في المدرسة المنقول إليها الطالب."
      ];

      const violations = [
        // Degree 1
        ...[
          "التأخر الصباحي.",
          "عدم حضور الاصطفاف الصباحي - في حال كان الطالب متواجدًا داخل المدرسة.",
          "التأخر عن الاصطفاف الصباحي - في حال كان الطالب متواجدا داخل المدرسة أو العبث أثناءه.",
          "التأخر في الدخول إلى الحصص.",
          "إعاقة سير الحصص الدراسية مثل: الحديث الجانبي المقاطعة المستمرة غير الهادفة لشرح المعلم، تناول الأطعمة أو المشروبات أثناء الدرس.",
          "النوم داخل الفصل.",
          "تكرار خروج ودخول الطلبة من البوابة قبل وقت الحضور والانصراف. التجمهر أمام بوابة المدرسة."
        ].map(name => ({ name, degree: 1, points: 1, category: 'تجاه الطلبة والمدرسة', procedures: degree1Procedures })),
        
        // Degree 2
        ...[
          "عدم حضور الحصة الدراسية أو الهروب منها.",
          "الدخول أو الخروج من الفصل دون استئذان.",
          "دخول فصل آخر دون استئذان.",
          "إثارة الفوضى داخل الفصل أو المدرسة أو في وسائل النقل المدرسي."
        ].map(name => ({ name, degree: 2, points: 2, category: 'تجاه الطلبة والمدرسة', procedures: degree2Procedures })),

        // Degree 3
        ...[
          "عدم التقيد بالزي المدرسي.",
          "الشجار أو الاشتراك في مضاربة جماعية.",
          "الإشارة بحركات مخلة بالأدب تجاه الطلبة.",
          "التلفظ بكلمات نابية على الطلبة، أو تهديدهم أو السخرية منهم.",
          "إلحاق الضرر المتعمد بممتلكات الطلبة.",
          "العبث بتجهيزات المدرسة أو مبانيها كأجهزة الحاسوب، أدوات ومعدات الأمن والسلامة المدرسية، الكهرباء المعامل، حافلة المدرسة والكتابة على الجدار وغيره.",
          "إحضار المواد أو الألعاب الخطرة إلى المدرسة دون استخدامها.",
          "حيازة السجائر بأنواعها.",
          "حيازة المواد الإعلامية الممنوعة المقروءة، أو المسموعة، أو المرئية.",
          "التوقيع عن ولي الأمر من غير علمه على المكاتبات المتبادلة بين المدرسة وولي الأمر.",
          "امتهان الكتب الدراسية."
        ].map(name => ({ name, degree: 3, points: 3, category: 'تجاه الطلبة والمدرسة', procedures: degree3Procedures })),

        // Degree 4
        ...[
          "تعمد إصابة أحد الطلبة عن طريق الضرب.",
          "سرقة شيء من ممتلكات الطلبة أو المدرسة.",
          "التصوير أو التسجيل الصوتي للطلبة.",
          "إلحاق الضرر المتعمد بتجهيزات المدرسة.",
          "التدخين بأنواعه داخل المدرسة.",
          "الهروب من المدرسة.",
          "إحضار أو استخدام المواد أو الألعاب الخطرة.",
          "عرض أو توزيع المواد الإعلامية الممنوعة."
        ].map(name => ({ name, degree: 4, points: 10, category: 'تجاه الطلبة والمدرسة', procedures: degree4Procedures })),
        ...[
          "تهديد المعلمين أو الإداريين، أو من في حكمهم.",
          "التلفظ بألفاظ غير لائقة تجاه المعلمين.",
          "السخرية من المعلمين.",
          "التوقيع عن أحد منسوبي المدرسة.",
          "تصوير المعلمين، أو الإداريين، أو من في حكمهم، أو التسجيل الصوتي لهم."
        ].map(name => ({ name, degree: 4, points: 10, category: 'تجاه الهيئة التعليمية والإدارية', procedures: degree4Procedures })),

        // Degree 5
        ...[
          "الإساءة أو الاستهزاء بشيء من شعائر الإسلام.",
          "الإساءة للدولة أو رموزها.",
          "بث أو ترويج أفكار ومعتقدات متطرفة.",
          "الإساءة إلى الأديان السماوية أو إثارة العنصرية والفتن.",
          "التزوير.",
          "التحرش الجنسي.",
          "المظاهر أو الصور أو الشعارات التي تدل على الشذوذ الجنسي.",
          "إشعال النار داخل المدرسة.",
          "حيازة أو استخدام أو تهديد الطلبة بالأسلحة النارية أو ما في حكمها.",
          "حيازة، أو تعاطي، أو ترويج المخدرات.",
          "الجرائم المعلوماتية بكافة أنواعها.",
          "ابتزاز الطلبة.",
          "التنمر بجميع أنواعه وأشكاله."
        ].map(name => ({ name, degree: 5, points: 15, category: 'تجاه الطلبة والمدرسة', procedures: degree5Procedures })),
        ...[
          "إلحاق الضرر بممتلكات المعلمين أو سرقتها.",
          "الإشارة بحركات مخلة بالأدب تجاه المعلمين.",
          "الاعتداء بالضرب على المعلمين.",
          "ابتزاز المعلمين.",
          "الجرائم المعلوماتية تجاه المعلمين."
        ].map(name => ({ name, degree: 5, points: 15, category: 'تجاه الهيئة التعليمية والإدارية', procedures: degree5Procedures }))
      ];

      for (const v of violations) {
        const fullProcedures = {
          steps: v.procedures,
          general: generalProcedures
        };
        await sql`
          INSERT INTO behavioral_violations_dict (category, violation_name, degree, deduction_points, procedures)
          VALUES (${v.category}, ${v.name}, ${v.degree}, ${v.points}, ${JSON.stringify(fullProcedures)})
        `;
      }
    }

  } catch (err) {
    console.error("Database initialization error:", err);
  }
}

initDb();

async function startServer() {
  const app = express();
  // تعديل المنفذ ليتوافق مع خوادم Render
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // API Routes
  app.get("/api/seed-test-users", async (req, res) => {
    try {
      const users = [
        { name: 'معلم تجربة', email: 'teacher@test.com', password: '123', role: 'teacher', is_active: true, is_phone_verified: true, status: 'ACTIVE', national_id: '1000000001' },
        { name: 'معلم تجربة 2', email: 'teacher2@test.com', password: '123', role: 'teacher', is_active: true, is_phone_verified: true, status: 'ACTIVE', national_id: '1000000006' },
        { name: 'وكيل تجربة', email: 'vp@test.com', password: '123', role: 'vice_principal', is_active: true, is_phone_verified: true, status: 'ACTIVE', national_id: '1000000002' },
        { name: 'موجه تجربة', email: 'counselor@test.com', password: '123', role: 'counselor', is_active: true, is_phone_verified: true, status: 'ACTIVE', national_id: '1000000003' },
        { name: 'مدير تجربة', email: 'principal@test.com', password: '123', role: 'principal', is_active: true, is_phone_verified: true, status: 'ACTIVE', national_id: '1000000004' },
        { name: 'ولي أمر تجربة', email: 'parent@test.com', password: '123', role: 'parent', is_active: true, is_phone_verified: true, status: 'ACTIVE', national_id: '1000000005', phone_number: '0500000000' }
      ];

      for (const user of users) {
        const existing = await sql`SELECT id FROM users WHERE email = ${user.email}`;
        if (existing.length === 0) {
          await sql`
            INSERT INTO users (name, email, password, role, is_active, is_phone_verified, status, national_id, phone_number)
            VALUES (${user.name}, ${user.email}, ${user.password}, ${user.role}, ${user.is_active}, ${user.is_phone_verified}, ${user.status}, ${user.national_id}, ${user.phone_number || null})
          `;
        } else {
          await sql`
            UPDATE users 
            SET password = ${user.password}, role = ${user.role}, is_active = ${user.is_active}, is_phone_verified = ${user.is_phone_verified}, status = ${user.status}, phone_number = ${user.phone_number || null}
            WHERE email = ${user.email}
          `;
        }
      }

      // Add a test student for parent login
      const testStudent = {
        name: 'طالب تجربة',
        national_id: '1000000005',
        grade: 'الأول المتوسط',
        section: 'أ',
        parent_phone: '0500000000'
      };

      const existingStudent = await sql`SELECT id FROM students WHERE national_id = ${testStudent.national_id}`;
      if (existingStudent.length === 0) {
        await sql`
          INSERT INTO students (name, national_id, grade, section, parent_phone)
          VALUES (${testStudent.name}, ${testStudent.national_id}, ${testStudent.grade}, ${testStudent.section}, ${testStudent.parent_phone})
        `;
      } else {
        await sql`
          UPDATE students
          SET name = ${testStudent.name}, grade = ${testStudent.grade}, section = ${testStudent.section}, parent_phone = ${testStudent.parent_phone}
          WHERE national_id = ${testStudent.national_id}
        `;
      }

      res.json({ success: true, message: 'تم إنشاء حسابات التجربة بنجاح' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'حدث خطأ أثناء إنشاء الحسابات' });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await sql`SELECT key, value FROM system_settings`;
      const settingsMap = settings.reduce((acc: any, row: any) => {
        acc[row.key] = row.value;
        return acc;
      }, {});
      res.json(settingsMap);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    const { settings } = req.body;
    try {
      for (const [key, value] of Object.entries(settings)) {
        await sql`
          INSERT INTO system_settings (key, value)
          VALUES (${key}, ${value as string})
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `;
      }
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  app.post("/api/whatsapp/send", async (req, res) => {
    let { phoneNumber, studentName, instanceId, token, period, message } = req.body;
    
    try {
      if (!instanceId || !token) {
        // Fetch from database if not provided
        const settings = await sql`SELECT key, value FROM system_settings WHERE key IN ('whatsapp_instance_id', 'whatsapp_token')`;
        const settingsMap = settings.reduce((acc: any, row: any) => {
          acc[row.key] = row.value;
          return acc;
        }, {});
        
        instanceId = settingsMap.whatsapp_instance_id;
        token = settingsMap.whatsapp_token;
        
        if (!instanceId || !token) {
          return res.status(400).json({ success: false, code: 'MISSING_WHATSAPP_CREDENTIALS', message: "لم يتم ربط بوابة الواتساب. يرجى التوجه إلى (إعدادات الرسائل) وإدخال مفاتيح الربط أولاً." });
        }
      }

      const currentDate = new Date().toLocaleDateString('ar-SA');
      const messageBody = message || `ابنكم ${studentName} غائب في (الحصة ${period || 'غير محدد'}) ليوم ${currentDate} ، ثانوية أم القرى`;

      // Clean phone number and append @c.us
      let cleanPhone = phoneNumber.replace(/[\s+]/g, '');
      if (cleanPhone.startsWith('00')) {
        cleanPhone = cleanPhone.substring(2);
      } else if (cleanPhone.startsWith('0')) {
        cleanPhone = '966' + cleanPhone.substring(1);
      }
      const chatId = `${cleanPhone}@c.us`;

      const response = await fetch(`https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId: chatId,
          message: messageBody
        })
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return res.status(403).json({ success: false, code: 'FORBIDDEN', message: "بيانات الربط غير صحيحة أو الحساب غير مفعل (Forbidden)" });
        }
        if (response.status === 429) {
          return res.status(429).json({ success: false, code: 'TOO_MANY_REQUESTS', message: "تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً." });
        }
        throw new Error(`Green API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[WHATSAPP] Error:", error);
      res.status(500).json({ success: false, message: error.message || "Failed to send WhatsApp message" });
    }
  });

  app.post("/api/whatsapp/delete", async (req, res) => {
    let { phoneNumber, idMessage } = req.body;
    
    try {
      const settings = await sql`SELECT key, value FROM system_settings WHERE key IN ('whatsapp_instance_id', 'whatsapp_token')`;
      const settingsMap = settings.reduce((acc: any, row: any) => {
        acc[row.key] = row.value;
        return acc;
      }, {});
      
      const instanceId = settingsMap.whatsapp_instance_id;
      const token = settingsMap.whatsapp_token;
      
      if (!instanceId || !token) {
        return res.status(400).json({ success: false, code: 'MISSING_WHATSAPP_CREDENTIALS', message: "لم يتم ربط بوابة الواتساب." });
      }

      let cleanPhone = phoneNumber.replace(/[\s+]/g, '');
      if (cleanPhone.startsWith('00')) {
        cleanPhone = cleanPhone.substring(2);
      } else if (cleanPhone.startsWith('0')) {
        cleanPhone = '966' + cleanPhone.substring(1);
      }
      const chatId = `${cleanPhone}@c.us`;

      const response = await fetch(`https://api.green-api.com/waInstance${instanceId}/deleteMessage/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatId: chatId,
          idMessage: idMessage
        })
      });

      if (!response.ok) {
        throw new Error(`Green API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[WHATSAPP DELETE] Error:", error);
      res.status(500).json({ success: false, message: error.message || "Failed to delete WhatsApp message" });
    }
  });

  const statusCache = new Map<string, { data: any, timestamp: number }>();

  app.get("/api/whatsapp/status", async (req, res) => {
    const { instanceId, token } = req.query;
    if (!instanceId || !token) {
      return res.status(400).json({ error: "Missing instanceId or token" });
    }

    const cacheKey = `${instanceId}_${token}`;
    const cached = statusCache.get(cacheKey);
    // Cache for 30 seconds to prevent rate limits
    if (cached && Date.now() - cached.timestamp < 30000) {
      return res.json(cached.data);
    }

    try {
      const response = await fetch(`https://api.green-api.com/waInstance${instanceId}/getStateInstance/${token}`);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return res.status(403).json({ error: "بيانات الربط غير صحيحة أو الحساب غير مفعل" });
        }
        if (response.status === 429) {
          return res.status(429).json({ error: "Too Many Requests", stateInstance: "rate_limited" });
        }
        throw new Error(`Green API error: ${response.statusText}`);
      }
      const data = await response.json();
      statusCache.set(cacheKey, { data, timestamp: Date.now() });
      res.json(data);
    } catch (error: any) {
      console.error("[WHATSAPP STATUS] Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch status" });
    }
  });

  const qrCache = new Map<string, { data: any, timestamp: number }>();

  app.get("/api/whatsapp/qr", async (req, res) => {
    const { instanceId, token } = req.query;
    if (!instanceId || !token) {
      return res.status(400).json({ error: "Missing instanceId or token" });
    }

    const cacheKey = `${instanceId}_${token}`;
    const cached = qrCache.get(cacheKey);
    // Cache for 60 seconds to prevent rate limits
    if (cached && Date.now() - cached.timestamp < 60000) {
      return res.json(cached.data);
    }

    try {
      const response = await fetch(`https://api.green-api.com/waInstance${instanceId}/qr/${token}`);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return res.status(403).json({ error: "بيانات الربط غير صحيحة أو الحساب غير مفعل" });
        }
        if (response.status === 429) {
          return res.status(429).json({ error: "Too Many Requests", qr: null });
        }
        throw new Error(`Green API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      let responseData;
      if (data.type === 'qrCode' && data.message) {
        responseData = { qrCode: `data:image/png;base64,${data.message}` };
      } else {
        responseData = data;
      }
      qrCache.set(cacheKey, { data: responseData, timestamp: Date.now() });
      res.json(responseData);
    } catch (error: any) {
      console.error("[WHATSAPP QR] Error:", error);
      res.status(500).json({ error: "Failed to fetch QR code" });
    }
  });

  app.post("/api/forgot-password", async (req, res) => {
    const { identifier } = req.body; // Can be email or phone
    try {
      let cleanPhone = identifier.replace(/[\s+]/g, '');
      if (cleanPhone.startsWith('00')) {
        cleanPhone = cleanPhone.substring(2);
      } else if (cleanPhone.startsWith('0')) {
        cleanPhone = '966' + cleanPhone.substring(1);
      }

      const users = await sql`SELECT id, name, phone_number FROM users WHERE email = ${identifier} OR phone_number = ${cleanPhone} OR phone_number = ${identifier} LIMIT 1`;
      
      if (users.length === 0) {
        return res.status(404).json({ success: false, message: "لم يتم العثور على حساب بهذا البريد أو رقم الجوال" });
      }

      const user = users[0];
      const otp_code = Math.floor(1000 + Math.random() * 9000).toString();

      await sql`UPDATE users SET otp_code = ${otp_code} WHERE id = ${user.id}`;

      res.json({ success: true, otp_code, phone_number: user.phone_number, user_id: user.id });
    } catch (err) {
      console.error("[FORGOT PASSWORD] Error:", err);
      res.status(500).json({ success: false, message: "حدث خطأ في النظام" });
    }
  });

  app.post("/api/verify-forgot-password-otp", async (req, res) => {
    const { user_id, otp_code } = req.body;
    try {
      const users = await sql`SELECT id FROM users WHERE id = ${user_id} AND otp_code = ${otp_code} LIMIT 1`;
      if (users.length === 0) {
        return res.status(400).json({ success: false, message: "كود التحقق غير صحيح" });
      }
      res.json({ success: true });
    } catch (err) {
      console.error("[VERIFY OTP] Error:", err);
      res.status(500).json({ success: false, message: "حدث خطأ في النظام" });
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    const { user_id, otp_code, new_password } = req.body;
    try {
      const users = await sql`SELECT id FROM users WHERE id = ${user_id} AND otp_code = ${otp_code} LIMIT 1`;
      if (users.length === 0) {
        return res.status(400).json({ success: false, message: "كود التحقق غير صحيح أو منتهي الصلاحية" });
      }

      await sql`UPDATE users SET password = ${new_password}, otp_code = NULL WHERE id = ${user_id}`;
      res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
    } catch (err) {
      console.error("[RESET PASSWORD] Error:", err);
      res.status(500).json({ success: false, message: "حدث خطأ في النظام" });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    console.log(`[LOGIN] Attempt for email: ${email}`);
    
    try {
      // البحث عن المستخدم بالبريد الإلكتروني فقط أولاً للتأكد من وجوده
      const users = await sql`SELECT * FROM users WHERE email = ${email}`;
      const user = users[0];
      
      if (!user) {
        console.log(`[LOGIN] User not found: ${email}`);
        return res.status(401).json({ success: false, message: "البريد الإلكتروني غير مسجل" });
      }

      if (!user.is_phone_verified && user.role !== 'admin' && user.role !== 'principal') {
        console.log(`[LOGIN] User phone not verified: ${email}`);
        return res.status(403).json({ success: false, message: "لم يتم توثيق رقم الجوال. يرجى إكمال التسجيل." });
      }

      if (user.status === 'PENDING') {
        console.log(`[LOGIN] User pending approval: ${email}`);
        return res.status(403).json({ success: false, message: "حسابك بانتظار اعتماد الإدارة" });
      }

      if (!user.is_active) {
        console.log(`[LOGIN] User is inactive: ${email}`);
        return res.status(403).json({ success: false, message: "حسابك موقوف، يرجى مراجعة الإدارة" });
      }

      if (user.password !== password) {
        console.log(`[LOGIN] Incorrect password for: ${email}`);
        return res.status(401).json({ success: false, message: "كلمة المرور غير صحيحة" });
      }

      const gradesResult = await sql`SELECT grade FROM user_grades WHERE user_id = ${user.id}`;
      const grades = gradesResult.map((g: any) => g.grade);
      
      // If user is a parent, try to find their student
      let student_id = null;
      if (user.role === 'parent' && user.phone_number) {
        const students = await sql`SELECT id FROM students WHERE parent_phone = ${user.phone_number} LIMIT 1`;
        if (students.length > 0) {
          student_id = students[0].id;
        }
      }
      
      // Generate OTP
      const otp_code = Math.floor(1000 + Math.random() * 9000).toString();
      await sql`UPDATE users SET otp_code = ${otp_code} WHERE id = ${user.id}`;

      console.log(`[LOGIN] Success for: ${email}, Role: ${user.role}`);
      res.json({ success: true, user: { ...user, assigned_grades: grades, student_id }, otp_code });
    } catch (err) {
      console.error("[LOGIN] Error:", err);
      res.status(500).json({ success: false, message: "حدث خطأ في السيرفر" });
    }
  });

  app.post("/api/register", async (req, res) => {
    const { name, phone_number, email, password, role } = req.body;
    
    try {
      // Generate 4-digit OTP
      const otp_code = Math.floor(1000 + Math.random() * 9000).toString();

      // Check if email already exists
      const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`;
      if (existingUser.length > 0) {
        const user = existingUser[0];
        // If user exists but phone is not verified, update their OTP and allow them to continue
        if (!user.is_phone_verified) {
          const result = await sql`
            UPDATE users 
            SET name = ${name}, phone_number = ${phone_number}, password = ${password}, role = ${role}, otp_code = ${otp_code}, status = 'PENDING', is_active = FALSE
            WHERE id = ${user.id}
            RETURNING id, name, email, school_id
          `;
          return res.json({ 
            success: true, 
            user: result[0], 
            otp_code: otp_code,
            message: "تم تحديث البيانات، يرجى إدخال كود التحقق" 
          });
        } else {
          return res.status(400).json({ success: false, message: "البريد الإلكتروني مسجل ومفعل مسبقاً" });
        }
      }
      
      const result = await sql`
        INSERT INTO users (name, phone_number, email, password, role, is_active, status, is_phone_verified, otp_code, school_id)
        VALUES (${name}, ${phone_number}, ${email}, ${password}, ${role}, FALSE, 'PENDING', FALSE, ${otp_code}, 1)
        RETURNING id, name, email, school_id
      `;

      res.json({ 
        success: true, 
        user: result[0], 
        otp_code: otp_code, // Added for frontend testing
        message: "تم التسجيل بنجاح، يرجى إدخال كود التحقق" 
      });
    } catch (err) {
      console.error("[REGISTER] Error:", err);
      res.status(500).json({ success: false, message: "حدث خطأ أثناء التسجيل" });
    }
  });

  app.post("/api/verify-otp", async (req, res) => {
    const { email, otp_code } = req.body;
    
    try {
      const users = await sql`SELECT * FROM users WHERE email = ${email}`;
      const user = users[0];

      if (!user) {
        return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
      }

      if (user.otp_code !== otp_code) {
        return res.status(400).json({ success: false, message: "كود التحقق غير صحيح" });
      }

      await sql`
        UPDATE users 
        SET is_phone_verified = TRUE, otp_code = NULL 
        WHERE id = ${user.id}
      `;

      res.json({ success: true, message: "تم توثيق الجوال بنجاح! حسابك الآن بانتظار اعتماد إدارة المدرسة للبدء بالعمل." });
    } catch (err) {
      console.error("[VERIFY OTP] Error:", err);
      res.status(500).json({ success: false, message: "حدث خطأ أثناء التحقق" });
    }
  });

  app.post("/api/verify-login-otp", async (req, res) => {
    const { email, phone_number, otp_code } = req.body;
    
    try {
      let user = null;
      let isParent = false;

      // Search by email or phone_number in users table
      if (email) {
        const users = await sql`SELECT * FROM users WHERE email = ${email}`;
        user = users[0];
      } else if (phone_number) {
        // Check both formats (with and without 966)
        let alt_phone = phone_number;
        if (phone_number.startsWith('9665')) {
          alt_phone = '05' + phone_number.substring(4);
        } else if (phone_number.startsWith('05')) {
          alt_phone = '9665' + phone_number.substring(2);
        }

        // First try to find a parent user
        const parentUsers = await sql`SELECT * FROM users WHERE (phone_number = ${phone_number} OR phone_number = ${alt_phone}) AND role = 'parent'`;
        if (parentUsers.length > 0) {
          user = parentUsers[0];
        }
      }

      // If not found in users, search in students table for parents
      if (!user && phone_number) {
        let alt_phone = phone_number;
        if (phone_number.startsWith('9665')) {
          alt_phone = '05' + phone_number.substring(4);
        } else if (phone_number.startsWith('05')) {
          alt_phone = '9665' + phone_number.substring(2);
        }

        const students = await sql`SELECT * FROM students WHERE (parent_phone = ${phone_number} OR parent_phone = ${alt_phone}) LIMIT 1`;
        if (students.length > 0) {
          const student = students[0];
          user = {
            id: student.id,
            name: student.name,
            role: 'parent',
            student_id: student.id,
            national_id: student.national_id,
            grade: student.grade,
            section: student.section,
            school_id: student.school_id,
            otp_code: '1234' // Mock OTP for parents since it's not stored in students table
          };
          isParent = true;
        }
      } else if (user && user.role === 'parent' && phone_number) {
        // If found in users, we still need to attach student_id!
        let alt_phone = phone_number;
        if (phone_number.startsWith('9665')) {
          alt_phone = '05' + phone_number.substring(4);
        } else if (phone_number.startsWith('05')) {
          alt_phone = '9665' + phone_number.substring(2);
        }

        const students = await sql`SELECT * FROM students WHERE (parent_phone = ${phone_number} OR parent_phone = ${alt_phone}) LIMIT 1`;
        if (students.length > 0) {
          user.student_id = students[0].id;
        }
      }

      if (!user) {
        return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
      }

      // Allow 1234 as a universal bypass for testing
      if (user.otp_code !== otp_code && otp_code !== '1234') {
        return res.status(400).json({ success: false, message: "كود التحقق غير صحيح" });
      }

      if (!isParent) {
        await sql`
          UPDATE users 
          SET otp_code = NULL 
          WHERE id = ${user.id}
        `;
      }

      res.json({ success: true, message: "تم التحقق بنجاح", user });
    } catch (err) {
      console.error("[VERIFY LOGIN OTP] Error:", err);
      res.status(500).json({ success: false, message: "حدث خطأ أثناء التحقق" });
    }
  });

  app.post("/api/parent-login", async (req, res) => {
    const { national_id, parent_phone } = req.body;
    console.log(`[PARENT LOGIN] Attempt for national_id: ${national_id}`);
    
    try {
      // Check both formats (with and without 966)
      let alt_phone = parent_phone;
      if (parent_phone.startsWith('9665')) {
        alt_phone = '05' + parent_phone.substring(4);
      } else if (parent_phone.startsWith('05')) {
        alt_phone = '9665' + parent_phone.substring(2);
      }

      const students = await sql`SELECT * FROM students WHERE national_id = ${national_id} AND (parent_phone = ${parent_phone} OR parent_phone = ${alt_phone})`;
      const student = students[0];
      
      if (!student) {
        console.log(`[PARENT LOGIN] Student not found or phone mismatch: ${national_id}`);
        return res.status(401).json({ success: false, message: "بيانات الدخول غير صحيحة، يرجى التأكد من هوية الطالب ورقم الجوال المسجل بالمدرسة" });
      }

      // Check if parent exists in users table
      const users = await sql`SELECT * FROM users WHERE (phone_number = ${parent_phone} OR phone_number = ${alt_phone}) AND role = 'parent'`;
      let otp_code = '1234'; // Default mock OTP
      
      if (users.length > 0) {
        const user = users[0];
        otp_code = Math.floor(1000 + Math.random() * 9000).toString();
        await sql`UPDATE users SET otp_code = ${otp_code} WHERE id = ${user.id}`;
      }

      console.log(`[PARENT LOGIN] Success for student: ${student.name}`);
      res.json({ success: true, user: { 
        id: student.id, 
        name: student.name, 
        role: 'parent', 
        student_id: student.id,
        national_id: student.national_id,
        grade: student.grade,
        section: student.section,
        parent_phone: student.parent_phone,
        school_id: student.school_id
      }, otp_code });
    } catch (err) {
      console.error("[PARENT LOGIN] Error:", err);
      res.status(500).json({ success: false, message: "حدث خطأ في السيرفر" });
    }
  });

  // --- Dashboard Pulse Endpoint ---
  app.get("/api/dashboard/pulse", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Attendance Stats
      const attendanceStats = await sql`
        SELECT 
          COUNT(CASE WHEN status = 'حاضر' THEN 1 END) as present,
          COUNT(CASE WHEN status = 'غائب' THEN 1 END) as absent,
          COUNT(*) as total
        FROM attendance_records
        WHERE date = ${today}
      `;
      const present = parseInt(attendanceStats[0].present || 0);
      const absent = parseInt(attendanceStats[0].absent || 0);
      const totalAttendance = parseInt(attendanceStats[0].total || 0);
      const attendanceRate = totalAttendance > 0 ? Math.round((present / totalAttendance) * 100) : 0;

      // 2. Pending Classes
      const allClasses = await sql`
        SELECT DISTINCT grade, section
        FROM students
        WHERE grade IS NOT NULL AND section IS NOT NULL
      `;
      const completedClasses = await sql`
        SELECT DISTINCT s.grade, s.section
        FROM students s
        JOIN attendance_records ar ON ar.student_id = s.id
        WHERE ar.date = ${today}
      `;
      const pendingClasses = allClasses.filter(c => 
        !completedClasses.some(comp => comp.grade === c.grade && comp.section === c.section)
      );

      // 3. Behavioral Incidents Today
      const incidentsToday = await sql`
        SELECT COUNT(*) as count
        FROM referrals
        WHERE DATE(created_at) = ${today}
      `;
      const behavioralIncidentsCount = parseInt(incidentsToday[0].count || 0);

      // 4. Active Referrals
      const activeReferrals = await sql`
        SELECT COUNT(*) as count
        FROM referrals
        WHERE status NOT IN ('resolved', 'closed')
      `;
      const activeReferralsCount = parseInt(activeReferrals[0].count || 0);

      // 5. Actionable Alerts
      const alerts = [];
      
      // Alert: Students with > 3 days absence
      const absenceLimits = await sql`
        SELECT 
          student_id,
          COUNT(DISTINCT date) as total_days
        FROM attendance_records
        WHERE status = 'غائب'
        GROUP BY student_id
        HAVING COUNT(DISTINCT date) >= 3
      `;
      if (absenceLimits.length > 0) {
        alerts.push({
          id: 'absences',
          type: 'warning',
          icon: '🚨',
          message: `هناك ${absenceLimits.length} طلاب تجاوزوا 3 أيام غياب.`,
          actionText: 'طباعة الإنذارات',
          actionLink: '/dashboard/attendance/radar'
        });
      }

      // Alert: Pending classes
      if (pendingClasses.length > 0) {
        alerts.push({
          id: 'pending_classes',
          type: 'alert',
          icon: '⚠️',
          message: `هناك ${pendingClasses.length} فصول لم يتم رفع تحضيرها للحصة الحالية.`,
          actionText: 'إرسال تنبيه',
          actionLink: '/dashboard/attendance/radar'
        });
      }

      // Alert: Active referrals
      const recentActiveReferrals = await sql`
        SELECT r.id, s.name as student_name, COALESCE(u.name, 'مستخدم محذوف') as teacher_name
        FROM referrals r
        JOIN students s ON r.student_id = s.id
        LEFT JOIN users u ON r.teacher_id = u.id
        WHERE r.status NOT IN ('resolved', 'closed')
        ORDER BY r.created_at DESC
        LIMIT 3
      `;
      recentActiveReferrals.forEach((ref: any) => {
        alerts.push({
          id: `ref_${ref.id}`,
          type: 'info',
          icon: '📝',
          message: `إحالة للطالب (${ref.student_name}) مرفوعة من المعلم (${ref.teacher_name}) تنتظر الإجراء.`,
          actionText: 'معالجة الحالة',
          actionLink: `/dashboard/referral/${ref.id}`
        });
      });

      // 6. Live Activity Stream
      const activities = [];
      
      // Recent attendance
      const recentAttendance = await sql`
        SELECT ar.date, ar.period, s.grade, s.section, COALESCE(u.name, 'مستخدم محذوف') as teacher_name, COUNT(*) as absent_count
        FROM attendance_records ar
        JOIN students s ON ar.student_id = s.id
        LEFT JOIN users u ON ar.teacher_id = u.id
        WHERE ar.date = ${today} AND ar.status = 'غائب'
        GROUP BY ar.date, ar.period, s.grade, s.section, u.name
        ORDER BY ar.period DESC
        LIMIT 5
      `;
      recentAttendance.forEach((ar: any) => {
        activities.push({
          id: `att_${ar.grade}_${ar.section}_${ar.period}`,
          icon: '❌',
          message: `تم رصد غياب ${ar.absent_count} طلاب في فصل ${ar.grade}/${ar.section} من قبل المعلم ${ar.teacher_name}.`,
          time: 'اليوم'
        });
      });

      // Recent referral logs
      const recentLogs = await sql`
        SELECT l.action, l.created_at, COALESCE(u.name, 'مستخدم محذوف') as user_name, s.name as student_name
        FROM referral_logs l
        LEFT JOIN users u ON l.user_id = u.id
        JOIN referrals r ON l.referral_id = r.id
        JOIN students s ON r.student_id = s.id
        ORDER BY l.created_at DESC
        LIMIT 5
      `;
      recentLogs.forEach((log: any) => {
        let icon = 'ℹ️';
        if (log.action.includes('حل') || log.action.includes('إغلاق')) icon = '🤝';
        else if (log.action.includes('إحالة')) icon = '📝';
        
        activities.push({
          id: `log_${log.created_at}`,
          icon,
          message: `${log.user_name} قام بـ: ${log.action} للطالب ${log.student_name}.`,
          time: new Date(log.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
        });
      });

      res.json({
        attendanceRate,
        absentCount: absent,
        pendingClassesCount: pendingClasses.length,
        behavioralIncidentsCount,
        activeReferralsCount,
        alerts,
        activities
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch dashboard pulse" });
    }
  });
  app.get("/api/reports/performance", async (req, res) => {
    try {
      const performance = await sql`
        SELECT 
          u.id,
          u.name, 
          u.role,
          (
            SELECT COUNT(r.id) 
            FROM referrals r 
            JOIN students s ON r.student_id = s.id
            JOIN user_grades ug ON s.grade = ug.grade
            WHERE ug.user_id = u.id
          ) as total_referred,
          (
            SELECT COUNT(DISTINCT l.referral_id)
            FROM referral_logs l
            WHERE l.user_id = u.id AND (l.action LIKE '%حل%' OR l.action LIKE '%إغلاق%')
          ) as total_resolved,
          (
            SELECT AVG(EXTRACT(EPOCH FROM (l.created_at - r.created_at))/3600)
            FROM referral_logs l
            JOIN referrals r ON l.referral_id = r.id
            WHERE l.user_id = u.id AND (l.action LIKE '%حل%' OR l.action LIKE '%إغلاق%')
          ) as avg_hours
        FROM users u
        WHERE u.role IN ('vice_principal', 'counselor')
        ORDER BY u.role, u.name
      `;
      res.json(performance);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch performance data" });
    }
  });

  app.get("/api/violations", async (req, res) => {
    try {
      const violations = await sql`SELECT * FROM behavioral_violations_dict ORDER BY degree, violation_name`;
      res.json(violations);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch violations" });
    }
  });

  app.post("/api/students/:id/score", async (req, res) => {
    const { id } = req.params;
    const { action_type, points_changed, reason, user_id } = req.body;
    try {
      // 1. Log the action
      await sql`
        INSERT INTO student_score_logs (student_id, action_type, points_changed, reason_or_evidence, created_by_user_id)
        VALUES (${id}, ${action_type}, ${points_changed}, ${reason}, ${user_id})
      `;

      // 2. Update student score
      if (action_type === 'deduction') {
        await sql`UPDATE students SET behavior_score = behavior_score - ${points_changed} WHERE id = ${id}`;
      } else if (action_type === 'bonus') {
        await sql`UPDATE students SET bonus_score = bonus_score + ${points_changed} WHERE id = ${id}`;
      } else if (action_type === 'compensation') {
        await sql`UPDATE students SET behavior_score = behavior_score + ${points_changed} WHERE id = ${id}`;
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update score" });
    }
  });

  app.get("/api/students/:id/score-logs", async (req, res) => {
    const { id } = req.params;
    try {
      const logs = await sql`
        SELECT l.*, COALESCE(u.name, 'مستخدم محذوف') as creator_name
        FROM student_score_logs l
        LEFT JOIN users u ON l.created_by_user_id = u.id
        WHERE l.student_id = ${id}
        ORDER BY l.created_at DESC
      `;
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  app.get("/api/referrals", async (req, res) => {
    const userId = req.query.userId as string;
    const userRole = req.query.role as string;

    let referrals;
    if (userId && userRole !== 'admin' && userRole !== 'principal') {
      const gradesResult = await sql`SELECT grade FROM user_grades WHERE user_id = ${userId}`;
      const grades = gradesResult.map((g: any) => g.grade);
      
      if (grades.length > 0) {
        if (userRole === 'teacher') {
          referrals = await sql`
            SELECT r.*, s.name as student_name, s.national_id as student_national_id, s.grade as student_grade, s.section as student_section, COALESCE(u.name, 'مستخدم محذوف') as teacher_name
            FROM referrals r
            JOIN students s ON r.student_id = s.id
            LEFT JOIN users u ON r.teacher_id = u.id
            WHERE s.grade = ANY(${grades}) AND r.teacher_id = ${userId}
            ORDER BY r.created_at DESC
          `;
        } else {
          referrals = await sql`
            SELECT r.*, s.name as student_name, s.national_id as student_national_id, s.grade as student_grade, s.section as student_section, COALESCE(u.name, 'مستخدم محذوف') as teacher_name
            FROM referrals r
            JOIN students s ON r.student_id = s.id
            LEFT JOIN users u ON r.teacher_id = u.id
            WHERE s.grade = ANY(${grades})
            ORDER BY r.created_at DESC
          `;
        }
      } else if (userRole === 'teacher') {
        referrals = await sql`
          SELECT r.*, s.name as student_name, s.national_id as student_national_id, s.grade as student_grade, s.section as student_section, COALESCE(u.name, 'مستخدم محذوف') as teacher_name
          FROM referrals r
          JOIN students s ON r.student_id = s.id
          LEFT JOIN users u ON r.teacher_id = u.id
          WHERE r.teacher_id = ${userId}
          ORDER BY r.created_at DESC
        `;
      } else {
        referrals = await sql`
          SELECT r.*, s.name as student_name, s.national_id as student_national_id, s.grade as student_grade, s.section as student_section, COALESCE(u.name, 'مستخدم محذوف') as teacher_name
          FROM referrals r
          JOIN students s ON r.student_id = s.id
          LEFT JOIN users u ON r.teacher_id = u.id
          ORDER BY r.created_at DESC
        `;
      }
    } else {
      referrals = await sql`
        SELECT r.*, s.name as student_name, s.national_id as student_national_id, s.grade as student_grade, s.section as student_section, COALESCE(u.name, 'مستخدم محذوف') as teacher_name
        FROM referrals r
        JOIN students s ON r.student_id = s.id
        LEFT JOIN users u ON r.teacher_id = u.id
        ORDER BY r.created_at DESC
      `;
    }
    res.json(referrals);
  });

  app.get("/api/students", async (req, res) => {
    const userId = req.query.userId as string;
    const grade = req.query.grade as string;
    const section = req.query.section as string;
    const schoolId = req.headers['x-school-id'] || '1';
    let students;

    if (grade && section) {
      students = await sql`SELECT * FROM students WHERE school_id = ${schoolId} AND grade = ${grade} AND section = ${section} ORDER BY name ASC`;
    } else if (userId) {
      const gradesResult = await sql`SELECT grade FROM user_grades WHERE user_id = ${userId}`;
      const grades = gradesResult.map((g: any) => g.grade);
      if (grades.length > 0) {
        students = await sql`SELECT * FROM students WHERE school_id = ${schoolId} AND grade = ANY(${grades}) ORDER BY name ASC`;
      } else {
        students = await sql`SELECT * FROM students WHERE school_id = ${schoolId} ORDER BY name ASC`;
      }
    } else {
      students = await sql`SELECT * FROM students WHERE school_id = ${schoolId} ORDER BY name ASC`;
    }

    res.json(students);
  });

  app.get("/api/student-search", async (req, res) => {
    const { query } = req.query;
    const schoolId = req.headers['x-school-id'];
    
    if (!query) return res.json([]);
    if (!schoolId) return res.status(400).json({ error: "School ID is required" });
    
    try {
      const students = await sql`
        SELECT * FROM students 
        WHERE school_id = ${schoolId}
        AND (name ILIKE ${`%${query}%`} 
        OR national_id = ${query})
        LIMIT 20
      `;
      res.json(students);
    } catch (err) {
      console.error("Search failed:", err);
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.get("/api/teacher/assignments", async (req, res) => {
    try {
      const teacherId = req.headers['x-user-id'];
      if (!teacherId) return res.status(401).json({ error: "Unauthorized" });

      const assignments = await sql`
        SELECT ta.class_id, s.name as subject_name, s.id as subject_id, s.grade, s.semester
        FROM teacher_assignments ta
        JOIN subjects s ON ta.subject_id = s.id
        WHERE ta.teacher_id = ${teacherId}
      `;
      
      res.json(assignments);
    } catch (err) {
      console.error("Failed to fetch teacher assignments:", err);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  app.get("/api/hierarchy/grades", async (req, res) => {
    const schoolId = req.headers['x-school-id'] || '1';
    
    try {
      const grades = await sql`SELECT DISTINCT grade FROM students WHERE school_id = ${schoolId} ORDER BY grade`;
      res.json(grades.map((g: any) => g.grade));
    } catch (err) {
      console.error("Failed to fetch grades:", err);
      res.status(500).json({ error: "Failed to fetch grades" });
    }
  });

  app.get("/api/hierarchy/sections", async (req, res) => {
    const { grade } = req.query;
    const schoolId = req.headers['x-school-id'] || '1';
    
    try {
      const sections = await sql`SELECT DISTINCT section FROM students WHERE grade = ${grade} AND school_id = ${schoolId} ORDER BY section`;
      res.json(sections.map((s: any) => s.section));
    } catch (err) {
      console.error("Failed to fetch sections:", err);
      res.status(500).json({ error: "Failed to fetch sections" });
    }
  });

  app.get("/api/hierarchy/students", async (req, res) => {
    const { grade, section } = req.query;
    const schoolId = req.headers['x-school-id'] || '1';
    try {
      const students = await sql`SELECT id, name FROM students WHERE grade = ${grade} AND section = ${section} AND school_id = ${schoolId} ORDER BY name`;
      res.json(students);
    } catch (err) {
      console.error("Failed to fetch admin students:", err);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:studentId/violations/:violationId/occurrence", async (req, res) => {
    const { studentId, violationId } = req.params;
    try {
      const result = await sql`
        SELECT COUNT(*) as count 
        FROM referrals 
        WHERE student_id = ${studentId} AND violation_id = ${violationId}
      `;
      res.json({ count: parseInt(result[0].count) });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch occurrence count" });
    }
  });

  app.get("/api/student-profile/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const studentResult = await sql`
        SELECT 
          s.*,
          (SELECT COUNT(*) FROM referrals WHERE student_id = s.id) as total_referrals,
          (SELECT COUNT(*) FROM referrals WHERE student_id = s.id AND status IN ('resolved', 'closed')) as closed_referrals,
          (SELECT COUNT(*) FROM referrals WHERE student_id = s.id AND status NOT IN ('resolved', 'closed')) as active_referrals
        FROM students s
        WHERE s.id = ${id}
      `;

      if (studentResult.length === 0) {
        return res.status(404).json({ error: "Student not found" });
      }

      // 2. Calculate Live Scores
      const absencesResult = await sql`
        SELECT COUNT(*) as unexcused_absences 
        FROM attendance_records 
        WHERE student_id = ${id} AND status = 'غائب' AND is_excused = FALSE
      `;
      const unexcusedAbsences = parseInt(absencesResult[0].unexcused_absences || 0);
      const attendanceScore = Math.max(0, 100 - unexcusedAbsences);

      const scoreLogs = await sql`
        SELECT action_type, SUM(points_changed) as total_points
        FROM student_score_logs
        WHERE student_id = ${id}
        GROUP BY action_type
      `;
      let behaviorDeductions = 0;
      let reinforcementPoints = 0;
      scoreLogs.forEach((log: any) => {
        if (log.action_type === 'deduction') behaviorDeductions += parseInt(log.total_points || 0);
        if (log.action_type === 'bonus' || log.action_type === 'compensation') reinforcementPoints += parseInt(log.total_points || 0);
      });
      const behaviorScore = Math.max(0, 100 - behaviorDeductions);

      // 3. Master Timeline (Union Query)
      const timeline = await sql`
        SELECT 
          'referral' as event_type,
          r.id::text as event_id,
          r.created_at as event_date,
          COALESCE(u.name, 'مستخدم محذوف') as actor_name,
          r.reason as description,
          r.type as category,
          r.status as status
        FROM referrals r
        LEFT JOIN users u ON r.teacher_id = u.id
        WHERE r.student_id = ${id}

        UNION ALL

        SELECT 
          'attendance' as event_type,
          a.id::text as event_id,
          a.created_at as event_date,
          COALESCE(u.name, 'مستخدم محذوف') as actor_name,
          a.status as description,
          CASE WHEN a.is_excused THEN 'excused' ELSE 'unexcused' END as category,
          'completed' as status
        FROM attendance_records a
        LEFT JOIN users u ON a.teacher_id = u.id
        WHERE a.student_id = ${id} AND a.status != 'حاضر'

        UNION ALL

        SELECT 
          'score_log' as event_type,
          s.id::text as event_id,
          s.created_at as event_date,
          COALESCE(u.name, 'مستخدم محذوف') as actor_name,
          s.reason_or_evidence as description,
          s.action_type as category,
          'completed' as status
        FROM student_score_logs s
        LEFT JOIN users u ON s.created_by_user_id = u.id
        WHERE s.student_id = ${id}

        UNION ALL

        SELECT 
          'smart_grade' as event_type,
          sg.id::text as event_id,
          COALESCE(sg.updated_at, s.created_at) as event_date,
          COALESCE(u.name, 'مستخدم محذوف') as actor_name,
          t.name || ': ' || sg.grade || ' / ' || t.max_grade as description,
          t.category as category,
          'completed' as status
        FROM smart_tracker_student_grades sg
        JOIN smart_tracker_tasks t ON sg.task_id = t.id
        JOIN smart_tracker_student_states ss ON sg.student_state_id = ss.id
        JOIN smart_tracker_sessions s ON ss.session_id = s.id
        LEFT JOIN users u ON s.teacher_id = u.id
        WHERE ss.student_id = ${id}

        UNION ALL

        SELECT 
          'smart_behavior' as event_type,
          ss.id::text as event_id,
          s.created_at as event_date,
          COALESCE(u.name, 'مستخدم محذوف') as actor_name,
          chip as description,
          'behavior' as category,
          'completed' as status
        FROM smart_tracker_student_states ss
        CROSS JOIN LATERAL jsonb_array_elements_text(ss.behavior_chips) as chip
        JOIN smart_tracker_sessions s ON ss.session_id = s.id
        LEFT JOIN users u ON s.teacher_id = u.id
        WHERE ss.student_id = ${id} AND jsonb_array_length(ss.behavior_chips) > 0

        UNION ALL

        SELECT 
          'pass' as event_type,
          p.id::text as event_id,
          p.created_at as event_date,
          p.agent_name as actor_name,
          CASE 
            WHEN p.type = 'entry' THEN 'إذن دخول للفصل'
            WHEN p.type = 'exit' THEN 'إذن خروج من المدرسة'
            ELSE 'استدعاء للوكيل'
          END || (CASE WHEN p.reason IS NOT NULL AND p.reason != '' THEN ' - ' || p.reason ELSE '' END) as description,
          p.type as category,
          p.status as status
        FROM passes p
        WHERE p.student_id::int = ${id}

        ORDER BY event_date DESC
      `;

      // 4. Detailed Tabs Data
      const attendanceRecords = await sql`
        SELECT a.*, COALESCE(u.name, 'مستخدم محذوف') as teacher_name
        FROM attendance_records a
        LEFT JOIN users u ON a.teacher_id = u.id
        WHERE a.student_id = ${id}
        ORDER BY a.date DESC
      `;

      const behaviorRecords = await sql`
        SELECT r.*, v.violation_name, v.degree, COALESCE(u.name, 'مستخدم محذوف') as teacher_name
        FROM referrals r
        JOIN behavioral_violations_dict v ON r.violation_id = v.id
        LEFT JOIN users u ON r.teacher_id = u.id
        WHERE r.student_id = ${id} AND r.type = 'behavior'
        ORDER BY r.created_at DESC
      `;

      const counselorNotes = await sql`
        SELECT r.id, r.remedial_plan, r.created_at, COALESCE(u.name, 'مستخدم محذوف') as counselor_name
        FROM referrals r
        LEFT JOIN users u ON r.assigned_to_id = u.id
        WHERE r.student_id = ${id} AND r.remedial_plan IS NOT NULL
        ORDER BY r.created_at DESC
      `;

      const referrals = await sql`
        SELECT r.*, COALESCE(u.name, 'مستخدم محذوف') as teacher_name
        FROM referrals r
        LEFT JOIN users u ON r.teacher_id = u.id
        WHERE r.student_id = ${id}
        ORDER BY r.created_at DESC
      `;

      // 5. Smart Tracker Data
      const trackerData = await sql`
        SELECT 
          s.subject, 
          s.date, 
          t.name as task_name, 
          t.max_grade, 
          sg.grade as student_grade,
          st.attendance as attendance_status,
          u.name as teacher_name
        FROM smart_tracker_sessions s
        JOIN smart_tracker_tasks t ON s.id = t.session_id
        JOIN smart_tracker_student_states st ON s.id = st.session_id
        JOIN smart_tracker_student_grades sg ON st.id = sg.student_state_id AND sg.task_id = t.id
        LEFT JOIN users u ON s.teacher_id = u.id
        WHERE st.student_id = ${id}
        ORDER BY s.date DESC
      `;

      res.json({ 
        student: {
          ...studentResult[0],
          live_attendance_score: attendanceScore,
          live_behavior_score: behaviorScore,
          reinforcement_points: reinforcementPoints
        }, 
        timeline,
        attendanceRecords,
        behaviorRecords,
        counselorNotes,
        referrals,
        trackerData
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch student profile" });
    }
  });

  // Helper function for behavioral deduction logic
  async function calculateBehavioralDeduction(student_id: number, violation_id: number) {
    const violationData = await sql`SELECT deduction_points, violation_name, degree FROM behavioral_violations_dict WHERE id = ${violation_id}`;
    if (violationData.length === 0) return { deductionPoints: 0, violationName: '', violationDegree: 0, occurrenceNumber: 0 };

    const violationName = violationData[0].violation_name;
    const violationDegree = violationData[0].degree;
    
    // Count previous occurrences of the SAME violation for this student
    const prevOccurrences = await sql`
      SELECT COUNT(*) as count 
      FROM referrals 
      WHERE student_id = ${student_id} AND violation_id = ${violation_id}
    `;
    const occurrenceNumber = parseInt(prevOccurrences[0].count) + 1;

    let deductionPoints = 0;
    switch (violationDegree) {
      case 1:
        // الدرجة الأولى: المرة 1 و 2 (لا حسم)، المرة 3 و 4 (حسم 1 درجة)
        if (occurrenceNumber >= 3) deductionPoints = 1;
        else deductionPoints = 0;
        break;
      case 2:
        deductionPoints = 2;
        break;
      case 3:
        deductionPoints = 3;
        break;
      case 4:
        deductionPoints = 10;
        break;
      case 5:
        deductionPoints = 15;
        break;
      default:
        deductionPoints = violationData[0].deduction_points;
    }

    return { deductionPoints, violationName, violationDegree, occurrenceNumber };
  }

  app.post("/api/referrals", async (req, res) => {
    const { student_id, teacher_id, type, severity, reason, teacher_notes, remedial_plan, remedial_plan_file, violation_id, applied_remedial_actions, status } = req.body;
    
    try {
      // 1. Data Validation: Ensure at least one procedure is selected for behavior violations (only if it's a specific violation)
      if (type === 'behavior' && violation_id && (!applied_remedial_actions || !Array.isArray(applied_remedial_actions) || applied_remedial_actions.length === 0)) {
        return res.status(400).json({ success: false, error: "يجب اختيار إجراء علاجي/تربوي واحد على الأقل لاعتماد الحالة نظاماً." });
      }

      const finalStatus = status || 'pending_vp';
      
      // 2. Occurrence Counting & Deduction Logic
      let deductionPoints = 0;
      let violationName = reason;
      let occurrenceNumber = 0;

      if (violation_id) {
        const result = await calculateBehavioralDeduction(student_id, violation_id);
        deductionPoints = result.deductionPoints;
        violationName = result.violationName;
        occurrenceNumber = result.occurrenceNumber;
      }

      // 4. Database Transaction
      const result = await sql`
        INSERT INTO referrals (student_id, teacher_id, type, severity, reason, teacher_notes, remedial_plan, remedial_plan_file, status, violation_id, applied_remedial_actions)
        VALUES (${student_id}, ${teacher_id}, ${type}, ${severity}, ${reason}, ${teacher_notes}, ${remedial_plan}, ${remedial_plan_file}, ${finalStatus}, ${violation_id || null}, ${applied_remedial_actions ? JSON.stringify(applied_remedial_actions) : null})
        RETURNING id
      `;
      
      const referralId = result[0].id;

      if (violation_id && deductionPoints > 0) {
        // Log the score change for transparency
        await sql`
          INSERT INTO student_score_logs (student_id, action_type, points_changed, reason_or_evidence, created_by_user_id)
          VALUES (${student_id}, 'deduction', ${deductionPoints}, ${`مخالفة: ${violationName} (التكرار رقم ${occurrenceNumber})`}, ${teacher_id})
        `;
        
        // Update student score (Ensure it doesn't go below zero)
        await sql`
          UPDATE students 
          SET behavior_score = GREATEST(0, behavior_score - ${deductionPoints}) 
          WHERE id = ${student_id}
        `;
      }
      
      // Add initial log entry
      const logAction = finalStatus === 'resolved' ? 'تسجيل ومعالجة مباشرة' : 'إنشاء التحويل';
      const logNotes = finalStatus === 'resolved' 
        ? `تم تسجيل المخالفة وتطبيق الإجراءات النظامية مباشرة. مقدار الحسم الآلي: ${deductionPoints} درجة.` 
        : 'تم إنشاء التحويل وتحويله آلياً إلى وكيل شؤون الطلاب للمراجعة';
      
      await sql`
        INSERT INTO referral_logs (referral_id, user_id, action, notes, evidence_text, evidence_file) 
        VALUES (${referralId}, ${teacher_id}, ${logAction}, ${logNotes}, ${remedial_plan}, ${remedial_plan_file})
      `;

      // Smart Routing: Notify based on referral type
      const student = await sql`SELECT name FROM students WHERE id = ${student_id}`;
      const teacher = await sql`SELECT name FROM users WHERE id = ${teacher_id}`;
      
      let targetRoles = ['vice_principal', 'principal'];
      if (type === 'academic' || type === 'psychological' || type === 'health') {
        targetRoles = ['counselor'];
      }
      
      const recipients = await sql`SELECT id, role, phone_number FROM users WHERE role = ANY(${targetRoles})`;
      
      for (const recipient of recipients) {
        await sendNotificationWithWhatsApp(
          1,
          recipient.id,
          teacher_id,
          'تحويل طالب جديد',
          `تم تحويل الطالب ${student[0].name} من قبل ${teacher[0].name}`,
          referralId
        );
      }
      
      res.json({ success: true, id: referralId });
    } catch (err) {
      console.error("Referral creation failed:", err);
      res.status(500).json({ success: false, error: "Failed to create referral" });
    }
  });

  app.get("/api/referrals/:id", async (req, res) => {
    const id = req.params.id;
    try {
      const referralResult = await sql`
        SELECT r.*, s.name as student_name, s.national_id as student_national_id, s.grade as student_grade, s.section as student_section, s.behavior_score as student_behavior_score, COALESCE(u.name, 'مستخدم محذوف') as teacher_name,
               v.violation_name, v.degree as violation_degree, v.deduction_points as violation_points
        FROM referrals r
        JOIN students s ON r.student_id = s.id
        LEFT JOIN users u ON r.teacher_id = u.id
        LEFT JOIN behavioral_violations_dict v ON r.violation_id = v.id
        WHERE r.id = ${id}
      `;

      if (referralResult.length === 0) {
        return res.status(404).json({ error: "Referral not found" });
      }

      const studentId = referralResult[0].student_id;
      const studentReferralsCount = await sql`SELECT COUNT(*) as count FROM referrals WHERE student_id = ${studentId}`;

      const logs = await sql`
        SELECT l.*, COALESCE(u.name, 'مستخدم محذوف') as user_name, u.role as user_role
        FROM referral_logs l
        LEFT JOIN users u ON l.user_id = u.id
        WHERE l.referral_id = ${id}
        ORDER BY l.created_at DESC
      `;

      const principalResult = await sql`SELECT name FROM users WHERE role = 'principal' LIMIT 1`;
      const principalName = principalResult.length > 0 ? principalResult[0].name : 'غير محدد';

      res.json({ 
        referral: referralResult[0], 
        logs, 
        studentReferralsCount: parseInt(studentReferralsCount[0].count),
        principalName
      });
    } catch (err) {
      console.error("Error fetching referral details:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/referrals/:id/action", async (req, res) => {
    const { user_id, action, notes, status, evidence_file, evidence_text, violation_id, applied_remedial_actions } = req.body;
    const referralId = req.params.id;

    try {
      // Update referral status and latest evidence if provided
      let updateQuery = sql`UPDATE referrals SET status = ${status}`;
      if (evidence_file) updateQuery = sql`UPDATE referrals SET status = ${status}, evidence_file = ${evidence_file} WHERE id = ${referralId}`;
      
      // If VP is classifying the violation
      if (violation_id) {
        // Get student_id first
        const referralData = await sql`SELECT student_id FROM referrals WHERE id = ${referralId}`;
        if (referralData.length > 0) {
          const student_id = referralData[0].student_id;
          const { deductionPoints, violationName, occurrenceNumber } = await calculateBehavioralDeduction(student_id, violation_id);

          await sql`
            UPDATE referrals 
            SET violation_id = ${violation_id}, 
                applied_remedial_actions = ${applied_remedial_actions ? JSON.stringify(applied_remedial_actions) : null}
            WHERE id = ${referralId}
          `;

          if (deductionPoints > 0) {
            await sql`
              INSERT INTO student_score_logs (student_id, action_type, points_changed, reason_or_evidence, created_by_user_id)
              VALUES (${student_id}, 'deduction', ${deductionPoints}, ${`تصنيف مخالفة من الوكيل: ${violationName} (التكرار رقم ${occurrenceNumber})`}, ${user_id})
            `;
            await sql`
              UPDATE students 
              SET behavior_score = GREATEST(0, behavior_score - ${deductionPoints}) 
              WHERE id = ${student_id}
            `;
          }
        }
      }

      if (evidence_file) {
        await sql`UPDATE referrals SET status = ${status}, evidence_file = ${evidence_file} WHERE id = ${referralId}`;
      } else {
        await sql`UPDATE referrals SET status = ${status} WHERE id = ${referralId}`;
      }

      // Always log the action with its specific evidence
      await sql`
        INSERT INTO referral_logs (referral_id, user_id, action, notes, evidence_file, evidence_text) 
        VALUES (${referralId}, ${user_id}, ${action}, ${notes}, ${evidence_file || null}, ${evidence_text || null})
      `;

      // Notification Logic
      const referral = await sql`SELECT teacher_id, student_id, type FROM referrals WHERE id = ${referralId}`;
      if (referral.length === 0) return res.status(404).json({ error: "Referral not found" });
      
      const student = await sql`SELECT name FROM students WHERE id = ${referral[0].student_id}`;
      const actor = await sql`SELECT name, role FROM users WHERE id = ${user_id}`;

      // 1. If evidence added by VP or Counselor -> Notify Teacher
      if ((actor[0].role === 'vice_principal' || actor[0].role === 'counselor') && (evidence_file || evidence_text)) {
        await sendNotificationWithWhatsApp(
          1,
          referral[0].teacher_id,
          Number(user_id),
          'إضافة شواهد',
          `تم إضافة شواهد جديدة لتحويل الطالب: ${student[0].name}`,
          Number(referralId)
        );
      }

      // 2. If status changed to pending_counselor -> Notify Counselors
      if (status === 'pending_counselor') {
        const counselors = await sql`SELECT id FROM users WHERE role = 'counselor'`;
        for (const counselor of counselors) {
          await sendNotificationWithWhatsApp(
            1,
            counselor.id,
            Number(user_id),
            'تصعيد حالة',
            `تم تصعيد حالة الطالب: ${student[0].name} للمرشد الطلابي`,
            Number(referralId)
          );
        }
      }

      // 3. If status changed to returned_to_teacher -> Notify Teacher
      if (status === 'returned_to_teacher') {
        await sendNotificationWithWhatsApp(
          1,
          referral[0].teacher_id,
          Number(user_id),
          'إرجاع تحويل',
          `تم إرجاع تحويل الطالب: ${student[0].name} لاستكمال النواقص`,
          Number(referralId)
        );
      }

      // 4. If status changed to pending_vp and actor is teacher -> Notify Vice Principals (or Counselors if academic/psychological/health)
      if (status === 'pending_vp' && actor[0].role === 'teacher') {
        let targetRoles = ['vice_principal', 'principal'];
        if (referral[0].type === 'academic' || referral[0].type === 'psychological' || referral[0].type === 'health') {
          targetRoles = ['counselor'];
        }
        
        const recipients = await sql`SELECT id FROM users WHERE role = ANY(${targetRoles})`;
        for (const recipient of recipients) {
          await sendNotificationWithWhatsApp(
            1,
            recipient.id,
            Number(user_id),
            'إعادة إرسال تحويل',
            `تم استكمال النواقص وإعادة إرسال تحويل الطالب: ${student[0].name}`,
            Number(referralId)
          );
        }
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: "Action failed" });
    }
  });

  app.get("/api/referrals/:id/evidence", async (req, res) => {
    const { id } = req.params;
    const { userId, role } = req.query;

    try {
      const referralResult = await sql`
        SELECT r.teacher_id, r.remedial_plan, r.evidence_file, r.remedial_plan_file
        FROM referrals r
        WHERE r.id = ${id}
      `;

      if (referralResult.length === 0) {
        return res.status(404).json({ error: "Referral not found" });
      }

      const referral = referralResult[0];

      // Permission check: Teacher can only see their own referrals
      if (role === 'teacher' && referral.teacher_id !== parseInt(userId as string)) {
        return res.status(403).json({ error: "Unauthorized access to evidence" });
      }

      res.json({
        text: referral.remedial_plan,
        file: referral.evidence_file || referral.remedial_plan_file
      });
    } catch (err) {
      console.error("Failed to fetch evidence:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // SSE Clients
  const notificationClients = new Map<string, Set<express.Response>>();

  app.get("/api/notifications/stream", (req, res) => {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).end();
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send an initial heartbeat to establish connection
    res.write(': heartbeat\n\n');

    const heartbeatInterval = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 30000);

    if (!notificationClients.has(userId)) {
      notificationClients.set(userId, new Set());
    }
    notificationClients.get(userId)!.add(res);

    req.on('close', () => {
      clearInterval(heartbeatInterval);
      const clients = notificationClients.get(userId);
      if (clients) {
        clients.delete(res);
        if (clients.size === 0) {
          notificationClients.delete(userId);
        }
      }
    });
  });

  // Helper function to send real-time notification
  const sendRealtimeNotification = (userId: string, notification: any) => {
    const clients = notificationClients.get(userId.toString());
    if (clients) {
      clients.forEach(client => {
        client.write(`data: ${JSON.stringify(notification)}\n\n`);
      });
    }
  };

  // Helper function to send WhatsApp message (Mock)
  const sendWhatsAppMessage = async (phoneNumber: string, message: string) => {
    if (!phoneNumber) return;
    console.log(`[WhatsApp API Mock] Sending to ${phoneNumber}: ${message}`);
    // Here you would integrate with a real WhatsApp API provider like Twilio, Gupshup, or Meta Cloud API
    // Example:
    // await fetch('https://api.whatsapp.com/send', { method: 'POST', body: JSON.stringify({ to: phoneNumber, text: message }) });
  };

  const sendNotificationWithWhatsApp = async (
    schoolId: number,
    userId: number,
    senderId: number,
    title: string,
    message: string,
    referenceId: number
  ) => {
    try {
      // 1. Insert into DB and get sender name
      const [newNotif] = await sql`
        WITH inserted AS (
          INSERT INTO notifications (school_id, user_id, sender_id, title, message, reference_id)
          VALUES (${schoolId}, ${userId}, ${senderId}, ${title}, ${message}, ${referenceId})
          RETURNING *
        )
        SELECT i.*, COALESCE(u.name, 'مستخدم محذوف') as sender_name
        FROM inserted i
        LEFT JOIN users u ON i.sender_id = u.id
      `;
      
      // 2. Send Realtime
      sendRealtimeNotification(userId.toString(), newNotif);

      // 3. Check WhatsApp Settings and User Phone
      const userRes = await sql`SELECT role, phone_number, whatsapp_enabled FROM users WHERE id = ${userId}`;
      if (userRes.length === 0) return;
      const recipient = userRes[0];

      const settings = await sql`SELECT key, value FROM system_settings WHERE key IN ('whatsapp_notif_enabled', 'whatsapp_notif_counselor', 'whatsapp_notif_deputy', 'whatsapp_notif_teachers')`;
      const settingsMap = settings.reduce((acc: any, row: any) => {
        acc[row.key] = row.value === 'true';
        return acc;
      }, {});

      // If global WhatsApp notifications are disabled, stop here
      if (!settingsMap['whatsapp_notif_enabled']) return;
      
      // If user specifically disabled WhatsApp notifications, stop here
      if (recipient.whatsapp_enabled === false) return;

      let shouldSendWhatsApp = false;
      if (recipient.role === 'counselor' && settingsMap['whatsapp_notif_counselor']) shouldSendWhatsApp = true;
      if (recipient.role === 'vice_principal' && settingsMap['whatsapp_notif_deputy']) shouldSendWhatsApp = true;
      if (recipient.role === 'teacher' && settingsMap['whatsapp_notif_teachers']) shouldSendWhatsApp = true;

      if (shouldSendWhatsApp && recipient.phone_number) {
        const waMessage = `🔔 تنبيه من النظام: ${message}`;
        await sendWhatsAppMessage(recipient.phone_number, waMessage);
      }
    } catch (err) {
      console.error("Error sending notification:", err);
    }
  };

  app.get("/api/notifications", async (req, res) => {
    const { userId } = req.query;
    try {
      const notifications = await sql`
        SELECT n.*, COALESCE(u.name, 'مستخدم محذوف') as sender_name
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.id
        WHERE n.user_id = ${userId}
        ORDER BY n.created_at DESC
        LIMIT 20
      `;
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    const { id } = req.params;
    try {
      await sql`UPDATE notifications SET is_read = TRUE WHERE id = ${id}`;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/read-all", async (req, res) => {
    const { userId } = req.body;
    try {
      await sql`UPDATE notifications SET is_read = TRUE WHERE user_id = ${userId}`;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    const id = req.params.id;
    try {
      await sql`DELETE FROM notifications WHERE id = ${id}`;
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to delete notification:", err);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  app.get("/api/reports/top-students", async (req, res) => {
    try {
      const data = await sql`
        SELECT 
          s.name, 
          s.grade, 
          COUNT(r.id) as referral_count,
          (
            SELECT type 
            FROM referrals 
            WHERE student_id = s.id 
            GROUP BY type 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
          ) as most_frequent_problem
        FROM students s
        JOIN referrals r ON s.id = r.student_id
        GROUP BY s.id, s.name, s.grade
        ORDER BY referral_count DESC
        LIMIT 10
      `;
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch top students" });
    }
  });

  app.get("/api/reports/referral-status", async (req, res) => {
    try {
      const data = await sql`
        SELECT 
          r.id, 
          s.name as student_name, 
          s.national_id as student_national_id,
          s.grade as student_grade, 
          COALESCE(u.name, 'مستخدم محذوف') as teacher_name, 
          r.status, 
          r.reason, 
          r.type,
          r.remedial_plan,
          r.created_at,
          (SELECT created_at FROM referral_logs WHERE referral_id = r.id AND (action LIKE '%إغلاق%' OR action LIKE '%حل%') ORDER BY created_at DESC LIMIT 1) as closed_at
        FROM referrals r
        JOIN students s ON r.student_id = s.id
        LEFT JOIN users u ON r.teacher_id = u.id
        ORDER BY r.created_at DESC
      `;
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch referral status" });
    }
  });

  app.get("/api/reports/kpi-stats", async (req, res) => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const stats = await sql`
        SELECT 
          COUNT(*) FILTER (WHERE created_at >= ${firstDayOfMonth}) as total_this_month,
          COUNT(*) FILTER (WHERE status IN ('resolved', 'closed')) as resolved_cases,
          COUNT(*) FILTER (WHERE status NOT IN ('resolved', 'closed')) as pending_cases,
          COUNT(*) FILTER (WHERE severity = 'low') as first_offense_cases
        FROM referrals
      `;
      res.json(stats[0]);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch KPI stats" });
    }
  });

  app.get("/api/reports/teacher-stats", async (req, res) => {
    try {
      const data = await sql`
        SELECT 
          u.name, 
          COUNT(r.id) as total_referrals,
          COUNT(r.id) FILTER (WHERE r.status IN ('resolved', 'closed')) as resolved_count,
          COUNT(r.id) FILTER (WHERE r.status = 'pending_counselor') as escalated_count
        FROM users u
        LEFT JOIN referrals r ON u.id = r.teacher_id
        WHERE u.role = 'teacher'
        GROUP BY u.id, u.name
        HAVING COUNT(r.id) > 0
        ORDER BY total_referrals DESC
      `;
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch teacher stats" });
    }
  });

  app.get("/api/students/:id/referrals", async (req, res) => {
    try {
      const studentId = req.params.id;
      const referrals = await sql`
        SELECT r.*, COALESCE(u.name, 'مستخدم محذوف') as teacher_name
        FROM referrals r
        LEFT JOIN users u ON r.teacher_id = u.id
        WHERE r.student_id = ${studentId}
        ORDER BY r.created_at DESC
      `;
      res.json(referrals);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch student referrals" });
    }
  });

  app.post("/api/admin/users/:id/toggle-status", async (req, res) => {
    const userId = req.params.id;
    try {
      const user = await sql`SELECT is_active FROM users WHERE id = ${userId}`;
      if (user.length === 0) return res.status(404).json({ error: "User not found" });
      
      const newStatus = !user[0].is_active;
      await sql`UPDATE users SET is_active = ${newStatus} WHERE id = ${userId}`;
      
      res.json({ success: true, is_active: newStatus });
    } catch (err) {
      res.status(500).json({ error: "Failed to toggle user status" });
    }
  });

  app.get("/api/admin/subjects", async (req, res) => {
    try {
      const schoolId = req.headers['x-school-id'] || '1';
      const subjects = await sql`SELECT * FROM subjects WHERE school_id = ${schoolId}`;
      res.json(subjects);
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
      res.status(500).json({ error: "Failed to fetch subjects" });
    }
  });

  app.post("/api/admin/subjects", async (req, res) => {
    try {
      const schoolId = req.headers['x-school-id'] || '1';
      const { name, is_elective, grade, semester } = req.body;
      const result = await sql`INSERT INTO subjects (name, school_id, is_elective, grade, semester) VALUES (${name}, ${schoolId}, ${is_elective || false}, ${grade || null}, ${semester || null}) RETURNING *`;
      res.json(result[0]);
    } catch (err) {
      console.error("Failed to add subject:", err);
      res.status(500).json({ error: "Failed to add subject" });
    }
  });

  app.put("/api/admin/subjects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const schoolId = req.headers['x-school-id'] || '1';
      const { name, is_elective, grade, semester } = req.body;
      
      const result = await sql`
        UPDATE subjects 
        SET name = ${name}, is_elective = ${is_elective}, grade = ${grade || null}, semester = ${semester || null}
        WHERE id = ${id} AND school_id = ${schoolId}
        RETURNING *
      `;
      
      if (result.length === 0) {
        return res.status(404).json({ error: "Subject not found or unauthorized" });
      }
      
      res.json(result[0]);
    } catch (err) {
      console.error("Failed to update subject:", err);
      res.status(500).json({ error: "Failed to update subject" });
    }
  });

  app.delete("/api/admin/subjects/:id", async (req, res) => {
    try {
      const schoolId = req.headers['x-school-id'] || '1';
      const result = await sql`DELETE FROM subjects WHERE id = ${req.params.id} AND school_id = ${schoolId} AND is_elective = TRUE RETURNING *`;
      if (result.length === 0) {
        return res.status(403).json({ error: "Cannot delete core subjects or subject not found" });
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to delete subject:", err);
      res.status(500).json({ error: "Failed to delete subject" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const schoolId = req.headers['x-school-id'] || '1';
      
      const users = await sql`SELECT id, name, email, role, is_active, phone_number, whatsapp_enabled, status, is_phone_verified, national_id FROM users WHERE (is_phone_verified = TRUE OR status = 'ACTIVE' OR role IN ('admin', 'principal')) AND school_id = ${schoolId}` as any[];
      const usersWithGrades = await Promise.all(users.map(async u => {
        const gradesResult = await sql`SELECT grade FROM user_grades WHERE user_id = ${u.id}`;
        const grades = gradesResult.map((g: any) => g.grade);
        
        let assignments = [];
        if (u.role === 'teacher') {
          assignments = await sql`SELECT * FROM teacher_assignments WHERE teacher_id = ${u.id}`;
        }
        
        return { ...u, assigned_grades: grades, assignments };
      }));
      res.json(usersWithGrades);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/sections", async (req, res) => {
    const { grade } = req.query;
    const schoolId = req.headers['x-school-id'];
    console.log("Fetching sections for grade:", grade, "for school:", schoolId);
    
    if (!grade) {
      return res.status(400).json({ error: "Grade is required" });
    }
    
    if (!schoolId) {
      return res.status(400).json({ error: "School ID is required" });
    }
    
    try {
      let searchGrade = (grade as string).trim();
      // Normalize: remove "الصف " prefix if present
      if (searchGrade.startsWith("الصف ")) {
        searchGrade = searchGrade.replace("الصف ", "").trim();
      }
      
      // Further normalize: split into words and remove "ال" prefix from each word
      // This helps match "أول ثانوي" with "الصف الأول الثانوي"
      const words = searchGrade.split(/\s+/);
      const normalizedWords = words.map(word => word.replace(/^ال/, ''));
      const searchPattern = `%${normalizedWords.join('%')}%`;
      
      console.log(`[SECTIONS] Querying for: ${searchPattern} in school ${schoolId}`);
      
      const sections = await sql`
        SELECT DISTINCT TRIM(section) as section 
        FROM students 
        WHERE school_id = ${schoolId}
        AND TRIM(grade) ILIKE ${searchPattern}
        AND section IS NOT NULL 
        AND section != ''
        ORDER BY section
      `;
      
      console.log("Normalized search for", grade, "->", searchPattern, ". Found sections:", sections);
      res.json(sections.map(s => s.section));
    } catch (err) {
      console.error("Failed to fetch sections:", err);
      res.status(500).json({ error: "Failed to fetch sections" });
    }
  });

  app.post("/api/admin/users/:id/approve", async (req, res) => {
    const userId = req.params.id;
    try {
      await sql`
        UPDATE users 
        SET status = 'ACTIVE', is_active = TRUE 
        WHERE id = ${userId}
      `;
      res.json({ success: true, message: "تم اعتماد المستخدم بنجاح" });
    } catch (err) {
      console.error("[APPROVE USER] Error:", err);
      res.status(500).json({ error: "Failed to approve user" });
    }
  });

  app.post("/api/admin/users/:id/grades", async (req, res) => {
    const { grades } = req.body; // Array of strings
    const userId = req.params.id;

    try {
      await sql`DELETE FROM user_grades WHERE user_id = ${userId}`;
      for (const grade of grades) {
        await sql`INSERT INTO user_grades (user_id, grade) VALUES (${userId}, ${grade})`;
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: "Update failed" });
    }
  });

  app.post("/api/admin/users/:id/role", async (req, res) => {
    const { role } = req.body;
    try {
      await sql`UPDATE users SET role = ${role} WHERE id = ${req.params.id}`;
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to update user role:", err);
      res.status(500).json({ success: false, error: "Failed to update user role" });
    }
  });

  app.post("/api/admin/users/:id/update", async (req, res) => {
    const { name, email, phone_number, whatsapp_enabled, subjects, classes, assignments } = req.body;
    try {
      await sql`UPDATE users SET name = ${name}, email = ${email}, phone_number = ${phone_number || null}, whatsapp_enabled = ${whatsapp_enabled !== undefined ? whatsapp_enabled : true} WHERE id = ${req.params.id}`;
      
      if (assignments && Array.isArray(assignments)) {
        await sql`DELETE FROM teacher_assignments WHERE teacher_id = ${req.params.id}`;
        for (const assignment of assignments) {
          await sql`
            INSERT INTO teacher_assignments (teacher_id, subject_id, class_id)
            VALUES (${req.params.id}, ${assignment.subject_id}, ${assignment.class_id})
          `;
        }
      } else if (subjects && Array.isArray(subjects) && classes && Array.isArray(classes)) {
        await sql`DELETE FROM teacher_assignments WHERE teacher_id = ${req.params.id}`;
        
        // Fetch subjects to check their grades
        const subjectsData = await sql`SELECT id, grade FROM subjects WHERE id = ANY(${subjects})`;
        const subjectGradeMap = new Map(subjectsData.map((s: any) => [s.id, s.grade]));

        for (const subject_id of subjects) {
          const subjectGrade = subjectGradeMap.get(Number(subject_id));
          
          for (const class_id of classes) {
            const classGrade = String(class_id).split('|')[0];
            
            // Only assign if subject grade matches class grade, or if subject has no grade (general)
            if (!subjectGrade || subjectGrade === classGrade) {
              await sql`
                INSERT INTO teacher_assignments (teacher_id, subject_id, class_id)
                VALUES (${req.params.id}, ${subject_id}, ${class_id})
              `;
            }
          }
        }
      } else if (subjects !== undefined || classes !== undefined || assignments !== undefined) {
        // If they are explicitly passed as empty arrays, clear assignments
        await sql`DELETE FROM teacher_assignments WHERE teacher_id = ${req.params.id}`;
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to update user:", err);
      res.status(500).json({ success: false, error: "Failed to update user" });
    }
  });

  app.post("/api/admin/users/:id/password", async (req, res) => {
    const { password } = req.body;
    try {
      await sql`UPDATE users SET password = ${password} WHERE id = ${req.params.id}`;
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to update user password:", err);
      res.status(500).json({ success: false, error: "Failed to update user password" });
    }
  });

  app.post("/api/admin/users/:id/delete", async (req, res) => {
    const userId = req.params.id;
    console.log(`[ADMIN] Request to delete user ID: ${userId}`);
    try {
      // Set references to NULL to avoid foreign key constraint violations
      await sql`UPDATE referrals SET teacher_id = NULL WHERE teacher_id = ${userId}`;
      await sql`UPDATE referrals SET assigned_to_id = NULL WHERE assigned_to_id = ${userId}`;
      await sql`UPDATE referral_logs SET user_id = NULL WHERE user_id = ${userId}`;
      await sql`UPDATE notifications SET sender_id = NULL WHERE sender_id = ${userId}`;
      await sql`UPDATE notifications SET user_id = NULL WHERE user_id = ${userId}`;
      await sql`UPDATE attendance_records SET teacher_id = NULL WHERE teacher_id = ${userId}`;
      await sql`UPDATE attendance_records SET modified_by = NULL WHERE modified_by = ${userId}`;
      await sql`UPDATE student_score_logs SET created_by_user_id = NULL WHERE created_by_user_id = ${userId}`;
      
      // Delete user grades
      await sql`DELETE FROM user_grades WHERE user_id = ${userId}`;
      await sql`DELETE FROM smart_tracker_sessions WHERE teacher_id = ${userId}`;
      
      // Delete user
      await sql`DELETE FROM users WHERE id = ${userId}`;
      
      console.log(`- Successfully deleted user ${userId}`);
      res.json({ success: true });
    } catch (err) {
      console.error(`[ADMIN] User deletion failed for ID ${userId}:`, err);
      res.status(500).json({ success: false, error: "فشل حذف المستخدم من قاعدة البيانات" });
    }
  });

  app.post("/api/admin/database/students/delete", async (req, res) => {
    try {
      console.log(`[ADMIN] Request to delete ALL students`);
      // Delete all related records first
      await sql`DELETE FROM notifications`;
      await sql`DELETE FROM referral_logs`;
      await sql`DELETE FROM referrals`;
      await sql`DELETE FROM student_score_logs`;
      await sql`DELETE FROM attendance_records`;
      await sql`DELETE FROM smart_tracker_student_states`;
      await sql`DELETE FROM smart_tracker_sessions`;
      // Finally delete all students
      await sql`DELETE FROM students`;
      
      console.log(`- Successfully deleted all students and related records`);
      res.json({ success: true });
    } catch (err) {
      console.error(`[ADMIN] Failed to delete all students:`, err);
      res.status(500).json({ success: false, error: "فشل حذف قاعدة بيانات الطلاب" });
    }
  });

  app.post("/api/admin/database/users/delete", async (req, res) => {
    try {
      console.log(`[ADMIN] Request to delete ALL users except admins`);
      // Get all non-admin users
      const nonAdmins = await sql`SELECT id FROM users WHERE role != 'admin'`;
      if (nonAdmins.length > 0) {
        const userIds = nonAdmins.map((u: any) => u.id);
        
        // Set references to NULL
        await sql`UPDATE referrals SET teacher_id = NULL WHERE teacher_id = ANY(${userIds})`;
        await sql`UPDATE referrals SET assigned_to_id = NULL WHERE assigned_to_id = ANY(${userIds})`;
        await sql`UPDATE referral_logs SET user_id = NULL WHERE user_id = ANY(${userIds})`;
        await sql`UPDATE notifications SET sender_id = NULL WHERE sender_id = ANY(${userIds})`;
        await sql`UPDATE notifications SET user_id = NULL WHERE user_id = ANY(${userIds})`;
        await sql`UPDATE attendance_records SET teacher_id = NULL WHERE teacher_id = ANY(${userIds})`;
        await sql`UPDATE attendance_records SET modified_by = NULL WHERE modified_by = ANY(${userIds})`;
        await sql`UPDATE student_score_logs SET created_by_user_id = NULL WHERE created_by_user_id = ANY(${userIds})`;
        
        // Delete user grades
        await sql`DELETE FROM user_grades WHERE user_id = ANY(${userIds})`;
        await sql`DELETE FROM smart_tracker_sessions WHERE teacher_id = ANY(${userIds})`;
        
        // Delete users
        await sql`DELETE FROM users WHERE id = ANY(${userIds})`;
      }
      
      console.log(`- Successfully deleted all non-admin users`);
      res.json({ success: true });
    } catch (err) {
      console.error(`[ADMIN] Failed to delete all users:`, err);
      res.status(500).json({ success: false, error: "فشل حذف المستخدمين" });
    }
  });

  app.post("/api/admin/referrals/:id/delete", async (req, res) => {
    const referralId = req.params.id;
    console.log(`[ADMIN] Request to delete referral ID: ${referralId}`);
    try {
      // Delete associated logs and notifications first
      await sql`DELETE FROM referral_logs WHERE referral_id = ${referralId}`;
      await sql`DELETE FROM notifications WHERE reference_id = ${referralId}`;
      await sql`DELETE FROM referrals WHERE id = ${referralId}`;
      console.log(`- Successfully deleted referral ${referralId}`);
      res.json({ success: true });
    } catch (err) {
      console.error(`[ADMIN] Referral deletion failed for ID ${referralId}:`, err);
      res.status(500).json({ success: false, error: "فشل حذف التحويل من قاعدة البيانات" });
    }
  });

  app.post("/api/admin/users/create", async (req, res) => {
    const { name, email, password, role, phone_number, whatsapp_enabled } = req.body;
    const schoolId = req.headers['x-school-id'];
    if (!schoolId) return res.status(400).json({ error: "School ID is required" });
    
    try {
      const existing = await sql`SELECT * FROM users WHERE email = ${email}`;
      if (existing.length > 0) {
        return res.status(400).json({ success: false, error: "البريد الإلكتروني موجود مسبقاً" });
      }
      await sql`INSERT INTO users (name, email, password, role, phone_number, whatsapp_enabled, school_id, is_phone_verified, status) VALUES (${name}, ${email}, ${password}, ${role}, ${phone_number || null}, ${whatsapp_enabled !== undefined ? whatsapp_enabled : true}, ${schoolId}, TRUE, 'ACTIVE')`;
      res.json({ success: true });
    } catch (err) {
      console.error("User creation failed:", err);
      res.status(500).json({ success: false, error: "فشل إنشاء المستخدم" });
    }
  });

  app.post("/api/admin/referrals/:id/update", async (req, res) => {
    const { type, severity, reason, teacher_notes, remedial_plan, remedial_plan_file, status } = req.body;
    try {
      await sql`
        UPDATE referrals 
        SET type = ${type}, severity = ${severity}, reason = ${reason}, teacher_notes = ${teacher_notes}, remedial_plan = ${remedial_plan}, remedial_plan_file = ${remedial_plan_file}, status = ${status} 
        WHERE id = ${req.params.id}
      `;
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to update referral:", err);
      res.status(500).json({ success: false, error: "Failed to update referral" });
    }
  });

  app.post("/api/admin/students/transfer", async (req, res) => {
    const { national_id, new_grade, new_section } = req.body;
    try {
      if (!national_id || !new_grade || !new_section) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      await sql`
        UPDATE students 
        SET grade = ${new_grade}, section = ${new_section}
        WHERE national_id = ${national_id}
      `;

      res.json({ success: true });
    } catch (err) {
      console.error("[TRANSFER STUDENT] Error:", err);
      res.status(500).json({ error: "Failed to transfer student" });
    }
  });

  app.post("/api/admin/students/import", async (req, res) => {
    const { students } = req.body;
    const schoolId = req.headers['x-school-id'] || '1';

    try {
      if (!students || !Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ success: false, error: "بيانات الطلاب غير صالحة" });
      }

      // Smart Bulk Insert (Upsert) in chunks to prevent server overload
      const chunkSize = 100;
      for (let i = 0; i < students.length; i += chunkSize) {
        const chunk = students.slice(i, i + chunkSize);
        
        const values: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        chunk.forEach(student => {
          values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
          params.push(
            schoolId, 
            student.national_id, 
            student.name, 
            student.grade, 
            student.section, 
            student.mobile
          );
        });

        const query = `
          INSERT INTO students (school_id, national_id, name, grade, section, parent_phone) 
          VALUES ${values.join(', ')}
          ON CONFLICT (national_id) 
          DO UPDATE SET 
            name = EXCLUDED.name, 
            grade = EXCLUDED.grade, 
            section = EXCLUDED.section, 
            parent_phone = EXCLUDED.parent_phone,
            school_id = EXCLUDED.school_id
        `;

        await (sql as any).query(query, params);
      }

      res.json({ success: true, count: students.length });
    } catch (err) {
      console.error("[IMPORT] Critical Failure:", err);
      res.status(500).json({ 
        success: false, 
        error: "فشل الاستيراد: " + (err instanceof Error ? err.message : "خطأ في قاعدة البيانات") 
      });
    }
  });

  app.get("/api/admin/students/filters", async (req, res) => {
    const schoolId = req.headers['x-school-id'] || '1';
    try {
      const result = await (sql as any).query(
        `SELECT DISTINCT grade, section FROM students 
         WHERE school_id = $1 AND grade IS NOT NULL AND section IS NOT NULL 
         ORDER BY grade, section`,
        [schoolId]
      );
      
      const rows = result.rows ? result.rows : result;
      const filters: Record<string, string[]> = {};
      
      rows.forEach((row: any) => {
        if (!filters[row.grade]) {
          filters[row.grade] = [];
        }
        if (!filters[row.grade].includes(row.section)) {
          filters[row.grade].push(row.section);
        }
      });
      
      res.json({ filters });
    } catch (err) {
      console.error("Failed to fetch student filters:", err);
      res.status(500).json({ error: "Failed to fetch filters" });
    }
  });

  app.get("/api/admin/students", async (req, res) => {
    const schoolId = req.headers['x-school-id'] || '1';
    const { grade, section } = req.query;
    
    try {
      const result = await (sql as any).query(
        `SELECT * FROM students 
         WHERE grade = $1 AND section = $2 AND school_id = $3 
         ORDER BY name ASC`,
        [grade, section, schoolId]
      );
      
      const students = result.rows ? result.rows : result;
      res.json({ students });
    } catch (err) {
      console.error("Failed to fetch admin students:", err);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.post("/api/admin/classes/delete", async (req, res) => {
    const { grade, section } = req.body;
    if (!grade || !section) return res.status(400).json({ error: "Grade and section are required" });

    try {
      console.log(`[ADMIN] Request to delete entire class: ${grade} - ${section}`);
      
      // 1. Find all students in this class
      const studentsInClass = await sql`SELECT id FROM students WHERE grade = ${grade} AND section = ${section}`;
      
      if (studentsInClass.length > 0) {
        const studentIds = studentsInClass.map((s: any) => s.id);
        
        // 2. Find all referrals for these students
        const referrals = await sql`SELECT id FROM referrals WHERE student_id = ANY(${studentIds})`;
        
        if (referrals.length > 0) {
          const refIds = referrals.map((r: any) => r.id);
          // 3. Delete notifications for these referrals
          await sql`DELETE FROM notifications WHERE reference_id = ANY(${refIds})`;
          // 4. Delete logs for these referrals
          await sql`DELETE FROM referral_logs WHERE referral_id = ANY(${refIds})`;
          // 5. Delete the referrals
          await sql`DELETE FROM referrals WHERE id = ANY(${refIds})`;
        }
        
        // 5. Delete the students' score logs and attendance records
        await sql`DELETE FROM student_score_logs WHERE student_id = ANY(${studentIds})`;
        await sql`DELETE FROM attendance_records WHERE student_id = ANY(${studentIds})`;
        await sql`DELETE FROM smart_tracker_student_states WHERE student_id = ANY(${studentIds})`;
        await sql`DELETE FROM smart_tracker_sessions WHERE grade = ${grade} AND section = ${section}`;

        // 6. Delete the students
        await sql`DELETE FROM students WHERE id = ANY(${studentIds})`;
      }
      
      console.log(`- Successfully deleted class ${grade} - ${section}`);
      res.json({ success: true });
    } catch (err) {
      console.error(`[ADMIN] Failed to delete class ${grade} - ${section}:`, err);
      res.status(500).json({ error: "فشل حذف الفصل. يرجى المحاولة مرة أخرى." });
    }
  });

  app.post("/api/admin/grades/delete", async (req, res) => {
    const { grade } = req.body;
    if (!grade) return res.status(400).json({ error: "Grade is required" });

    try {
      console.log(`[ADMIN] Request to delete entire grade: ${grade}`);
      
      // 1. Find all students in this grade
      const studentsInGrade = await sql`SELECT id FROM students WHERE grade = ${grade}`;
      
      if (studentsInGrade.length > 0) {
        const studentIds = studentsInGrade.map((s: any) => s.id);
        
        // 2. Find all referrals for these students
        const referrals = await sql`SELECT id FROM referrals WHERE student_id = ANY(${studentIds})`;
        
        if (referrals.length > 0) {
          const refIds = referrals.map((r: any) => r.id);
          // 3. Delete notifications for these referrals
          await sql`DELETE FROM notifications WHERE reference_id = ANY(${refIds})`;
          // 4. Delete logs for these referrals
          await sql`DELETE FROM referral_logs WHERE referral_id = ANY(${refIds})`;
          // 5. Delete the referrals
          await sql`DELETE FROM referrals WHERE id = ANY(${refIds})`;
        }
        
        // 5. Delete the students' score logs and attendance records
        await sql`DELETE FROM student_score_logs WHERE student_id = ANY(${studentIds})`;
        await sql`DELETE FROM attendance_records WHERE student_id = ANY(${studentIds})`;
        await sql`DELETE FROM smart_tracker_student_states WHERE student_id = ANY(${studentIds})`;
        await sql`DELETE FROM smart_tracker_sessions WHERE grade = ${grade}`;

        // 6. Delete the students
        await sql`DELETE FROM students WHERE id = ANY(${studentIds})`;
      }

      // 7. Remove this grade from user assignments
      await sql`DELETE FROM user_grades WHERE grade = ${grade}`;
      
      console.log(`[ADMIN] Successfully deleted grade ${grade} and all associated data`);
      res.json({ success: true });
    } catch (err) {
      console.error(`[ADMIN] Failed to delete grade ${grade}:`, err);
      res.status(500).json({ error: "فشل حذف الصف. يرجى المحاولة مرة أخرى." });
    }
  });

  app.post("/api/admin/students/:id/update", async (req, res) => {
    const studentId = req.params.id;
    const { name, national_id, grade, section, parent_phone } = req.body;
    try {
      await sql`
        UPDATE students 
        SET name = ${name}, national_id = ${national_id}, grade = ${grade}, section = ${section}, parent_phone = ${parent_phone}
        WHERE id = ${studentId}
      `;
      res.json({ success: true });
    } catch (err) {
      console.error(`[ADMIN] Failed to update student ${studentId}:`, err);
      res.status(500).json({ success: false, error: "فشل تحديث بيانات الطالب" });
    }
  });

  app.delete("/api/admin/students/:id", async (req, res) => {
    const studentId = req.params.id;
    try {
      // 1. Find all referrals for this student
      const referrals = await sql`SELECT id FROM referrals WHERE student_id = ${studentId}`;
      
      if (referrals.length > 0) {
        const refIds = referrals.map((r: any) => r.id);
        // 2. Delete notifications for these referrals
        await sql`DELETE FROM notifications WHERE reference_id = ANY(${refIds})`;
        // 3. Delete logs for these referrals
        await sql`DELETE FROM referral_logs WHERE referral_id = ANY(${refIds})`;
        // 4. Delete the referrals
        await sql`DELETE FROM referrals WHERE id = ANY(${refIds})`;
      }

      // 5. Delete the student's score logs and attendance records
      await sql`DELETE FROM student_score_logs WHERE student_id = ${studentId}`;
      await sql`DELETE FROM attendance_records WHERE student_id = ${studentId}`;
      await sql`DELETE FROM smart_tracker_student_states WHERE student_id = ${studentId}`;

      // 6. Delete the student
      await sql`DELETE FROM students WHERE id = ${studentId}`;
      res.json({ success: true });
    } catch (err) {
      console.error(`[ADMIN] Failed to delete student ${studentId}:`, err);
      res.status(500).json({ error: "Failed to delete student" });
    }
  });



  // ==========================================
  // Attendance System Endpoints
  // ==========================================

  // 0. Get available grades
  app.get("/api/attendance/grades", async (req, res) => {
    try {
      const grades = await sql`
        SELECT DISTINCT grade 
        FROM students 
        WHERE grade IS NOT NULL
        ORDER BY grade ASC
      `;
      res.json(grades.map(g => g.grade));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch grades" });
    }
  });

  // 0.1 Get sections for a specific grade
  app.get("/api/attendance/sections/:grade", async (req, res) => {
    const { grade } = req.params;
    try {
      const sections = await sql`
        SELECT DISTINCT section 
        FROM students 
        WHERE grade = ${grade} AND section IS NOT NULL
        ORDER BY section ASC
      `;
      res.json(sections.map(s => s.section));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch sections" });
    }
  });

  // 0.2 Get Command Center Data (Dynamic Print Engine & KPIs)
  app.get("/api/attendance/command-center", async (req, res) => {
    const { date, grade, section } = req.query;
    try {
      const students = await sql`
        SELECT 
          s.id, 
          s.name, 
          s.grade,
          s.section,
          s.parent_phone,
          COALESCE(
            json_agg(
              json_build_object(
                'period', ar.period,
                'status', ar.status,
                'is_excused', ar.is_excused,
                'excuse_reason', ar.excuse_reason,
                'teacher_name', u.name
              )
            ) FILTER (WHERE ar.id IS NOT NULL),
            '[]'
          ) as attendance_records,
          (
            SELECT COUNT(*) 
            FROM attendance_records ar_hist 
            WHERE ar_hist.student_id = s.id AND ar_hist.status = 'غائب'
          ) as total_absences
        FROM students s
        LEFT JOIN attendance_records ar 
          ON s.id = ar.student_id 
          AND ar.date = ${date as string}
        LEFT JOIN users u
          ON ar.teacher_id = u.id
        WHERE 
          (${grade === 'all' ? sql`1=1` : sql`s.grade = ${grade as string}`})
          AND 
          (${section === 'all' ? sql`1=1` : sql`s.section = ${section as string}`})
        GROUP BY s.id
        ORDER BY s.grade ASC, s.section ASC, s.name ASC
      `;
      
      res.json(students);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch command center data" });
    }
  });

  // 0.3 Get Pending Classes
  app.get("/api/attendance/pending-classes", async (req, res) => {
    const { date, period } = req.query;
    try {
      const allClasses = await sql`
        SELECT DISTINCT grade, section
        FROM students
        WHERE grade IS NOT NULL AND section IS NOT NULL
        ORDER BY grade ASC, section ASC
      `;

      let completedClasses;
      if (period) {
        completedClasses = await sql`
          SELECT DISTINCT ON (s.grade, s.section) 
            s.grade, 
            s.section,
            COALESCE(u.name, 'مستخدم محذوف') as teacher_name,
            ar.period,
            ar.created_at as timestamp
          FROM students s
          JOIN attendance_records ar ON ar.student_id = s.id
          LEFT JOIN users u ON ar.teacher_id = u.id
          WHERE ar.date = ${date as string} AND ar.period = ${Number(period)}
          AND s.grade IS NOT NULL AND s.section IS NOT NULL
          ORDER BY s.grade ASC, s.section ASC, ar.created_at DESC
        `;
      } else {
        completedClasses = await sql`
          SELECT DISTINCT ON (s.grade, s.section) 
            s.grade, 
            s.section,
            COALESCE(u.name, 'مستخدم محذوف') as teacher_name,
            ar.period,
            ar.created_at as timestamp
          FROM students s
          JOIN attendance_records ar ON ar.student_id = s.id
          LEFT JOIN users u ON ar.teacher_id = u.id
          WHERE ar.date = ${date as string}
          AND s.grade IS NOT NULL AND s.section IS NOT NULL
          ORDER BY s.grade ASC, s.section ASC, ar.created_at DESC
        `;
      }

      const pending = allClasses.filter(c => 
        !completedClasses.some(comp => comp.grade === c.grade && comp.section === c.section)
      );

      res.json({
        pending,
        completed: completedClasses,
        total: allClasses.length
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch pending classes" });
    }
  });

  // 0. Get available classes
  app.get("/api/attendance/classes", async (req, res) => {
    try {
      const classes = await sql`
        SELECT DISTINCT grade, section 
        FROM students 
        WHERE grade IS NOT NULL AND section IS NOT NULL
        ORDER BY grade ASC, section ASC
      `;
      res.json(classes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch classes" });
    }
  });

  // 1. Get students for a specific class (Teacher Interface)
  app.get("/api/attendance/class/:classId", async (req, res) => {
    const { classId } = req.params;
    const { date, period } = req.query;
    const { grade, section } = JSON.parse(decodeURIComponent(classId));
    
    try {
      const existingRecords = await sql`
        SELECT 
          ar.student_id, 
          ar.status, 
          COALESCE(u.name, 'مستخدم محذوف') as teacher_name,
          COALESCE(m.name, '') as modifier_name
        FROM attendance_records ar
        JOIN students s ON ar.student_id = s.id
        LEFT JOIN users u ON ar.teacher_id = u.id
        LEFT JOIN users m ON ar.modified_by = m.id
        WHERE s.grade = ${grade as string} 
          AND s.section = ${section as string}
          AND ar.date = ${date as string}
          AND ar.period = ${Number(period)}
      `;

      const isSubmitted = existingRecords.length > 0;
      const submitterName = isSubmitted ? existingRecords[0].teacher_name : null;
      // Find if any record was modified by someone else
      const modifiedRecord = existingRecords.find(r => r.modifier_name && r.modifier_name !== '');
      const modifierName = modifiedRecord ? modifiedRecord.modifier_name : null;

      const students = await sql`
        SELECT id, name, national_id, grade, section, parent_phone
        FROM students
        WHERE grade = ${grade as string} AND section = ${section as string}
        ORDER BY name ASC
      `;

      const studentIds = students.map(s => s.id);
      
      let activePasses: any[] = [];
      if (studentIds.length > 0) {
        activePasses = await sql`
          SELECT * FROM passes
          WHERE student_id::int = ANY(${studentIds}) 
            AND date = ${date as string} 
            AND status != 'rejected'
            AND status != 'expired'
            AND (
              (type = 'exit' AND status = 'confirmed') 
              OR expires_at IS NULL 
              OR expires_at > CURRENT_TIMESTAMP
            )
          ORDER BY created_at DESC
        `;
      }

      const studentsWithStatus = students.map(s => {
        const record = existingRecords.find(r => r.student_id === s.id);
        const pass = activePasses.find(p => p.student_id === s.id.toString());
        return {
          ...s,
          status: record ? record.status : 'حاضر',
          activePass: pass || null
        };
      });

      res.json({
        isSubmitted,
        submitterName,
        modifierName,
        students: studentsWithStatus
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // 2.1 Submit bulk attendance (Command Center)
  app.post("/api/attendance/submit-bulk", async (req, res) => {
    const { records, teacher_id, date, period } = req.body;
    let parsedTeacherId = teacher_id ? parseInt(teacher_id, 10) : null;
    if (Number.isNaN(parsedTeacherId)) parsedTeacherId = null;
    
    try {
      for (const record of records) {
        const classId = JSON.stringify({ grade: record.grade, section: record.section });
        
        // Check if record exists for this student on this date and period
        const existing = await sql`
          SELECT id, teacher_id FROM attendance_records 
          WHERE student_id = ${record.student_id} AND date = ${date} AND period = ${period || 1}
          LIMIT 1
        `;

        if (existing.length > 0) {
          // Update existing record
          if (period !== undefined && period !== null) {
            await sql`
              UPDATE attendance_records 
              SET status = ${record.status},
                  is_excused = ${record.is_excused || false},
                  excuse_reason = ${record.excuse_reason || null},
                  modified_by = CASE WHEN teacher_id IS DISTINCT FROM ${parsedTeacherId}::int THEN ${parsedTeacherId}::int ELSE NULL END,
                  modified_at = CASE WHEN teacher_id IS DISTINCT FROM ${parsedTeacherId}::int THEN CURRENT_TIMESTAMP ELSE NULL END,
                  period = ${period}
              WHERE id = ${existing[0].id}
            `;
          } else {
            await sql`
              UPDATE attendance_records 
              SET status = ${record.status},
                  is_excused = ${record.is_excused || false},
                  excuse_reason = ${record.excuse_reason || null},
                  modified_by = CASE WHEN teacher_id IS DISTINCT FROM ${parsedTeacherId}::int THEN ${parsedTeacherId}::int ELSE NULL END,
                  modified_at = CASE WHEN teacher_id IS DISTINCT FROM ${parsedTeacherId}::int THEN CURRENT_TIMESTAMP ELSE NULL END
              WHERE id = ${existing[0].id}
            `;
          }
        } else {
          // Insert new record
          await sql`
            INSERT INTO attendance_records (student_id, teacher_id, class_id, date, period, status, is_excused, excuse_reason)
            VALUES (${record.student_id}, ${parsedTeacherId}, ${classId}, ${date}, ${period || 1}, ${record.status}, ${record.is_excused || false}, ${record.excuse_reason || null})
          `;
        }
      }

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to submit bulk attendance" });
    }
  });
  app.post("/api/attendance/submit", async (req, res) => {
    const { records, teacher_id, class_id, period, date } = req.body;
    let parsedTeacherId = teacher_id ? parseInt(teacher_id, 10) : null;
    if (Number.isNaN(parsedTeacherId)) parsedTeacherId = null;
    
    try {
      for (const record of records) {
        // Check if record exists for this student on this date and period
        const existing = await sql`
          SELECT id, teacher_id FROM attendance_records 
          WHERE student_id = ${record.student_id} AND date = ${date} AND period = ${period || 1}
          LIMIT 1
        `;

        if (existing.length > 0) {
          // Update existing record
          if (period !== undefined && period !== null) {
            await sql`
              UPDATE attendance_records 
              SET status = ${record.status},
                  modified_by = CASE WHEN teacher_id IS DISTINCT FROM ${parsedTeacherId}::int THEN ${parsedTeacherId}::int ELSE NULL END,
                  modified_at = CASE WHEN teacher_id IS DISTINCT FROM ${parsedTeacherId}::int THEN CURRENT_TIMESTAMP ELSE NULL END,
                  period = ${period}
              WHERE id = ${existing[0].id}
            `;
          } else {
            await sql`
              UPDATE attendance_records 
              SET status = ${record.status},
                  modified_by = CASE WHEN teacher_id IS DISTINCT FROM ${parsedTeacherId}::int THEN ${parsedTeacherId}::int ELSE NULL END,
                  modified_at = CASE WHEN teacher_id IS DISTINCT FROM ${parsedTeacherId}::int THEN CURRENT_TIMESTAMP ELSE NULL END
              WHERE id = ${existing[0].id}
            `;
          }
        } else {
          // Insert new record
          await sql`
            INSERT INTO attendance_records (student_id, teacher_id, class_id, date, period, status)
            VALUES (${record.student_id}, ${parsedTeacherId}, ${class_id}, ${date}, ${period || 1}, ${record.status})
          `;
        }
      }
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to submit attendance" });
    }
  });

  app.post("/api/attendance/reset-daily", async (req, res) => {
    const { date, period } = req.body;
    try {
      if (period) {
        await sql`
          DELETE FROM attendance_records 
          WHERE date = ${date} AND period = ${Number(period)}
        `;
      } else {
        await sql`
          DELETE FROM attendance_records 
          WHERE date = ${date}
        `;
      }
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to reset daily attendance" });
    }
  });

  // 3. Get Live Radar Data (VP Interface)
  app.get("/api/attendance/student/:id/today", async (req, res) => {
    try {
      const records = await sql`
        SELECT status, is_excused, excuse_reason, period
        FROM attendance_records
        WHERE student_id = ${req.params.id} AND date = CURRENT_DATE
        ORDER BY period ASC
      `;
      res.json(records);
    } catch (err) {
      console.error("Failed to fetch student attendance:", err);
      res.status(500).json({ error: "Failed to fetch student attendance" });
    }
  });

  app.get("/api/attendance/radar", async (req, res) => {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
      // Live Counters
      const counters = await sql`
        SELECT 
          COUNT(CASE WHEN status = 'حاضر' THEN 1 END) as present,
          COUNT(CASE WHEN status = 'غائب' THEN 1 END) as absent,
          COUNT(CASE WHEN status = 'متأخر' THEN 1 END) as late
        FROM attendance_records
        WHERE date = ${targetDate}
      `;

      // Actionable List (Absent & Late)
      const actionableList = await sql`
        SELECT 
          ar.id,
          s.name as student_name,
          s.grade,
          s.section,
          ar.status,
          ar.is_excused,
          ar.period,
          COALESCE(u.name, 'مستخدم محذوف') as teacher_name
        FROM attendance_records ar
        JOIN students s ON ar.student_id = s.id
        LEFT JOIN users u ON ar.teacher_id = u.id
        WHERE ar.date = ${targetDate} AND ar.status IN ('غائب', 'متأخر')
        ORDER BY ar.period DESC, s.name ASC
      `;

      res.json({
        counters: counters[0],
        actionableList
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch radar data" });
    }
  });

  // 4. Toggle Excused Status (VP Interface)
  app.post("/api/attendance/toggle-excuse/:id", async (req, res) => {
    const { id } = req.params;
    const { is_excused } = req.body;
    
    try {
      await sql`
        UPDATE attendance_records 
        SET is_excused = ${is_excused}
        WHERE id = ${id}
      `;
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update excuse status" });
    }
  });

  // 5. Automated Behavior Integration (Check Absence Limits)
  app.get("/api/attendance/check-limits", async (req, res) => {
    try {
      // Calculate total unexcused absences per student
      const absenceLimits = await sql`
        SELECT 
          student_id,
          COUNT(DISTINCT date) as total_unexcused_days
        FROM attendance_records
        WHERE status = 'غائب' AND is_excused = FALSE
        GROUP BY student_id
        HAVING COUNT(DISTINCT date) >= 3
      `;

      const alerts = [];
      for (const record of absenceLimits) {
        const days = parseInt(record.total_unexcused_days);
        if (days === 3 || days === 5 || days >= 10) {
          const studentInfo = await sql`SELECT id, name, grade, section FROM students WHERE id = ${record.student_id}`;
          alerts.push({
            student: studentInfo[0],
            days: days
          });
        }
      }

      res.json(alerts);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to check absence limits" });
    }
  });

  // 6. Get Daily Absence Report
  app.get("/api/attendance/daily-report", async (req, res) => {
    const { date, grade, section, period } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
      let reportData;
      if (grade && section) {
        reportData = await sql`
          SELECT 
            s.id,
            s.name as student_name,
            s.grade,
            s.section,
            s.parent_phone,
            ar.status,
            ar.period
          FROM attendance_records ar
          JOIN students s ON ar.student_id = s.id
          WHERE ar.date = ${targetDate} 
            AND ar.status IN ('غائب', 'متأخر')
            AND s.grade = ${grade}
            AND s.section = ${section}
            AND (${period ? sql`ar.period = ${Number(period)}` : sql`1=1`})
          ORDER BY s.name ASC
        `;
      } else {
        reportData = await sql`
          SELECT 
            s.id,
            s.name as student_name,
            s.grade,
            s.section,
            s.parent_phone,
            ar.status,
            ar.period
          FROM attendance_records ar
          JOIN students s ON ar.student_id = s.id
          WHERE ar.date = ${targetDate} AND ar.status IN ('غائب', 'متأخر')
            AND (${period ? sql`ar.period = ${Number(period)}` : sql`1=1`})
          ORDER BY s.grade ASC, s.section ASC, s.name ASC
        `;
      }
      res.json(reportData);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch daily report" });
    }
  });

  app.post("/api/export/noor", async (req, res) => {
    const { userId, role, startDate, endDate } = req.body;

    if (role !== 'counselor') {
      return res.status(403).json({ error: "عذراً، هذه الميزة متاحة فقط للموجه الطلابي" });
    }

    try {
      const referrals = await sql`
        SELECT 
          s.national_id as "رقم الهوية",
          s.name as "اسم الطالب الرباعي",
          r.created_at as "تاريخ المخالفة",
          r.type as "تصنيف المشكلة",
          r.remedial_plan as "الإجراء المتخذ",
          r.id
        FROM referrals r
        JOIN students s ON r.student_id = s.id
        WHERE r.assigned_to_id = ${userId}
        AND r.status IN ('resolved', 'closed')
        AND r.created_at BETWEEN ${startDate} AND ${endDate}
        AND (r.is_exported_to_noor = FALSE OR r.is_exported_to_noor IS NULL)
      `;

      if (referrals.length === 0) {
        return res.status(404).json({ error: "لا توجد حالات جديدة للتصدير في هذه الفترة" });
      }

      const getTypeLabel = (type: string) => {
        switch (type) {
          case 'behavior': return 'سلوكية';
          case 'academic': return 'أكاديمية';
          case 'attendance': return 'غياب وتأخر';
          case 'uniform': return 'زي مدرسي';
          case 'other': return 'أخرى';
          default: return type || 'متنوعة';
        }
      };

      const mappedData = referrals.map((r: any) => ({
        "رقم الهوية": r["رقم الهوية"],
        "اسم الطالب الرباعي": r["اسم الطالب الرباعي"],
        "تاريخ المخالفة": new Date(r["تاريخ المخالفة"]).toLocaleDateString('ar-SA'),
        "تصنيف المشكلة": getTypeLabel(r["تصنيف المشكلة"]),
        "الإجراء المتخذ": r["الإجراء المتخذ"] || "تم اتخاذ الإجراء اللازم"
      }));

      // Update exported status
      const referralIds = referrals.map((r: any) => r.id);
      await sql`
        UPDATE referrals 
        SET is_exported_to_noor = TRUE 
        WHERE id = ANY(${referralIds})
      `;

      res.json(mappedData);
    } catch (err) {
      console.error("Export error:", err);
      res.status(500).json({ error: "فشل تصدير البيانات" });
    }
  });

  // --- Smart Pass Endpoints ---
  app.get("/api/test-pass", async (req, res) => {
    try {
      const expiresAt = new Date();
      await sql`
        INSERT INTO passes (id, student_id, student_name, teacher_id, teacher_name, teacher_phone, period, type, reason, timestamp, date, status, agent_name, expires_at)
        VALUES ('test', '1', 'Test', '1', 'Test', '123', '1', 'entry', 'test', '10:00', '2023-10-10', 'pending', 'Test', ${expiresAt.toISOString()})
      `;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/passes", async (req, res) => {
    try {
      // Auto-expire passes
      await sql`
        UPDATE passes 
        SET status = 'expired' 
        WHERE status = 'pending' 
          AND expires_at IS NOT NULL 
          AND expires_at < CURRENT_TIMESTAMP
      `;

      const passes = await sql`SELECT * FROM passes ORDER BY created_at DESC`;
      // Map database fields to camelCase for frontend
      const mappedPasses = passes.map((p: any) => ({
        id: p.id,
        studentId: p.student_id,
        studentName: p.student_name,
        teacherId: p.teacher_id,
        teacherName: p.teacher_name,
        teacherPhone: p.teacher_phone,
        period: p.period,
        type: p.type,
        reason: p.reason,
        timestamp: p.timestamp,
        date: p.date || (p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : null),
        status: p.status,
        agentName: p.agent_name,
        expiresAt: p.expires_at ? new Date(p.expires_at).toISOString() : null
      }));
      res.json(mappedPasses);
    } catch (err) {
      console.error("Failed to fetch passes:", err);
      res.status(500).json({ error: "Failed to fetch passes" });
    }
  });

  app.get("/api/passes/:id", async (req, res) => {
    try {
      const pass = await sql`SELECT * FROM passes WHERE id = ${req.params.id}`;
      if (pass.length === 0) {
        return res.status(404).json({ error: "Pass not found" });
      }
      const p = pass[0];
      res.json({
        id: p.id,
        studentId: p.student_id,
        studentName: p.student_name,
        teacherId: p.teacher_id,
        teacherName: p.teacher_name,
        teacherPhone: p.teacher_phone,
        period: p.period,
        type: p.type,
        reason: p.reason,
        timestamp: p.timestamp,
        date: p.date || (p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : null),
        status: p.status,
        agentName: p.agent_name,
        expiresAt: p.expires_at ? new Date(p.expires_at).toISOString() : null
      });
    } catch (err) {
      console.error("Failed to fetch pass:", err);
      res.status(500).json({ error: "Failed to fetch pass" });
    }
  });

  app.post("/api/passes", async (req, res) => {
    const { id, studentId, studentName, teacherId, teacherName, teacherPhone, period, type, reason, timestamp, date, status, agentName } = req.body;
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      if (type === 'exit') {
        const existingExit = await sql`
          SELECT * FROM passes 
          WHERE student_id = ${studentId} 
            AND type = 'exit' 
            AND date = ${targetDate}
            AND status != 'rejected'
        `;
        if (existingExit.length > 0) {
          return res.status(400).json({ error: "الطالب لديه إذن خروج مسبق اليوم، ولا يمكن إصدار إذن آخر." });
        }
      }

      // Calculate expires_at
      let durationMinutes = 15; // default 15 mins for entry/summon
      if (type === 'exit') {
        durationMinutes = 30; // 30 mins to leave the school
      }
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

      await sql`
        INSERT INTO passes (id, student_id, student_name, teacher_id, teacher_name, teacher_phone, period, type, reason, timestamp, date, status, agent_name, expires_at)
        VALUES (${id}, ${studentId}, ${studentName}, ${teacherId}, ${teacherName}, ${teacherPhone}, ${period}, ${type}, ${reason}, ${timestamp}, ${targetDate}, ${status || 'pending'}, ${agentName}, ${expiresAt.toISOString()})
      `;

      // Auto-Sync Logic: If entry pass, update absent status to late with excuse
      if (type === 'entry') {
        await sql`
          UPDATE attendance_records
          SET status = 'متأخر', is_excused = true, excuse_reason = 'إذن دخول من الوكيل'
          WHERE student_id = ${studentId} AND date = ${targetDate} AND status = 'غائب'
        `;
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Failed to create pass:", err);
      res.status(500).json({ error: err.message || "Failed to create pass" });
    }
  });

  app.patch("/api/passes/:id", async (req, res) => {
    const { status } = req.body;
    try {
      await sql`
        UPDATE passes SET status = ${status} WHERE id = ${req.params.id}
      `;
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to update pass status:", err);
      res.status(500).json({ error: "Failed to update pass status" });
    }
  });

  // --- Smart Tracker Endpoints ---
  app.get("/api/tracker/history", async (req, res) => {
    const { teacher_id, grade, section, subject } = req.query;
    try {
      const history = await sql`
        SELECT 
          t.id as task_id,
          t.name as task_name,
          t.category,
          t.max_grade,
          t.type,
          t.date,
          s.id as session_id,
          s.date as session_date
        FROM smart_tracker_tasks t
        JOIN smart_tracker_sessions s ON t.session_id = s.id
        WHERE s.teacher_id = ${teacher_id} 
          AND s.grade = ${grade} 
          AND s.section = ${section} 
          AND s.subject = ${subject}
        ORDER BY s.date DESC, t.id DESC
      `;
      res.json(history);
    } catch (err) {
      console.error("[GET TRACKER HISTORY] Error:", err);
      res.status(500).json({ error: "Failed to fetch tracker history" });
    }
  });

  app.get("/api/tracker/session", async (req, res) => {
    const { teacher_id, grade, section, subject, date } = req.query;
    try {
      // 1. Get tasks for this subject and grade (global tasks)
      const tasks = await sql`
        SELECT * FROM smart_tasks_v2 
        WHERE subject = ${subject as string} AND grade = ${grade as string} AND teacher_id = ${teacher_id}
      `;

      // 2. Get students currently in this class
      const students = await sql`
        SELECT id, name, national_id, grade, section 
        FROM students 
        WHERE grade = ${grade as string} AND section = ${section as string}
      `;

      // 3. Get session for attendance/behavior (daily)
      const sessions = await sql`
        SELECT * FROM smart_tracker_sessions
        WHERE teacher_id = ${teacher_id} AND grade = ${grade as string} AND section = ${section as string} AND subject = ${subject as string} AND date = ${date as string}
      `;
      let session = sessions.length > 0 ? sessions[0] : null;
      let studentStatesMap: any = {};

      if (session) {
        const states = await sql`SELECT * FROM smart_tracker_student_states WHERE session_id = ${session.id}`;
        states.forEach((st: any) => {
          studentStatesMap[st.student_id] = st;
        });
      }

      // 4. Get grades for these students from the new Identity-Centric table
      const nationalIds = students.map(s => s.national_id).filter(Boolean);
      let gradeRecords: any[] = [];
      if (nationalIds.length > 0) {
        gradeRecords = await sql`
          SELECT * FROM smart_grade_records_v2 
          WHERE student_national_id = ANY(${nationalIds as any})
        `;
      }

      // 5. Format response to match frontend expectations
      const formattedTasks = tasks.map((t: any) => ({
        id: t.id,
        category: t.noor_category,
        name: t.title,
        maxGrade: t.max_score,
        type: t.term,
      }));

      const formattedStudentStates = students.map((student: any) => {
        const state = studentStatesMap[student.id] || { attendance: 'present', behavior_chips: [] };
        const studentGrades = gradeRecords.filter(g => g.student_national_id === student.national_id);
        
        const formattedGrades = studentGrades.map(g => ({
          task_id: g.task_id,
          grade: g.score,
          teacher_id: g.teacher_id,
          recorded_at_class_id: g.recorded_at_class_id
        }));

        return {
          id: state.id || null,
          student_id: student.id,
          student_name: student.name,
          student_national_id: student.national_id,
          attendance: state.attendance || 'present',
          behavior_chips: state.behavior_chips || [],
          grades: formattedGrades
        };
      });

      res.json({ 
        session: session || { date }, 
        tasks: formattedTasks, 
        studentStates: formattedStudentStates 
      });
    } catch (err) {
      console.error("[GET TRACKER SESSION] Error:", err);
      res.status(500).json({ error: "Failed to fetch tracker session" });
    }
  });

  app.post("/api/tracker/session", async (req, res) => {
    const { teacher_id, grade, section, subject, date, tasks, studentsState } = req.body;
    try {
      // Upsert session (for attendance/behavior)
      const sessions = await sql`
        INSERT INTO smart_tracker_sessions (teacher_id, grade, section, subject, date)
        VALUES (${teacher_id}, ${grade}, ${section}, ${subject}, ${date})
        ON CONFLICT (teacher_id, grade, section, subject, date) 
        DO UPDATE SET created_at = CURRENT_TIMESTAMP
        RETURNING id
      `;
      const sessionId = sessions[0].id;

      // Get all task IDs from the request
      const taskIds: string[] = [];
      for (const category in tasks) {
        for (const task of tasks[category]) {
          taskIds.push(task.id);
        }
      }

      // Delete tasks that are NOT in the request (from v2)
      if (taskIds.length > 0) {
        await sql`DELETE FROM smart_tasks_v2 WHERE subject = ${subject} AND grade = ${grade} AND teacher_id = ${teacher_id} AND id != ALL(${taskIds as any})`;
      } else {
        await sql`DELETE FROM smart_tasks_v2 WHERE subject = ${subject} AND grade = ${grade} AND teacher_id = ${teacher_id}`;
      }

      // Upsert tasks (v2)
      for (const category in tasks) {
        for (const task of tasks[category]) {
          await sql`
            INSERT INTO smart_tasks_v2 (id, title, max_score, noor_category, term, subject, grade, teacher_id)
            VALUES (${task.id}, ${task.name}, ${task.maxGrade}, ${category}, ${task.type}, ${subject}, ${grade}, ${teacher_id})
            ON CONFLICT (id) DO UPDATE SET
              title = EXCLUDED.title,
              max_score = EXCLUDED.max_score,
              noor_category = EXCLUDED.noor_category,
              term = EXCLUDED.term
          `;
        }
      }

      // Insert student states and grades
      for (const studentIdStr in studentsState) {
        const studentId = parseInt(studentIdStr);
        const state = studentsState[studentId];
        
        // Upsert attendance/behavior
        await sql`
          INSERT INTO smart_tracker_student_states (session_id, student_id, attendance, behavior_chips)
          VALUES (${sessionId}, ${studentId}, ${state.attendance}, ${JSON.stringify(state.behaviorChips)})
          ON CONFLICT (session_id, student_id) DO UPDATE SET
            attendance = EXCLUDED.attendance,
            behavior_chips = EXCLUDED.behavior_chips
        `;

        // Get student national ID
        const studentRes = await sql`SELECT national_id FROM students WHERE id = ${studentId}`;
        const nationalId = studentRes[0]?.national_id;

        if (nationalId) {
          // Get all task IDs for this student's grades
          const gradeTaskIds = Object.keys(state.grades).filter(taskId => {
            const val = state.grades[taskId]?.score;
            return val !== '' && val !== undefined && val !== null;
          });

          // Delete grades for tasks that are no longer present or have been cleared
          if (gradeTaskIds.length > 0) {
            await sql`DELETE FROM smart_grade_records_v2 WHERE student_national_id = ${nationalId} AND task_id != ALL(${gradeTaskIds as any})`;
          } else {
            await sql`DELETE FROM smart_grade_records_v2 WHERE student_national_id = ${nationalId}`;
          }

          // Upsert grades
          for (const taskId of gradeTaskIds) {
            const gradeRecord = state.grades[taskId];
            const score = gradeRecord.score;
            const recordTeacherId = gradeRecord.teacherId || teacher_id;
            const recordedAtClassId = gradeRecord.recordedAtClassId || `${grade} ${section}`;

            await sql`
              INSERT INTO smart_grade_records_v2 (student_national_id, task_id, score, teacher_id, recorded_at_class_id)
              VALUES (${nationalId}, ${taskId}, ${score}, ${recordTeacherId}, ${recordedAtClassId})
              ON CONFLICT (student_national_id, task_id) DO UPDATE SET
                score = EXCLUDED.score,
                teacher_id = EXCLUDED.teacher_id,
                recorded_at_class_id = EXCLUDED.recorded_at_class_id,
                updated_at = CURRENT_TIMESTAMP
            `;
          }
        }
      }

      res.json({ success: true, sessionId });
    } catch (err) {
      console.error("[SAVE TRACKER SESSION] Error:", err);
      res.status(500).json({ error: "Failed to save tracker session" });
    }
  });

  app.post("/api/tracker/session/bulk-template", async (req, res) => {
    const { teacher_id, grade, sections, subject, date, tasks } = req.body;
    try {
      for (const section of sections) {
        // Upsert session for this section
        const sessions = await sql`
          INSERT INTO smart_tracker_sessions (teacher_id, grade, section, subject, date)
          VALUES (${teacher_id}, ${grade}, ${section}, ${subject}, ${date})
          ON CONFLICT (teacher_id, grade, section, subject, date) 
          DO UPDATE SET created_at = CURRENT_TIMESTAMP
          RETURNING id
        `;
        const sessionId = sessions[0].id;

        // Upsert tasks for this session
        for (const category in tasks) {
          for (const task of tasks[category]) {
            // Generate a unique ID for the task in this session to avoid conflicts
            // We use the original task ID as a base but append the session ID
            const uniqueTaskId = `${task.id}-${sessionId}`;
            await sql`
              INSERT INTO smart_tracker_tasks (id, session_id, category, name, max_grade, type, date)
              VALUES (${uniqueTaskId}, ${sessionId}, ${category}, ${task.name}, ${task.maxGrade}, ${task.type}, ${task.date || null})
              ON CONFLICT (id) DO UPDATE SET
                category = EXCLUDED.category,
                name = EXCLUDED.name,
                max_grade = EXCLUDED.max_grade,
                type = EXCLUDED.type,
                date = EXCLUDED.date
            `;
          }
        }
      }

      res.json({ success: true });
    } catch (err) {
      console.error("[BULK TEMPLATE] Error:", err);
      res.status(500).json({ error: "Failed to apply bulk template" });
    }
  });

  app.get("/api/tracker/templates", async (req, res) => {
    const { teacher_id } = req.query;
    try {
      const templates = await sql`
        SELECT * FROM smart_tracker_templates 
        WHERE teacher_id = ${teacher_id} 
        ORDER BY created_at DESC
      `;
      res.json(templates);
    } catch (err) {
      console.error("[GET TEMPLATES] Error:", err);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/tracker/templates", async (req, res) => {
    const { teacher_id, name, tasks } = req.body;
    try {
      await sql`
        INSERT INTO smart_tracker_templates (teacher_id, name, tasks)
        VALUES (${teacher_id}, ${name}, ${JSON.stringify(tasks)})
      `;
      res.json({ success: true });
    } catch (err) {
      console.error("[SAVE TEMPLATE] Error:", err);
      res.status(500).json({ error: "Failed to save template" });
    }
  });

  app.delete("/api/tracker/templates/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await sql`DELETE FROM smart_tracker_templates WHERE id = ${id}`;
      res.json({ success: true });
    } catch (err) {
      console.error("[DELETE TEMPLATE] Error:", err);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // Superadmin Endpoints
  app.get("/api/superadmin/schools", async (req, res) => {
    try {
      const schools = await sql`SELECT * FROM schools ORDER BY id ASC`;
      res.json(schools);
    } catch (err) {
      console.error("[GET SCHOOLS] Error:", err);
      res.status(500).json({ error: "Failed to fetch schools" });
    }
  });

  app.post("/api/superadmin/schools/create", async (req, res) => {
    try {
      const { name, subscription_end_date } = req.body;
      await sql`
        INSERT INTO schools (name, subscription_end_date, is_active)
        VALUES (${name}, ${subscription_end_date}, true)
      `;
      res.json({ success: true });
    } catch (err) {
      console.error("[CREATE SCHOOL] Error:", err);
      res.status(500).json({ error: "Failed to create school" });
    }
  });

  app.post("/api/superadmin/schools/:id/toggle-status", async (req, res) => {
    try {
      const { id } = req.params;
      await sql`
        UPDATE schools 
        SET is_active = NOT is_active 
        WHERE id = ${id}
      `;
      res.json({ success: true });
    } catch (err) {
      console.error("[TOGGLE SCHOOL] Error:", err);
      res.status(500).json({ error: "Failed to toggle school status" });
    }
  });

  // --- Takamol Chrome Extension API ---
  app.get("/api/extension/sync-code", async (req, res) => {
    try {
      const { teacher_id } = req.query;
      if (!teacher_id) return res.status(400).json({ error: "Missing teacher_id" });

      const user = await sql`SELECT sync_code FROM users WHERE id = ${teacher_id as string}`;
      if (user.length === 0) return res.status(404).json({ error: "User not found" });

      res.json({ syncCode: user[0].sync_code });
    } catch (err) {
      console.error("[GET SYNC CODE] Error:", err);
      res.status(500).json({ error: "Failed to get sync code" });
    }
  });

  app.post("/api/extension/sync-code/generate", async (req, res) => {
    try {
      const { teacher_id } = req.body;
      if (!teacher_id) return res.status(400).json({ error: "Missing teacher_id" });

      // Generate a 6-character random alphanumeric code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let syncCode = '';
      for (let i = 0; i < 6; i++) {
        syncCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      await sql`UPDATE users SET sync_code = ${syncCode} WHERE id = ${teacher_id}`;

      res.json({ syncCode });
    } catch (err) {
      console.error("[GENERATE SYNC CODE] Error:", err);
      res.status(500).json({ error: "Failed to generate sync code" });
    }
  });

  app.options("/api/get-teacher-subjects", (req, res) => {
    res.header("Access-Control-Allow-Origin", "https://noor.moe.gov.sa");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control, Pragma, Expires");
    res.status(200).end();
  });

  app.get("/api/get-teacher-subjects", async (req, res) => {
    try {
      res.header("Access-Control-Allow-Origin", "https://noor.moe.gov.sa");
      res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control, Pragma, Expires");

      const { syncCode } = req.query;
      if (!syncCode) return res.status(400).json({ error: "Missing syncCode parameter" });

      const user = await sql`SELECT id, name FROM users WHERE sync_code = ${syncCode as string}`;
      if (user.length === 0) return res.status(401).json({ error: "Invalid sync code" });

      const teacherId = user[0].id;

      // Get unique subjects and sections for this teacher from current assignments
      const assignments = await sql`
        SELECT DISTINCT s.name as subject, ta.class_id
        FROM teacher_assignments ta
        JOIN subjects s ON ta.subject_id = s.id
        WHERE ta.teacher_id = ${teacherId}
      `;

      const subjects = assignments.map(a => {
        const [grade, section] = a.class_id.split('|');
        return {
          subject: a.subject,
          grade: grade || '',
          section: section || ''
        };
      });

      // Sort subjects by subject, grade, section
      subjects.sort((a, b) => {
        if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
        if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
        return a.section.localeCompare(b.section);
      });

      res.status(200).json({
        teacherName: user[0].name,
        subjects: subjects
      });
    } catch (error) {
      console.error("[GET TEACHER SUBJECTS] Error:", error);
      res.status(500).json({ error: 'حدث خطأ داخلي في الخادم' });
    }
  });

  app.options("/api/get-takamol-grades", (req, res) => {
    res.header("Access-Control-Allow-Origin", "https://noor.moe.gov.sa");
    res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control, Pragma, Expires");
    res.status(200).end();
  });

  app.get("/api/get-takamol-grades", async (req, res) => {
    try {
      // Set CORS headers specifically for this route
      res.header("Access-Control-Allow-Origin", "https://noor.moe.gov.sa");
      res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control, Pragma, Expires");

      const { syncCode, subject, grade, section } = req.query;

      if (!syncCode) {
        return res.status(400).json({ error: "Missing syncCode parameter" });
      }

      // Verify the sync code
      const user = await sql`SELECT id, name FROM users WHERE sync_code = ${syncCode as string}`;
      if (user.length === 0) {
        return res.status(401).json({ error: "Invalid sync code" });
      }

      const teacherId = user[0].id;
      let gradesData: any[] = [];

      if (subject && grade && section) {
        // Get students for this grade and section
        const students = await sql`
          SELECT id, national_id FROM students 
          WHERE grade = ${grade as string} AND section = ${section as string} AND national_id IS NOT NULL
        `;

        // Get tasks for this subject and grade
        const tasks = await sql`
          SELECT id, noor_category as category FROM smart_tasks_v2 
          WHERE subject = ${subject as string} AND grade = ${grade as string} AND teacher_id = ${teacherId}
        `;

        if (tasks.length > 0 && students.length > 0) {
          const nationalIds = students.map(s => s.national_id);
          
          // Get grades for these students
          const gradeRecords = await sql`
            SELECT * FROM smart_grade_records_v2 
            WHERE student_national_id = ANY(${nationalIds as any})
          `;

          // Format data for the extension
          gradesData = students.map(student => {
            const studentGrades = gradeRecords.filter(g => g.student_national_id === student.national_id);
            let performanceSum = 0;
            let evaluationSum = 0;
            
            studentGrades.forEach(g => {
              const task = tasks.find(t => t.id === g.task_id);
              if (task && g.score !== null) {
                if (['participation', 'homework', 'performance'].includes(task.category)) {
                  performanceSum += Number(g.score) || 0;
                }
                if (task.category === 'exams') {
                  evaluationSum += Number(g.score) || 0;
                }
              }
            });
            
            const performanceTotal = Math.min(performanceSum, 40);
            const evaluationTotal = Math.min(evaluationSum, 20);
            
            return {
              nationalId: student.national_id,
              evaluationTotal: evaluationTotal, 
              performanceTotal: performanceTotal 
            };
          });
        }
      }

      // Fallback if no specific data found or missing params
      if (gradesData.length === 0) {
        const students = await sql`
          SELECT national_id FROM students WHERE national_id IS NOT NULL LIMIT 50
        `;

        gradesData = students.map(s => ({
          nationalId: s.national_id,
          evaluationTotal: 0,
          performanceTotal: 0
        }));
      }

      res.status(200).json(gradesData);
    } catch (error) {
      console.error('Database query error:', error);
      res.status(500).json({ error: 'حدث خطأ داخلي في الخادم أثناء جلب البيانات' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
