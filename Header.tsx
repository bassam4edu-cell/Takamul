const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// 1. تفعيل إعدادات CORS للسماح لنظام نور بالوصول للـ API
const corsOptions = {
  origin: 'https://noor.moe.gov.sa',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

// 2. إعداد الاتصال بقاعدة بيانات Neon (PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // مطلوب للاتصال بـ Neon
  }
});

// 3. إنشاء مسار (Route) جديد لجلب الدرجات
app.get('/api/get-takamol-grades', async (req, res) => {
  try {
    // استعلام لجلب بيانات الطلاب (عدل أسماء الأعمدة والجدول حسب هيكلة قاعدة بياناتك)
    // مثال: جلب الدرجات التي لم يتم مزامنتها بعد
    const query = `
      SELECT 
        national_id AS "nationalId", 
        oral_score AS "oralScore", 
        performance_score AS "performanceScore" 
      FROM student_grades 
      WHERE sync_status = 'pending'
    `;
    
    const { rows } = await pool.query(query);

    // إرجاع البيانات بصيغة JSON كمصفوفة
    res.status(200).json(rows);

  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'حدث خطأ داخلي في الخادم أثناء جلب البيانات' });
  }
});

// تشغيل الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Takamol API Server is running on port ${PORT}`);
});
