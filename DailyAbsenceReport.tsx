@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Tajawal:wght@400;500;700;900&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Cairo", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Tajawal", sans-serif;
  
  --color-primary: #006847;
  --color-primary-light: #00855c;
  --color-primary-dark: #004d35;
  --color-accent: #d4af37; /* Gold/Yellow from the login button */
  --color-bg-light: #f8fafc;
  
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-3xl: 2rem;
}

@layer base {
  body {
    @apply bg-bg-light text-slate-800 antialiased;
    direction: rtl;
  }
  
  input, button, select, textarea {
    @apply min-h-[44px];
  }
}

@layer components {
  .sts-card {
    @apply bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300;
  }
  
  .sts-button-primary {
    @apply bg-primary hover:bg-primary-light text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20 active:scale-95;
  }
  
  .sts-button-accent {
    @apply bg-accent hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-accent/20 active:scale-95;
  }

  .sts-input {
    @apply w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none;
  }
}

.glass {
  @apply bg-white/80 backdrop-blur-md border border-white/20;
}

.card-shadow {
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 10px -2px rgba(0, 0, 0, 0.03);
}

@layer utilities {
  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
}

@media print {
  @page {
    size: A4 landscape;
    margin: 0.5cm;
  }
  
  html, body, #root, main {
    background-color: white !important;
    margin: 0 !important;
    padding: 0 !important;
    direction: rtl;
    height: auto !important;
    min-height: auto !important;
    overflow: visible !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .no-print, aside, nav, header, button, .sticky, .no-print-area {
    display: none !important;
  }

  ::-webkit-scrollbar {
    display: none !important;
  }

  /* Ensure the main content takes full width */
  main {
    width: 100% !important;
  }

  .max-w-6xl, .max-w-4xl, .max-w-5xl {
    max-width: 100% !important;
    width: 100% !important;
  }

  .sts-card {
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
  }

  .print-report {
    display: block !important;
    padding: 5mm;
    transform: scale(0.95);
    transform-origin: top center;
  }

  .print-section {
    margin-bottom: 15px;
    border: 1px solid #000;
    page-break-inside: avoid;
  }

  .print-section-header {
    background-color: #f1f5f9 !important;
    border-bottom: 1px solid #000;
    padding: 6px 10px;
    font-weight: bold;
    font-size: 13px;
  }

  .print-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  .print-cell {
    padding: 6px 10px;
    border-bottom: 1px solid #eee;
    border-left: 1px solid #eee;
    font-size: 11px;
  }

  .print-cell:last-child {
    border-left: none;
  }

  .print-label {
    font-weight: bold;
    color: #475569;
    margin-left: 6px;
  }

  .print-full-cell {
    padding: 10px;
    font-size: 11px;
    line-height: 1.5;
  }
}

.print-report {
  display: none;
}
