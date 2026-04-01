import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileSpreadsheet, 
  Smartphone, 
  Save, 
  Trash2, 
  Users, 
  CheckCircle2, 
  X,
  Loader2,
  Building2,
  UserCircle
} from 'lucide-react';
import { useSchoolSettings } from '../context/SchoolContext';

const AdminSettings: React.FC = () => {
  const { settings, updateSettings } = useSchoolSettings();
  const [clearExisting, setClearExisting] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Local state for school settings
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [generalDirectorateName, setGeneralDirectorateName] = useState(settings.generalDirectorateName);
  const [principalName, setPrincipalName] = useState(settings.principalName);

  useEffect(() => {
    setSchoolName(settings.schoolName);
    setGeneralDirectorateName(settings.generalDirectorateName);
    setPrincipalName(settings.principalName);
  }, [settings]);

  const processFile = async (file: File) => {
    setIsImporting(true);
    setImportMessage(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      let headerRowIndex = -1;
      let targetSheetData: any[][] = [];
      let idCol = -1, nameCol = -1, gradeCol = -1, sectionCol = -1, mobileCol = -1;
      
      // 1. البحث في جميع أوراق العمل (Sheets)
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        // قراءة الملف كمصفوفة ثنائية الأبعاد خام مع ضمان قراءة كل الخلايا حتى الفارغة
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];

        // 2. تحديد سطر العناوين (Header Row) وأرقام الأعمدة (Column Indices)
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || !Array.isArray(row)) continue;
          
          // البحث عن الخلية التي تحتوي على "رقم الهوية" أو "الهوية" (مع إزالة كل المسافات لتجنب مشاكل التنسيق)
          const hasNationalId = row.some(cell => {
            if (cell === null || cell === undefined) return false;
            const cellStr = String(cell).replace(/\s+/g, '');
            return cellStr.includes('رقمالهوية') || cellStr.includes('الهوية') || cellStr.includes('السجلالمدني') || cellStr.includes('رقمالطالب');
          });

          const hasStudentName = row.some(cell => {
            if (cell === null || cell === undefined) return false;
            const cellStr = String(cell).replace(/\s+/g, '');
            return cellStr.includes('اسمالطالب') || cellStr === 'الاسم';
          });

          if (hasNationalId || hasStudentName) {
            headerRowIndex = i;
            targetSheetData = jsonData;
            
            // البحث عن الـ Index (رقم العمود) لكل من الحقول المطلوبة مع إزالة المسافات
            idCol = row.findIndex(col => {
              if (col === null || col === undefined) return false;
              const s = String(col).replace(/\s+/g, '');
              return s.includes('الهوية') || s.includes('السجلالمدني') || s.includes('رقمالطالب');
            });
            nameCol = row.findIndex(col => {
              if (col === null || col === undefined) return false;
              const s = String(col).replace(/\s+/g, '');
              return s.includes('اسمالطالب') || s.includes('الاسم') || s === 'اسم';
            });
            gradeCol = row.findIndex(col => {
              if (col === null || col === undefined) return false;
              const s = String(col).replace(/\s+/g, '');
              return s.includes('الصف') || s.includes('المرحلة');
            });
            sectionCol = row.findIndex(col => {
              if (col === null || col === undefined) return false;
              const s = String(col).replace(/\s+/g, '');
              return s.includes('الفصل') || s.includes('الشعبة');
            });
            mobileCol = row.findIndex(col => {
              if (col === null || col === undefined) return false;
              const s = String(col).replace(/\s+/g, '');
              return s.includes('جوال') || s.includes('هاتف');
            });
            
            break; // وجدنا العناوين في هذه الورقة، نخرج من حلقة الصفوف
          }
        }
        
        if (headerRowIndex !== -1) break; // وجدنا العناوين، نخرج من حلقة الأوراق
      }

      if (headerRowIndex === -1) {
        throw new Error('لم يتم العثور على عمود "رقم الهوية" أو "اسم الطالب" في أي ورقة عمل. يرجى التأكد من صيغة ملف نظام نور.');
      }

      // 2. دالة الترجمة (Grade Mapper Dictionary)
      const gradeMapper = (rawGrade: string): string => {
        const gradeStr = String(rawGrade).trim();
        if (gradeStr.includes('1314')) return 'الصف الأول';
        if (gradeStr.includes('1416')) return 'الصف الثاني';
        if (gradeStr.includes('1516')) return 'الصف الثالث';
        return gradeStr; // Fallback
      };

      // 3. استخراج البيانات (Data Extraction)
      const students: any[] = [];

      for (let i = headerRowIndex + 1; i < targetSheetData.length; i++) {
        const row = targetSheetData[i];
        if (!row || !Array.isArray(row) || row.length === 0) continue;

        // 4. التنظيف الصارم (Strict Sanitization)
        const rawId = idCol !== -1 ? String(row[idCol]).trim() : "";
        const rawName = nameCol !== -1 ? String(row[nameCol]).trim() : "";
        const rawGrade = gradeCol !== -1 ? String(row[gradeCol]).trim() : "";
        const rawSection = sectionCol !== -1 ? String(row[sectionCol]).trim() : "";
        const rawMobile = mobileCol !== -1 ? String(row[mobileCol]).trim() : "";

        // تجاهل أي صف يكون فيه national_id فارغاً، أو لا يتكون من أرقام (لتجاهل صفوف التذييل مثل "المجموع")
        const national_id = rawId.replace(/\s+/g, '');
        if (!national_id || !/^\d+$/.test(national_id)) {
          continue;
        }

        const name = rawName;
        const grade = gradeMapper(rawGrade);
        const section = rawSection;
        
        let parent_phone = rawMobile.replace(/\s+/g, '');
        if (parent_phone.startsWith('05')) {
          parent_phone = '9665' + parent_phone.substring(2);
        }

        // التأكد من وجود الاسم على الأقل مع الهوية
        if (name) {
          students.push({
            national_id,
            name,
            grade,
            section,
            parent_phone
          });
        }
      }

      if (students.length === 0) {
        throw new Error('لم يتم العثور على بيانات طلاب صالحة بعد صف العناوين.');
      }

      console.log("Final Parsed Students:", students);

      // 5. الإرسال (API Payload)
      const response = await fetch('/api/admin/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          students: students, 
          wipeDatabase: clearExisting 
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'فشل في رفع البيانات إلى الخادم');
      }

      setImportMessage({ text: `تم استيراد ${result.count || students.length} طالب بنجاح`, type: 'success' });
    } catch (error: any) {
      console.error('Import Error:', error);
      setImportMessage({ text: error.message || 'حدث خطأ غير متوقع أثناء معالجة الملف', type: 'error' });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        schoolName,
        generalDirectorateName,
        principalName,
      });
      // You could add a success message here
    } catch (error) {
      console.error("Failed to save settings:", error);
      // You could add an error message here
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">إعدادات النظام</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* العمود الأيمن: استيراد الطلاب الذكي */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">استيراد الطلاب الذكي</h2>
                <p className="text-sm text-slate-500 font-bold mt-1">ارفع ملف Excel لتحديث قاعدة البيانات تلقائياً</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-6">
              <input 
                type="checkbox" 
                id="clear-db"
                checked={clearExisting}
                onChange={(e) => setClearExisting(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <label htmlFor="clear-db" className="text-sm font-extrabold text-slate-700 cursor-pointer">
                مسح قاعدة بيانات الطلاب الحالية قبل الاستيراد (Wipe & Import)
              </label>
            </div>

            <div 
              className={`w-full flex flex-col items-center justify-center gap-6 p-12 border-2 border-dashed rounded-[2rem] bg-slate-50/50 cursor-pointer transition-all ${isDragging ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/40'} ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !isImporting && fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".xlsx, .xls, .csv"
                disabled={isImporting}
              />
              <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center bg-white text-primary shadow-xl">
                {isImporting ? <Loader2 size={32} className="animate-spin" /> : <Upload size={32} />}
              </div>
              <p className="font-black text-slate-800 text-lg">{isImporting ? 'جاري المعالجة...' : 'اسحب الملف هنا أو اضغط للرفع'}</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">XLSX, XLS, CSV (حتى 10MB)</p>
            </div>

            {importMessage && (
              <div className={`mt-4 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 ${importMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {importMessage.type === 'success' ? <CheckCircle2 size={20} /> : <X size={20} />}
                {importMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 mt-6">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="font-extrabold text-slate-800 text-sm mb-2">الأعمدة المطلوبة</h4>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                  يجب أن يحتوي الملف على: اسم الطالب، رقم الهوية، الصف، الفصل، جوال الطالب.
                </p>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="font-extrabold text-slate-800 text-sm mb-2">استراتيجية التحديث الذكي</h4>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                  النظام يستخدم رقم الهوية كمفتاح فريد. إذا كان الطالب موجوداً مسبقاً، سيتم تحديث بياناته، وإذا كان جديداً سيتم إضافته.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* العمود الأيسر */}
        <div className="space-y-8">
          {/* إعدادات المدرسة المركزية */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">إعدادات المدرسة المركزية</h2>
                <p className="text-sm text-slate-500 font-bold mt-1">تظهر هذه المعلومات في ترويسة جميع التقارير</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">اسم الإدارة العامة</label>
                <input
                  type="text"
                  value={generalDirectorateName}
                  onChange={(e) => setGeneralDirectorateName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-slate-800"
                  placeholder="مثال: الإدارة العامة للتعليم بمنطقة الرياض"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">اسم المدرسة</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-slate-800"
                  placeholder="مثال: ثانوية أم القرى"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">اسم مدير المدرسة</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <UserCircle size={20} />
                  </div>
                  <input
                    type="text"
                    value={principalName}
                    onChange={(e) => setPrincipalName(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-slate-800"
                    placeholder="اسم مدير المدرسة"
                  />
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full mt-6 bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20"
            >
              <Save size={20} />
              {isSaving ? 'جاري الحفظ...' : 'حفظ إعدادات المدرسة'}
            </button>
          </div>

          {/* إعدادات إشعارات الواتساب */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-800 mb-6">إعدادات إشعارات الواتساب</h2>
            <label className="flex items-center justify-between p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 cursor-pointer mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${whatsappEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <Smartphone size={20} />
                </div>
                <span className="font-black text-slate-800">تفعيل إشعارات الواتساب للنظام بالكامل</span>
              </div>
              <input
                type="checkbox"
                checked={whatsappEnabled}
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
                className="w-6 h-6 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Save size={20} />
              {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>

          {/* إدارة قواعد البيانات */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-extrabold text-red-600 mb-6">إدارة قواعد البيانات (Danger Zone)</h2>
            <div className="space-y-4">
              <button className="w-full flex items-center justify-center gap-3 p-4 border-2 border-red-100 text-red-600 rounded-2xl font-extrabold hover:bg-red-50 transition-all">
                <Trash2 size={18} />
                <span>حذف قاعدة بيانات الطلاب بالكامل</span>
              </button>
              <button className="w-full flex items-center justify-center gap-3 p-4 border-2 border-red-100 text-red-600 rounded-2xl font-extrabold hover:bg-red-50 transition-all">
                <Users size={18} />
                <span>حذف جميع المستخدمين (باستثناء الإدارة)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
