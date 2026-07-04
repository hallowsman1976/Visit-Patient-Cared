import { route, renderRoute, navigate } from './router.js';
import { getSession, clearSession, isLoggedIn } from './state.js';
import { call } from './api.js';
import { CONFIG, DEMO_MODE } from './config.js';

import { render as renderLogin } from './pages/login.js';
import { render as renderDashboard } from './pages/dashboard.js';
import { render as renderPatientSearch } from './pages/patientSearch.js';
import { render as renderPatientProfile } from './pages/patientProfile.js';
import { render as renderVisitForm } from './pages/homeVisitForm.js';
import { render as renderVisitHistory } from './pages/visitHistory.js';
import { render as renderAdmin } from './pages/admin.js';

route('/login', renderLogin);
route('/dashboard', renderDashboard);
route('/patients', renderPatientSearch);
route('/patient', renderPatientProfile);
route('/visit-form', renderVisitForm);
route('/visits', renderVisitHistory);
route('/admin', renderAdmin);

function renderShell() {
  document.getElementById('appName').textContent = CONFIG.APP_NAME;
  document.getElementById('appSub').textContent = DEMO_MODE ? 'โหมดสาธิต' : CONFIG.ORG_NAME;

  const logoutBtn = document.getElementById('btnLogout');
  logoutBtn.onclick = () => {
    // ออกจากระบบทันที ไม่ต้องรอ backend: ยิง logout แบบ fire-and-forget (จับ session ก่อน clear)
    // แล้วเคลียร์ session + ไปหน้า login เลย ผู้ใช้จึงไม่เห็นสถานะค้างรอ
    if (isLoggedIn()) { try { call('logout', {}); } catch (e) { /* ไม่ต้องสน */ } }
    clearSession();
    navigate('/login');
  };
}

renderShell();
renderRoute();
