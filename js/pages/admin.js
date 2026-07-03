import { call } from '../api.js';
import { getSession } from '../state.js';
import { formatThaiDate, escapeHtml, toast } from '../utils.js';
import { resetDemoData } from '../mockData.js';
import { DEMO_MODE } from '../api.js';

export async function render(app) {
  const session = getSession();
  if (session.roleCode !== 'ADMIN') {
    app.innerHTML = `<div class="container"><div class="card">หน้านี้สำหรับผู้ดูแลระบบ (ADMIN) เท่านั้น</div></div>`;
    return;
  }

  const [settingsRes, auditRes] = await Promise.all([
    call('getSettings', {}),
    call('getAuditLogs', { limit: 50 })
  ]);

  app.innerHTML = `
    <div class="container">
      <div class="card">
        <h2>ตั้งค่าระบบ</h2>
        ${Object.entries(settingsRes.data || {}).map(([k, v]) => `<div style="font-size:13px;display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--gray-100);"><span>${k}</span><span style="color:var(--gray-500);">${escapeHtml(String(v))}</span></div>`).join('')}
      </div>

      <div class="card">
        <h2>Audit Log (ล่าสุด 50 รายการ)</h2>
        ${(auditRes.data || []).length ? auditRes.data.map(l => `<div style="font-size:12px;padding:6px 0;border-bottom:1px solid var(--gray-100);">${formatThaiDate(l.timestamp)} · ${escapeHtml(l.action)} · ${escapeHtml(l.sheet_name || '')} · ${escapeHtml(l.detail || '')}</div>`).join('') : '<div class="empty-state">ยังไม่มี log</div>'}
      </div>

      ${DEMO_MODE ? `<div class="card"><h2>โหมดสาธิต</h2><button class="btn btn-danger" id="btnReset">รีเซ็ตข้อมูลตัวอย่างทั้งหมด</button></div>` : ''}
    </div>
  `;

  const resetBtn = app.querySelector('#btnReset');
  if (resetBtn) resetBtn.onclick = () => { resetDemoData(); toast('รีเซ็ตข้อมูลแล้ว'); location.reload(); };
}
