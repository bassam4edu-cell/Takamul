<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>مكتبة النماذج الرسمية - بوابة تكامل</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');

        /* 1. Typography & Layout */
        @page {
            size: A4;
            margin: 15mm;
        }

        :root {
            --primary-color: #1f2937;
            --border-color: #d1d5db;
            --bg-light: #f3f4f6;
            --text-main: #111827;
            --text-muted: #4b5563;
        }

        body {
            font-family: 'Tajawal', 'Arial', sans-serif;
            direction: rtl;
            background-color: #e5e7eb;
            margin: 0;
            padding: 0;
            color: var(--text-main);
            font-size: 12pt;
            line-height: 1.6;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* Page Container for Web View */
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            margin: 10mm auto;
            background: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            box-sizing: border-box;
            position: relative;
            page-break-after: always;
        }

        /* 2. Elegant Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid var(--primary-color);
            padding-bottom: 15px;
            margin-bottom: 25px;
        }

        .header-right {
            text-align: right;
            line-height: 1.4;
            font-size: 12pt;
            font-weight: 700;
            color: var(--primary-color);
        }

        .header-left {
            text-align: left;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 10px;
        }

        .header-logo {
            width: 80px;
            height: auto;
            object-fit: contain;
        }

        .header-date {
            font-size: 11pt;
            color: var(--text-muted);
        }

        /* Titles */
        h1, h2, .form-title {
            text-align: center;
            font-size: 18pt;
            font-weight: 800;
            color: var(--primary-color);
            margin-top: 10px;
            margin-bottom: 30px;
        }

        h3 {
            font-size: 14pt;
            font-weight: 700;
            margin-top: 25px;
            margin-bottom: 15px;
            color: var(--primary-color);
        }

        /* Content */
        .content {
            font-size: 12pt;
            line-height: 1.8;
            text-align: justify;
        }

        .content p {
            margin-bottom: 15px;
        }

        /* 4. Dynamic Variables Display */
        .field {
            font-weight: 700;
            border-bottom: 1px dashed #9ca3af;
            display: inline-block;
            min-width: 150px;
            text-align: center;
            color: var(--primary-color);
            padding: 0 5px;
        }

        /* 3. Clean Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            margin-bottom: 20px;
            page-break-inside: avoid;
        }

        th, td {
            border: 1px solid var(--border-color);
            padding: 10px;
            text-align: center;
            font-size: 11pt;
        }

        th {
            background-color: var(--bg-light);
            font-weight: 700;
            color: var(--primary-color);
        }

        tr {
            page-break-inside: avoid;
        }

        /* 5. Signature Footer */
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            page-break-inside: avoid;
        }

        .signature-box {
            text-align: center;
            width: 30%;
        }

        .signature-box p:first-child {
            font-weight: 700;
            margin-bottom: 30px;
            color: var(--primary-color);
        }

        .signature-box p:last-child {
            color: var(--text-muted);
        }

        /* Fixed Footer */
        .footer {
            position: absolute;
            bottom: 15mm;
            left: 15mm;
            right: 15mm;
            border-top: 1px solid var(--border-color);
            padding-top: 15px;
            display: flex;
            justify-content: space-between;
            font-size: 11pt;
            font-weight: 700;
            color: var(--text-muted);
            page-break-inside: avoid;
        }

        /* Checkboxes */
        .checkbox-item {
            display: inline-flex;
            align-items: center;
            margin-left: 20px;
            font-weight: 500;
        }

        .checkbox-box {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 1px solid var(--primary-color);
            text-align: center;
            line-height: 16px;
            font-size: 12px;
            margin-left: 8px;
            border-radius: 3px;
        }

        hr {
            border: 0;
            border-top: 1px dashed var(--border-color);
            margin: 25px 0;
        }

        /* 6. Strict Print Settings */
        @media print {
            body {
                background-color: white;
                margin: 0;
                padding: 0;
            }
            
            .page {
                margin: 0;
                padding: 0;
                box-shadow: none;
                width: 100%;
                min-height: 100%;
                page-break-after: always;
            }
            
            /* Hide unnecessary web elements */
            .no-print,
            nav,
            button,
            ::-webkit-scrollbar {
                display: none !important;
            }
            
            /* Ensure backgrounds print */
            th {
                background-color: #f3f4f6 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>

    <!-- ==========================================
         الترويسة والتذييل الثابتة (يتم تضمينها في كل صفحة)
         ========================================== -->
    <!-- 
    <div class="header">
        <div class="header-right">
            المملكة العربية السعودية<br>
            وزارة التعليم<br>
            الإدارة العامة للتعليم بمنطقة الرياض<br>
            محافظة الخرج<br>
            المدرسة: ثانوية أم القرى
        </div>
        <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
    </div>
    
    <div class="footer">
        <div>مدير المدرسة: {{ $principal_name }}</div>
        <div>التوقيع: ....................</div>
        <div>التاريخ: {{ $current_date }}</div>
    </div>
    -->

    <!-- 1. نموذج تعهد سلوكي -->
    <div class="page">
        <div class="header">
            <div class="header-right">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                الإدارة العامة للتعليم بمنطقة الرياض<br>
                محافظة الخرج<br>
                المدرسة: ثانوية أم القرى
            </div>
            <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
        </div>

        <h2>نموذج تعهد سلوكي</h2>
        
        <div class="content">
            <p>أنا الطالب: <span class="field">{{ $student->name }}</span> بالصف: <span class="field">{{ $student->grade }}</span></p>
            <p>أتعهد بأنني قمت في يوم: <span class="field">{{ $incident->day_name }}</span> الموافق: <span class="field">{{ $incident->date }}</span></p>
            <p>بمشكلة سلوكية من الدرجة: <span class="field">{{ $incident->degree }}</span> وهي: <span class="field">{{ $incident->violation_name }}</span></p>
            <p>وأتعهد بعدم تكرار ذلك مستقبلاً، وفي حال تكرار المخالفة يحق لإدارة المدرسة اتخاذ الإجراءات النظامية بحقي وفق قواعد السلوك والمواظبة.</p>
        </div>

        <div class="signatures">
            <div class="signature-box">
                <p>توقيع الطالب</p>
                <p>....................</p>
            </div>
            <div class="signature-box">
                <p>توقيع ولي الأمر</p>
                <p>....................</p>
            </div>
            <div class="signature-box">
                <p>المدير / الوكيل</p>
                <p>....................</p>
            </div>
        </div>

        <div class="footer">
            <div>مدير المدرسة: {{ $principal_name }}</div>
            <div>التوقيع: ....................</div>
            <div>التاريخ: {{ $current_date }}</div>
        </div>
    </div>

    <!-- 2. إشعار ولي أمر الطالب بمشكلة سلوكية -->
    <div class="page">
        <div class="header">
            <div class="header-right">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                الإدارة العامة للتعليم بمنطقة الرياض<br>
                محافظة الخرج<br>
                المدرسة: ثانوية أم القرى
            </div>
            <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
        </div>

        <h2>إشعار ولي أمر الطالب بمشكلة سلوكية</h2>
        
        <div class="content">
            <p>المكرم ولي أمر الطالب: <span class="field">{{ $student->name }}</span> بالصف: <span class="field">{{ $student->grade }}</span></p>
            <p>نفيدكم بأن ابنكم قام بمشكلة سلوكية من الدرجة: <span class="field">{{ $incident->degree }}</span> وهي: <span class="field">{{ $incident->violation_name }}</span></p>
            <p>وقد قررت لجنة التوجيه الطلابي الإجراءات التالية حياله:</p>
            
            <ul>
                @foreach($incident->procedures as $index => $procedure)
                <li>{{ $index + 1 }}. {{ $procedure->name }}</li>
                @endforeach
            </ul>
            
            <p>نأمل منكم التعاون مع المدرسة في توجيه ابنكم لما فيه مصلحته ومستقبله.</p>
        </div>

        <div class="signatures">
            <div class="signature-box">
                <p>توقيع ولي الأمر بالعلم</p>
                <p>....................</p>
            </div>
            <div class="signature-box">
                <p>الموجه الطلابي</p>
                <p>....................</p>
            </div>
        </div>

        <div class="footer">
            <div>مدير المدرسة: {{ $principal_name }}</div>
            <div>التوقيع: ....................</div>
            <div>التاريخ: {{ $current_date }}</div>
        </div>
    </div>

    <!-- 3. نموذج الالتزام المدرسي -->
    <div class="page">
        <div class="header">
            <div class="header-right">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                الإدارة العامة للتعليم بمنطقة الرياض<br>
                محافظة الخرج<br>
                المدرسة: ثانوية أم القرى
            </div>
            <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
        </div>

        <h2>نموذج الالتزام المدرسي</h2>
        
        <div class="content">
            <p>الاسم: <span class="field">{{ $student->name }}</span> المرحلة: <span class="field">{{ $student->stage }}</span> الصف: <span class="field">{{ $student->grade }}</span></p>
            
            <h3>بيانات التواصل لولي الأمر:</h3>
            <p>العمل: <span class="field">{{ $parent->work_phone }}</span></p>
            <p>هاتف المنزل: <span class="field">{{ $parent->home_phone }}</span></p>
            <p>الجوال: <span class="field">{{ $parent->mobile }}</span></p>
            <p>رقم آخر: <span class="field">{{ $parent->other_phone }}</span></p>
            
            <p>أتعهد أنا ولي أمر الطالب المذكور أعلاه بالالتزام بأنظمة المدرسة وقواعد السلوك والمواظبة، ومتابعة ابني دراسياً وسلوكياً، والتواصل المستمر مع المدرسة.</p>
        </div>

        <div class="signatures">
            <div class="signature-box">
                <p>توقيع ولي الأمر</p>
                <p>....................</p>
            </div>
        </div>

        <div class="footer">
            <div>مدير المدرسة: {{ $principal_name }}</div>
            <div>التوقيع: ....................</div>
            <div>التاريخ: {{ $current_date }}</div>
        </div>
    </div>

    <!-- 4. تعهد الالتزام بالحضور -->
    <div class="page">
        <div class="header">
            <div class="header-right">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                الإدارة العامة للتعليم بمنطقة الرياض<br>
                محافظة الخرج<br>
                المدرسة: ثانوية أم القرى
            </div>
            <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
        </div>

        <h2>تعهد الالتزام بالحضور</h2>
        
        <div class="content">
            <p>أنا الطالب: <span class="field">{{ $student->name }}</span> بالصف: <span class="field">{{ $student->grade }}</span></p>
            <p>أقر بأنني تغيبت بدون عذر لمدة <span class="field">{{ $absence->days_count }}</span> أيام، بتاريخ <span class="field">{{ $absence->date }}</span>.</p>
            <p>وأتعهد بالانتظام في الحضور وعدم الغياب مستقبلاً إلا بعذر رسمي مقبول، وأتحمل كافة الإجراءات النظامية المترتبة على غيابي وفق قواعد المواظبة.</p>
        </div>

        <div class="signatures">
            <div class="signature-box">
                <p>توقيع الطالب</p>
                <p>....................</p>
            </div>
            <div class="signature-box">
                <p>توقيع ولي الأمر</p>
                <p>....................</p>
            </div>
        </div>

        <div class="footer">
            <div>مدير المدرسة: {{ $principal_name }}</div>
            <div>التوقيع: ....................</div>
            <div>التاريخ: {{ $current_date }}</div>
        </div>
    </div>

    <!-- 5. خطاب دعوة ولي الأمر -->
    <div class="page">
        <div class="header">
            <div class="header-right">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                الإدارة العامة للتعليم بمنطقة الرياض<br>
                محافظة الخرج<br>
                المدرسة: ثانوية أم القرى
            </div>
            <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
        </div>

        <h2>خطاب دعوة ولي الأمر</h2>
        
        <div class="content">
            <p>المكرم ولي أمر الطالب: <span class="field">{{ $student->name }}</span> بالصف: <span class="field">{{ $student->grade }}</span></p>
            <p>السلام عليكم ورحمة الله وبركاته، وبعد:</p>
            <p>نأمل الحضور في يوم: <span class="field">{{ $invitation->day }}</span> الموافق: <span class="field">{{ $invitation->date }}</span></p>
            <p>لمقابلة مدير المدرسة بهدف: <span class="field">{{ $invitation->purpose }}</span>.</p>
            <p>شاكرين ومقدرين لكم حسن تعاونكم واهتمامكم.</p>
        </div>

        <div class="footer">
            <div>مدير المدرسة: {{ $principal_name }}</div>
            <div>التوقيع: ....................</div>
            <div>التاريخ: {{ $current_date }}</div>
        </div>
    </div>

    <!-- 6. نموذج رصد المعلم لمشكلة سلوكية -->
    <div class="page">
        <div class="header">
            <div class="header-right">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                الإدارة العامة للتعليم بمنطقة الرياض<br>
                محافظة الخرج<br>
                المدرسة: ثانوية أم القرى
            </div>
            <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
        </div>

        <h2>نموذج رصد المعلم لمشكلة سلوكية</h2>
        
        <div class="content">
            <p>المادة: <span class="field">{{ $teacher->subject }}</span> الصف: <span class="field">{{ $teacher->grade_assigned }}</span></p>
            
            <table>
                <thead>
                    <tr>
                        <th>م</th>
                        <th>اسم الطالب</th>
                        <th>المشكلة</th>
                        <th>الدرجة</th>
                        <th>الإجراء المتخذ</th>
                        <th>مرات التكرار</th>
                        <th>مدى الاستجابة</th>
                        <th>التاريخ</th>
                        <th>الحصة</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($observations as $index => $obs)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ $obs->student->name }}</td>
                        <td>{{ $obs->violation_name }}</td>
                        <td>{{ $obs->degree }}</td>
                        <td>{{ $obs->action_taken }}</td>
                        <td>{{ $obs->repetition_count }}</td>
                        <td>{{ $obs->response_level }}</td>
                        <td>{{ $obs->date }}</td>
                        <td>{{ $obs->period }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="footer">
            <div>مدير المدرسة: {{ $principal_name }}</div>
            <div>التوقيع: ....................</div>
            <div>التاريخ: {{ $current_date }}</div>
        </div>
    </div>

    <!-- 7. نموذج رصد مشكلة سلوكية (سجل الوكيل) -->
    <div class="page">
        <div class="header">
            <div class="header-right">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                الإدارة العامة للتعليم بمنطقة الرياض<br>
                محافظة الخرج<br>
                المدرسة: ثانوية أم القرى
            </div>
            <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
        </div>

        <h2>نموذج رصد مشكلة سلوكية (سجل الوكيل)</h2>
        
        <div class="content">
            <p>اسم الطالب: <span class="field">{{ $student->name }}</span> الصف: <span class="field">{{ $student->grade }}</span> الفصل: <span class="field">{{ $student->class_name }}</span></p>
            
            <table>
                <thead>
                    <tr>
                        <th>م</th>
                        <th>المشكلة</th>
                        <th>نوعها ودرجتها</th>
                        <th>تاريخها</th>
                        <th>الدرجات المحسومة</th>
                        <th>الإجراءات</th>
                        <th>تاريخ الإجراء</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($records as $index => $rec)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ $rec->violation_name }}</td>
                        <td>{{ $rec->type }} - {{ $rec->degree }}</td>
                        <td>{{ $rec->date }}</td>
                        <td>{{ $rec->deducted_points }}</td>
                        <td>{{ $rec->procedures_list }}</td>
                        <td>{{ $rec->procedure_date }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="footer">
            <div>مدير المدرسة: {{ $principal_name }}</div>
            <div>التوقيع: ....................</div>
            <div>التاريخ: {{ $current_date }}</div>
        </div>
    </div>

    <!-- 8. نموذج رصد درجات السلوك المتميز -->
    <div class="page">
        <div class="header">
            <div class="header-right">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                الإدارة العامة للتعليم بمنطقة الرياض<br>
                محافظة الخرج<br>
                المدرسة: ثانوية أم القرى
            </div>
            <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
        </div>

        <h2>نموذج رصد درجات السلوك المتميز</h2>
        
        <div class="content">
            <table>
                <thead>
                    <tr>
                        <th>م</th>
                        <th>موضوع الممارسة</th>
                        <th>نوعها</th>
                        <th>تاريخ التنفيذ</th>
                        <th>الشواهد</th>
                        <th>الدرجة المكتسبة</th>
                        <th>اسم الراصد</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($positive_records as $index => $rec)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ $rec->subject }}</td>
                        <td>{{ $rec->type }}</td>
                        <td>{{ $rec->date }}</td>
                        <td>{{ $rec->evidence }}</td>
                        <td>{{ $rec->earned_points }}</td>
                        <td>{{ $rec->observer_name }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="footer">
            <div>مدير المدرسة: {{ $principal_name }}</div>
            <div>التوقيع: ....................</div>
            <div>التاريخ: {{ $current_date }}</div>
        </div>
    </div>

    <!-- 9. نموذج فرص تعويض درجات السلوك الإيجابي -->
    <div class="page">
        <div class="header">
            <div class="header-right">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                الإدارة العامة للتعليم بمنطقة الرياض<br>
                محافظة الخرج<br>
                المدرسة: ثانوية أم القرى
            </div>
            <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
        </div>

        <h2>نموذج فرص تعويض درجات السلوك الإيجابي</h2>
        
        <div class="content">
            <table>
                <thead>
                    <tr>
                        <th>م</th>
                        <th>المشكلة</th>
                        <th>نوعها ودرجتها</th>
                        <th>درجات محسومة</th>
                        <th>الدرجات المكتسبة بالتعويض</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($compensations as $index => $comp)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ $comp->violation_name }}</td>
                        <td>{{ $comp->degree }}</td>
                        <td>{{ $comp->deducted }}</td>
                        <td>{{ $comp->earned }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="footer">
            <div>مدير المدرسة: {{ $principal_name }}</div>
            <div>التوقيع: ....................</div>
            <div>التاريخ: {{ $current_date }}</div>
        </div>
    </div>

    <!-- 10. إحالة طالب (للموجه) -->
    <div class="page">
        <div class="header">
            <div class="header-right">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                الإدارة العامة للتعليم بمنطقة الرياض<br>
                محافظة الخرج<br>
                المدرسة: ثانوية أم القرى
            </div>
            <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
        </div>

        <h2>إحالة طالب (للموجه الطلابي)</h2>
        
        <div class="content">
            <p>المكرم الموجه الطلابي،،،</p>
            <p>نحيل إليكم الطالب: <span class="field">{{ $student->name }}</span> بالصف: <span class="field">{{ $student->grade }}</span></p>
            <p>ذي المشكلة من الدرجة: <span class="field">{{ $incident->degree }}</span> وهي: <span class="field">{{ $incident->violation_name }}</span>.</p>
            <p>نأمل منكم دراسة الحالة واتخاذ الإجراءات التربوية والإرشادية المناسبة.</p>
            
            <div class="signatures">
                <div class="signature-box">
                    <p>الوكيل المحيل</p>
                    <p>{{ $agent->name }}</p>
                    <p>....................</p>
                </div>
            </div>
        </div>

        <div class="footer">
            <div>مدير المدرسة: {{ $principal_name }}</div>
            <div>التوقيع: ....................</div>
            <div>التاريخ: {{ $current_date }}</div>
        </div>
    </div>

    <!-- 11. محضر اجتماع لجنة التوجيه الطلابي -->
    <div class="page">
        <div class="header">
            <div class="header-right">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                الإدارة العامة للتعليم بمنطقة الرياض<br>
                محافظة الخرج<br>
                المدرسة: ثانوية أم القرى
            </div>
            <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
        </div>

        <h2>محضر اجتماع لجنة التوجيه الطلابي</h2>
        
        <div class="content">
            <p>وصف المشكلة: <span class="field">{{ $meeting->problem_description }}</span></p>
            <p>تصنيفها: <span class="field">{{ $meeting->classification }}</span></p>
            <p>قرارات اللجنة: <span class="field">{{ $meeting->decisions }}</span></p>
            
            <h3>أعضاء اللجنة:</h3>
            <table>
                <thead>
                    <tr>
                        <th>م</th>
                        <th>الاسم</th>
                        <th>الوظيفة</th>
                        <th>العمل المسند</th>
                        <th>التوقيع</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($meeting->members as $index => $member)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ $member->name }}</td>
                        <td>{{ $member->role }}</td>
                        <td>{{ $member->task }}</td>
                        <td>....................</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="footer">
            <div>مدير المدرسة: {{ $principal_name }}</div>
            <div>التوقيع: ....................</div>
            <div>التاريخ: {{ $current_date }}</div>
        </div>
    </div>

    <!-- 12. خطة تعديل السلوك (الصفحتان) -->
    <div class="page">
        <div class="header">
            <div class="header-right">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                الإدارة العامة للتعليم بمنطقة الرياض<br>
                محافظة الخرج<br>
                المدرسة: ثانوية أم القرى
            </div>
            <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
        </div>

        <h2>خطة تعديل السلوك (الصفحة 1)</h2>
        
        <div class="content">
            <p>الاسم: <span class="field">{{ $student->name }}</span> الميلاد: <span class="field">{{ $student->dob }}</span> العمر: <span class="field">{{ $student->age }}</span></p>
            <p>تاريخ البداية: <span class="field">{{ $plan->start_date }}</span> تاريخ النهاية: <span class="field">{{ $plan->end_date }}</span></p>
            
            <hr>
            
            <p>وصف المشكلة: <span class="field">{{ $plan->problem_desc }}</span></p>
            <p>المظاهر: <span class="field">{{ $plan->symptoms }}</span></p>
            
            <hr>
            
            <p>المثيرات القبلية: <span class="field">{{ $plan->pre_triggers }}</span></p>
            <p>المثيرات البعدية: <span class="field">{{ $plan->post_triggers }}</span></p>
            <p>ما يحققه السلوك (المكاسب): <span class="field">{{ $plan->gains }}</span></p>
            <p>الإجراءات السابقة: <span class="field">{{ $plan->past_actions }}</span></p>
        </div>

        <div class="footer">
            <div>مدير المدرسة: {{ $principal_name }}</div>
            <div>التوقيع: ....................</div>
            <div>التاريخ: {{ $current_date }}</div>
        </div>
    </div>
    
    <div class="page">
        <div class="header">
            <div class="header-right">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                الإدارة العامة للتعليم بمنطقة الرياض<br>
                محافظة الخرج<br>
                المدرسة: ثانوية أم القرى
            </div>
            <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
        </div>

        <h2>خطة تعديل السلوك (الصفحة 2)</h2>
        
        <div class="content">
            <p>السلوك المرغوب (البديل): <span class="field">{{ $plan->desired_behavior }}</span></p>
            <p>التعزيز المقترح: <span class="field">{{ $plan->reinforcement }}</span></p>
            
            <br><br><br>
            <div class="signatures">
                <div class="signature-box">
                    <p>الموجه الطلابي</p>
                    <p>....................</p>
                </div>
                <div class="signature-box">
                    <p>ولي الأمر</p>
                    <p>....................</p>
                </div>
            </div>
        </div>

        <div class="footer">
            <div>مدير المدرسة: {{ $principal_name }}</div>
            <div>التوقيع: ....................</div>
            <div>التاريخ: {{ $current_date }}</div>
        </div>
    </div>

    <!-- 13. محضر ضبط واقعة -->
    <div class="page">
        <div class="header">
            <div class="header-right">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                الإدارة العامة للتعليم بمنطقة الرياض<br>
                محافظة الخرج<br>
                المدرسة: ثانوية أم القرى
            </div>
            <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
        </div>

        <h2>محضر ضبط واقعة</h2>
        
        <div class="content">
            <p>الطالب: <span class="field">{{ $student->name }}</span></p>
            <p>المشكلة: <span class="field">{{ $incident->violation_name }}</span> درجتها: <span class="field">{{ $incident->degree }}</span></p>
            <p>مكان الضبط: <span class="field">{{ $incident->location }}</span></p>
            
            <p>نوع المشاهدة (الشواهد): 
                <span class="checkbox-item">
                    <span class="checkbox-box">@if($incident->evidence_type == 'صور') ✓ @endif</span> صور
                </span>
                <span class="checkbox-item">
                    <span class="checkbox-box">@if($incident->evidence_type == 'فيديو') ✓ @endif</span> فيديو
                </span>
                <span class="checkbox-item">
                    <span class="checkbox-box">@if($incident->evidence_type == 'أخرى') ✓ @endif</span> أخرى
                </span>
            </p>
            
            <h3>الشهود:</h3>
            <table>
                <thead>
                    <tr>
                        <th>م</th>
                        <th>الاسم</th>
                        <th>الوظيفة</th>
                        <th>التوقيع</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($incident->witnesses as $index => $witness)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>{{ $witness->name }}</td>
                        <td>{{ $witness->job }}</td>
                        <td>....................</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="footer">
            <div>مدير المدرسة: {{ $principal_name }}</div>
            <div>التوقيع: ....................</div>
            <div>التاريخ: {{ $current_date }}</div>
        </div>
    </div>

    <!-- 14. إبلاغ عن حالة عالية الخطورة -->
    <div class="page">
        <div class="header">
            <div class="header-right">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                الإدارة العامة للتعليم بمنطقة الرياض<br>
                محافظة الخرج<br>
                المدرسة: ثانوية أم القرى
            </div>
            <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
        </div>

        <h2>إبلاغ عن حالة عالية الخطورة</h2>
        
        <div class="content">
            <p>الطالب: <span class="field">{{ $student->name }}</span></p>
            <p>وصف الحالة: <span class="field">{{ $report->description }}</span></p>
            <p>الراصد: <span class="field">{{ $report->observer_name }}</span> التاريخ: <span class="field">{{ $report->date }}</span> الوقت: <span class="field">{{ $report->time }}</span></p>
            
            <h3>الإجراءات المتخذة:</h3>
            <p>
                <span class="checkbox-item">
                    @if($report->notified_education) ☑ @else ☐ @endif تبليغ إدارة التعليم
                </span>
                <span class="checkbox-item">
                    @if($report->notified_security) ☑ @else ☐ @endif الجهات الأمنية
                </span>
                <span class="checkbox-item">
                    @if($report->notified_health) ☑ @else ☐ @endif الجهات الصحية
                </span>
                <span class="checkbox-item">
                    @if($report->notified_protection) ☑ @else ☐ @endif وحدة الحماية
                </span>
            </p>
        </div>

        <div class="footer">
            <div>مدير المدرسة: {{ $principal_name }}</div>
            <div>التوقيع: ....................</div>
            <div>التاريخ: {{ $current_date }}</div>
        </div>
    </div>

    <!-- 15. إبلاغ لمركز البلاغات 1919 (إيذاء) -->
    <div class="page">
        <div class="header">
            <div class="header-right">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                الإدارة العامة للتعليم بمنطقة الرياض<br>
                محافظة الخرج<br>
                المدرسة: ثانوية أم القرى
            </div>
            <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
        </div>

        <h2>إبلاغ لمركز البلاغات 1919 (إيذاء)</h2>
        
        <div class="content">
            <h3>بيانات الحالة (الضحية):</h3>
            <p>الاسم: <span class="field">{{ $victim->name }}</span> العمر: <span class="field">{{ $victim->age }}</span> الجنس: <span class="field">{{ $victim->gender }}</span></p>
            <p>الجنسية: <span class="field">{{ $victim->nationality }}</span> السجل المدني: <span class="field">{{ $victim->national_id }}</span></p>
            <p>الجوال: <span class="field">{{ $victim->mobile }}</span> العنوان: <span class="field">{{ $victim->address }}</span></p>
            
            <hr>
            
            <h3>الجهة المبلغة:</h3>
            <p>الاسم: <span class="field">{{ $reporter->name }}</span> السجل المدني: <span class="field">{{ $reporter->national_id }}</span></p>
            <p>الهواتف: <span class="field">{{ $reporter->phones }}</span></p>
            
            <hr>
            
            <h3>ملخص المشكلة:</h3>
            <p>{{ $report->summary }}</p>
        </div>

        <div class="footer">
            <div>مدير المدرسة: {{ $principal_name }}</div>
            <div>التوقيع: ....................</div>
            <div>التاريخ: {{ $current_date }}</div>
        </div>
    </div>

    <!-- 16. إجراءات الغياب بعذر -->
    <div class="page">
        <div class="header">
            <div class="header-right">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                الإدارة العامة للتعليم بمنطقة الرياض<br>
                محافظة الخرج<br>
                المدرسة: ثانوية أم القرى
            </div>
            <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
        </div>

        <h2>إجراءات الغياب بعذر</h2>
        
        <div class="content">
            <p>الطالب: <span class="field">{{ $student->name }}</span> الصف: <span class="field">{{ $student->grade }}</span></p>
            
            <table>
                <thead>
                    <tr>
                        <th>أيام الغياب</th>
                        <th>الإجراء المتخذ</th>
                        <th>التاريخ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{{ $absence->days_count }}</td>
                        <td>{{ $absence->procedure }}</td>
                        <td>{{ $absence->date }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="footer">
            <div>مدير المدرسة: {{ $principal_name }}</div>
            <div>التوقيع: ....................</div>
            <div>التاريخ: {{ $current_date }}</div>
        </div>
    </div>

    <!-- 17. إجراءات الغياب بدون عذر -->
    <div class="page">
        <div class="header">
            <div class="header-right">
                المملكة العربية السعودية<br>
                وزارة التعليم<br>
                الإدارة العامة للتعليم بمنطقة الرياض<br>
                محافظة الخرج<br>
                المدرسة: ثانوية أم القرى
            </div>
            <div class="header-left">
                <img src="/moe-logo.png" alt="شعار وزارة التعليم" class="header-logo">
                <div class="header-date">التاريخ: {{ $current_date }}</div>
            </div>
        </div>

        <h2>إجراءات الغياب بدون عذر</h2>
        
        <div class="content">
            <p>الطالب: <span class="field">{{ $student->name }}</span> الصف: <span class="field">{{ $student->grade }}</span></p>
            
            <table>
                <thead>
                    <tr>
                        <th>أيام الغياب</th>
                        <th>الإجراء المتخذ</th>
                        <th>تاريخ الإجراء</th>
                        <th>عدد درجات المواظبة المحسومة</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{{ $absence->days_count }}</td>
                        <td>{{ $absence->procedure }}</td>
                        <td>{{ $absence->date }}</td>
                        <td>{{ $absence->deducted_points }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="footer">
            <div>مدير المدرسة: {{ $principal_name }}</div>
            <div>التوقيع: ....................</div>
            <div>التاريخ: {{ $current_date }}</div>
        </div>
    </div>

</body>
</html>
