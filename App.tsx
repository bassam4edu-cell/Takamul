<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>التحول الرقمي - ثانوية أم القرى</title>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: 'Tajawal', sans-serif;
            background-color: #f8fafc;
            background-image: radial-gradient(#006C35 0.5px, transparent 0.5px);
            background-size: 24px 24px;
            background-attachment: fixed;
        }
        .official-gradient {
            background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%);
        }
        .btn-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-hover:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
    </style>
</head>
<body class="min-h-screen flex flex-col relative overflow-x-hidden">
    <!-- Background Overlay -->
    <div class="fixed inset-0 bg-gradient-to-tr from-emerald-50/30 via-transparent to-blue-50/30 pointer-events-none"></div>

    <!-- Top Right Header -->
    <header class="absolute top-6 right-6 md:top-12 md:right-12 text-right z-10">
        <div class="space-y-0.5 md:space-y-1">
            <h2 class="text-sm md:text-xl font-bold text-slate-800">المملكة العربية السعودية</h2>
            <h3 class="text-xs md:text-lg font-semibold text-slate-700">وزارة التعليم</h3>
            <p class="text-[10px] md:text-base text-slate-600">الإدارة العامة للتعليم بمنطقة الرياض</p>
            <p class="text-[10px] md:text-sm text-emerald-700 font-bold">ثانوية أم القرى بالخرج</p>
        </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-24 md:py-20 z-10">
        <div class="flex flex-col items-center text-center space-y-8 md:space-y-12 max-w-4xl w-full">
            <!-- Logo -->
            <div class="relative group">
                <img src="https://i.ibb.co/11D74Jg/222.png" alt="شعار ثانوية أم القرى" class="w-40 md:w-64 lg:w-80 h-auto drop-shadow-2xl transition-transform duration-700 group-hover:scale-105">
                <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-3 bg-black/5 blur-xl rounded-full"></div>
            </div>

            <!-- Title -->
            <div class="space-y-3 md:space-y-4">
                <h1 class="text-3xl md:text-6xl font-black text-slate-900 tracking-tight">
                    بوابة التحول الرقمي
                </h1>
                <div class="h-1 w-16 md:h-1.5 md:w-24 bg-emerald-600 mx-auto rounded-full"></div>
            </div>

            <!-- Buttons -->
            <div class="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full max-w-2xl pt-4 md:pt-8">
                <a href="https://sites.google.com/view/ummal/%D8%A7%D9%84%D8%B5%D9%81%D8%AD%D8%A9-%D8%A7%D9%84%D8%B1%D8%A6%D9%8A%D8%B3%D9%8A%D8%A9?authuser=0" target="_blank" class="btn-hover w-full md:flex-1 bg-white text-slate-800 border-2 border-slate-100 py-5 md:py-6 px-6 md:px-8 rounded-2xl md:rounded-[2rem] font-bold text-lg md:text-xl shadow-xl shadow-slate-200/50 flex items-center justify-center gap-3 hover:border-emerald-500/30 hover:text-emerald-700 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-emerald-600 md:w-6 md:h-6"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    الوثائق المدرسية
                </a>

                <a href="/login" class="btn-hover w-full md:flex-1 bg-slate-900 text-white py-5 md:py-6 px-6 md:px-8 rounded-2xl md:rounded-[2rem] font-bold text-lg md:text-xl shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-white md:w-6 md:h-6"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
                    بوابة تكامل
                </a>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="py-8 w-full text-center text-slate-400 text-xs font-bold z-10">
        <p>© 2026 ثانوية أم القرى بالخرج - جميع الحقوق محفوظة</p>
        <p class="text-[10px] mt-1 opacity-70">برمجة: بسام العنزي</p>
    </footer>
</body>
</html>
