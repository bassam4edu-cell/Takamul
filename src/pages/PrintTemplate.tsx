import { apiFetch } from '../utils/api';
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Referral } from '../types';
import { Printer, ArrowRight } from 'lucide-react';

const PrintTemplate: React.FC = () => {
  const { templateId, referralId } = useParams();
  const navigate = useNavigate();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="bg-white p-10 max-w-4xl mx-auto text-right shadow-sm print:shadow-none print:p-0" dir="rtl">
        {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
        <div className="text-center space-y-1">
          <p className="font-bold">المملكة العربية السعودية</p>
          <p className="font-bold">وزارة التعليم</p>
          <p className="font-bold">إدارة التعليم بـ ....................</p>
          <p className="font-bold">مدرسة ....................</p>
        </div>
        <div className="text-center">
          <img src="https://upload.wikimedia.org/wikipedia/ar/thumb/a/a3/Ministry_of_Education_%28Saudi_Arabia%29_Logo.svg/1200px-Ministry_of_Education_%28Saudi_Arabia%29_Logo.svg.png" alt="شعار الوزارة" className="w-24 h-auto mx-auto grayscale opacity-80" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-bold">الرقم: ....................</p>
          <p className="font-bold">التاريخ: {new Date().toLocaleDateString('ar-SA')}</p>
          <p className="font-bold">المرفقات: ....................</p>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-extrabold text-center mb-10 underline underline-offset-8">
        {getTemplateTitle(templateId || '')}
      </h1>

      {/* Content */}
      <div className="space-y-8 text-lg leading-loose">
        {/* Student Info */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
          <p><span className="font-bold">اسم الطالب:</span> {referral.student_name}</p>
          <p><span className="font-bold">رقم الهوية:</span> {referral.student_national_id || '....................'}</p>
          <p><span className="font-bold">الصف:</span> {referral.student_grade}</p>
          <p><span className="font-bold">الفصل:</span> {referral.student_section}</p>
        </div>

        {/* Dynamic Content based on template */}
        {templateId === '1' && (
          <div className="space-y-6">
            <p>أقر أنا الطالب المذكور أعلاه، وبناءً على ما بدر مني من مخالفة سلوكية تتمثل في:</p>
            <p className="font-bold bg-slate-100 p-4 rounded-lg">{referral.reason}</p>
            <p>بأنني ألتزم التزاماً تاماً بأنظمة وقوانين المدرسة، وأتعهد بعدم تكرار هذه المخالفة أو أي مخالفة أخرى مستقبلاً. وفي حال تكرار ذلك، يحق لإدارة المدرسة اتخاذ الإجراءات النظامية بحقي وفق قواعد السلوك والمواظبة.</p>
          </div>
        )}

        {templateId === '2' && (
          <div className="space-y-6">
            <p>المكرم ولي أمر الطالب / <span className="font-bold">{referral.student_name}</span> المحترم</p>
            <p>السلام عليكم ورحمة الله وبركاته، وبعد:</p>
            <p>نود إشعاركم بأنه لوحظ على ابنكم المخالفة السلوكية التالية:</p>
            <p className="font-bold bg-slate-100 p-4 rounded-lg">{referral.reason}</p>
            <p>نأمل منكم التعاون مع إدارة المدرسة في توجيه ابنكم ومتابعة سلوكه، شاكرين لكم حسن تعاونكم.</p>
          </div>
        )}

        {templateId === '5' && (
          <div className="space-y-6">
            <p>المكرم ولي أمر الطالب / <span className="font-bold">{referral.student_name}</span> المحترم</p>
            <p>السلام عليكم ورحمة الله وبركاته، وبعد:</p>
            <p>نظراً لأهمية الشراكة بين المدرسة والأسرة في تقويم سلوك الطلاب، نأمل منكم الحضور للمدرسة يوم (....................) الموافق (....................) لمناقشة بعض الأمور التربوية المتعلقة بابنكم.</p>
            <p>شاكرين ومقدرين تعاونكم المستمر.</p>
          </div>
        )}

        {templateId === '12' && (
          <div className="space-y-6">
            <p className="font-bold">وصف المشكلة السلوكية:</p>
            <p className="bg-slate-100 p-4 rounded-lg">{referral.reason}</p>
            <p className="font-bold">الأهداف العلاجية:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>تعديل السلوك السلبي إلى سلوك إيجابي.</li>
              <li>تعزيز الوعي الذاتي لدى الطالب بأهمية الانضباط.</li>
              <li>إشراك الأسرة في عملية التعديل.</li>
            </ul>
            <p className="font-bold">الإجراءات والأساليب:</p>
            <p className="bg-slate-100 p-4 rounded-lg min-h-[100px]"></p>
          </div>
        )}

        {/* Default fallback for other templates */}
        {!['1', '2', '5', '12'].includes(templateId || '') && (
          <div className="space-y-6">
            <p className="font-bold">تفاصيل الحالة:</p>
            <p className="bg-slate-100 p-4 rounded-lg">{referral.reason}</p>
            <p className="font-bold">الإجراء المتخذ:</p>
            <p className="bg-slate-100 p-4 rounded-lg min-h-[100px]"></p>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 mt-20 text-center pt-10">
          <div>
            <p className="font-bold mb-8">توقيع الطالب</p>
            <p>........................</p>
          </div>
          <div>
            <p className="font-bold mb-8">توقيع ولي الأمر</p>
            <p>........................</p>
          </div>
          <div>
            <p className="font-bold mb-8">الختم والاعتماد</p>
            <p>........................</p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default PrintTemplate;
