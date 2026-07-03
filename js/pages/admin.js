import { call } from '../api.js';
import { getSession } from '../state.js';
import { formatThaiDate, escapeHtml, toast } from '../utils.js';
import { resetDemoData } from '../mockData.js';
import { DEMO_MODE } from '../api.js';

const ROLE_LABELS = { ADMIN: 'ผู้ดูแลระบบ', STAFF: 'เจ้าหน้าที่บันทึก/เยี่ยมบ้าน', VIEWER: 'ผู้ดูข้อมูล/ผู้บริหาร' };

const MENU = [
  { key: 'settings', icon: '⚙️', label: 'ตั้งค่าระบบ' },
  { key: 'users', icon: '👥', label: 'จัดการผู้ใช้งาน' },
  { key: 'assign', icon: '🗂️', label: 'มอบหมายผู้ป่วย' },
  { key: 'audit', icon: '📜', label: 'Audit Log' },
  ...(DEMO_MODE ? [{ key: 'demo', icon: '🧪', label: 'โหมดสาธิต' }] : [])
];

let activeSection = MENU[0].key;

export async function render(app) {
  const session = getSession();
  if (session.roleCode !== 'ADMIN') {
    app.innerHTML = `<div class="container"><div class="card">หน้านี้สำหรับผู้ดูแลระบบ (ADMIN) เท่านั้น</div></div>`;
    return;
  }

  const [settingsRes, auditRes, usersRes, patientsRes] = await Promise.all([
    call('getSettings', {}),
    call('getAuditLogs', { limit: 50 }),
    call('listUsers', {}),
    call('listPatientsBrief', {})
  ]);

  const users = usersRes.success ? (usersRes.data || []) : [];
  const patients = patientsRes.success ? (patientsRes.data || []) : [];

  app.innerHTML = `
    <div class="container container-wide">
      <div class="admin-layout">
        <nav class="admin-sidebar" id="adminNav">
          ${MENU.map(m => `<div class="nav-item${m.key === activeSection ? ' active' : ''}" data-section="${m.key}"><span class="ic">${m.icon}</span>${m.label}</div>`).join('')}
        </nav>
        <div class="admin-content" id="adminContent">
          <div class="admin-section" data-section="settings" ${activeSection !== 'settings' ? 'hidden' : ''}>
            <div class="card">
              <h2>ตั้งค่าระบบ</h2>
              ${Object.entries(settingsRes.data || {}).map(([k, v]) => `<div style="font-size:13px;display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--gray-100);"><span>${k}</span><span style="color:var(--gray-500);">${escapeHtml(String(v))}</span></div>`).join('')}
            </div>
          </div>

          <div class="admin-section" data-section="users" ${activeSection !== 'users' ? 'hidden' : ''}>
            <div class="card">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <h2 style="margin:0;">จัดการผู้ใช้งาน</h2>
                <button class="btn btn-secondary" style="width:auto;" id="btnAddUser">＋ เพิ่มผู้ใช้งาน</button>
              </div>
              ${users.length ? users.map(u => userRow(u)).join('') : '<div class="empty-state">ยังไม่มีผู้ใช้งาน</div>'}
            </div>
          </div>

          <div class="admin-section" data-section="assign" ${activeSection !== 'assign' ? 'hidden' : ''}>
            <div class="card">
              <h2>มอบหมายผู้ป่วยให้เจ้าหน้าที่</h2>
              ${patients.length ? patients.map(p => assignRow(p, users)).join('') : '<div class="empty-state">ยังไม่มีผู้ป่วยในระบบ</div>'}
            </div>
          </div>

          <div class="admin-section" data-section="audit" ${activeSection !== 'audit' ? 'hidden' : ''}>
            <div class="card">
              <h2>Audit Log (ล่าสุด 50 รายการ)</h2>
              ${(auditRes.data || []).length ? auditRes.data.map(l => `<div style="font-size:12px;padding:6px 0;border-bottom:1px solid var(--gray-100);">${formatThaiDate(l.timestamp)} · ${escapeHtml(l.action)} · ${escapeHtml(l.sheet_name || '')} · ${escapeHtml(l.detail || '')}</div>`).join('') : '<div class="empty-state">ยังไม่มี log</div>'}
            </div>
          </div>

          ${DEMO_MODE ? `
          <div class="admin-section" data-section="demo" ${activeSection !== 'demo' ? 'hidden' : ''}>
            <div class="card"><h2>โหมดสาธิต</h2><button class="btn btn-danger" id="btnReset">รีเซ็ตข้อมูลตัวอย่างทั้งหมด</button></div>
          </div>` : ''}
        </div>
      </div>
    </div>
  `;

  app.querySelectorAll('.admin-sidebar .nav-item').forEach(item => {
    item.onclick = () => {
      activeSection = item.dataset.section;
      app.querySelectorAll('.admin-sidebar .nav-item').forEach(n => n.classList.toggle('active', n === item));
      app.querySelectorAll('.admin-content .admin-section').forEach(sec => { sec.hidden = sec.dataset.section !== activeSection; });
    };
  });

  const resetBtn = app.querySelector('#btnReset');
  if (resetBtn) resetBtn.onclick = () => { resetDemoData(); toast('รีเซ็ตข้อมูลแล้ว'); location.reload(); };

  app.querySelector('#btnAddUser').onclick = () => openUserModal(app, null);
  app.querySelectorAll('.user-row .btn-edit-user').forEach(btn => {
    btn.onclick = () => openUserModal(app, users.find(u => u.user_uid === btn.dataset.uid));
  });
  app.querySelectorAll('.assign-select').forEach(sel => {
    sel.onchange = async () => {
      const res = await call('assignPatientStaff', { patient_uid: sel.dataset.uid, user_uid: sel.value });
      if (!res.success) { toast(res.message); return; }
      toast('มอบหมายผู้รับผิดชอบแล้ว');
      render(app);
    };
  });
}

function userRow(u) {
  const active = u.is_active !== false;
  return `
    <div class="list-item user-row" style="cursor:default;">
      <div>
        <div class="name">${escapeHtml(u.display_name)} <span class="badge gray">${escapeHtml(u.username)}</span></div>
        <div class="meta">${escapeHtml(ROLE_LABELS[u.role_code] || u.role_code)}${u.unit_name ? ' · ' + escapeHtml(u.unit_name) : ''}</div>
        <div class="meta">${active ? '<span class="badge green">ใช้งานอยู่</span>' : '<span class="badge red">ปิดใช้งาน</span>'}</div>
      </div>
      <button type="button" class="btn btn-secondary btn-edit-user" style="width:auto;" data-uid="${u.user_uid}">แก้ไข</button>
    </div>
  `;
}

function assignRow(p, users) {
  const assignable = users.filter(u => u.role_code === 'STAFF' || u.role_code === 'ADMIN');
  return `
    <div class="list-item" style="cursor:default;">
      <div>
        <div class="name">${escapeHtml(p.first_name)} ${escapeHtml(p.last_name)}</div>
        <div class="meta">HN: ${escapeHtml(p.hn)} · ผู้รับผิดชอบ: ${p.responsible_staff_name ? escapeHtml(p.responsible_staff_name) : 'ยังไม่ได้มอบหมาย'}</div>
      </div>
      <select class="assign-select" data-uid="${p.patient_uid}" style="width:auto;max-width:160px;">
        <option value="">- ไม่ระบุ -</option>
        ${assignable.map(u => `<option value="${u.user_uid}" ${p.responsible_staff === u.user_uid ? 'selected' : ''}>${escapeHtml(u.display_name)}</option>`).join('')}
      </select>
    </div>
  `;
}

function openUserModal(app, user) {
  const isEdit = !!user;
  const wrap = document.createElement('div');
  wrap.className = 'card';
  wrap.style.cssText = 'position:fixed;inset:14px;top:auto;bottom:74px;max-height:80vh;overflow:auto;z-index:50;';
  wrap.innerHTML = `
    <button type="button" class="modal-close" id="btnClose" aria-label="ปิด">✕</button>
    <h2 style="padding-right:34px;">${isEdit ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งาน'}</h2>
    <form id="userForm">
      <div class="two-col">
        <div class="field"><label>ชื่อผู้ใช้ *</label><input name="username" required ${isEdit ? 'readonly' : ''} value="${isEdit ? escapeHtml(user.username) : ''}" /></div>
        <div class="field"><label>ชื่อที่แสดง *</label><input name="display_name" required value="${isEdit ? escapeHtml(user.display_name) : ''}" /></div>
      </div>
      <div class="two-col">
        <div class="field"><label>อีเมล</label><input name="email" type="email" value="${isEdit ? escapeHtml(user.email || '') : ''}" /></div>
        <div class="field"><label>เบอร์โทร</label><input name="phone" value="${isEdit ? escapeHtml(user.phone || '') : ''}" /></div>
      </div>
      <div class="two-col">
        <div class="field"><label>สิทธิ์ *</label>
          <select name="role_code" required>
            ${Object.entries(ROLE_LABELS).map(([code, label]) => `<option value="${code}" ${isEdit && user.role_code === code ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>หน่วยงาน</label><input name="unit_name" value="${isEdit ? escapeHtml(user.unit_name || '') : ''}" /></div>
      </div>
      <div class="field"><label>${isEdit ? 'ตั้งรหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน *'}</label><input name="password" type="password" ${isEdit ? '' : 'required'} /></div>
      ${isEdit ? `<div class="field checkbox"><input type="checkbox" name="is_active" id="isActive" ${user.is_active !== false ? 'checked' : ''} /><label for="isActive" style="margin:0;">ใช้งานอยู่</label></div>` : ''}
      <div class="btn-row">
        <button type="button" class="btn btn-secondary" id="btnCancel">ยกเลิก</button>
        <button type="submit" class="btn btn-primary">บันทึก</button>
      </div>
    </form>
  `;
  document.body.appendChild(wrap);
  wrap.querySelector('#btnClose').onclick = () => wrap.remove();
  wrap.querySelector('#btnCancel').onclick = () => wrap.remove();
  wrap.querySelector('#userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    data.is_active = isEdit ? fd.has('is_active') : true;
    if (!data.password) delete data.password;
    if (isEdit) data.user_uid = user.user_uid;
    const res = await call(isEdit ? 'updateUser' : 'createUser', data);
    if (!res.success) { toast(res.message); return; }
    toast(isEdit ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มผู้ใช้งานแล้ว');
    wrap.remove();
    render(app);
  });
}
