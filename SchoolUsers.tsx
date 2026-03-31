import { apiFetch } from '../utils/api';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Referral } from '../types';
import { Printer, ArrowRight } from 'lucide-react';
import { useSchoolSettings } from '../context/SchoolContext';

const PrintTemplate: React.FC = () => {
  const { templateId, referralId } = useParams();
  const navigate = useNavigate();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);
  const { settings } = useSchoolSettings();

  useEffect(() => {
    const fetchReferral = async () => {
      try {
        const res = await apiFetch(`/api/referrals/${referralId}`);
        if (res.ok) {
          const data = await res.json();
          setReferral(data.referral);
        }
      } catch (err) {
        console.error('Failed to fetch referral', err);
      } finally {
        setLoading(false);
      }
    };
    if (referralId) {
      fetchReferral();
    }
  }, [referralId]);

  if (loading) {
    return <div className="p-10 text-center font-bold">جاري التحميل...</div>;
  }

  if (!referral) {
    return <div className="p-10 text-center font-bold text-red-600">لم يتم العثور على الحالة</div>;
  }

  const getTemplateTitle = (id: string) => {
    switch (id) {
      case '1': return 'تعهد سلوكي';
      case '2': return 'إشعار ولي أمر بمشكلة سلوكية';
      case '4': return 'تعهد الحضور والانضباط';
      case '5': return 'خطاب دعوة ولي أمر';
      case '9': return 'نموذج تعويض درجات السلوك';
      case '10': return 'نموذج إحالة طالب للموجه الطلابي';
      case '11': return 'طلب انعقاد لجنة التوجيه الطلابي';
      case '12': return 'خطة تعديل سلوك';
      case '16': return 'إجراءات الغياب والتأخر';
      default: return 'نموذج إداري';
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen py-8">
      {/* Action Buttons (Hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors font-bold shadow-sm"
        >
          <ArrowRight size={18} />
          <span>رجوع</span>
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-xl hover:bg-primary/90 transition-colors font-bold shadow-lg shadow-primary/20"
        >
          <Printer size={18} />
          <span>طباعة النموذج</span>
        </button>
      </div>

      {/* Printable Area */}
      <div className="bg-white p-10 max-w-4xl mx-auto text-right shadow-sm print:shadow-none print:p-0 print-report font-sans" dir="rtl">
        {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-8">
        <div className="text-right space-y-1">
          <p className="text-sm font-black">المملكة العربية السعودية</p>
          <p className="text-sm font-black">وزارة التعليم</p>
          <p className="text-sm font-black">{settings.schoolName ? `مدرسة ${settings.schoolName}` : 'مدرسة ....................'}</p>
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

      {/* Title */}
      <h1 className="text-xl font-black text-center mb-8 underline underline-offset-8">
        {getTemplateTitle(templateId || '')}
      </h1>

      {/* Content */}
      <div className="space-y-6">
        {/* Student Info */}
        <div className="print-section">
          <div className="print-section-header">بيانات الطالب الأساسية</div>
          <div className="print-grid">
            <div className="print-cell"><span className="print-label">اسم الطالب:</span> {referral.student_name}</div>
            <div className="print-cell"><span className="print-label">رقم الهوية:</span> {referral.student_national_id || 'غير مسجل'}</div>
            <div className="print-cell"><span className="print-label">الصف الدراسي:</span> {referral.student_grade}</div>
            <div className="print-cell"><span className="print-label">الفصل:</span> {referral.student_section}</div>
          </div>
        </div>

        {/* Dynamic Content based on template */}
        <div className="print-section">
          <div className="print-section-header">تفاصيل النموذج</div>
          <div className="print-full-cell space-y-4">
            {templateId === '1' && (
              <>
                <p>أقر أنا الطالب المذكور أعلاه، وبناءً على ما بدر مني من مخالفة سلوكية تتمثل في:</p>
                <p className="font-bold">{referral.reason}</p>
                <p>بأنني ألتزم التزاماً تاماً بأنظمة وقوانين المدرسة، وأتعهد بعدم تكرار هذه المخالفة أو أي مخالفة أخرى مستقبلاً. وفي حال تكرار ذلك، يحق لإدارة المدرسة اتخاذ الإجراءات النظامية بحقي وفق قواعد السلوك والمواظبة.</p>
              </>
            )}

            {templateId === '2' && (
              <>
                <p>المكرم ولي أمر الطالب / <span className="font-bold">{referral.student_name}</span> المحترم</p>
                <p>السلام عليكم ورحمة الله وبركاته، وبعد:</p>
                <p>نود إشعاركم بأنه لوحظ على ابنكم المخالفة السلوكية التالية:</p>
                <p className="font-bold">{referral.reason}</p>
                <p>نأمل منكم التعاون مع إدارة المدرسة في توجيه ابنكم ومتابعة سلوكه، شاكرين لكم حسن تعاونكم.</p>
              </>
            )}

            {templateId === '5' && (
              <>
                <p>المكرم ولي أمر الطالب / <span className="font-bold">{referral.student_name}</span> المحترم</p>
                <p>السلام عليكم ورحمة الله وبركاته، وبعد:</p>
                <p>نظراً لأهمية الشراكة بين المدرسة والأسرة في تقويم سلوك الطلاب، نأمل منكم الحضور للمدرسة يوم (....................) الموافق (....................) لمناقشة بعض الأمور التربوية المتعلقة بابنكم.</p>
                <p>شاكرين ومقدرين تعاونكم المستمر.</p>
              </>
            )}

            {templateId === '12' && (
              <>
                <p className="font-bold">وصف المشكلة السلوكية:</p>
                <p>{referral.reason}</p>
                <p className="font-bold mt-4">الأهداف العلاجية:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>تعديل السلوك السلبي إلى سلوك إيجابي.</li>
                  <li>تعزيز الوعي الذاتي لدى الطالب بأهمية الانضباط.</li>
                  <li>إشراك الأسرة في عملية التعديل.</li>
                </ul>
                <p className="font-bold mt-4">الإجراءات والأساليب:</p>
                <p className="min-h-[60px]"></p>
              </>
            )}

            {/* Default fallback for other templates */}
            {!['1', '2', '5', '12'].includes(templateId || '') && (
              <>
                <p className="font-bold">تفاصيل الحالة:</p>
                <p>{referral.reason}</p>
                <p className="font-bold mt-4">الإجراء المتخذ:</p>
                <p className="min-h-[60px]"></p>
              </>
            )}
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-16 print-grid grid-cols-3 gap-8 text-center page-break-inside-avoid">
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
          <div className="space-y-8">
            <p className="print-label">الختم والاعتماد</p>
            <div className="h-px bg-black w-3/4 mx-auto"></div>
            <p className="text-sm font-bold">التوقيع: .................</p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default PrintTemplate;
