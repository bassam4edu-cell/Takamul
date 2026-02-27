import express from "express";
import { createServer as createViteServer } from "vite";
import { neon } from "@neondatabase/serverless";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

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
        role TEXT -- 'teacher', 'vice_principal', 'counselor', 'admin'
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name TEXT,
        national_id TEXT,
        grade TEXT,
        section TEXT
      )
    `;

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

    await sql`
      CREATE TABLE IF NOT EXISTS user_grades (
        user_id INTEGER REFERENCES users(id),
        grade TEXT,
        PRIMARY KEY (user_id, grade)
      )
    `;

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
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}

initDb();

async function startServer() {
  const app = express();
  // تعديل المنفذ ليتوافق مع خوادم Render
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ limit: '2mb', extended: true }));

  // API Routes
  app.post("/api/login", async (req, res) => {
    const { email, password, role } = req.body;
    const users = await sql`SELECT * FROM users WHERE email = ${email} AND password = ${password} AND role = ${role}`;
    const user = users[0];
    if (user) {
      const gradesResult = await sql`SELECT grade FROM user_grades WHERE user_id = ${user.id}`;
      const grades = gradesResult.map((g: any) => g.grade);
      res.json({ success: true, user: { ...user, assigned_grades: grades } });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  app.get("/api/admin/performance", async (req, res) => {
    try {
      const performance = await sql`
        SELECT 
          u.id,
          u.name, 
          u.role,
          COUNT(r.id) as total_resolved,
          AVG(EXTRACT(EPOCH FROM (l.created_at - r.created_at))/3600) as avg_hours
        FROM referral_logs l
        JOIN referrals r ON l.referral_id = r.id
        JOIN users u ON l.user_id = u.id
        WHERE (l.action LIKE '%حل%' OR l.action LIKE '%إغلاق%')
        AND u.role IN ('vice_principal', 'counselor')
        GROUP BY u.id, u.name, u.role
      `;
      res.json(performance);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch performance data" });
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
            SELECT r.*, s.name as student_name, s.grade as student_grade, s.section as student_section, u.name as teacher_name
            FROM referrals r
            JOIN students s ON r.student_id = s.id
            JOIN users u ON r.teacher_id = u.id
            WHERE s.grade = ANY(${grades}) AND r.teacher_id = ${userId}
            ORDER BY r.created_at DESC
          `;
        } else {
          referrals = await sql`
            SELECT r.*, s.name as student_name, s.grade as student_grade, s.section as student_section, u.name as teacher_name
            FROM referrals r
            JOIN students s ON r.student_id = s.id
            JOIN users u ON r.teacher_id = u.id
            WHERE s.grade = ANY(${grades})
            ORDER BY r.created_at DESC
          `;
        }
      } else if (userRole === 'teacher') {
        referrals = await sql`
          SELECT r.*, s.name as student_name, s.grade as student_grade, s.section as student_section, u.name as teacher_name
          FROM referrals r
          JOIN students s ON r.student_id = s.id
          JOIN users u ON r.teacher_id = u.id
          WHERE r.teacher_id = ${userId}
          ORDER BY r.created_at DESC
        `;
      } else {
        referrals = await sql`
          SELECT r.*, s.name as student_name, s.grade as student_grade, s.section as student_section, u.name as teacher_name
          FROM referrals r
          JOIN students s ON r.student_id = s.id
          JOIN users u ON r.teacher_id = u.id
          ORDER BY r.created_at DESC
        `;
      }
    } else {
      referrals = await sql`
        SELECT r.*, s.name as student_name, s.grade as student_grade, s.section as student_section, u.name as teacher_name
        FROM referrals r
        JOIN students s ON r.student_id = s.id
        JOIN users u ON r.teacher_id = u.id
        ORDER BY r.created_at DESC
      `;
    }
    res.json(referrals);
  });

  app.get("/api/students", async (req, res) => {
    const userId = req.query.userId as string;
    let students;

    if (userId) {
      const gradesResult = await sql`SELECT grade FROM user_grades WHERE user_id = ${userId}`;
      const grades = gradesResult.map((g: any) => g.grade);
      if (grades.length > 0) {
        students = await sql`SELECT * FROM students WHERE grade = ANY(${grades})`;
      } else {
        students = await sql`SELECT * FROM students`;
      }
    } else {
      students = await sql`SELECT * FROM students`;
    }

    res.json(students);
  });

  app.post("/api/referrals", async (req, res) => {
    const { student_id, teacher_id, type, severity, reason, teacher_notes, remedial_plan, remedial_plan_file } = req.body;
    try {
      const result = await sql`
        INSERT INTO referrals (student_id, teacher_id, type, severity, reason, teacher_notes, remedial_plan, remedial_plan_file, status)
        VALUES (${student_id}, ${teacher_id}, ${type}, ${severity}, ${reason}, ${teacher_notes}, ${remedial_plan}, ${remedial_plan_file}, 'pending_vp')
        RETURNING id
      `;
      
      const referralId = result[0].id;
      
      // Add initial log entry
      await sql`
        INSERT INTO referral_logs (referral_id, user_id, action, notes) 
        VALUES (${referralId}, ${teacher_id}, 'إنشاء التحويل', 'تم إنشاء التحويل وتحويله آلياً إلى وكيل شؤون الطلاب للمراجعة')
      `;
      
      res.json({ success: true, id: referralId });
    } catch (err) {
      console.error("Referral creation failed:", err);
      res.status(500).json({ success: false, error: "Failed to create referral" });
    }
  });

  app.get("/api/referrals/:id", async (req, res) => {
    const id = req.params.id;
    const referralResult = await sql`
      SELECT r.*, s.name as student_name, s.grade as student_grade, s.section as student_section, u.name as teacher_name
      FROM referrals r
      JOIN students s ON r.student_id = s.id
      JOIN users u ON r.teacher_id = u.id
      WHERE r.id = ${id}
    `;

    const logs = await sql`
      SELECT l.*, u.name as user_name, u.role as user_role
      FROM referral_logs l
      JOIN users u ON l.user_id = u.id
      WHERE l.referral_id = ${id}
      ORDER BY l.created_at DESC
    `;

    res.json({ referral: referralResult[0], logs });
  });

  app.post("/api/referrals/:id/action", async (req, res) => {
    const { user_id, action, notes, status } = req.body;
    const referralId = req.params.id;

    try {
      await sql`UPDATE referrals SET status = ${status} WHERE id = ${referralId}`;
      await sql`INSERT INTO referral_logs (referral_id, user_id, action, notes) VALUES (${referralId}, ${user_id}, ${action}, ${notes})`;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: "Action failed" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    const users = await sql`SELECT id, name, email, role FROM users` as any[];
    const usersWithGrades = await Promise.all(users.map(async u => {
      const gradesResult = await sql`SELECT grade FROM user_grades WHERE user_id = ${u.id}`;
      const grades = gradesResult.map((g: any) => g.grade);
      return { ...u, assigned_grades: grades };
    }));
    res.json(usersWithGrades);
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
    await sql`UPDATE users SET role = ${role} WHERE id = ${req.params.id}`;
    res.json({ success: true });
  });

  app.post("/api/admin/users/:id/update", async (req, res) => {
    const { name, email } = req.body;
    await sql`UPDATE users SET name = ${name}, email = ${email} WHERE id = ${req.params.id}`;
    res.json({ success: true });
  });

  app.post("/api/admin/users/:id/delete", async (req, res) => {
    const userId = req.params.id;
    console.log(`[ADMIN] Request to delete user ID: ${userId}`);
    try {
      // 1. Delete user grades
      await sql`DELETE FROM user_grades WHERE user_id = ${userId}`;
      console.log(`- Deleted grades for user ${userId}`);
      
      // 2. Delete referral logs associated with the user (actions they took)
      await sql`DELETE FROM referral_logs WHERE user_id = ${userId}`;
      console.log(`- Deleted logs for user ${userId}`);
      
      // 3. Handle referrals created by this user
      const createdReferrals = await sql`SELECT id FROM referrals WHERE teacher_id = ${userId}`;
      if (createdReferrals.length > 0) {
        const ids = createdReferrals.map((r: any) => r.id);
        console.log(`- Found ${ids.length} referrals created by user ${userId}. Deleting logs...`);
        // Delete logs for these referrals first
        for (const id of ids) {
          await sql`DELETE FROM referral_logs WHERE referral_id = ${id}`;
        }
        // Delete the referrals themselves
        await sql`DELETE FROM referrals WHERE teacher_id = ${userId}`;
        console.log(`- Deleted referrals created by user ${userId}`);
      }

      // 4. Handle referrals assigned to this user
      await sql`UPDATE referrals SET assigned_to_id = NULL WHERE assigned_to_id = ${userId}`;
      console.log(`- Unassigned referrals from user ${userId}`);
      
      // 5. Finally delete the user
      await sql`DELETE FROM users WHERE id = ${userId}`;
      console.log(`- Successfully deleted user ${userId}`);
      
      res.json({ success: true });
    } catch (err) {
      console.error(`[ADMIN] User deletion failed for ID ${userId}:`, err);
      res.status(500).json({ success: false, error: "فشل حذف المستخدم من قاعدة البيانات" });
    }
  });

  app.post("/api/admin/users/create", async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      const existing = await sql`SELECT * FROM users WHERE email = ${email}`;
      if (existing.length > 0) {
        return res.status(400).json({ success: false, error: "البريد الإلكتروني موجود مسبقاً" });
      }
      await sql`INSERT INTO users (name, email, password, role) VALUES (${name}, ${email}, ${password}, ${role})`;
      res.json({ success: true });
    } catch (err) {
      console.error("User creation failed:", err);
      res.status(500).json({ success: false, error: "فشل إنشاء المستخدم" });
    }
  });

  app.post("/api/admin/referrals/:id/update", async (req, res) => {
    const { type, severity, reason, teacher_notes, remedial_plan, remedial_plan_file, status } = req.body;
    await sql`
      UPDATE referrals 
      SET type = ${type}, severity = ${severity}, reason = ${reason}, teacher_notes = ${teacher_notes}, remedial_plan = ${remedial_plan}, remedial_plan_file = ${remedial_plan_file}, status = ${status} 
      WHERE id = ${req.params.id}
    `;
    res.json({ success: true });
  });

  app.post("/api/admin/students/import", async (req, res) => {
    const { students } = req.body; // Expecting array of { name, national_id, grade, section }
    console.log(`Attempting to import ${students?.length} students`);
    
    try {
      if (!students || !Array.isArray(students)) {
        return res.status(400).json({ success: false, error: "Invalid students data" });
      }

      for (const student of students) {
        await sql`INSERT INTO students (name, national_id, grade, section) VALUES (${student.name}, ${student.national_id}, ${student.grade}, ${student.section})`;
      }
      console.log(`Successfully imported ${students.length} students`);
      res.json({ success: true, count: students.length });
    } catch (err) {
      console.error("Import failed:", err);
      res.status(500).json({ success: false, error: "Import failed: " + (err instanceof Error ? err.message : String(err)) });
    }
  });

  app.get("/api/admin/students", async (req, res) => {
    try {
      const students = await sql`SELECT * FROM students ORDER BY grade, section, name`;
      res.json(students);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch students" });
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
          // 3. Delete logs for these referrals
          await sql`DELETE FROM referral_logs WHERE referral_id = ANY(${refIds})`;
          // 4. Delete the referrals
          await sql`DELETE FROM referrals WHERE id = ANY(${refIds})`;
        }
        
        // 5. Delete the students
        await sql`DELETE FROM students WHERE id = ANY(${studentIds})`;
      }

      // 6. Remove this grade from user assignments
      await sql`DELETE FROM user_grades WHERE grade = ${grade}`;
      
      console.log(`[ADMIN] Successfully deleted grade ${grade} and all associated data`);
      res.json({ success: true });
    } catch (err) {
      console.error(`[ADMIN] Failed to delete grade ${grade}:`, err);
      res.status(500).json({ error: "فشل حذف الصف. يرجى المحاولة مرة أخرى." });
    }
  });

  app.delete("/api/admin/students/:id", async (req, res) => {
    try {
      await sql`DELETE FROM students WHERE id = ${req.params.id}`;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete student" });
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
