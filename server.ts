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
        is_active BOOLEAN DEFAULT TRUE
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name TEXT,
        national_id TEXT UNIQUE,
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
    await sql`ALTER TABLE referrals ADD COLUMN IF NOT EXISTS evidence_file TEXT`;
    await sql`ALTER TABLE referrals ADD COLUMN IF NOT EXISTS is_exported_to_noor BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`;

    // New Columns for Students (Behavior & Attendance)
    await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS behavior_score INT DEFAULT 80`;
    await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS bonus_score INT DEFAULT 0`;
    await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS attendance_score INT DEFAULT 100`;

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
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id),
        recipient_id INTEGER REFERENCES users(id),
        message TEXT,
        referral_id INTEGER REFERENCES referrals(id),
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    // Seed Behavioral Violations Dictionary
    const behavioralViolationsCount = await sql`SELECT COUNT(*) as count FROM behavioral_violations_dict`;
    if (parseInt(behavioralViolationsCount[0].count) === 0) {
      const generalProcedures = [
        "استدعاء الهلال الأحمر لنقل الطالب المصاب إلى أقرب مركز صحي (إذا تطلب الأمر).",
        "تبليغ الجهات الأمنية المختصة فور وقوع المشكلة.",
        "التواصل مباشرة مع مركز تلقي البلاغات (1919) للتبليغ عن حالات الإيذاء."
      ];

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

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ limit: '2mb', extended: true }));

  // API Routes
  app.post("/api/login", async (req, res) => {
    const { email, password, role } = req.body;
    console.log(`[LOGIN] Attempt for email: ${email}, role: ${role}`);
    
    try {
      // البحث عن المستخدم بالبريد الإلكتروني فقط أولاً للتأكد من وجوده
      const users = await sql`SELECT * FROM users WHERE email = ${email} AND is_active = TRUE`;
      const user = users[0];
      
      if (!user) {
        console.log(`[LOGIN] User not found: ${email}`);
        return res.status(401).json({ success: false, message: "البريد الإلكتروني غير مسجل" });
      }

      if (user.password !== password) {
        console.log(`[LOGIN] Incorrect password for: ${email}`);
        return res.status(401).json({ success: false, message: "كلمة المرور غير صحيحة" });
      }

      if (user.role !== role) {
        console.log(`[LOGIN] Role mismatch for: ${email}. Expected: ${user.role}, Got: ${role}`);
        return res.status(401).json({ success: false, message: "نوع الحساب المختار غير صحيح لهذا المستخدم" });
      }

      const gradesResult = await sql`SELECT grade FROM user_grades WHERE user_id = ${user.id}`;
      const grades = gradesResult.map((g: any) => g.grade);
      
      console.log(`[LOGIN] Success for: ${email}`);
      res.json({ success: true, user: { ...user, assigned_grades: grades } });
    } catch (err) {
      console.error("[LOGIN] Error:", err);
      res.status(500).json({ success: false, message: "حدث خطأ في السيرفر" });
    }
  });

  app.get("/api/admin/performance", async (req, res) => {
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
        SELECT l.*, u.name as creator_name
        FROM student_score_logs l
        JOIN users u ON l.created_by_user_id = u.id
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
            SELECT r.*, s.name as student_name, s.national_id as student_national_id, s.grade as student_grade, s.section as student_section, u.name as teacher_name
            FROM referrals r
            JOIN students s ON r.student_id = s.id
            JOIN users u ON r.teacher_id = u.id
            WHERE s.grade = ANY(${grades}) AND r.teacher_id = ${userId}
            ORDER BY r.created_at DESC
          `;
        } else {
          referrals = await sql`
            SELECT r.*, s.name as student_name, s.national_id as student_national_id, s.grade as student_grade, s.section as student_section, u.name as teacher_name
            FROM referrals r
            JOIN students s ON r.student_id = s.id
            JOIN users u ON r.teacher_id = u.id
            WHERE s.grade = ANY(${grades})
            ORDER BY r.created_at DESC
          `;
        }
      } else if (userRole === 'teacher') {
        referrals = await sql`
          SELECT r.*, s.name as student_name, s.national_id as student_national_id, s.grade as student_grade, s.section as student_section, u.name as teacher_name
          FROM referrals r
          JOIN students s ON r.student_id = s.id
          JOIN users u ON r.teacher_id = u.id
          WHERE r.teacher_id = ${userId}
          ORDER BY r.created_at DESC
        `;
      } else {
        referrals = await sql`
          SELECT r.*, s.name as student_name, s.national_id as student_national_id, s.grade as student_grade, s.section as student_section, u.name as teacher_name
          FROM referrals r
          JOIN students s ON r.student_id = s.id
          JOIN users u ON r.teacher_id = u.id
          ORDER BY r.created_at DESC
        `;
      }
    } else {
      referrals = await sql`
        SELECT r.*, s.name as student_name, s.national_id as student_national_id, s.grade as student_grade, s.section as student_section, u.name as teacher_name
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

  app.get("/api/student-search", async (req, res) => {
    const { query } = req.query;
    if (!query) return res.json([]);
    
    try {
      const students = await sql`
        SELECT * FROM students 
        WHERE name LIKE ${`%${query}%`} 
        OR national_id = ${query}
        LIMIT 20
      `;
      res.json(students);
    } catch (err) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.get("/api/hierarchy/grades", async (req, res) => {
    try {
      const grades = await sql`SELECT DISTINCT grade FROM students ORDER BY grade`;
      res.json(grades.map((g: any) => g.grade));
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch grades" });
    }
  });

  app.get("/api/hierarchy/sections", async (req, res) => {
    const { grade } = req.query;
    try {
      const sections = await sql`SELECT DISTINCT section FROM students WHERE grade = ${grade} ORDER BY section`;
      res.json(sections.map((s: any) => s.section));
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch sections" });
    }
  });

  app.get("/api/hierarchy/students", async (req, res) => {
    const { grade, section } = req.query;
    try {
      const students = await sql`SELECT id, name FROM students WHERE grade = ${grade} AND section = ${section} ORDER BY name`;
      res.json(students);
    } catch (err) {
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

      const referrals = await sql`
        SELECT 
          r.*, 
          u_teacher.name as teacher_name,
          (SELECT action FROM referral_logs WHERE referral_id = r.id ORDER BY created_at DESC LIMIT 1) as last_action,
          (SELECT u.name FROM referral_logs rl JOIN users u ON rl.user_id = u.id WHERE rl.referral_id = r.id ORDER BY rl.created_at DESC LIMIT 1) as last_actor_name
        FROM referrals r
        JOIN users u_teacher ON r.teacher_id = u_teacher.id
        WHERE r.student_id = ${id}
        ORDER BY r.created_at DESC
      `;

      res.json({ student: studentResult[0], referrals });
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
      // 1. Data Validation: Ensure at least one procedure is selected for behavior violations
      if (type === 'behavior' && (!applied_remedial_actions || !Array.isArray(applied_remedial_actions) || applied_remedial_actions.length === 0)) {
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

      // Notify Vice Principals and Principals
      const student = await sql`SELECT name FROM students WHERE id = ${student_id}`;
      const recipients = await sql`SELECT id FROM users WHERE role IN ('vice_principal', 'principal')`;
      const teacher = await sql`SELECT name FROM users WHERE id = ${teacher_id}`;
      
      for (const recipient of recipients) {
        await sql`
          INSERT INTO notifications (sender_id, recipient_id, message, referral_id)
          VALUES (${teacher_id}, ${recipient.id}, ${`تحويل جديد للطالب: ${student[0].name} من قبل ${teacher[0].name}`}, ${referralId})
        `;
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
        SELECT r.*, s.name as student_name, s.national_id as student_national_id, s.grade as student_grade, s.section as student_section, s.behavior_score as student_behavior_score, u.name as teacher_name,
               v.violation_name, v.degree as violation_degree, v.deduction_points as violation_points
        FROM referrals r
        JOIN students s ON r.student_id = s.id
        JOIN users u ON r.teacher_id = u.id
        LEFT JOIN behavioral_violations_dict v ON r.violation_id = v.id
        WHERE r.id = ${id}
      `;

      if (referralResult.length === 0) {
        return res.status(404).json({ error: "Referral not found" });
      }

      const studentId = referralResult[0].student_id;
      const studentReferralsCount = await sql`SELECT COUNT(*) as count FROM referrals WHERE student_id = ${studentId}`;

      const logs = await sql`
        SELECT l.*, u.name as user_name, u.role as user_role
        FROM referral_logs l
        JOIN users u ON l.user_id = u.id
        WHERE l.referral_id = ${id}
        ORDER BY l.created_at DESC
      `;

      res.json({ referral: referralResult[0], logs, studentReferralsCount: parseInt(studentReferralsCount[0].count) });
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
      const referral = await sql`SELECT teacher_id, student_id FROM referrals WHERE id = ${referralId}`;
      if (referral.length === 0) return res.status(404).json({ error: "Referral not found" });
      
      const student = await sql`SELECT name FROM students WHERE id = ${referral[0].student_id}`;
      const actor = await sql`SELECT name, role FROM users WHERE id = ${user_id}`;

      // 1. If evidence added by VP -> Notify Teacher
      if (actor[0].role === 'vice_principal' && (evidence_file || evidence_text)) {
        await sql`
          INSERT INTO notifications (sender_id, recipient_id, message, referral_id)
          VALUES (${user_id}, ${referral[0].teacher_id}, ${`تم إضافة شواهد جديدة لتحويل الطالب: ${student[0].name}`}, ${referralId})
        `;
      }

      // 2. If status changed to pending_counselor -> Notify Counselors
      if (status === 'pending_counselor') {
        const counselors = await sql`SELECT id FROM users WHERE role = 'counselor'`;
        for (const counselor of counselors) {
          await sql`
            INSERT INTO notifications (sender_id, recipient_id, message, referral_id)
            VALUES (${user_id}, ${counselor.id}, ${`تم تصعيد حالة الطالب: ${student[0].name} للمرشد الطلابي`}, ${referralId})
          `;
        }
      }

      // 3. If status changed to returned_to_teacher -> Notify Teacher
      if (status === 'returned_to_teacher') {
        await sql`
          INSERT INTO notifications (sender_id, recipient_id, message, referral_id)
          VALUES (${user_id}, ${referral[0].teacher_id}, ${`تم إرجاع تحويل الطالب: ${student[0].name} لاستكمال النواقص`}, ${referralId})
        `;
      }

      // 4. If status changed to pending_vp and actor is teacher -> Notify Vice Principals
      if (status === 'pending_vp' && actor[0].role === 'teacher') {
        const vps = await sql`SELECT id FROM users WHERE role = 'vice_principal'`;
        for (const vp of vps) {
          await sql`
            INSERT INTO notifications (sender_id, recipient_id, message, referral_id)
            VALUES (${user_id}, ${vp.id}, ${`تم استكمال النواقص وإعادة إرسال تحويل الطالب: ${student[0].name}`}, ${referralId})
          `;
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

  app.get("/api/notifications", async (req, res) => {
    const { userId } = req.query;
    try {
      const notifications = await sql`
        SELECT n.*, u.name as sender_name
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.id
        WHERE n.recipient_id = ${userId}
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
      await sql`UPDATE notifications SET is_read = TRUE WHERE recipient_id = ${userId}`;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
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
          u.name as teacher_name, 
          r.status, 
          r.reason, 
          r.type,
          r.remedial_plan,
          r.created_at,
          (SELECT created_at FROM referral_logs WHERE referral_id = r.id AND (action LIKE '%إغلاق%' OR action LIKE '%حل%') ORDER BY created_at DESC LIMIT 1) as closed_at
        FROM referrals r
        JOIN students s ON r.student_id = s.id
        JOIN users u ON r.teacher_id = u.id
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
        SELECT r.*, u.name as teacher_name
        FROM referrals r
        JOIN users u ON r.teacher_id = u.id
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

  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await sql`SELECT id, name, email, role, is_active FROM users` as any[];
      const usersWithGrades = await Promise.all(users.map(async u => {
        const gradesResult = await sql`SELECT grade FROM user_grades WHERE user_id = ${u.id}`;
        const grades = gradesResult.map((g: any) => g.grade);
        return { ...u, assigned_grades: grades };
      }));
      res.json(usersWithGrades);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch users" });
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
    const { name, email } = req.body;
    try {
      await sql`UPDATE users SET name = ${name}, email = ${email} WHERE id = ${req.params.id}`;
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

  app.post("/api/admin/import-national-ids", async (req, res) => {
    const { base64 } = req.body;
    if (!base64) return res.status(400).json({ error: "No file data provided" });

    try {
      const buffer = Buffer.from(base64.split(",")[1], 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet) as any[];

      let updatedCount = 0;
      let notFoundCount = 0;

      for (const row of data) {
        const name = row["الاسم"] || row["Name"];
        const nationalId = row["رقم الهوية"] || row["National ID"] || row["ID"];

        if (name && nationalId) {
          const result = await sql`UPDATE students SET national_id = ${nationalId.toString()} WHERE name = ${name}`;
          // result in neon-serverless doesn't return rowCount easily in some versions, 
          // but we can assume if it didn't throw, it tried.
          // To be more precise, we could check if student exists first.
          const check = await sql`SELECT id FROM students WHERE name = ${name}`;
          if (check.length > 0) {
            updatedCount++;
          } else {
            notFoundCount++;
          }
        }
      }

      res.json({ success: true, updatedCount, notFoundCount });
    } catch (err) {
      console.error("Import error:", err);
      res.status(500).json({ error: "Failed to process Excel file" });
    }
  });

  app.post("/api/admin/users/:id/delete", async (req, res) => {
    const userId = req.params.id;
    console.log(`[ADMIN] Request to delete user ID: ${userId}`);
    try {
      // Check if user has referrals
      const referralsCount = await sql`SELECT count(*) FROM referrals WHERE teacher_id = ${userId} OR assigned_to_id = ${userId}`;
      if (parseInt(referralsCount[0].count) > 0) {
        return res.status(400).json({ success: false, error: "لا يمكن حذف المستخدم لوجود تحويلات مرتبطة به. يمكنك تعطيل حسابه بدلاً من ذلك." });
      }
      
      await sql`DELETE FROM user_grades WHERE user_id = ${userId}`;
      await sql`DELETE FROM users WHERE id = ${userId}`;
      console.log(`- Successfully deleted user ${userId}`);
      res.json({ success: true });
    } catch (err) {
      console.error(`[ADMIN] User deletion failed for ID ${userId}:`, err);
      res.status(500).json({ success: false, error: "فشل حذف المستخدم من قاعدة البيانات" });
    }
  });

  app.post("/api/admin/referrals/:id/delete", async (req, res) => {
    const referralId = req.params.id;
    console.log(`[ADMIN] Request to delete referral ID: ${referralId}`);
    try {
      // Delete associated logs and notifications first
      await sql`DELETE FROM referral_logs WHERE referral_id = ${referralId}`;
      await sql`DELETE FROM notifications WHERE referral_id = ${referralId}`;
      await sql`DELETE FROM referrals WHERE id = ${referralId}`;
      console.log(`- Successfully deleted referral ${referralId}`);
      res.json({ success: true });
    } catch (err) {
      console.error(`[ADMIN] Referral deletion failed for ID ${referralId}:`, err);
      res.status(500).json({ success: false, error: "فشل حذف التحويل من قاعدة البيانات" });
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

  app.post("/api/admin/students/import", async (req, res) => {
    const { students, clearExisting } = req.body;
    console.log(`[IMPORT] Request received. Students: ${students?.length}, ClearExisting: ${clearExisting}`);
    
    try {
      if (!students || !Array.isArray(students)) {
        return res.status(400).json({ success: false, error: "بيانات الطلاب غير صالحة" });
      }

      // 1. Handle Wipe Logic (Clear Database)
      if (clearExisting) {
        console.log("[IMPORT] Wiping existing student data...");
        // Delete in order to respect foreign keys
        await sql`DELETE FROM notifications`;
        await sql`DELETE FROM referral_logs`;
        await sql`DELETE FROM referrals`;
        await sql`DELETE FROM students`;
        console.log("[IMPORT] Database wiped successfully.");
      }

      // 2. Process Students Loop
      let importedCount = 0;
      for (const student of students) {
        // Validation: Skip empty rows or rows without a name
        if (!student.name || String(student.name).trim() === "") {
          continue; 
        }

        const name = String(student.name).trim();
        const national_id = student.national_id ? String(student.national_id).trim() : null;
        const grade = student.grade ? String(student.grade).trim() : null;
        const section = student.section ? String(student.section).trim() : null;

        if (national_id && national_id !== "") {
          // Upsert based on national_id
          await sql`
            INSERT INTO students (name, national_id, grade, section) 
            VALUES (${name}, ${national_id}, ${grade}, ${section})
            ON CONFLICT (national_id) 
            DO UPDATE SET 
              name = EXCLUDED.name,
              grade = EXCLUDED.grade,
              section = EXCLUDED.section
          `;
        } else {
          // Insert without national_id (allows multiple students without IDs)
          await sql`
            INSERT INTO students (name, grade, section) 
            VALUES (${name}, ${grade}, ${section})
          `;
        }
        importedCount++;
      }

      console.log(`[IMPORT] Successfully processed ${importedCount} students`);
      res.json({ success: true, count: importedCount });
    } catch (err) {
      console.error("[IMPORT] Critical Failure:", err);
      res.status(500).json({ 
        success: false, 
        error: "فشل الاستيراد: " + (err instanceof Error ? err.message : "خطأ في قاعدة البيانات") 
      });
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
          // 3. Delete notifications for these referrals
          await sql`DELETE FROM notifications WHERE referral_id = ANY(${refIds})`;
          // 4. Delete logs for these referrals
          await sql`DELETE FROM referral_logs WHERE referral_id = ANY(${refIds})`;
          // 5. Delete the referrals
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

  app.post("/api/admin/students/:id/update", async (req, res) => {
    const studentId = req.params.id;
    const { name, national_id, grade, section } = req.body;
    try {
      await sql`
        UPDATE students 
        SET name = ${name}, national_id = ${national_id}, grade = ${grade}, section = ${section}
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
        await sql`DELETE FROM notifications WHERE referral_id = ANY(${refIds})`;
        // 3. Delete logs for these referrals
        await sql`DELETE FROM referral_logs WHERE referral_id = ANY(${refIds})`;
        // 4. Delete the referrals
        await sql`DELETE FROM referrals WHERE id = ANY(${refIds})`;
      }

      // 5. Delete the student
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
      const students = await sql`
        SELECT 
          s.id, 
          s.name, 
          s.national_id,
          ar.status
        FROM students s
        LEFT JOIN attendance_records ar 
          ON s.id = ar.student_id 
          AND ar.date = ${date} 
          AND ar.period = ${period}
        WHERE s.grade = ${grade} AND s.section = ${section}
        ORDER BY s.name ASC
      `;
      res.json(students);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  // 2. Submit attendance (Teacher Interface)
  app.post("/api/attendance/submit", async (req, res) => {
    const { records, teacher_id, class_id, period, date } = req.body;
    
    try {
      // Delete existing records for this class, period, and date to allow updates
      await sql`
        DELETE FROM attendance_records 
        WHERE class_id = ${class_id} AND period = ${period} AND date = ${date}
      `;

      // Insert new records
      for (const record of records) {
        await sql`
          INSERT INTO attendance_records (student_id, teacher_id, class_id, date, period, status)
          VALUES (${record.student_id}, ${teacher_id}, ${class_id}, ${date}, ${period}, ${record.status})
        `;
      }
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to submit attendance" });
    }
  });

  // 3. Get Live Radar Data (VP Interface)
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
          u.name as teacher_name
        FROM attendance_records ar
        JOIN students s ON ar.student_id = s.id
        JOIN users u ON ar.teacher_id = u.id
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
    const { date, grade, section } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    try {
      let reportData;
      if (grade && section) {
        reportData = await sql`
          SELECT 
            s.name as student_name,
            s.grade,
            s.section,
            ar.status,
            ar.period
          FROM attendance_records ar
          JOIN students s ON ar.student_id = s.id
          WHERE ar.date = ${targetDate} 
            AND ar.status IN ('غائب', 'متأخر')
            AND s.grade = ${grade}
            AND s.section = ${section}
          ORDER BY s.name ASC
        `;
      } else {
        reportData = await sql`
          SELECT 
            s.name as student_name,
            s.grade,
            s.section,
            ar.status,
            ar.period
          FROM attendance_records ar
          JOIN students s ON ar.student_id = s.id
          WHERE ar.date = ${targetDate} AND ar.status IN ('غائب', 'متأخر')
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
