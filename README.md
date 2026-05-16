# 🎓 نظام إدارة مدرسي متكامل

نظام شامل لإدارة المدارس مع تتبع الحضور، الدرجات، السلوك، والنسخ الاحتياطية التلقائية.

## ✨ الميزات الرئيسية

### 📊 إدارة الطلاب
- ✅ SmartTracker - كشف المتابعة الذكي
- ✅ ClassTracker - المتابعة المبسطة  
- ✅ رادار التحضير
- ✅ الملف الشامل للطالب

### 🔒 النسخ الاحتياطية (جديد!)
- ✅ نسخ احتياطي يومي تلقائي (2:00 صباحاً)
- ✅ نسخ احتياطي يدوي من واجهة Admin
- ✅ الاحتفاظ بآخر 30 نسخة

### 🛡️ الأمان وسلامة البيانات
- ✅ Transaction system كامل
- ✅ Foreign keys محسنة مع CASCADE
- ✅ 15+ Indexes للأداء

---

## 🚀 التثبيت

```bash
# 1. تثبيت Dependencies
npm install

# 2. إعداد قاعدة البيانات
psql your_db < migrations/001_fix_critical_issues.sql

# 3. إعداد .env
cp .env.example .env

# 4. إنشاء مجلد Backups
sudo mkdir -p /var/backups/school-db
sudo chown $USER /var/backups/school-db

# 5. تشغيل
npm run dev
```

راجع `/docs/SETUP_GUIDE.md` للتفاصيل الكاملة.

---

**الإصدار:** 2.0.0  
**الحالة:** جاهز للإنتاج ✅
