import { call } from '../api.js';
import { navigate } from '../router.js';
import { formatThaiDate, escapeHtml, toast } from '../utils.js';
import { getSession } from '../state.js';

export async function render(app, params) {
  const uid = params.uid;
  const res = await call('getPatientProfile', { patient_uid: uid });
  if (!res.success) {
    app.innerHTML = `<div class="container"><div class="card">${escapeHtml(res.message)}</div></div>`;
    return;
  }
  const d = res.data;
  const p = d.patient;
  const session = getSession();
  const canEdit = session.roleCode === 'ADMIN' || session.roleCode === 'STAFF';

  app.innerHTML = `
    <div class="container">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-size:18px;font-weight:700;">${escapeHtml(p.first_name)} ${escapeHtml(p.last_name)}</div>
            <div style="font-size:13px;color:var(--gray-500);">HN: ${escapeHtml(p.hn)} · CID: ${escapeHtml(p.cid_masked)}</div>
          </div>
          ${badgeDependency(p.dependency_level)}
        </div>
        <div class="divider"></div>
        <div style="font-size:13px;line-height:1.9;">
          อายุ: ${p.age_year ?? '-'} ปี &nbsp;|&nbsp; เพศ: ${p.sex === 'male' ? 'ชาย' : p.sex === 'female' ? 'หญิง' : '-'}<br/>
          วินิจฉัยหลัก: ${escapeHtml(p.main_diagnosis || '-')}<br/>
          โรคร่วม: ${escapeHtml(p.comorbidity || '-')}<br/>
          แพ้ยา/อาหาร: ${escapeHtml(p.allergy || '-')}
        </div>
      </div>

      <div class="card">
        <h2>ที่อยู่</h2>
        ${d.household ? `<div style="font-size:13px;">${escapeHtml(d.household.village_name || '')} ต.${escapeHtml(d.household.subdistrict || '-')} อ.${escapeHtml(d.household.district || '-')} จ.${escapeHtml(d.household.province || '-')}</div>` : '<div class="empty-state">ยังไม่มีข้อมูลที่อยู่</div>'}
      </div>

      <div class="card">
        <h2>ผู้ดูแลหลัก</h2>
        ${(d.caregivers || []).length ? d.caregivers.map(c => `<div style="font-size:13px;margin-bottom:4px;">${escapeHtml(c.caregiver_name)} (${escapeHtml(c.relationship || '-')}) ${c.is_main_caregiver ? '<span class="badge blue">หลัก</span>' : ''}</div>`).join('') : '<div class="empty-state">ยังไม่มีข้อมูลผู้ดูแล</div>'}
      </div>

      <div class="card">
        <h2>สรุปการดูแล</h2>
        <div style="font-size:13px;line-height:1.9;">
          จำนวนครั้งที่เยี่ยม: ${d.visitCount}<br/>
          ADL ล่าสุด: ${d.latestAdl ? d.latestAdl.adl_total + ' คะแนน (' + d.latestAdl.adl_interpretation + ')' : '-'}<br/>
          ปัญหาที่ยังไม่ปิด: ${d.openProblems.length} รายการ ${d.openProblems.some(pr => pr.is_red_flag) ? '<span class="badge red">Red flag</span>' : ''}<br/>
          นัดครั้งถัดไป: ${d.nextVisitPlan ? formatThaiDate(d.nextVisitPlan.planned_date) + ' — ' + escapeHtml(d.nextVisitPlan.purpose || '') : 'ยังไม่มีนัด'}
        </div>
      </div>

      <div class="btn-row">
        ${canEdit ? `<button class="btn btn-primary" id="btnNewVisit">＋ เยี่ยมบ้านครั้งใหม่</button>` : ''}
        <button class="btn btn-secondary" id="btnHistory">ดูประวัติเยี่ยมทั้งหมด</button>
      </div>
    </div>
  `;

  app.querySelector('#btnHistory').onclick = () => navigate('/visits', { patient_uid: uid });
  const newVisitBtn = app.querySelector('#btnNewVisit');
  if (newVisitBtn) newVisitBtn.onclick = () => navigate('/visit-form', { patient_uid: uid });
}

function badgeDependency(level) {
  const map = { social: ['ติดสังคม', 'green'], home: ['ติดบ้าน', 'orange'], bed: ['ติดเตียง', 'red'] };
  const m = map[level] || [level || '-', 'gray'];
  return `<span class="badge ${m[1]}">${m[0]}</span>`;
}
