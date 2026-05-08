import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Filter, Calendar, Users, Download } from 'lucide-react';
import { apiFetch } from '../utils/api';
import * as XLSX from 'xlsx';

interface AbsenceRecord {
  id: number;
  student_name: string;
  grade: string;
  section: string;
  date: string;
  period: string;
  status: string;
  teacher_name: string;
}

const AbsenceRecordPage: React.FC = () => {
  const [records, setRecords] = useState<AbsenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/attendance/absences');
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Failed to fetch absence records:', error);
    } finally {
      setLoading(false);
    }
  };

  const grades = Array.from(new Set(records.map(r => r.grade))).filter(Boolean).sort();
  const sections = Array.from(new Set(records.filter(r => !selectedGrade || r.grade === selectedGrade).map(r => r.section))).filter(Boolean).sort();

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.student_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = !selectedGrade || record.grade === selectedGrade;
    const matchesSection = !selectedSection || record.section === selectedSection;
    const matchesDate = !selectedDate || record.date === selectedDate;
    return matchesSearch && matchesGrade && matchesSection && matchesDate;
  });

  const groupedRecords = useMemo(() => {
    const groups: Record<string, any> = {};
    filteredRecords.forEach(record => {
      const key = `${record.student_name}-${record.grade}-${record.section}`;
      if (!groups[key]) {
        groups[key] = {
          id: record.id,
          student_name: record.student_name,
          grade: record.grade,
          section: record.section,
          absences: []
        };
      }
      groups[key].absences.push({
        date: record.date,
        period: record.period,
        status: record.status,
        teacher_name: record.teacher_name
      });
    });
    return Object.values(groups);
  }, [filteredRecords]);

  const exportToExcel = () => {
    const exportData = groupedRecords.map(r => ({
      'اسم الطالب': r.student_name,
      'الصف': r.grade,
      'الفصل': r.section,
      'إجمالي الغياب والتأخر': r.absences.length,
      'التفاصيل': r.absences.map((a: any) => `${a.date} (حصة ${a.period} - ${a.status})`).join(' | ')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "سجل الغياب والتأخر");
    XLSX.writeFile(wb, `سجل_الغياب_والتأخر_${new Date().toLocaleDateString('ar-SA')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            سجل الغياب والتأخر
          </h1>
          <p className="text-slate-500 mt-1">عرض جميع حالات الغياب والتأخر المسجلة من قبل المعلمين</p>
        </div>
        
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold hover:bg-emerald-100 transition-colors"
        >
          <Download className="w-5 h-5" />
          تصدير Excel
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="بحث باسم الطالب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-12 pl-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="relative">
            <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedSection('');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-12 pl-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
            >
              <option value="">جميع الصفوف</option>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="relative">
            <Users className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-12 pl-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
              disabled={!selectedGrade}
            >
              <option value="">جميع الفصول</option>
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-12 pl-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 font-bold text-slate-600">اسم الطالب</th>
                <th className="p-4 font-bold text-slate-600">الصف والفصل</th>
                <th className="p-4 font-bold text-slate-600">أيام الغياب والتأخر</th>
                <th className="p-4 font-bold text-slate-600 text-center">إجمالي الأيام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">جاري التحميل...</td>
                </tr>
              ) : groupedRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">لا توجد سجلات مطابقة</td>
                </tr>
              ) : (
                groupedRecords.map((group) => (
                  <tr key={group.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{group.student_name}</td>
                    <td className="p-4 text-slate-600">{group.grade} - {group.section}</td>
                    <td className="p-4 text-slate-600">
                      <div className="flex flex-wrap gap-2">
                        {group.absences.map((abs: any, idx: number) => (
                          <span key={idx} className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                            abs.status === 'غائب' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'
                          }`} title={`الحصة ${abs.period} - ${abs.teacher_name}`}>
                            {abs.date} ({abs.status})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-bold text-center text-lg">
                      {group.absences.length}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AbsenceRecordPage;
