import { call } from '../api.js';
import { navigate } from '../router.js';
import { formatThaiDate, escapeHtml } from '../utils.js';

export async function render(app, params) {
  if (params.patient_uid) return renderPatientVisits(app, params.patient_uid);
  return renderAllPlans(app);
}

async function renderPatientVisits(app, patientUid) {
  const res = await call('listHomeVisitsByPatient', { patient_uid: patientUid });
  const visits = res.data || [];
  app.innerHTML = `
    <div class="container">
      <div class="card"><h2>ประวัติการเยี่ยมบ้าน</h2></div>
      ${visits.length ? visits.map(v => visitRow(v)).join('') : '<div class="empty-state">ยังไม่มีประวัติการเยี่ยม</div>'}
    </div>
  `;
  app.querySelectorAll('[data-visit]').forEach(row => {
    row.onclick = () => navigate('/visit-form', { patient_uid: patientUid, visit_uid: row.dataset.visit });
  });
}

async function renderAllPlans(app) {
  const res = await call('listVisitPlans', {});
  const plans = (res.data || []).sort((a, b) => new Date(a.planned_date) - new Date(b.planned_date));
  app.innerHTML = `
    <div class="container">
      <div class="card">
        <h2>แผนเยี่ยมบ้านทั้งหมด</h2>
        <div class="hint" style="font-size:12px;color:var(--gray-500);">ค้นหาผู้ป่วยเพื่อดูประวัติเยี่ยมรายบุคคลแบบเต็ม</div>
      </div>
      ${plans.length ? plans.map(planRow).join('') : '<div class="empty-state">ยังไม่มีแผนเยี่ยม</div>'}
    </div>
  `;
}

function visitRow(v) {
  return `
    <div class="list-item" data-visit="${v.visit_uid}">
      <div>
        <div class="name">${formatThaiDate(v.visit_date)} — ครั้งที่ ${v.visit_no}</div>
        <div class="meta">${escapeHtml(v.visitor_name || '')} · ${statusBadge(v.visit_status)} ${v.red_flag ? '<span class="badge red">Red flag</span>' : ''}</div>
      </div>
      <div class="chev">›</div>
    </div>
  `;
}

function planRow(p) {
  return `
    <div class="list-item">
      <div>
        <div class="name">${formatThaiDate(p.planned_date)} — ${escapeHtml(p.purpose || '')}</div>
        <div class="meta">${priorityBadge(p.priority_level)} ${p.is_overdue ? '<span class="badge red">เลยกำหนด</span>' : `<span class="badge gray">${statusLabel(p.status)}</span>`}</div>
      </div>
      <div class="chev">›</div>
    </div>
  `;
}

function statusBadge(status) {
  const map = { draft: ['ฉบับร่าง', 'gray'], completed: ['เสร็จสิ้น', 'green'], reviewed: ['ตรวจทานแล้ว', 'blue'], cancelled: ['ยกเลิก', 'gray'] };
  const m = map[status] || [status, 'gray'];
  return `<span class="badge ${m[1]}">${m[0]}</span>`;
}

function statusLabel(status) {
  return { planned: 'วางแผน', done: 'เสร็จสิ้น', postponed: 'เลื่อน', cancelled: 'ยกเลิก' }[status] || status;
}

function priorityBadge(level) {
  const map = { low: ['ต่ำ', 'gray'], medium: ['กลาง', 'blue'], high: ['สูง', 'orange'], urgent: ['เร่งด่วน', 'red'] };
  const m = map[level] || [level, 'gray'];
  return `<span class="badge ${m[1]}">${m[0]}</span>`;
}
