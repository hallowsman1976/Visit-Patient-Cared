import { call } from '../api.js';
import { navigate } from '../router.js';
import { toast, debounce, escapeHtml } from '../utils.js';
import { getSession } from '../state.js';

let mode = 'hn';

export async function render(app) {
  const session = getSession();
  const canCreate = session.roleCode === 'ADMIN' || session.roleCode === 'STAFF';

  app.innerHTML = `
    <div class="container">
      <div class="card">
        <h2>ค้นหาผู้ป่วย</h2>
        <div class="search-tabs">
          <div class="search-tab ${mode === 'hn' ? 'active' : ''}" data-mode="hn">HN</div>
          <div class="search-tab ${mode === 'cid' ? 'active' : ''}" data-mode="cid">CID</div>
          <div class="search-tab ${mode === 'name' ? 'active' : ''}" data-mode="name">ชื่อ-สกุล</div>
        </div>
        <div class="search-box">
          <input id="q" placeholder="${placeholder()}" inputmode="${mode === 'name' ? 'text' : 'numeric'}" />
          <button class="btn btn-primary" style="width:auto;" id="btnSearch">ค้นหา</button>
        </div>
      </div>
      <div id="results"></div>
      ${canCreate ? `<button class="btn btn-secondary" id="btnNew">＋ เพิ่มผู้ป่วยใหม่</button>` : ''}
    </div>
  `;

  function placeholder() {
    return mode === 'hn' ? 'กรอก HN เช่น HN0001' : mode === 'cid' ? 'กรอกเลขบัตรประชาชน 13 หลัก' : 'กรอกชื่อหรือนามสกุล';
  }

  app.querySelectorAll('.search-tab').forEach(tab => {
    tab.onclick = () => { mode = tab.dataset.mode; render(app); };
  });

  const doSearch = async () => {
    const q = app.querySelector('#q').value.trim();
    if (!q) return;
    const payload = mode === 'hn' ? { hn: q } : mode === 'cid' ? { cid: q } : { name: q };
    const res = await call('searchPatient', payload);
    renderResults(res);
  };

  app.querySelector('#btnSearch').onclick = doSearch;
  app.querySelector('#q').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  app.querySelector('#q').addEventListener('input', debounce(doSearch, 500));

  function renderResults(res) {
    const box = app.querySelector('#results');
    if (!res.success) { box.innerHTML = `<div class="card">${escapeHtml(res.message)}</div>`; return; }
    const list = res.data || [];
    if (!list.length) { box.innerHTML = `<div class="empty-state">ไม่พบข้อมูล</div>`; return; }
    box.innerHTML = list.map(p => `
      <div class="list-item" data-uid="${p.patient_uid}">
        <div>
          <div class="name">${escapeHtml(p.first_name)} ${escapeHtml(p.last_name)}</div>
          <div class="meta">HN: ${escapeHtml(p.hn)} · CID: ${escapeHtml(p.cid_masked)} · อายุ ${p.age_year ?? '-'} ปี</div>
          <div class="meta">${escapeHtml(p.village_name || '')} ${escapeHtml(p.subdistrict || '')} ${badgeDependency(p.dependency_level)}</div>
        </div>
        <div class="chev">›</div>
      </div>
    `).join('');
    box.querySelectorAll('.list-item').forEach(item => {
      item.onclick = () => navigate('/patient', { uid: item.dataset.uid });
    });
  }

  const newBtn = app.querySelector('#btnNew');
  if (newBtn) newBtn.onclick = () => openCreateModal(app);
}

function badgeDependency(level) {
  const map = { social: ['ติดสังคม', 'green'], home: ['ติดบ้าน', 'orange'], bed: ['ติดเตียง', 'red'] };
  const m = map[level] || [level || '-', 'gray'];
  return `<span class="badge ${m[1]}">${m[0]}</span>`;
}

function openCreateModal(app) {
  const wrap = document.createElement('div');
  wrap.className = 'card';
  wrap.style.cssText = 'position:fixed;inset:14px;top:auto;bottom:74px;max-height:80vh;overflow:auto;z-index:50;';
  wrap.innerHTML = `
    <h2>เพิ่มผู้ป่วยใหม่</h2>
    <form id="newPatientForm">
      <div class="two-col">
        <div class="field"><label>HN *</label><input name="hn" required /></div>
        <div class="field"><label>CID (13 หลัก) *</label><input name="cid" required maxlength="13" pattern="\\d{13}" /></div>
      </div>
      <div class="two-col">
        <div class="field"><label>ชื่อ *</label><input name="first_name" required /></div>
        <div class="field"><label>นามสกุล *</label><input name="last_name" required /></div>
      </div>
      <div class="two-col">
        <div class="field"><label>เพศ</label><select name="sex"><option value="male">ชาย</option><option value="female">หญิง</option></select></div>
        <div class="field"><label>วันเกิด (ค.ศ.)</label><input name="birth_date" type="date" /></div>
      </div>
      <div class="field"><label>ระดับการพึ่งพา</label>
        <select name="dependency_level">
          <option value="social">ติดสังคม</option><option value="home">ติดบ้าน</option><option value="bed">ติดเตียง</option>
        </select>
      </div>
      <div class="field"><label>วินิจฉัยหลัก</label><input name="main_diagnosis" /></div>
      <div class="btn-row">
        <button type="button" class="btn btn-secondary" id="btnCancel">ยกเลิก</button>
        <button type="submit" class="btn btn-primary">บันทึก</button>
      </div>
    </form>
  `;
  document.body.appendChild(wrap);
  wrap.querySelector('#btnCancel').onclick = () => wrap.remove();
  wrap.querySelector('#newPatientForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const res = await call('createPatient', data);
    if (!res.success) { toast(res.message); return; }
    if (res.data.duplicate) {
      toast(res.data.message);
      wrap.remove();
      navigate('/patient', { uid: res.data.existingPatient.patient_uid });
      return;
    }
    toast('เพิ่มผู้ป่วยสำเร็จ');
    wrap.remove();
    navigate('/patient', { uid: res.data.patient_uid });
  });
}
