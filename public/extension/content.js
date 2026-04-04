// --- Takamol Noor Sync Engine Chrome Extension ---
// NOTE: This file is dynamically generated when downloaded via the ExtensionSetup page
// to ensure the correct API URL is used based on the current domain.

// Placeholder API URL
const API_BASE_URL = "https://your-takamol-api.onrender.com/api";

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

  btn.onclick = openSyncModal;

  document.body.appendChild(btn);
}

async function getSyncCode() {
  let syncCode = null;
  
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    try {
      const result = await new Promise(resolve => chrome.storage.local.get(['takamolSyncCode'], resolve));
      syncCode = result.takamolSyncCode;
    } catch (e) {
      console.warn("Could not access chrome.storage.local", e);
    }
  }
  
  if (!syncCode) {
    syncCode = localStorage.getItem('takamolSyncCode');
  }

  if (!syncCode) {
    syncCode = prompt('الرجاء إدخال كود الربط السريع من بوابة تكامل:');
    if (!syncCode || syncCode.trim() === '') {
      alert('تم إلغاء عملية الربط. يجب إدخال الكود للمزامنة.');
      return null;
    }
    
    syncCode = syncCode.trim();
    
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ takamolSyncCode: syncCode });
    }
    localStorage.setItem('takamolSyncCode', syncCode);
  }

  return syncCode;
}

function clearSyncCode() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.remove('takamolSyncCode');
  }
  localStorage.removeItem('takamolSyncCode');
}

async function openSyncModal() {
  const syncCode = await getSyncCode();
  if (!syncCode) return;

  // Create Modal UI
  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'takamol-modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000000; font-family: 'Tajawal', sans-serif; direction: rtl;
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white; padding: 32px; border-radius: 24px;
    width: 90%; max-width: 450px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    text-align: center; position: relative;
  `;

  modalContent.innerHTML = `
    <h2 style="color: #059669; font-size: 24px; font-weight: bold; margin-bottom: 8px;">بوابة تكامل</h2>
    <p style="color: #64748b; margin-bottom: 24px; font-size: 15px;" id="takamol-modal-subtitle">جاري الاتصال بالخادم...</p>
    
    <div id="takamol-modal-body" style="min-height: 100px; display: flex; flex-direction: column; justify-content: center;">
      <div style="width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #059669; border-radius: 50%; animation: takamol-spin 1s linear infinite; margin: 0 auto;"></div>
    </div>
    
    <style>
      @keyframes takamol-spin { to { transform: rotate(360deg); } }
      .takamol-select { width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 12px; font-family: 'Tajawal', sans-serif; font-size: 15px; outline: none; transition: border-color 0.2s; }
      .takamol-select:focus { border-color: #059669; }
      .takamol-btn { padding: 12px 24px; border-radius: 12px; font-family: 'Tajawal', sans-serif; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.2s; border: none; width: 100%; margin-bottom: 12px; }
      .takamol-btn-primary { background: #059669; color: white; }
      .takamol-btn-primary:hover { background: #047857; }
      .takamol-btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
      .takamol-btn-secondary { background: #f1f5f9; color: #475569; }
      .takamol-btn-secondary:hover { background: #e2e8f0; }
      .takamol-refresh-btn { background: none; border: none; color: #059669; cursor: pointer; font-family: 'Tajawal', sans-serif; font-size: 14px; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px; transition: background 0.2s; }
      .takamol-refresh-btn:hover { background: #ecfdf5; }
    </style>
  `;

  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);

  await fetchAndPopulateSubjects(syncCode, modalOverlay, modalContent);
}

async function fetchAndPopulateSubjects(syncCode, modalOverlay, modalContent) {
  const modalBody = document.getElementById('takamol-modal-body');
  const subtitle = document.getElementById('takamol-modal-subtitle');
  
  // Show spinner
  modalBody.innerHTML = `
    <div style="width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #059669; border-radius: 50%; animation: takamol-spin 1s linear infinite; margin: 0 auto;"></div>
    <p style="color: #64748b; margin-top: 12px; font-size: 14px;">جاري تحديث القائمة...</p>
  `;

  try {
    const url = new URL(`${API_BASE_URL}/get-teacher-subjects`);
    url.searchParams.append('syncCode', syncCode);
    url.searchParams.append('v', Date.now()); // Cache busting
    
    const response = await fetch(url.toString(), { cache: 'no-store' });
    
    if (response.status === 401) {
      clearSyncCode();
      document.body.removeChild(modalOverlay);
      alert('كود الربط غير صحيح أو منتهي الصلاحية. يرجى إدخال كود جديد.');
      return;
    }
    
    if (!response.ok) throw new Error('فشل الاتصال بالخادم');
    
    const data = await response.json();
    const subjects = data.subjects || [];
    
    subtitle.innerText = `مرحباً بك، ${data.teacherName}`;
    
    if (subjects.length === 0) {
      modalBody.innerHTML = `
        <div style="background: #fef2f2; color: #dc2626; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
          لا توجد مواد مسجلة لك في نظام تكامل حالياً.
        </div>
        <div style="display: flex; justify-content: center; margin-bottom: 24px;">
          <button id="takamol-refresh-btn" class="takamol-refresh-btn">🔄 تحديث القائمة</button>
        </div>
        <button class="takamol-btn takamol-btn-secondary" onclick="document.body.removeChild(document.getElementById('takamol-modal-overlay'))">إغلاق</button>
      `;
      document.getElementById('takamol-refresh-btn').addEventListener('click', () => fetchAndPopulateSubjects(syncCode, modalOverlay, modalContent));
      return;
    }

    let optionsHtml = '<option value="">-- اختر المادة والشعبة --</option>';
    subjects.forEach((subj, index) => {
      optionsHtml += `<option value="${index}">${subj.subject} - ${subj.grade} - شعبة ${subj.section}</option>`;
    });

    modalBody.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <label style="font-size: 14px; color: #475569; font-weight: bold;">اختر المادة:</label>
        <button id="takamol-refresh-btn" class="takamol-refresh-btn">🔄 تحديث</button>
      </div>
      <select id="takamol-subject-select" class="takamol-select" style="margin-bottom: 24px;">
        ${optionsHtml}
      </select>
      <button id="takamol-start-btn" class="takamol-btn takamol-btn-primary" disabled>بدء الرصد الآلي</button>
      <button class="takamol-btn takamol-btn-secondary" onclick="document.body.removeChild(document.getElementById('takamol-modal-overlay'))">إلغاء</button>
    `;

    document.getElementById('takamol-refresh-btn').addEventListener('click', () => fetchAndPopulateSubjects(syncCode, modalOverlay, modalContent));

    const selectEl = document.getElementById('takamol-subject-select');
    const startBtn = document.getElementById('takamol-start-btn');

    selectEl.addEventListener('change', (e) => {
      startBtn.disabled = e.target.value === "";
    });

    startBtn.addEventListener('click', () => {
      const selectedIndex = selectEl.value;
      if (selectedIndex !== "") {
        const selectedSubject = subjects[selectedIndex];
        startSyncProcess(syncCode, selectedSubject, modalContent);
      }
    });

  } catch (error) {
    modalBody.innerHTML = `
      <div style="background: #fef2f2; color: #dc2626; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
        ${error.message || 'حدث خطأ أثناء جلب البيانات.'}
      </div>
      <div style="display: flex; justify-content: center; margin-bottom: 24px;">
        <button id="takamol-refresh-btn" class="takamol-refresh-btn">🔄 إعادة المحاولة</button>
      </div>
      <button class="takamol-btn takamol-btn-secondary" onclick="document.body.removeChild(document.getElementById('takamol-modal-overlay'))">إغلاق</button>
    `;
    document.getElementById('takamol-refresh-btn').addEventListener('click', () => fetchAndPopulateSubjects(syncCode, modalOverlay, modalContent));
  }
}

async function startSyncProcess(syncCode, subjectData, modalContent) {
  // تصفير البيانات قبل البدء
  let currentData = [];

  modalContent.innerHTML = `
    <h2 style="color: #059669; font-size: 24px; font-weight: bold; margin-bottom: 8px;">جاري الرصد...</h2>
    <p style="color: #64748b; margin-bottom: 24px; font-size: 15px;">${subjectData.subject} - ${subjectData.grade} - شعبة ${subjectData.section}</p>
    <div style="width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #059669; border-radius: 50%; animation: takamol-spin 1s linear infinite; margin: 0 auto 24px auto;"></div>
  `;

  try {
    const url = new URL(`${API_BASE_URL}/get-takamol-grades`);
    url.searchParams.append('syncCode', syncCode);
    url.searchParams.append('subject', subjectData.subject);
    url.searchParams.append('grade', subjectData.grade);
    url.searchParams.append('section', subjectData.section);
    url.searchParams.append('timestamp', Date.now()); // تحديث منطق الحقن (No-Cache Injection)
    
    // جلب البيانات الجديدة (Fetch latest)
    const response = await fetch(url.toString(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) throw new Error('فشل جلب درجات الطلاب');
    
    currentData = await response.json();
    let successCount = 0;
    
    // Find student rows robustly
    let studentRows = Array.from(document.querySelectorAll('tr')).filter(row => {
      const textInputs = row.querySelectorAll('input[type="text"]');
      return textInputs.length >= 2 && !row.closest('thead');
    });

    studentRows.forEach(row => {
      const rowText = row.innerText; 
      
      // المطابقة الصارمة برقم الهوية فقط
      let studentData = currentData.find(g => g.nationalId && rowText.includes(g.nationalId));

      if (studentData) {
        const inputs = row.querySelectorAll('input[type="text"]');
        if (inputs.length >= 2) {
          // In Noor (RTL), the first input is usually the right-most grade column (Evaluation out of 20)
          // The second input is the next column (Performance out of 40)
          inputs[0].value = studentData.evaluationTotal || 20;
          inputs[1].value = studentData.performanceTotal || 40;

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

    modalContent.innerHTML = `
      <div style="width: 64px; height: 64px; background: #d1fae5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <h2 style="color: #059669; font-size: 24px; font-weight: bold; margin-bottom: 8px;">اكتمل الرصد بنجاح!</h2>
      <p style="color: #64748b; margin-bottom: 24px; font-size: 15px;">تم رصد درجات ${successCount} طالب.</p>
      <button class="takamol-btn takamol-btn-primary" onclick="document.body.removeChild(document.getElementById('takamol-modal-overlay'))">إنهاء</button>
    `;

  } catch (error) {
    modalContent.innerHTML = `
      <div style="width: 64px; height: 64px; background: #fef2f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </div>
      <h2 style="color: #dc2626; font-size: 24px; font-weight: bold; margin-bottom: 8px;">فشل الرصد</h2>
      <p style="color: #64748b; margin-bottom: 24px; font-size: 15px;">${error.message || 'حدث خطأ أثناء الاتصال ببوابة تكامل.'}</p>
      <button class="takamol-btn takamol-btn-secondary" onclick="document.body.removeChild(document.getElementById('takamol-modal-overlay'))">إغلاق</button>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectFloatingButton);
} else {
  injectFloatingButton();
}
