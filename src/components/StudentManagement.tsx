import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { toast, Toaster } from 'react-hot-toast';
import { apiFetch } from '../utils/api';
import { UploadCloud, Search, Users, Edit, Trash2, X, Save } from 'lucide-react';

const StudentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'import' | 'view'>('import');

  // View Tab States
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const fetchStudents = async () => {
    if (selectedGrade === "" || selectedSection === "") {
      setStudentsList([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/admin/students?grade=${encodeURIComponent(selectedGrade)}&section=${encodeURIComponent(selectedSection)}`);
      if (res.ok) {
        const data = await res.json();
        setStudentsList(data.students || []);
      } else {
        toast.error("فشل جلب البيانات");
      }
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'view') {
      const fetchFilters = async () => {
        try {
          const res = await apiFetch('/api/admin/students/filters');
          if (res.ok) {
            const data = await res.json();
            setFilters(data.filters || {});
          }
        } catch (err) {
          console.error("Failed to fetch filters", err);
        }
      };
      fetchFilters();
    }
  }, [activeTab]);

  // Import Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        if (!evt.target?.result) return;
        
        // استخدام array بدلاً من binary لدعم اللغة العربية بشكل صحيح
        const data = new Uint8Array(evt.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        
        let headerIndex = -1;
        let rawData: any[] = [];
        let targetSheetName = "";

        // البحث في جميع أوراق العمل (لأن نظام نور قد يقسم الجداول إلى عدة أوراق إذا كان الملف HTML)
        for (const sheetName of workbook.SheetNames) {
          const sheetData = XLSX.utils.sheet_to_json<any[]>(workbook.Sheets[sheetName], { header: 1, defval: "" });
          
          for (let i = 0; i < sheetData.length; i++) {
            const row = sheetData[i];
            if (!Array.isArray(row)) continue;
            
            const hasIdColumn = row.some(cell => {
              // إزالة المسافات، المسافات المخفية، والتشكيل
              const cleanCell = String(cell).replace(/[\s\u200B-\u200D\uFEFF\u064B-\u065F]/g, '');
              return cleanCell.includes("رقمالطالب") || 
                     cleanCell.includes("رقمالهوية") || 
                     cleanCell.includes("الهوية") || 
                     cleanCell.includes("السجلالمدني") ||
                     cleanCell === "رقم"; // أحياناً يكون اسم العمود "رقم" فقط
            });
            
            if (hasIdColumn) {
              headerIndex = i;
              rawData = sheetData;
              targetSheetName = sheetName;
              break;
            }
          }
          if (headerIndex !== -1) break;
        }

        if (headerIndex === -1) {
          console.error("لم يتم العثور على العناوين في أي ورقة عمل. الأوراق المتاحة:", workbook.SheetNames);
          toast.error("خطأ: الملف لا يحتوي على عمود باسم 'رقم الطالب' أو 'رقم الهوية'");
          if (e.target) e.target.value = '';
          return;
        }

        console.log(`تم العثور على العناوين في الورقة: ${targetSheetName} في الصف: ${headerIndex}`);

        const headerRow = rawData[headerIndex];
        
        const findCol = (keywords: string[]) => headerRow.findIndex((cell: any) => {
          const cleanCell = String(cell).replace(/[\s\u200B-\u200D\uFEFF\u064B-\u065F]/g, '');
          return keywords.some(kw => cleanCell.includes(kw));
        });

        const idCol = findCol(["رقمالطالب", "رقمالهوية", "الهوية", "السجلالمدني"]);
        const nameCol = findCol(["اسمالطالب", "الاسم"]);
        const gradeCol = findCol(["رقمالصف", "الصف"]);
        const sectionCol = findCol(["الفصل"]);
        const mobileCol = findCol(["الجوال", "هاتف", "المحمول"]);

        if (idCol === -1 || nameCol === -1 || gradeCol === -1 || sectionCol === -1 || mobileCol === -1) {
          toast.error("خطأ: تأكد من وجود جميع الأعمدة (رقم الطالب، اسم الطالب، رقم الصف، الفصل، الجوال)");
          if (e.target) e.target.value = '';
          return;
        }

        const translateGrade = (rawGrade: any) => {
          const strGrade = String(rawGrade).trim();
          if (strGrade === "1314") return "الصف الأول";
          if (strGrade === "1416") return "الصف الثاني";
          if (strGrade === "1516") return "الصف الثالث";
          return strGrade; 
        };

        const parsedStudents = [];
        for (let i = headerIndex + 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || !Array.isArray(row)) continue;

          const idValue = String(row[idCol] || "").trim();
          if (!idValue || idValue.length < 5) continue;

          parsedStudents.push({
            national_id: idValue,
            name: String(row[nameCol] || "").trim(),
            grade: translateGrade(row[gradeCol]),
            section: String(row[sectionCol] || "").trim(),
            mobile: String(row[mobileCol] || "").trim()
          });
        }

        if (parsedStudents.length === 0) {
          toast.error("خطأ: لم يتم العثور على أي بيانات طلاب صالحة في الملف");
          if (e.target) e.target.value = '';
          return;
        }

        const res = await apiFetch('/api/admin/students/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ students: parsedStudents }),
        });

        if (res.ok) {
          toast.success('تم الرفع بنجاح');
        } else {
          const errorData = await res.json().catch(() => ({}));
          toast.error(errorData.error || 'فشل الرفع');
        }
      } catch (err) {
        console.error(err);
        toast.error('حدث خطأ أثناء معالجة الملف');
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // View Tab Logic
  useEffect(() => {
    fetchStudents();
  }, [selectedGrade, selectedSection]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const res = await apiFetch(`/api/admin/students/${editingStudent.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingStudent.name,
          national_id: editingStudent.national_id,
          grade: editingStudent.grade,
          section: editingStudent.section,
          parent_phone: editingStudent.mobile || editingStudent.parent_phone
        })
      });

      if (res.ok) {
        toast.success('تم تحديث بيانات الطالب بنجاح');
        setEditingStudent(null);
        fetchStudents();
      } else {
        const data = await res.json();
        toast.error(data.error || 'فشل تحديث البيانات');
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء التحديث');
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (!window.confirm('هل أنت متأكد من فصل/حذف هذا الطالب؟ سيتم حذف جميع سجلاته ومخالفاته.')) return;
    
    setIsDeleting(studentId);
    try {
      const res = await apiFetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('تم حذف الطالب بنجاح');
        fetchStudents();
      } else {
        const data = await res.json();
        toast.error(data.error || 'فشل حذف الطالب');
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء الحذف');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <Toaster position="top-center" />
      
      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'import' ? 'bg-primary/5 text-primary border-b-2 border-primary' : 'text-slate-500 hover:bg-slate-50'}`}
          onClick={() => setActiveTab('import')}
        >
          استيراد بيانات نور
        </button>
        <button
          className={`flex-1 py-4 text-center font-bold transition-colors ${activeTab === 'view' ? 'bg-primary/5 text-primary border-b-2 border-primary' : 'text-slate-500 hover:bg-slate-50'}`}
          onClick={() => setActiveTab('view')}
        >
          استعراض الطلاب
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'import' && (
          <div className="max-w-xl mx-auto">
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700 mb-2">اسحب وأفلت ملف نور هنا</h3>
              <p className="text-sm text-slate-500">أو اضغط لاختيار ملف (Excel/CSV)</p>
            </div>
            <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800">
              <p className="font-bold mb-1">تنبيه هام:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>يجب أن يحتوي الملف على الأعمدة التالية بالحرف: (رقم الطالب، اسم الطالب، رقم الصف، الفصل، الجوال).</li>
                <li>سيتم تحديث بيانات الطلاب الموجودين مسبقاً تلقائياً.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'view' && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <select 
                value={selectedGrade} 
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  setSelectedSection(''); // Reset section when grade changes
                }}
                className="flex-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">-- اختر الصف --</option>
                {Object.keys(filters).map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
              <select 
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={!selectedGrade}
                className="flex-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">-- اختر الفصل --</option>
                {(filters[selectedGrade] || []).map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>

            {selectedGrade === "" || selectedSection === "" ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">يرجى تحديد الصف والفصل لاستعراض البيانات</p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : studentsList.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">لا يوجد طلاب مسجلين في هذا الفصل</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 font-bold text-slate-600">اسم الطالب</th>
                      <th className="p-4 font-bold text-slate-600">الهوية</th>
                      <th className="p-4 font-bold text-slate-600">الصف</th>
                      <th className="p-4 font-bold text-slate-600">الفصل</th>
                      <th className="p-4 font-bold text-slate-600">الجوال</th>
                      <th className="p-4 font-bold text-slate-600 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentsList.map((student, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-medium text-slate-900">{student.name}</td>
                        <td className="p-4 text-slate-600">{student.national_id}</td>
                        <td className="p-4 text-slate-600">{student.grade}</td>
                        <td className="p-4 text-slate-600">{student.section}</td>
                        <td className="p-4 text-slate-600">{student.mobile || student.parent_phone || '-'}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setEditingStudent({...student, mobile: student.mobile || student.parent_phone})}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="تعديل بيانات الطالب"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              disabled={isDeleting === student.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="فصل/حذف الطالب"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800">تعديل بيانات الطالب</h3>
              <button 
                onClick={() => setEditingStudent(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم الطالب</label>
                <input
                  type="text"
                  required
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهوية</label>
                <input
                  type="text"
                  required
                  value={editingStudent.national_id}
                  onChange={(e) => setEditingStudent({...editingStudent, national_id: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الصف</label>
                  <select
                    required
                    value={editingStudent.grade}
                    onChange={(e) => setEditingStudent({...editingStudent, grade: e.target.value, section: ''})}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="">-- اختر الصف --</option>
                    {Object.keys(filters).map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الفصل</label>
                  <select
                    required
                    value={editingStudent.section}
                    onChange={(e) => setEditingStudent({...editingStudent, section: e.target.value})}
                    disabled={!editingStudent.grade}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">-- اختر الفصل --</option>
                    {(filters[editingStudent.grade] || []).map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الجوال</label>
                <input
                  type="text"
                  value={editingStudent.mobile || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, mobile: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="رقم جوال ولي الأمر"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-white bg-primary hover:bg-primary/90 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
