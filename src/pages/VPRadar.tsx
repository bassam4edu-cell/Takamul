import { apiFetch } from '../utils/api';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMessageLog } from '../context/MessageLogContext';
import { CheckCircle2, XCircle, Clock, Save, UserCheck, AlertCircle, Printer, Filter, Calendar, MessageSquare, AlertTriangle, Search, Hourglass, Trash2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AttendanceRecord {
  studentId: number;
  date: string;
  period: number;
  status: string;
  isExcused: boolean;
  excuseReason: string;
  teacherName?: string;
}

const VPRadar: React.FC = () => {
  const { user } = useAuth();
  const { addLogEntry } = useMessageLog();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [grade, setGrade] = useState('all');
  const [section, setSection] = useState('all');
  
  const [grades, setGrades] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [originalAttendanceData, setOriginalAttendanceData] = useState<AttendanceRecord[]>([]);
  
  const [pendingClasses, setPendingClasses] = useState<{grade: string, section: string}[]>([]);
  const [completedClasses, setCompletedClasses] = useState<{grade: string, section: string, teacher_name?: string, period?: number, timestamp?: string}[]>([]);
  const [totalClassesCount, setTotalClassesCount] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [principalName, setPrincipalName] = useState('مدير المدرسة');

  // Smart Dashboard States
  const [hasSearched, setHasSearched] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'حاضر' | 'غائب' | 'متأخر'>('all');

  // Report Engine States
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<'daily' | 'warnings_3' | 'warnings_5' | 'excused_form'>('daily');
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<any>(null);

  // Modal States
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [bulkPresentConfig, setBulkPresentConfig] = useState<{grade: string, section: string} | null>(null);
  const [absenceTemplate, setAbsenceTemplate] = useState("المكرم ولي أمر الطالب {اسم_الطالب}، نود إشعاركم بغياب ابنكم اليوم {التاريخ} عن {الحصة}. إدارة {اسم_المدرسة}.");
  const [schoolName, setSchoolName] = useState('ثانوية أم القرى');

  useEffect(() => {
    apiFetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.absence_template) {
          setAbsenceTemplate(data.absence_template);
        }
        if (data.school_name) {
          setSchoolName(data.school_name);
        }
      })
      .catch(console.error);
  }, []);

  // Helper to get current period data
  const currentPeriodData = useMemo(() => {
    return attendanceData.filter(a => a.date === date && a.period === selectedPeriod);
  }, [attendanceData, date, selectedPeriod]);

  const originalCurrentPeriodData = useMemo(() => {
    return originalAttendanceData.filter(a => a.date === date && a.period === selectedPeriod);
  }, [originalAttendanceData, date, selectedPeriod]);

  const getStudentStatus = (studentId: number) => {
    const record = currentPeriodData.find(a => a.studentId === studentId);
    return record ? record.status : 'حاضر';
  };

  const getStudentExcuseStatus = (studentId: number) => {
    const record = currentPeriodData.find(a => a.studentId === studentId);
    return record ? record.isExcused : false;
  };

  const getStudentExcuseReason = (studentId: number) => {
    const record = currentPeriodData.find(a => a.studentId === studentId);
    return record ? record.excuseReason : '';
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return currentPeriodData.some(current => {
      const original = originalCurrentPeriodData.find(o => o.studentId === current.studentId);
      if (!original) {
        // If no original record, it's an unsaved change ONLY if the new status is not 'حاضر'
        // or if there's an excuse/reason.
        return current.status !== 'حاضر' || current.isExcused || current.excuseReason !== '';
      }
      return current.status !== original.status || 
             current.isExcused !== original.isExcused || 
             current.excuseReason !== original.excuseReason;
    });
  }, [currentPeriodData, originalCurrentPeriodData]);

  // Fetch Grades
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await apiFetch('/api/attendance/grades');
        if (res.ok) {
          const data = await res.json();
          setGrades(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchGrades();
  }, []);

  // Fetch Sections when Grade changes
  useEffect(() => {
    const fetchSections = async () => {
      if (grade === 'all') {
        setSections([]);
        setSection('all');
        return;
      }
      try {
        const res = await apiFetch(`/api/attendance/sections/${grade}`);
        if (res.ok) {
          const data = await res.json();
          setSections(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSections();
  }, [grade]);

  // Fetch Command Center Data & Pending Classes
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        date,
        grade,
        section
      });
      
      const [studentsRes, pendingRes, settingsRes] = await Promise.all([
        apiFetch(`/api/attendance/command-center?${params}`),
        apiFetch(`/api/attendance/pending-classes?date=${date}&period=${selectedPeriod}`),
        apiFetch('/api/settings')
      ]);

      if (settingsRes.ok) {
        const settingsJson = await settingsRes.json();
        if (settingsJson.principal_name) {
          setPrincipalName(settingsJson.principal_name);
        }
      }

      if (studentsRes.ok) {
        const data = await studentsRes.json();
        setStudents(data);
        
        const newAttendanceData: AttendanceRecord[] = [];
        
        data.forEach((s: any) => {
          if (s.attendance_records && Array.isArray(s.attendance_records)) {
            s.attendance_records.forEach((ar: any) => {
              newAttendanceData.push({
                studentId: s.id,
                date: date,
                period: ar.period,
                status: ar.status,
                isExcused: ar.is_excused,
                excuseReason: ar.excuse_reason || '',
                teacherName: ar.teacher_name
              });
            });
          }
        });
        
        setAttendanceData(newAttendanceData);
        setOriginalAttendanceData(JSON.parse(JSON.stringify(newAttendanceData)));
      }

      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        // Filter pending classes based on selected grade/section if needed
        let pending = pendingData.pending || [];
        let completed = pendingData.completed || [];
        
        if (grade !== 'all') {
          pending = pending.filter((c: any) => c.grade === grade);
          completed = completed.filter((c: any) => c.grade === grade);
        }
        if (section !== 'all') {
          pending = pending.filter((c: any) => c.section === section);
          completed = completed.filter((c: any) => c.section === section);
        }
        setPendingClasses(pending);
        setCompletedClasses(completed);
        setTotalClassesCount(pendingData.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when filters change
  useEffect(() => {
    fetchData();
    // We don't auto-set hasSearched to true here. 
    // The user must explicitly click Search or a KPI to view the list.
  }, [date, grade, section, selectedPeriod]);

  // Poll for pending classes every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      apiFetch(`/api/attendance/pending-classes?date=${date}&period=${selectedPeriod}`)
        .then(res => res.json())
        .then(pendingData => {
          let pending = pendingData.pending || [];
          let completed = pendingData.completed || [];
          if (grade !== 'all') {
            pending = pending.filter((c: any) => c.grade === grade);
            completed = completed.filter((c: any) => c.grade === grade);
          }
          if (section !== 'all') {
            pending = pending.filter((c: any) => c.section === section);
            completed = completed.filter((c: any) => c.section === section);
          }
          setPendingClasses(pending);
          setCompletedClasses(completed);
          setTotalClassesCount(pendingData.total || 0);
        })
        .catch(err => console.error('Failed to poll pending classes:', err));
    }, 30000);
    return () => clearInterval(interval);
  }, [date, grade, section, selectedPeriod]);

  const handleSearchClick = () => {
    setStatusFilter('all');
    setHasSearched(true);
  };

  const handleKPIClick = (status: 'حاضر' | 'غائب' | 'متأخر') => {
    setStatusFilter(status);
    setHasSearched(true);
  };

  const handleExcuseChange = (studentId: number, isExcused: boolean) => {
    setAttendanceData(prev => {
      const existingIndex = prev.findIndex(a => a.studentId === studentId && a.date === date && a.period === selectedPeriod);
      if (existingIndex >= 0) {
        const newData = [...prev];
        newData[existingIndex] = { ...newData[existingIndex], isExcused };
        return newData;
      } else {
        return [...prev, { studentId, date, period: selectedPeriod, status: 'غائب', isExcused, excuseReason: '' }];
      }
    });
  };

  const handleExcuseReasonChange = (studentId: number, excuseReason: string) => {
    setAttendanceData(prev => {
      const existingIndex = prev.findIndex(a => a.studentId === studentId && a.date === date && a.period === selectedPeriod);
      if (existingIndex >= 0) {
        const newData = [...prev];
        newData[existingIndex] = { ...newData[existingIndex], excuseReason };
        return newData;
      } else {
        return [...prev, { studentId, date, period: selectedPeriod, status: 'غائب', isExcused: true, excuseReason }];
      }
    });
  };

  const handleStatusChange = async (studentId: number, status: string) => {
    setAttendanceData(prev => {
      const existingIndex = prev.findIndex(a => a.studentId === studentId && a.date === date && a.period === selectedPeriod);
      if (existingIndex >= 0) {
        const newData = [...prev];
        newData[existingIndex] = { ...newData[existingIndex], status };
        return newData;
      } else {
        return [...prev, { studentId, date, period: selectedPeriod, status, isExcused: false, excuseReason: '' }];
      }
    });
    
    // Quick Individual Edit: Save instantly
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    try {
      const records = [{
        student_id: student.id,
        status: status,
        is_excused: getStudentExcuseStatus(student.id),
        excuse_reason: getStudentExcuseReason(student.id),
        grade: student.grade,
        section: student.section
      }];

      const res = await apiFetch('/api/attendance/submit-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records,
          teacher_id: user?.id,
          date,
          period: selectedPeriod
        })
      });

      if (res.ok) {
        setOriginalAttendanceData(prev => {
          const existingIndex = prev.findIndex(a => a.studentId === studentId && a.date === date && a.period === selectedPeriod);
          if (existingIndex >= 0) {
            const newData = [...prev];
            newData[existingIndex] = { ...newData[existingIndex], status };
            return newData;
          } else {
            return [...prev, { studentId, date, period: selectedPeriod, status, isExcused: false, excuseReason: '' }];
          }
        });
        fetchData(); // Refresh radar data
      }
    } catch (err) {
      console.error("Failed to save individual status", err);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let studentsToSubmit = students;
      
      // If viewing all grades or all sections, only submit records that have been modified
      if (grade === 'all' || section === 'all') {
        studentsToSubmit = students.filter(s => {
          const current = currentPeriodData.find(a => a.studentId === s.id);
          const original = originalCurrentPeriodData.find(o => o.studentId === s.id);
          if (!current) return false;
          if (!original) {
            return current.status !== 'حاضر' || current.isExcused || current.excuseReason !== '';
          }
          return current.status !== original.status || 
                 current.isExcused !== original.isExcused || 
                 current.excuseReason !== original.excuseReason;
        });
      }

      if (studentsToSubmit.length === 0) {
        setSubmitting(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        return;
      }

      const records = studentsToSubmit.map(s => ({
        student_id: s.id,
        status: getStudentStatus(s.id),
        is_excused: getStudentExcuseStatus(s.id),
        excuse_reason: getStudentExcuseReason(s.id),
        grade: s.grade,
        section: s.section
      }));

      const res = await apiFetch('/api/attendance/submit-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records,
          teacher_id: user?.id,
          date,
          period: selectedPeriod
        })
      });

      if (res.ok) {
        setSuccess(true);
        setOriginalAttendanceData(JSON.parse(JSON.stringify(attendanceData)));
        setTimeout(() => setSuccess(false), 3000);
        fetchData(); // Refresh to get updated teacher names and radar
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAttendance = async () => {
    setResetting(true);
    try {
      const res = await apiFetch('/api/attendance/reset-daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, period: selectedPeriod })
      });
      if (res.ok) {
        setAlertMessage(`تم تصفير تحضير الحصة ${selectedPeriod} بنجاح.`);
        fetchData();
        setIsResetModalOpen(false);
      } else {
        setAlertMessage('حدث خطأ أثناء التصفير.');
      }
    } catch (err) {
      console.error(err);
      setAlertMessage('حدث خطأ أثناء التصفير.');
    } finally {
      setResetting(false);
    }
  };

  const handleBulkPresent = async () => {
    if (!bulkPresentConfig) return;
    const { grade, section } = bulkPresentConfig;
    
    const classStudents = students.filter(s => s.grade === grade && s.section === section);
    
    setAttendanceData(prev => {
      const next = [...prev];
      classStudents.forEach(s => {
        const existingIndex = next.findIndex(a => a.studentId === s.id && a.date === date && a.period === selectedPeriod);
        if (existingIndex >= 0) {
          next[existingIndex] = { ...next[existingIndex], status: 'حاضر' };
        } else {
          next.push({ studentId: s.id, date, period: selectedPeriod, status: 'حاضر', isExcused: false, excuseReason: '' });
        }
      });
      return next;
    });

    try {
      const records = classStudents.map(s => ({
        student_id: s.id,
        status: 'حاضر',
        is_excused: getStudentExcuseStatus(s.id),
        excuse_reason: getStudentExcuseReason(s.id),
        grade: s.grade,
        section: s.section
      }));

      const res = await apiFetch('/api/attendance/submit-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records,
          teacher_id: user?.id,
          date,
          period: selectedPeriod
        })
      });

      if (res.ok) {
        setOriginalAttendanceData(prev => {
          const next = [...prev];
          classStudents.forEach(s => {
            const existingIndex = next.findIndex(a => a.studentId === s.id && a.date === date && a.period === selectedPeriod);
            if (existingIndex >= 0) {
              next[existingIndex] = { ...next[existingIndex], status: 'حاضر' };
            } else {
              next.push({ studentId: s.id, date, period: selectedPeriod, status: 'حاضر', isExcused: false, excuseReason: '' });
            }
          });
          return next;
        });
        fetchData();
        setAlertMessage(`تم تحضير جميع طلاب الفصل للحصة ${selectedPeriod} بنجاح`);
      }
    } catch (err) {
      console.error("Failed to bulk present", err);
      setAlertMessage('حدث خطأ أثناء التحضير الجماعي');
    } finally {
      setBulkPresentConfig(null);
    }
  };

  const handlePrint = () => {
    setSelectedReportType('daily');
    setIsPrintModalOpen(true);
  };

  const handleStudentPrint = (student: any, type: 'warnings_3' | 'warnings_5' | 'excused_form') => {
    setSelectedReportType(type);
    setSelectedStudentForReport(student);
    setIsPrintModalOpen(true);
  };

  const getReportStudents = () => {
    let list = filteredStudents;
    if (selectedReportType === 'warnings_3') {
      list = students.filter(s => (s.total_absences || 0) >= 3);
    } else if (selectedReportType === 'warnings_5') {
      list = students.filter(s => (s.total_absences || 0) >= 5);
    } else if (selectedReportType === 'daily') {
      list = filteredStudents.filter(s => getStudentStatus(s.id) === 'غائب');
    }
    return list;
  };

  const sendWhatsAppMessage = async (phoneNumber: string, studentName: string) => {
    try {
      const currentDate = new Date().toLocaleDateString('ar-SA');
      const periodName = selectedPeriod ? `الحصة ${selectedPeriod}` : 'غير محدد';
      
      const finalMessage = absenceTemplate
        .replace(/{اسم_الطالب}/g, studentName)
        .replace(/{التاريخ}/g, currentDate)
        .replace(/{الحصة}/g, periodName)
        .replace(/{اسم_المدرسة}/g, schoolName);

      const response = await apiFetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber, studentName, period: selectedPeriod, message: finalMessage })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.code === 'MISSING_WHATSAPP_CREDENTIALS' || data.code === 'FORBIDDEN') {
          return { success: false, code: data.code, message: data.message };
        }
        
        addLogEntry({
          recipient: studentName,
          recipientPhone: phoneNumber,
          messageType: '🛑 إشعار غياب',
          messageText: finalMessage,
          status: 'failed'
        });
        
        throw new Error('Failed to send WhatsApp message');
      }

      addLogEntry({
        recipient: studentName,
        recipientPhone: phoneNumber,
        messageType: '🛑 إشعار غياب',
        messageText: finalMessage,
        status: 'success'
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to send WhatsApp message", error);
      return { success: false, message: 'حدث خطأ أثناء الإرسال' };
    }
  };

  const handleSendWhatsApp = async (student: any) => {
    if (!student.parent_phone || student.parent_phone.trim() === '') {
      setAlertMessage('رقم الجوال غير مسجل لهذا الطالب');
      return;
    }
    
    // Show loading state or alert
    const result = await sendWhatsAppMessage(student.parent_phone, student.name);
    
    if (!result.success) {
      if (result.code === 'MISSING_WHATSAPP_CREDENTIALS' || result.code === 'FORBIDDEN') {
        setAlertMessage(`⚠️ تعذر الإرسال: ${result.message}`);
      } else {
        setAlertMessage('حدث خطأ أثناء الإرسال.');
      }
      return;
    }
    
    setAlertMessage(`تم إرسال رسالة واتساب لولي أمر الطالب بنجاح.`);
  };

  const handleBulkWhatsApp = async () => {
    const absentStudents = filteredStudents.filter(s => getStudentStatus(s.id) === 'غائب');
    const validStudents = absentStudents.filter(s => s.parent_phone && s.parent_phone.trim() !== '');
    const skippedCount = absentStudents.length - validStudents.length;

    if (validStudents.length === 0) {
      setAlertMessage(`لا يوجد طلاب غائبين بأرقام جوال مسجلة.`);
      return;
    }

    setIsSendingBulk(true);
    let sentCount = 0;
    let hasCredentialError = false;
    
    for (const student of validStudents) {
      const result = await sendWhatsAppMessage(student.parent_phone, student.name);
      
      if (!result.success) {
        if (result.code === 'MISSING_WHATSAPP_CREDENTIALS') {
          setAlertMessage(`⚠️ تعذر الإرسال: ${result.message}`);
          hasCredentialError = true;
          break; // Stop the loop
        }
        // Continue to next student if it's a normal error
        continue;
      }
      
      sentCount++;
      // Delay of 2000ms between messages to prevent bans
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    setIsSendingBulk(false);
    
    if (!hasCredentialError) {
      setAlertMessage(`تم إرسال ${sentCount} رسالة بنجاح، وتخطي ${skippedCount} طالب لعدم وجود رقم.`);
    }
  };

  // KPIs
  const totalPresent = students.filter(s => getStudentStatus(s.id) === 'حاضر').length;
  const totalAbsent = students.filter(s => getStudentStatus(s.id) === 'غائب').length;
  const totalLate = students.filter(s => getStudentStatus(s.id) === 'متأخر').length;

  const progressPercentage = totalClassesCount > 0 ? Math.round((completedClasses.length / totalClassesCount) * 100) : 0;

  // Filtered Students
  const filteredStudents = useMemo(() => {
    if (statusFilter === 'all') return students;
    return students.filter(s => getStudentStatus(s.id) === statusFilter);
  }, [students, currentPeriodData, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto p-4 pb-24 space-y-6">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; direction: rtl; }
          
          /* الاعتماد على الخطوط الرسمية المدمجة في الأجهزة */
          #printable-report, #printable-report table, #printable-report th, #printable-report td, #printable-report span, #printable-report p, #printable-report h1, #printable-report h2 {
            font-family: 'Traditional Arabic', 'Simplified Arabic', 'Times New Roman', serif !important;
          }
          
          /* مقاس الخط للتفاصيل وأسماء الطلاب */
          #printable-report { font-size: 11pt !important; }
          
          /* مقاس الخط للعناوين ورأس الجدول */
          #printable-report th, #printable-report h1, #printable-report h2, #printable-report .report-title {
            font-size: 14pt !important;
            font-weight: bold !important;
          }

          .print-table { border-collapse: collapse; width: 100%; border: 1px solid #000; }
          .print-table th, .print-table td { border: 1px solid #000; padding: 4px 8px; text-align: right; color: #000; }
          .print-table th { background-color: #f3f4f6 !important; }
          .print-table tr:nth-child(even) { background-color: #f9fafb !important; }
          .print-table tr:nth-child(odd) { background-color: #ffffff !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
      
      {/* Print Views (Only visible when printing) */}
      <div id="printable-report" className="hidden print:block w-full bg-white text-black print-report font-sans" dir="rtl">
        {selectedReportType === 'excused_form' && selectedStudentForReport ? (
          <div className="p-4" dir="rtl">
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-8">
              <div className="text-right space-y-1">
                <p className="text-sm font-black">المملكة العربية السعودية</p>
                <p className="text-sm font-black">وزارة التعليم</p>
                <p className="text-sm font-black">الإدارة العامة للتعليم بمنطقة الرياض</p>
                <p className="text-sm font-black">مدرسة ثانوية أم القرى</p>
              </div>
              <div className="text-center">
                <img src="https://upload.wikimedia.org/wikipedia/ar/thumb/a/a3/Ministry_of_Education_%28Saudi_Arabia%29_Logo.svg/1200px-Ministry_of_Education_%28Saudi_Arabia%29_Logo.svg.png" alt="شعار الوزارة" className="w-20 h-auto mx-auto grayscale opacity-80" />
              </div>
              <div className="text-right space-y-1 text-sm font-bold">
                <p>الرقم: ....................</p>
                <p>التاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
                <p>المرفقات: ....................</p>
              </div>
            </div>

            <h1 className="text-xl font-black text-center mb-8 underline underline-offset-8">نموذج إجراءات الغياب (بعذر / بدون عذر)</h1>

            <div className="mb-8 font-bold flex flex-wrap gap-8 bg-gray-50 p-4 border border-black rounded-lg print:bg-gray-50 print:border-black">
              <p>اسم الطالب: <span className="font-bold">{selectedStudentForReport.name}</span> | المرحلة: الثانوية | الصف: {selectedStudentForReport.grade} - {selectedStudentForReport.section}</p>
            </div>

            <table className="print-table mb-12">
              <thead>
                <tr>
                  <th className="w-32 text-center">عدد أيام الغياب</th>
                  <th>الإجراء المتخذ</th>
                  <th className="w-32 text-center">تاريخ الإجراء</th>
                  <th className="w-32 text-center">توقيع الطالب</th>
                  <th className="w-32 text-center">توقيع ولي الأمر</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-bold text-center py-4">3 أيام</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="font-bold text-center py-4">5 أيام</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="font-bold text-center py-4">10 أيام</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            <div className="mt-16 print-grid grid-cols-3 gap-8 text-center page-break-inside-avoid">
              <div className="space-y-8">
                <p className="print-label">مدير المدرسة</p>
                <div className="h-px bg-black w-3/4 mx-auto"></div>
                <p className="text-sm font-bold">التوقيع: .................</p>
              </div>
              <div className="space-y-8">
                <p className="print-label">توقيع الطالب</p>
                <div className="h-px bg-black w-3/4 mx-auto"></div>
                <p className="text-sm font-bold">التوقيع: .................</p>
              </div>
              <div className="space-y-8">
                <p className="print-label">توقيع ولي الأمر</p>
                <div className="h-px bg-black w-3/4 mx-auto"></div>
                <p className="text-sm font-bold">التوقيع: .................</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4" dir="rtl">
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-8">
              <div className="text-right space-y-1">
                <p className="text-sm font-black">المملكة العربية السعودية</p>
                <p className="text-sm font-black">وزارة التعليم</p>
                <p className="text-sm font-black">الإدارة العامة للتعليم بمنطقة الرياض</p>
                <p className="text-sm font-black">مدرسة ثانوية أم القرى</p>
              </div>
              <div className="text-center">
                <img src="https://upload.wikimedia.org/wikipedia/ar/thumb/a/a3/Ministry_of_Education_%28Saudi_Arabia%29_Logo.svg/1200px-Ministry_of_Education_%28Saudi_Arabia%29_Logo.svg.png" alt="شعار الوزارة" className="w-20 h-auto mx-auto grayscale opacity-80" />
              </div>
              <div className="text-right space-y-1 text-sm font-bold">
                <p>الرقم: {Math.floor(Math.random() * 10000)}</p>
                <p>التاريخ: {date}</p>
                <p>المرفقات: ....................</p>
              </div>
            </div>

            <h1 className="text-xl font-black text-center mb-8 underline underline-offset-8">
              {selectedReportType === 'daily' ? 'تقرير الغياب اليومي' :
               selectedReportType === 'warnings_3' ? 'تقرير إنذارات الغياب (3 أيام فأكثر)' :
               'تقرير إنذارات الغياب (5 أيام فأكثر)'}
            </h1>

            <table className="print-table mb-12">
              <thead>
                <tr>
                  <th className="w-[5%] text-center">م</th>
                  <th className="w-[40%] whitespace-nowrap">اسم الطالب الرباعي</th>
                  <th className="w-[20%] text-center whitespace-nowrap">الصف والفصل</th>
                  <th className="w-[10%] text-center">الغياب</th>
                  <th className="w-[25%]">ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {getReportStudents().map((student, index) => (
                  <tr key={student.id}>
                    <td className="text-center py-1 px-2">{index + 1}</td>
                    <td className="font-bold whitespace-nowrap py-1 px-2">{student.name}</td>
                    <td className="text-center whitespace-nowrap py-1 px-2">{student.grade} - {student.section}</td>
                    <td className="text-center font-bold py-1 px-2">{student.total_absences || 0}</td>
                    <td className="py-1 px-2"></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-16 print-grid grid-cols-2 gap-8 text-center page-break-inside-avoid">
              <div className="space-y-8">
                <p className="print-label">وكيل شؤون الطلاب</p>
                <div className="h-px bg-black w-3/4 mx-auto"></div>
                <p className="text-sm font-bold">الاسم: {user?.name || 'غير محدد'}</p>
              </div>
              <div className="space-y-8">
                <p className="print-label">مدير المدرسة</p>
                <div className="h-px bg-black w-3/4 mx-auto"></div>
                <p className="text-sm font-bold">الاسم: {principalName}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Command Center Header & Filters (Hidden when printing) */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <UserCheck className="text-primary w-8 h-8" />
            رادار التحضير والغياب
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button 
              onClick={() => setIsResetModalOpen(true)}
              className="w-full md:w-auto py-3 px-6 bg-red-100 hover:bg-red-200 text-red-700 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-sm min-h-[44px]"
            >
              🔄 تصفير تحضير هذه الحصة
            </button>
            <button 
              onClick={handlePrint}
              className="w-full md:w-auto py-3 px-6 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg min-h-[44px]"
            >
              <Printer size={18} />
              طباعة التقرير المخصص
            </button>
          </div>
        </div>

        {/* Top Metric Cards (Compact) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Classes */}
          <div className="bg-white rounded-2xl py-3 px-4 shadow-sm border border-slate-100 flex items-center justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest">إجمالي الفصول</span>
            <span className="text-2xl font-black text-slate-800">{totalClassesCount}</span>
          </div>
          
          {/* Completed */}
          <div className="bg-emerald-50 rounded-2xl py-3 px-4 shadow-sm border border-emerald-100 flex items-center justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-200 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-100">
              <motion.div 
                className="h-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span className="text-sm font-black text-emerald-600/70 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 size={16} />
              تم التحضير
            </span>
            <span className="text-2xl font-black text-emerald-600">{completedClasses.length}</span>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-2xl py-3 px-4 shadow-sm border-2 border-dashed border-slate-200 flex items-center justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <span className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Hourglass size={16} />
              بانتظار التحضير
            </span>
            <span className="text-2xl font-black text-slate-500">{pendingClasses.length}</span>
          </div>
        </div>

        {/* Class Cards Grid (High-Density) */}
        <div className="space-y-6">
          {Object.entries(
            [...pendingClasses.map(c => ({ ...c, status: 'pending' })), ...completedClasses.map(c => ({ ...c, status: 'completed' }))]
              .reduce((acc, curr) => {
                if (!acc[curr.grade]) acc[curr.grade] = [];
                acc[curr.grade].push(curr);
                return acc;
              }, {} as Record<string, any[]>)
          ).map(([gradeName, classes]) => (
            <div key={gradeName} className="space-y-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mt-6 mb-3">
                <span className="w-1.5 h-5 bg-primary rounded-full inline-block"></span>
                {gradeName}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {classes
                  .sort((a, b) => a.section.localeCompare(b.section))
                  .map((c, idx) => {
                    const isCompleted = c.status === 'completed';
                    return (
                      <button 
                        key={`${c.grade}-${c.section}-${idx}`}
                        onClick={() => {
                          if (isCompleted) {
                            if (grade === c.grade && section === c.section && hasSearched) {
                              // Toggle off: reset filters and hide table
                              setGrade('all');
                              setSection('all');
                              setStatusFilter('all');
                              setHasSearched(false);
                            } else {
                              // Toggle on: set filters and show table
                              setGrade(c.grade);
                              setSection(c.section);
                              setStatusFilter('غائب');
                              setHasSearched(true);
                            }
                          }
                        }}
                        disabled={!isCompleted}
                        className={`group relative flex justify-between items-center p-2 h-12 rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
                          isCompleted 
                            ? (grade === c.grade && section === c.section && hasSearched)
                              ? 'bg-emerald-500 text-white border border-emerald-600 shadow-md cursor-pointer' // Selected state
                              : 'bg-emerald-50 border border-emerald-200 cursor-pointer' 
                            : 'bg-white border-2 border-dashed border-slate-300 cursor-default'
                        }`}
                      >
                        {/* Tooltip */}
                        {isCompleted && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-gray-800 text-white text-xs rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl text-center">
                            <span>👨‍🏫 المعلم: {c.teacher_name || 'غير محدد'} | 📚 الحصة: {c.period ? ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة'][c.period - 1] || c.period : 'غير محدد'} | 🕒 الوقت: {c.timestamp ? new Date(c.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'غير محدد'}</span>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-800"></div>
                          </div>
                        )}
                        {isCompleted ? (
                          <CheckCircle2 size={18} className={(grade === c.grade && section === c.section && hasSearched) ? "text-white" : "text-emerald-500"} />
                        ) : (
                          <Hourglass size={18} className="text-slate-300" />
                        )}
                        <span className={`text-sm font-bold ${isCompleted ? ((grade === c.grade && section === c.section && hasSearched) ? 'text-white' : 'text-emerald-800') : 'text-slate-500'}`}>
                          {c.section}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
          {totalClassesCount === 0 && (
            <div className="text-center text-slate-400 font-bold py-12 bg-white rounded-3xl border-2 border-slate-200 border-dashed">
              لا توجد فصول مسجلة لهذا اليوم
            </div>
          )}
        </div>

        {/* Smart Filters */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 text-slate-800 font-black shrink-0">
            <Filter size={18} className="text-primary" />
            <h3>الفلاتر:</h3>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 w-full">
            <div className="relative">
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none min-h-[44px]"
              />
            </div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none min-h-[44px]"
            >
              <option value="1">الحصة الأولى</option>
              <option value="2">الحصة الثانية</option>
              <option value="3">الحصة الثالثة</option>
              <option value="4">الحصة الرابعة</option>
              <option value="5">الحصة الخامسة</option>
              <option value="6">الحصة السادسة</option>
              <option value="7">الحصة السابعة</option>
            </select>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none min-h-[44px]"
            >
              <option value="all">جميع الصفوف</option>
              {grades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              disabled={grade === 'all'}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50 min-h-[44px]"
            >
              <option value="all">جميع الفصول</option>
              {sections.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={handleSearchClick}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl py-3 px-4 text-sm font-black flex items-center justify-center gap-2 transition-all min-h-[44px]"
            >
              <Search size={18} />
              عرض السجلات
            </button>
          </div>
        </div>

        {/* Clickable KPIs (Always visible) */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => handleKPIClick('حاضر')}
            className={`group relative rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center text-center transition-all duration-300 border-2 active:scale-95 ${
              statusFilter === 'حاضر' || statusFilter === 'all'
                ? 'bg-emerald-50 border-emerald-200 shadow-sm hover:shadow-md hover:-translate-y-1'
                : 'bg-white border-slate-100 opacity-70 hover:opacity-100 hover:border-emerald-200 hover:shadow-sm'
            }`}
          >
            <div className={`absolute inset-0 rounded-3xl transition-opacity duration-300 ${statusFilter === 'حاضر' ? 'bg-emerald-500/5 opacity-100' : 'opacity-0 group-hover:opacity-100 bg-emerald-500/5'}`} />
            <CheckCircle2 className={`mb-2 w-8 h-8 transition-colors duration-300 relative z-10 ${statusFilter === 'حاضر' || statusFilter === 'all' ? 'text-emerald-500' : 'text-slate-400 group-hover:text-emerald-400'}`} />
            <p className={`text-xs md:text-sm font-bold mb-1 transition-colors duration-300 relative z-10 ${statusFilter === 'حاضر' || statusFilter === 'all' ? 'text-emerald-600' : 'text-slate-500 group-hover:text-emerald-600'}`}>الحاضرين ✅</p>
            <p className={`text-2xl md:text-4xl font-black transition-colors duration-300 relative z-10 ${statusFilter === 'حاضر' || statusFilter === 'all' ? 'text-emerald-700' : 'text-slate-600 group-hover:text-emerald-700'}`}>{totalPresent}</p>
          </button>
          
          <button
            onClick={() => handleKPIClick('غائب')}
            className={`group relative rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center text-center transition-all duration-300 border-2 active:scale-95 ${
              statusFilter === 'غائب' || statusFilter === 'all'
                ? 'bg-rose-50 border-rose-200 shadow-sm hover:shadow-md hover:-translate-y-1'
                : 'bg-white border-slate-100 opacity-70 hover:opacity-100 hover:border-rose-200 hover:shadow-sm'
            }`}
          >
            <div className={`absolute inset-0 rounded-3xl transition-opacity duration-300 ${statusFilter === 'غائب' ? 'bg-rose-500/5 opacity-100' : 'opacity-0 group-hover:opacity-100 bg-rose-500/5'}`} />
            <XCircle className={`mb-2 w-8 h-8 transition-colors duration-300 relative z-10 ${statusFilter === 'غائب' || statusFilter === 'all' ? 'text-rose-500' : 'text-slate-400 group-hover:text-rose-400'}`} />
            <p className={`text-xs md:text-sm font-bold mb-1 transition-colors duration-300 relative z-10 ${statusFilter === 'غائب' || statusFilter === 'all' ? 'text-rose-600' : 'text-slate-500 group-hover:text-rose-600'}`}>الغائبين ❌</p>
            <p className={`text-2xl md:text-4xl font-black transition-colors duration-300 relative z-10 ${statusFilter === 'غائب' || statusFilter === 'all' ? 'text-rose-700' : 'text-slate-600 group-hover:text-rose-700'}`}>{totalAbsent}</p>
          </button>
          
          <button
            onClick={() => handleKPIClick('متأخر')}
            className={`group relative rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center text-center transition-all duration-300 border-2 active:scale-95 ${
              statusFilter === 'متأخر' || statusFilter === 'all'
                ? 'bg-amber-50 border-amber-200 shadow-sm hover:shadow-md hover:-translate-y-1'
                : 'bg-white border-slate-100 opacity-70 hover:opacity-100 hover:border-amber-200 hover:shadow-sm'
            }`}
          >
            <div className={`absolute inset-0 rounded-3xl transition-opacity duration-300 ${statusFilter === 'متأخر' ? 'bg-amber-500/5 opacity-100' : 'opacity-0 group-hover:opacity-100 bg-amber-500/5'}`} />
            <Clock className={`mb-2 w-8 h-8 transition-colors duration-300 relative z-10 ${statusFilter === 'متأخر' || statusFilter === 'all' ? 'text-amber-500' : 'text-slate-400 group-hover:text-amber-400'}`} />
            <p className={`text-xs md:text-sm font-bold mb-1 transition-colors duration-300 relative z-10 ${statusFilter === 'متأخر' || statusFilter === 'all' ? 'text-amber-600' : 'text-slate-500 group-hover:text-amber-600'}`}>المتأخرين ⏱️</p>
            <p className={`text-2xl md:text-4xl font-black transition-colors duration-300 relative z-10 ${statusFilter === 'متأخر' || statusFilter === 'all' ? 'text-amber-700' : 'text-slate-600 group-hover:text-amber-700'}`}>{totalLate}</p>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {!hasSearched ? (
        <div className="text-center p-16 bg-white rounded-3xl border border-slate-100 border-dashed print:hidden flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-primary/40" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">الرادار في وضع الاستعداد</h3>
          <p className="text-slate-500 font-bold">🔍 الرجاء استخدام الفلاتر أو الضغط على بطاقات الإحصائيات لعرض الطلاب</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center p-10 print:hidden">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredStudents.length > 0 ? (
        <>
          {/* Info Banner for Selected Class */}
          {grade !== 'all' && section !== 'all' && completedClasses.find(c => c.grade === grade && c.section === section) && (() => {
            const c = completedClasses.find(c => c.grade === grade && c.section === section);
            if (!c) return null;
            return (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-sm text-slate-600 print:hidden">
                <div className="flex items-center gap-2">
                  <span>������ تم التحضير بواسطة:</span>
                  <span className="font-bold text-slate-800">{c.teacher_name || 'غير محدد'}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    📅 الحصة: <span className="font-bold text-slate-800">{c.period ? ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة'][c.period - 1] || c.period : 'غير محدد'}</span>
                  </div>
                  <div>
                    ⏰ وقت الإدخال: <span className="font-bold text-slate-800">{c.timestamp ? new Date(c.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'غير محدد'}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Bulk Actions */}
          <AnimatePresence>
            <div className="print:hidden mb-6 space-y-4">
              {grade !== 'all' && section !== 'all' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <button
                    onClick={() => setBulkPresentConfig({ grade, section })}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600 rounded-2xl py-4 px-6 text-sm font-black flex items-center justify-center gap-3 transition-all shadow-sm"
                  >
                    <UserCheck size={20} />
                    ✅ تحضير جميع طلاب الفصل (حضور)
                  </button>
                </motion.div>
              )}

              {filteredStudents.some(s => getStudentStatus(s.id) === 'غائب') && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={handleBulkWhatsApp}
                      disabled={isSendingBulk}
                      className={`w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200 rounded-2xl py-4 px-6 text-sm font-black flex items-center justify-center gap-3 transition-all shadow-sm ${isSendingBulk ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <MessageSquare size={20} />
                      {isSendingBulk ? 'جاري الإرسال...' : 'إرسال واتساب لجميع الغائبين المعروضين'}
                    </button>
                    {(() => {
                      const absentStudents = filteredStudents.filter(s => getStudentStatus(s.id) === 'غائب');
                      const areAllExcused = absentStudents.length > 0 && absentStudents.every(s => getStudentExcuseStatus(s.id));
                      return (
                        <button
                          onClick={() => {
                            absentStudents.forEach(student => {
                              handleExcuseChange(student.id, !areAllExcused);
                            });
                          }}
                          className={`w-full border rounded-2xl py-4 px-6 text-sm font-black flex items-center justify-center gap-3 transition-all shadow-sm ${
                            areAllExcused
                              ? 'bg-red-100 hover:bg-red-200 text-red-800 border-red-200'
                              : 'bg-green-100 hover:bg-green-200 text-green-800 border-green-200'
                          }`}
                        >
                          {areAllExcused ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
                          {areAllExcused ? 'تحويل جميع الغائبين إلى (بدون عذر)' : 'تحويل جميع الغائبين إلى (بعذر)'}
                        </button>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </div>
          </AnimatePresence>

          {/* Enhanced Student Cards View (Hidden on Print) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:hidden">
            {filteredStudents.map((student) => {
              const absCount = student.total_absences || 0;
              const isAbsent = getStudentStatus(student.id) === 'غائب';
              
              return (
                <motion.div 
                  key={student.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-white p-5 rounded-3xl border transition-all shadow-sm flex flex-col sm:flex-row gap-4 items-center ${
                    getStudentStatus(student.id) === 'حاضر' ? 'border-emerald-200 bg-emerald-50/10' :
                    getStudentStatus(student.id) === 'غائب' ? 'border-rose-200 bg-rose-50/10' :
                    'border-amber-200 bg-amber-50/10'
                  }`}
                >
                  {/* Right: Info */}
                  <div className="flex-1 w-full text-right">
                    <span className="font-black text-slate-800 text-lg block mb-1">{student.name}</span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg inline-block">
                      {student.grade} - {student.section}
                    </span>
                  </div>

                  {/* Center: Toggles & Badges */}
                  <div className="flex-[2] w-full flex flex-col gap-3">
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleStatusChange(student.id, 'حاضر')}
                        className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${
                          getStudentStatus(student.id) === 'حاضر'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        <CheckCircle2 size={16} />
                        حاضر
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'غائب')}
                        className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${
                          getStudentStatus(student.id) === 'غائب'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        <XCircle size={16} />
                        غائب
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'متأخر')}
                        className={`flex-1 min-h-[44px] rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-all ${
                          getStudentStatus(student.id) === 'متأخر'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        <Clock size={16} />
                        متأخر
                      </button>
                    </div>
                    
                    {/* Smart Badges */}
                    {isAbsent && absCount > 3 && (
                      <button 
                        onClick={() => handleStudentPrint(student, absCount > 5 ? 'warnings_5' : 'warnings_3')}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all hover:opacity-90 ${
                          absCount > 5 
                            ? 'bg-red-100 text-red-700 border border-red-200' 
                            : 'bg-orange-100 text-orange-700 border border-orange-200'
                        }`}
                      >
                        <AlertTriangle size={14} />
                        {absCount > 5 ? '🚨 تعهد واستدعاء: 5 أيام' : '⚠️ إنذار أول: 3 أيام'}
                      </button>
                    )}

                    {/* Excuse Status & Reason */}
                    <AnimatePresence>
                      {isAbsent && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="w-full flex flex-col gap-2 overflow-hidden"
                        >
                          <button
                            onClick={() => handleExcuseChange(student.id, !getStudentExcuseStatus(student.id))}
                            className={`w-full py-2 px-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                              getStudentExcuseStatus(student.id)
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-red-100 text-red-700 border border-red-200'
                            }`}
                          >
                            {getStudentExcuseStatus(student.id) ? '🟢 غياب بعذر' : '🔴 غياب بدون عذر'}
                          </button>
                          
                          <AnimatePresence>
                            {getStudentExcuseStatus(student.id) && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="w-full overflow-hidden"
                              >
                                <input
                                  type="text"
                                  placeholder="اكتب سبب العذر (مثال: تقرير طبي، مراجعة مستشفى)..."
                                  value={getStudentExcuseReason(student.id)}
                                  onChange={(e) => handleExcuseReasonChange(student.id, e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Left: Quick Actions */}
                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
                    {isAbsent && (
                      <button
                        onClick={() => handleSendWhatsApp(student)}
                        disabled={!student.parent_phone || student.parent_phone.trim() === ''}
                        className={`flex-1 sm:flex-none w-full sm:w-auto px-4 h-12 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm font-bold text-sm ${
                          (!student.parent_phone || student.parent_phone.trim() === '') 
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={(!student.parent_phone || student.parent_phone.trim() === '') ? '⚠️ رقم الجوال غير مسجل' : 'إرسال واتساب لولي الأمر'}
                      >
                        <MessageSquare size={18} />
                        إرسال واتساب 💬
                      </button>
                    )}
                    {isAbsent && absCount > 3 && (
                      <button
                        onClick={() => handleStudentPrint(student, 'excused_form')}
                        className="flex-1 sm:flex-none w-full sm:w-auto px-4 h-12 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center justify-center gap-2 transition-all shadow-sm font-bold text-sm"
                        title="طباعة إنذار الغياب"
                      >
                        <Printer size={18} />
                        طباعة
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center p-10 bg-white rounded-3xl border border-slate-100 print:hidden">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">لا توجد بيانات مطابقة للبحث</p>
        </div>
      )}

      {/* Fixed Bottom Action (Hidden on Print) */}
      <AnimatePresence>
        {filteredStudents.length > 0 && hasUnsavedChanges && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-10 print:hidden"
          >
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full max-w-md mx-auto min-h-[56px] rounded-2xl font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg ${
                success 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                  : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
              }`}
            >
              {submitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : success ? (
                <>
                  <CheckCircle2 size={20} />
                  <span>تم حفظ تعديلات الحصة {selectedPeriod} بنجاح</span>
                </>
              ) : (
                <>
                  <Save size={20} />
                  <span>حفظ التعديلات في النظام</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Present Confirmation Modal */}
      <AnimatePresence>
        {bulkPresentConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 bg-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <UserCheck size={24} />
                  </div>
                  <h2 className="text-xl font-black text-emerald-900">تأكيد التحضير الجماعي</h2>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-slate-700 font-medium leading-relaxed">
                  هل أنت متأكد من تحضير جميع طلاب فصل <span className="font-black text-slate-900">{bulkPresentConfig.grade} - {bulkPresentConfig.section}</span> كحضور؟
                </p>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setBulkPresentConfig(null)}
                  className="flex-1 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleBulkPresent}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <UserCheck size={18} />
                  تأكيد التحضير
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {isResetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 bg-red-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <AlertTriangle size={24} />
                  </div>
                  <h2 className="text-xl font-black text-red-900">تحذير خطير</h2>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-slate-700 font-medium leading-relaxed">
                  هل أنت متأكد من رغبتك في تصفير (حذف) جميع سجلات التحضير للحصة <span className="font-black text-slate-900">{selectedPeriod}</span> لتاريخ <span className="font-black text-slate-900">{date}</span>؟
                </p>
                <p className="text-red-600 text-sm font-bold mt-4">
                  هذا الإجراء لا يمكن التراجع عنه!
                </p>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleResetAttendance}
                  disabled={resetting}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {resetting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={18} />
                      تأكيد التصفير
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Alert Modal */}
      <AnimatePresence>
        {alertMessage && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mx-auto mb-4">
                  <Info size={32} />
                </div>
                <p className="text-slate-800 font-bold text-lg leading-relaxed">
                  {alertMessage}
                </p>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => setAlertMessage(null)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
                >
                  حسناً
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Selection Modal */}
      <AnimatePresence>
        {isPrintModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Printer className="text-primary" />
                  محرك التقارير الاحترافي
                </h3>
                <button onClick={() => setIsPrintModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                  <XCircle size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-slate-700">اختر نوع التقرير:</label>
                  
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedReportType === 'daily' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/30'}`}>
                    <input type="radio" name="reportType" value="daily" checked={selectedReportType === 'daily'} onChange={() => setSelectedReportType('daily')} className="w-5 h-5 text-primary focus:ring-primary" />
                    <span className="font-bold text-slate-700">تقرير الغياب اليومي (حسب الفلاتر)</span>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedReportType === 'warnings_3' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-amber-500/30'}`}>
                    <input type="radio" name="reportType" value="warnings_3" checked={selectedReportType === 'warnings_3'} onChange={() => setSelectedReportType('warnings_3')} className="w-5 h-5 text-amber-500 focus:ring-amber-500" />
                    <span className="font-bold text-slate-700">تقرير إنذارات الغياب (3 أيام فأكثر)</span>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedReportType === 'warnings_5' ? 'border-rose-500 bg-rose-50' : 'border-slate-200 hover:border-rose-500/30'}`}>
                    <input type="radio" name="reportType" value="warnings_5" checked={selectedReportType === 'warnings_5'} onChange={() => setSelectedReportType('warnings_5')} className="w-5 h-5 text-rose-500 focus:ring-rose-500" />
                    <span className="font-bold text-slate-700">تقرير إنذارات الغياب (5 أيام فأكثر)</span>
                  </label>
                  
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedReportType === 'excused_form' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-500/30'}`}>
                    <input type="radio" name="reportType" value="excused_form" checked={selectedReportType === 'excused_form'} onChange={() => setSelectedReportType('excused_form')} className="w-5 h-5 text-indigo-500 focus:ring-indigo-500" />
                    <span className="font-bold text-slate-700">نموذج إجراءات الغياب بعذر (طالب محدد)</span>
                  </label>
                </div>

                {selectedReportType === 'excused_form' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-bold text-slate-700">اختر الطالب:</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={selectedStudentForReport?.id || ''}
                      onChange={(e) => {
                        const st = students.find(s => s.id === Number(e.target.value));
                        setSelectedStudentForReport(st || null);
                      }}
                    >
                      <option value="">-- اختر طالباً --</option>
                      {students.filter(s => (s.total_absences || 0) > 0).map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.grade} - {s.section})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col gap-3">
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsPrintModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                  >
                    إلغاء
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedReportType === 'excused_form' && !selectedStudentForReport) {
                        setAlertMessage('الرجاء اختيار الطالب أولاً');
                        return;
                      }
                      
                      try {
                        // Check if running in an iframe (preview mode)
                        if (window.self !== window.top) {
                          setAlertMessage('عذراً، الطباعة غير مدعومة داخل وضع المعاينة. يرجى فتح التطبيق في نافذة جديدة (Open in new tab) من أعلى يمين الشاشة للتمكن من الطباعة.');
                          return;
                        }
                      } catch (e) {
                        // Cross-origin error means we are definitely in an iframe
                        setAlertMessage('عذراً، الطباعة غير مدعومة داخل وضع المعاينة. يرجى فتح التطبيق في نافذة جديدة (Open in new tab) من أعلى يمين الشاشة للتمكن من الطباعة.');
                        return;
                      }
                      
                      window.print();
                    }}
                    className="flex-1 py-3 px-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Printer size={18} />
                    طباعة التقرير
                  </button>
                </div>
                <p className="text-xs text-slate-500 text-center mt-2">
                  ملاحظة: إذا لم تظهر نافذة الطباعة، يرجى فتح التطبيق في علامة تبويب جديدة.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VPRadar;
