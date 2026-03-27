// --- Takamol Noor Sync Engine Chrome Extension ---
// NOTE: This file is dynamically generated when downloaded via the ExtensionSetup page
// to ensure the correct API URL is used based on the current domain.

// Placeholder API URL
const API_URL = "https://your-takamol-api.onrender.com/api/get-takamol-grades";

function injectFloatingButton() {
  if (document.getElementById('takamol-sync-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'takamol-sync-btn';
  btn.innerHTML = '🚀 رصد درجات تكامل';
  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 999999;
    background-color: #059669;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: 'Tajawal', sans-serif;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
  `;

  btn.onmouseover = () => btn.style.transform = 'translateY(-2px)';
  btn.onmouseout = () => btn.style.transform = 'translateY(0)';

  btn.onclick = handleSync;

  document.body.appendChild(btn);
}

async function handleSync() {
  const btn = document.getElementById('takamol-sync-btn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ جاري جلب البيانات...';
  btn.disabled = true;
  btn.style.backgroundColor = '#4B5563';

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('فشل الاتصال بالخادم');
    const gradesData = await response.json();

    let successCount = 0;

    const studentRows = document.querySelectorAll('tr[id^="gvDynamicStudentsMark_ctl"]');

    studentRows.forEach(row => {
      const rowText = row.innerText; 
      const studentData = gradesData.find(g => rowText.includes(g.nationalId));

      if (studentData) {
        const inputs = row.querySelectorAll('input[type="text"]');
        if (inputs.length >= 2) {
          inputs[0].value = studentData.oralScore;
          inputs[1].value = studentData.performanceScore;

          inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
          inputs[0].dispatchEvent(new Event('blur', { bubbles: true }));
          
          inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
          inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
          inputs[1].dispatchEvent(new Event('blur', { bubbles: true }));

          row.style.backgroundColor = '#d1fae5'; 
          successCount++;
        }
      }
    });

    btn.innerHTML = \`✅ تم رصد \${successCount} طالب\`;
    btn.style.backgroundColor = '#059669';
    alert(\`تمت المزامنة بنجاح! تم رصد درجات \${successCount} طالب.\`);

  } catch (error) {
    console.error('Sync Error:', error);
    btn.innerHTML = '❌ فشل الرصد';
    btn.style.backgroundColor = '#DC2626';
    alert('حدث خطأ أثناء الاتصال ببوابة تكامل. يرجى التأكد من تسجيل الدخول.');
  } finally {
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
      btn.style.backgroundColor = '#059669';
    }, 5000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectFloatingButton);
} else {
  injectFloatingButton();
}
