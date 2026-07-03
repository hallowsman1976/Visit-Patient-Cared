import { call } from '../api.js';
import { getSession } from '../state.js';
import { navigate } from '../router.js';

export async function render(app) {
  const session = getSession();
  const res = await call('getDashboardSummary', {});
  const s = res.data || {};

  app.innerHTML = `
    <div class="container">
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-weight:600;">สวัสดี ${session.displayName || ''}</div>
          <div style="font-size:12px;color:var(--gray-500);">บทบาท: ${roleLabel(session.roleCode)}</div>
        </div>
        <button class="btn btn-secondary" style="width:auto;" id="btnGoSearch">＋ เยี่ยมบ้านใหม่</button>
      </div>

      <div class="kpi-grid">
        ${kpi(s.totalPatients, 'ผู้ป่วยทั้งหมด')}
        ${kpi(s.activePatients, 'ผู้ป่วย active', 'green')}
        ${kpi(s.visitsToday, 'เยี่ยมวันนี้')}
        ${kpi(s.upcomingWithin7Days, 'นัดภายใน 7 วัน')}
        ${kpi(s.overduePlans, 'นัดเลยกำหนด', 'warn')}
        ${kpi(s.redFlagVisits, 'Red flag', 'danger')}
        ${kpi(s.highFallRisk, 'เสี่ยงหกล้มสูง', 'warn')}
        ${kpi(s.medicationProblems, 'ปัญหาการใช้ยา', 'warn')}
        ${kpi(s.pendingReferrals, 'ส่งต่อค้าง')}
        ${kpi(s.bedOrHomeBound, 'ติดบ้าน/ติดเตียง')}
        ${kpi(s.avgAdlLatest, 'ADL เฉลี่ยล่าสุด', 'green')}
      </div>

      <div class="card">
        <h2>ทางลัด</h2>
        <div class="btn-row">
          <button class="btn btn-primary" id="btnSearch">ค้นหาผู้ป่วย</button>
          <button class="btn btn-secondary" id="btnHistory">ประวัติเยี่ยมล่าสุด</button>
        </div>
      </div>
    </div>
  `;

  app.querySelector('#btnGoSearch').onclick = () => navigate('/patients');
  app.querySelector('#btnSearch').onclick = () => navigate('/patients');
  app.querySelector('#btnHistory').onclick = () => navigate('/visits');
}

function kpi(value, label, tone) {
  const cls = tone === 'danger' ? 'danger' : tone === 'warn' ? 'warn' : tone === 'green' ? 'green' : '';
  return `<div class="kpi ${cls}"><div class="num">${value ?? 0}</div><div class="label">${label}</div></div>`;
}

function roleLabel(code) {
  return { ADMIN: 'ผู้ดูแลระบบ', STAFF: 'เจ้าหน้าที่', VIEWER: 'ผู้ดูข้อมูล' }[code] || code;
}
