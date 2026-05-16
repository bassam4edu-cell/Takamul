# ⚙️ ملفات الإعداد المطلوبة

## 1. package.json - Dependencies

أضف في قسم dependencies:

```json
{
  "dependencies": {
    "node-schedule": "^2.1.1"
  }
}
```

ثم نفذ:
```bash
npm install
```

---

## 2. .env - Environment Variables

أضف/حدّث في ملف `.env`:

```env
# ================================
# Database Configuration
# ================================
DATABASE_NAME=school_management
DATABASE_USER=postgres
DATABASE_PASSWORD=your_secure_password_here
DATABASE_HOST=localhost
DATABASE_PORT=5432

# ================================
# Backup Configuration
# ================================
BACKUP_DIR=/var/backups/school-db
MAX_BACKUPS=30

# ================================
# Server Configuration
# ================================
PORT=3000
NODE_ENV=production
```

---

## 3. إنشاء مجلد الـ Backup

```bash
# إنشاء المجلد
sudo mkdir -p /var/backups/school-db

# إعطاء الصلاحيات
sudo chown -R $USER:$USER /var/backups/school-db
sudo chmod 755 /var/backups/school-db
```

---

## 4. إضافة BackupManager في Admin Page

في ملف `AdminDashboard.tsx` أو المكان المناسب:

```tsx
import { BackupManager } from '../components/BackupManager';

// في صفحة Admin، أضف تبويب جديد:
function AdminDashboard() {
  return (
    <div>
      <Tabs>
        <Tab label="لوحة التحكم">...</Tab>
        <Tab label="الطلاب">...</Tab>
        <Tab label="المعلمين">...</Tab>
        
        {/* التبويب الجديد */}
        <Tab label="النسخ الاحتياطية">
          <BackupManager />
        </Tab>
      </Tabs>
    </div>
  );
}
```

---

## 5. إضافة Backup Endpoints في server.ts

في ملف `server.ts`، أضف في البداية:

```typescript
import { 
  createBackup, 
  listBackups, 
  deleteBackup, 
  getBackupFile, 
  getBackupStats,
  scheduleDailyBackup 
} from './utils/backup';

// بعد تعريف app، أضف:
scheduleDailyBackup(); // تفعيل الـ backup اليومي
```

ثم انسخ الـ endpoints من ملف `backup-endpoints.ts` وألصقها في `server.ts`.

---

## 6. التحقق من التثبيت

بعد التطبيق، تحقق من:

```bash
# 1. تشغيل السيرفر
npm run dev

# 2. تحقق من الـ logs - يجب أن ترى:
# "📅 Daily backup scheduled at 2:00 AM"

# 3. اختبر إنشاء backup يدوي
# من صفحة Admin → النسخ الاحتياطية → "نسخة احتياطية يدوية"

# 4. تحقق من المجلد
ls -lh /var/backups/school-db/
```

---

## 7. Cron Job (اختياري - للتأكد)

إذا أردت ضمان إضافي، أضف cron job:

```bash
# فتح crontab
crontab -e

# أضف السطر التالي:
0 2 * * * cd /path/to/your/project && node -e "require('./utils/backup').createBackup('auto')"
```

---

## ✅ Checklist الإعداد

- [ ] أضفت node-schedule في package.json
- [ ] نفذت npm install
- [ ] حدّثت .env بالمعلومات الصحيحة
- [ ] أنشأت مجلد /var/backups/school-db
- [ ] أضفت BackupManager في Admin page
- [ ] أضفت backup endpoints في server.ts
- [ ] اختبرت إنشاء backup يدوي
- [ ] تحققت من وجود الملف في المجلد

---

**جاهز! 🎉**
