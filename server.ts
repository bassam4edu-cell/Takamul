import express from "express";
import { createServer as createViteServer } from "vite";
import { neon } from "@neondatabase/serverless";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";
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
        status TEXT, -- 'pending_vp', 'pending_counselor', 'resolved', 'closed'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

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
  } catch (err) {
    console.error("Database initialization error:", err);
  }
}

initDb();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

  app.get("/api/referrals", async (req, res) => {
    const userId = req.query.userId as string;
    const userRole = req.query.role as string;

    let referrals;
    if (userId && userRole !== 'admin') {
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
    const { student_id, teacher_id, type, severity, reason, teacher_notes } = req.body;
    const result = await sql`
      INSERT INTO referrals (student_id, teacher_id, type, severity, reason, teacher_notes, status)
      VALUES (${student_id}, ${teacher_id}, ${type}, ${severity}, ${reason}, ${teacher_notes}, 'pending_vp')
      RETURNING id
    `;
    
    res.json({ success: true, id: result[0].id });
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

  app.post("/api/admin/referrals/:id/update", async (req, res) => {
    const { type, severity, reason, teacher_notes, status } = req.body;
    await sql`
      UPDATE referrals 
      SET type = ${type}, severity = ${severity}, reason = ${reason}, teacher_notes = ${teacher_notes}, status = ${status} 
      WHERE id = ${req.params.id}
    `;
    res.json({ success: true });
  });

  app.post("/api/admin/students/import", async (req, res) => {
    const { students } = req.body; // Expecting array of { name, national_id, grade, section }
    
    try {
      for (const student of students) {
        await sql`INSERT INTO students (name, national_id, grade, section) VALUES (${student.name}, ${student.national_id}, ${student.grade}, ${student.section})`;
      }
      res.json({ success: true, count: students.length });
    } catch (err) {
      res.status(500).json({ success: false, error: "Import failed" });
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
