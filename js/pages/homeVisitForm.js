import { call } from '../api.js';
import { navigate } from '../router.js';
import { toast, todayYmd, fileToDataUrl, compressImage, escapeHtml } from '../utils.js';
import { ADL_FIELDS, INHOMESS_STEPS } from '../formSchema.js';

// เพจนี้ครอบคลุมฟอร์มเยี่ยมบ้าน 14 ขั้นตอนตาม docs/blueprint.md ข้อ 9.5
const STEPS = [
  { id: 'info', title: '1. ข้อมูลการเยี่ยม' },
  { id: 'adl', title: '2. ADL/Barthel' },
  ...INHOMESS_STEPS.map((d, i) => ({ id: d.code, title: `${i + 3}. ${d.title}`, domain: d })),
  { id: 'problems', title: '12. ปัญหา/แผน/ส่งต่อ/นัด' },
  { id: 'attachments', title: '13. แนบรูป/เอกสาร' },
  { id: 'summary', title: '14. สรุปก่อนบันทึก' }
];

let ctx = null; // { patientUid, visitUid, stepIndex, lookups, visitData }

export async function render(app, params) {
  ctx = { patientUid: params.patient_uid, visitUid: params.visit_uid || null, stepIndex: 0, lookups: {}, visitData: null, drugs: [] };
  const [lookupsRes, drugsRes] = await Promise.all([
    call('getLookups', {}),
    call('getDrugList', {})
  ]);
  ctx.lookups = lookupsRes.data || {};
  ctx.drugs = (drugsRes && drugsRes.success && Array.isArray(drugsRes.data)) ? drugsRes.data : [];

  if (ctx.visitUid) {
    const res = await call('getHomeVisit', { visit_uid: ctx.visitUid });
    if (res.success) ctx.visitData = res.data;
  }

  renderShell(app);
}

function renderShell(app) {
  app.innerHTML = `
    <div class="container">
      <div class="stepper-head" id="stepperHead"></div>
      <div id="stepBody"></div>
      <div class="btn-row">
        <button class="btn btn-secondary" id="btnPrev">‹ ก่อนหน้า</button>
        <button class="btn btn-primary" id="btnNext">ถัดไป ›</button>
      </div>
    </div>
  `;
  renderStepperHead(app);
  renderCurrentStep(app);

  app.querySelector('#btnPrev').onclick = () => { if (ctx.stepIndex > 0) { ctx.stepIndex--; renderShell(app); } };
  app.querySelector('#btnNext').onclick = () => { if (ctx.stepIndex < STEPS.length - 1) { ctx.stepIndex++; renderShell(app); } };
}

function renderStepperHead(app) {
  const head = app.querySelector('#stepperHead');
  head.innerHTML = STEPS.map((s, i) => {
    const done = isStepDone(s);
    return `<div class="step-chip ${i === ctx.stepIndex ? 'active' : ''} ${done ? 'done' : ''}" data-i="${i}">${s.title}</div>`;
  }).join('');
  head.querySelectorAll('.step-chip').forEach(chip => {
    chip.onclick = () => { ctx.stepIndex = Number(chip.dataset.i); renderShell(app); };
  });
}

function isStepDone(step) {
  if (!ctx.visitData) return false;
  if (step.id === 'info') return true;
  if (step.id === 'adl') return !!ctx.visitData.adl;
  if (step.id === 'attachments') return (ctx.visitData.attachments || []).length > 0;
  if (step.domain) return !!(ctx.visitData.inhomess || {})[step.id];
  return false;
}

function renderCurrentStep(app) {
  const body = app.querySelector('#stepBody');
  const step = STEPS[ctx.stepIndex];
  if (step.id === 'info') return renderInfoStep(body);
  if (step.id === 'adl') return renderAdlStep(body);
  if (step.domain) return renderDomainStep(body, step.domain);
  if (step.id === 'problems') return renderProblemsStep(body);
  if (step.id === 'attachments') return renderAttachmentsStep(body);
  if (step.id === 'summary') return renderSummaryStep(body);
}

// ---------- Step 1: ข้อมูลการเยี่ยม ----------
function renderInfoStep(body) {
  const v = (ctx.visitData && ctx.visitData.visit) || {};
  body.innerHTML = `
    <div class="card">
      <h2>ข้อมูลการเยี่ยมบ้าน</h2>
      <form id="infoForm">
        <div class="two-col">
          <div class="field"><label>วันที่เยี่ยม *</label><input name="visit_date" type="date" value="${v.visit_date || todayYmd()}" required /></div>
          <div class="field"><label>ประเภทการเยี่ยม *</label>
            <select name="visit_type" required>${selectOptions('visit_type', v.visit_type)}</select>
          </div>
        </div>
        <div class="field"><label>ผู้เยี่ยมหลัก *</label><input name="visitor_name" value="${escapeHtml(v.visitor_name || '')}" required /></div>
        <div class="field"><label>สภาพทั่วไปของผู้ป่วย</label><textarea name="patient_condition">${escapeHtml(v.patient_condition || '')}</textarea></div>
        <div class="field"><label>ปัญหาหลัก/ข้อกังวล</label><textarea name="chief_concern">${escapeHtml(v.chief_concern || '')}</textarea></div>
        <div class="field checkbox">
          <input type="checkbox" name="red_flag" id="redFlagChk" ${v.red_flag ? 'checked' : ''} />
          <label for="redFlagChk" style="margin:0;">พบสัญญาณอันตราย (Red flag)</label>
        </div>
        <div class="field" id="redFlagDetailWrap" style="${v.red_flag ? '' : 'display:none;'}">
          <label>รายละเอียด Red flag *</label>
          <textarea name="red_flag_detail">${escapeHtml(v.red_flag_detail || '')}</textarea>
        </div>
        <button class="btn btn-primary" type="submit">${ctx.visitUid ? 'บันทึกข้อมูลการเยี่ยม' : 'เริ่มบันทึกการเยี่ยม'}</button>
      </form>
    </div>
  `;
  const chk = body.querySelector('#redFlagChk');
  chk.onchange = () => { body.querySelector('#redFlagDetailWrap').style.display = chk.checked ? '' : 'none'; };

  body.querySelector('#infoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.red_flag = !!e.target.red_flag.checked;
    if (data.red_flag && !data.red_flag_detail) { toast('กรุณาระบุรายละเอียด Red flag'); return; }

    let res;
    if (ctx.visitUid) {
      res = await call('updateHomeVisit', Object.assign({ visit_uid: ctx.visitUid, patient_uid: ctx.patientUid }, data));
    } else {
      res = await call('createHomeVisit', Object.assign({ patient_uid: ctx.patientUid }, data));
      if (res.success) ctx.visitUid = res.data.visit_uid;
    }
    if (!res.success) { toast(res.message); return; }
    toast('บันทึกแล้ว');
    const refreshed = await call('getHomeVisit', { visit_uid: ctx.visitUid });
    if (refreshed.success) ctx.visitData = refreshed.data;
    ctx.stepIndex = 1;
    renderShell(document.getElementById('app'));
  });
}

// ---------- Step 2: ADL ----------
function renderAdlStep(body) {
  if (!ctx.visitUid) return needVisitFirst(body);
  const existing = (ctx.visitData && ctx.visitData.adl) || {};
  body.innerHTML = `
    <div class="card">
      <h2>ADL / Barthel Index</h2>
      <form id="adlForm">
        ${ADL_FIELDS.map(f => fieldHtml(f, existing[f.key])).join('')}
        <div class="hint">คะแนนรวมและการแปลผลจะคำนวณอัตโนมัติ</div>
        <button class="btn btn-primary" type="submit">บันทึก ADL</button>
      </form>
    </div>
  `;
  bindGenericForm(body, '#adlForm', async (data) => {
    return call('saveADL', Object.assign({ visit_uid: ctx.visitUid, patient_uid: ctx.patientUid }, data));
  });
}

// ---------- Step 3-11: INHOMESS domains ----------
function renderDomainStep(body, domain) {
  if (!ctx.visitUid) return needVisitFirst(body);
  const existing = (ctx.visitData && ctx.visitData.inhomess && ctx.visitData.inhomess[domain.code]) || {};
  body.innerHTML = `
    <div class="card">
      <h2>${domain.title}</h2>
      <div class="hint" style="margin-bottom:10px;">${domain.subtitle}</div>
      <form id="domainForm">
        ${domain.fields.map(f => fieldHtml(f, existing[f.key])).join('')}
        <button class="btn btn-primary" type="submit">บันทึกหมวด ${domain.code}</button>
      </form>
    </div>
  `;
  if (domain.code === 'N') setupBmiLiveCalc(body);
  if (domain.code === 'M') setupMedicationPicker(body);
  bindGenericForm(body, '#domainForm', async (data) => {
    return call('saveINHOMESS', { domain: domain.code, visit_uid: ctx.visitUid, patient_uid: ctx.patientUid, fields: data });
  });
}

// N: คำนวณ BMI สดจากน้ำหนัก/ส่วนสูง พร้อมแปลผลภาวะโภชนาการ (เกณฑ์เดียวกับ backend interpretBmi_)
function calcBmi(weightKg, heightCm) {
  const w = Number(weightKg), h = Number(heightCm);
  if (!w || !h) return null;
  const m = h / 100;
  return Math.round((w / (m * m)) * 10) / 10;
}

function interpretBmi(bmi) {
  if (bmi == null) return null;
  if (bmi < 18.5) return { text: 'ผอม / น้ำหนักน้อย', color: 'orange' };
  if (bmi < 23) return { text: 'ปกติ (สมส่วน)', color: 'green' };
  if (bmi < 25) return { text: 'น้ำหนักเกิน', color: 'orange' };
  if (bmi < 30) return { text: 'อ้วนระดับ 1', color: 'red' };
  return { text: 'อ้วนระดับ 2', color: 'red' };
}

function setupBmiLiveCalc(body) {
  const form = body.querySelector('#domainForm');
  const w = form.querySelector('[name=weight_kg]');
  const h = form.querySelector('[name=height_cm]');
  if (!w || !h) return;
  const disp = document.createElement('div');
  disp.className = 'bmi-result';
  h.closest('.field').insertAdjacentElement('afterend', disp);
  const update = () => {
    const bmi = calcBmi(w.value, h.value);
    if (bmi == null) {
      disp.innerHTML = `<span class="bmi-empty">กรอกน้ำหนักและส่วนสูงเพื่อคำนวณ BMI อัตโนมัติ</span>`;
      return;
    }
    const interp = interpretBmi(bmi);
    disp.innerHTML = `<div class="bmi-value">BMI = <b>${bmi}</b> กก./ม.²</div><span class="badge ${interp.color}">${interp.text}</span>`;
  };
  w.addEventListener('input', update);
  h.addEventListener('input', update);
  update();
}

// M: ตัวเลือกยาแบบค้นหา (Select2-style) จากคลังยา (ชีต Drug) + ปุ่มเพิ่มยา
function setupMedicationPicker(body) {
  const form = body.querySelector('#domainForm');
  const medField = form.querySelector('[name=current_medications]');
  const countField = form.querySelector('[name=medications_count]');
  if (!medField) return;

  let meds = String(medField.value || '').split('\n').map(s => s.trim()).filter(Boolean);
  medField.readOnly = true;
  const medLabel = medField.closest('.field').querySelector('label');
  if (medLabel) medLabel.textContent = 'รายการยาปัจจุบัน (เพิ่มจากช่องค้นหาด้านบน)';
  if (countField) countField.readOnly = true;

  const picker = document.createElement('div');
  picker.className = 'med-picker field';
  picker.innerHTML = `
    <label>เพิ่มรายการยา (ค้นหาจากคลังยา)</label>
    <div class="med-search-row">
      <div class="med-combo">
        <input type="text" id="drugSearch" placeholder="พิมพ์ชื่อยาเพื่อค้นหา หรือพิมพ์ชื่อยาที่ไม่มีในคลัง" autocomplete="off" />
        <div class="med-options" id="drugOptions" hidden></div>
      </div>
      <button type="button" class="btn btn-secondary" id="btnAddMed" style="width:auto;">＋ เพิ่มยา</button>
    </div>
    <div class="med-chips" id="medChips"></div>
    <div class="hint">${ctx.drugs.length ? 'คลังยามี ' + ctx.drugs.length + ' รายการ' : 'ยังไม่พบคลังยา (ชีต Drug) — พิมพ์ชื่อยาเพื่อเพิ่มได้'}</div>
  `;
  medField.closest('.field').insertAdjacentElement('beforebegin', picker);

  const search = picker.querySelector('#drugSearch');
  const optionsBox = picker.querySelector('#drugOptions');
  const chips = picker.querySelector('#medChips');
  const addBtn = picker.querySelector('#btnAddMed');

  const syncSink = () => {
    medField.value = meds.join('\n');
    if (countField) countField.value = meds.length;
  };
  const renderChips = () => {
    chips.innerHTML = meds.length
      ? meds.map((m, i) => `<span class="med-chip">${escapeHtml(m)}<button type="button" data-i="${i}" aria-label="ลบ">✕</button></span>`).join('')
      : '<span class="med-empty">ยังไม่มีรายการยา</span>';
    chips.querySelectorAll('button[data-i]').forEach(b => {
      b.onclick = () => { meds.splice(Number(b.dataset.i), 1); renderChips(); syncSink(); };
    });
  };
  const addMed = (name) => {
    name = String(name || '').trim();
    if (!name) return;
    if (meds.some(m => m.toLowerCase() === name.toLowerCase())) { toast('มียานี้ในรายการแล้ว'); return; }
    meds.push(name); renderChips(); syncSink();
    search.value = ''; optionsBox.hidden = true; search.focus();
  };
  const renderOptions = () => {
    const q = search.value.trim().toLowerCase();
    let list = ctx.drugs.filter(d => !meds.includes(d));
    if (q) list = list.filter(d => String(d).toLowerCase().includes(q));
    list = list.slice(0, 40);
    if (!list.length) { optionsBox.hidden = true; return; }
    optionsBox.innerHTML = list.map(d => `<div class="med-option" data-drug="${escapeHtml(d)}">${escapeHtml(d)}</div>`).join('');
    optionsBox.hidden = false;
    optionsBox.querySelectorAll('.med-option').forEach(o => { o.onclick = () => addMed(o.dataset.drug); });
  };
  search.addEventListener('input', renderOptions);
  search.addEventListener('focus', renderOptions);
  search.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addMed(search.value); } });
  search.addEventListener('blur', () => setTimeout(() => { optionsBox.hidden = true; }, 150));
  addBtn.onclick = () => addMed(search.value);

  renderChips();
  syncSink();
}

// ---------- Step 12: ปัญหา/แผนดูแล/ส่งต่อ/นัด ----------
function renderProblemsStep(body) {
  if (!ctx.visitUid) return needVisitFirst(body);
  const v = (ctx.visitData && ctx.visitData.visit) || {};
  const problems = (ctx.visitData && ctx.visitData.problems) || [];
  const referrals = (ctx.visitData && ctx.visitData.referrals) || [];

  body.innerHTML = `
    <div class="card">
      <h2>นัดครั้งถัดไป</h2>
      <form id="nextVisitForm">
        <div class="two-col">
          <div class="field"><label>วันที่นัดครั้งถัดไป</label><input name="next_visit_date" type="date" value="${v.next_visit_date || ''}" /></div>
          <div class="field"><label>วัตถุประสงค์</label><input name="next_visit_purpose" value="${escapeHtml(v.next_visit_purpose || '')}" /></div>
        </div>
        <button class="btn btn-secondary" type="submit">บันทึกนัดครั้งถัดไป</button>
      </form>
    </div>

    <div class="card">
      <h2>ปัญหา/ความเสี่ยงที่พบ</h2>
      ${problems.map(p => `<div class="list-item"><div><div class="name">${escapeHtml(p.problem_detail)}</div><div class="meta">หมวด ${p.domain_code} · ${p.severity}${p.is_red_flag ? ' · <span class="badge red">Red flag</span>' : ''}</div></div></div>`).join('') || '<div class="hint">ยังไม่มีรายการ</div>'}
      <form id="problemForm" class="block-mt">
        <div class="field"><label>หมวด</label>
          <select name="domain_code"><option>I</option><option>N</option><option>H</option><option>O</option><option>M</option><option>E</option><option>S1</option><option>S2</option><option>S3</option></select>
        </div>
        <div class="field"><label>รายละเอียดปัญหา</label><textarea name="problem_detail" required></textarea></div>
        <div class="two-col">
          <div class="field"><label>ความรุนแรง</label><select name="severity">${selectOptions('problem_severity')}</select></div>
          <div class="field checkbox"><input type="checkbox" name="is_red_flag" id="isRedFlagChk" /><label for="isRedFlagChk" style="margin:0;">เป็น Red flag</label></div>
        </div>
        <button class="btn btn-secondary" type="submit">＋ เพิ่มปัญหา</button>
      </form>
    </div>

    <div class="card">
      <h2>การส่งต่อ</h2>
      ${referrals.map(r => `<div class="list-item"><div><div class="name">${escapeHtml(r.refer_to)}</div><div class="meta">${escapeHtml(r.reason)} · ${r.urgency}</div></div></div>`).join('') || '<div class="hint">ยังไม่มีรายการ</div>'}
      <form id="referralForm" class="block-mt">
        <div class="field"><label>ส่งต่อไปยัง</label><input name="refer_to" required /></div>
        <div class="field"><label>เหตุผล</label><textarea name="reason" required></textarea></div>
        <div class="two-col">
          <div class="field"><label>ความเร่งด่วน</label><select name="urgency">${selectOptions('referral_urgency')}</select></div>
          <div class="field"><label>วันที่ส่งต่อ</label><input name="referral_date" type="date" value="${todayYmd()}" /></div>
        </div>
        <button class="btn btn-secondary" type="submit">＋ เพิ่มการส่งต่อ</button>
      </form>
    </div>
  `;

  bindGenericForm(body, '#nextVisitForm', (data) => call('updateHomeVisit', { visit_uid: ctx.visitUid, patient_uid: ctx.patientUid, next_visit_date: data.next_visit_date, next_visit_purpose: data.next_visit_purpose }));
  bindGenericForm(body, '#problemForm', (data) => {
    data.is_red_flag = !!body.querySelector('[name=is_red_flag]').checked;
    return call('saveVisitProblem', Object.assign({ visit_uid: ctx.visitUid, patient_uid: ctx.patientUid }, data));
  }, true);
  bindGenericForm(body, '#referralForm', (data) => call('saveReferral', Object.assign({ visit_uid: ctx.visitUid, patient_uid: ctx.patientUid }, data)), true);
}

// ---------- Step 13: แนบรูป/เอกสาร ----------
function renderAttachmentsStep(body) {
  if (!ctx.visitUid) return needVisitFirst(body);
  const attachments = (ctx.visitData && ctx.visitData.attachments) || [];
  body.innerHTML = `
    <div class="card">
      <h2>แนบรูป/เอกสาร</h2>
      ${attachments.map(a => `<div class="attach-row"><img src="${a.drive_file_url}" onerror="this.style.display='none'"/><div>${escapeHtml(a.file_category)}</div></div>`).join('')}
      <div class="field checkbox">
        <input type="checkbox" id="consentChk" />
        <label for="consentChk" style="margin:0;">ยืนยันได้รับความยินยอมจากผู้ป่วย/ญาติในการถ่ายภาพ</label>
      </div>
      <div class="field">
        <label>ประเภทไฟล์</label>
        <select id="fileCategory">
          <option value="home_photo">รูปบ้าน</option>
          <option value="wound_photo">รูปแผล</option>
          <option value="genogram">ผังเครือญาติ</option>
          <option value="document">เอกสาร</option>
          <option value="other">อื่น ๆ</option>
        </select>
      </div>
      <div class="field">
        <label>ถ่ายภาพ/เลือกไฟล์</label>
        <input type="file" id="fileInput" accept="image/*" capture="environment" />
      </div>
      <div id="preview"></div>
    </div>
  `;
  body.querySelector('#fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!body.querySelector('#consentChk').checked) { toast('กรุณายืนยันการยินยอมก่อนแนบไฟล์'); e.target.value = ''; return; }
    const raw = await fileToDataUrl(file);
    const compressed = await compressImage(raw);
    body.querySelector('#preview').innerHTML = `<img class="photo-thumb" src="${compressed}" />`;
    const res = await call('uploadAttachment', {
      patient_uid: ctx.patientUid, visit_uid: ctx.visitUid,
      file_category: body.querySelector('#fileCategory').value,
      consent_confirmed: true, dataUrl: compressed
    });
    if (!res.success) { toast(res.message); return; }
    toast('อัปโหลดสำเร็จ');
    const refreshed = await call('getHomeVisit', { visit_uid: ctx.visitUid });
    if (refreshed.success) { ctx.visitData = refreshed.data; renderCurrentStep(document.getElementById('app')); }
  });
}

// ---------- Step 14: สรุป ----------
function renderSummaryStep(body) {
  if (!ctx.visitUid) return needVisitFirst(body);
  const v = ctx.visitData.visit;
  body.innerHTML = `
    <div class="card">
      <h2>สรุปก่อนบันทึก</h2>
      <div style="font-size:13px;line-height:2;">
        สถานะการเยี่ยม: ${statusBadge(v.visit_status)}<br/>
        ADL: ${ctx.visitData.adl ? 'บันทึกแล้ว (' + ctx.visitData.adl.adl_total + ' คะแนน)' : '<span class="badge orange">ยังไม่ครบ</span>'}<br/>
        ${INHOMESS_STEPS.map(d => `${d.code}: ${ctx.visitData.inhomess[d.code] ? '<span class="badge green">ครบ</span>' : '<span class="badge orange">ยังไม่ครบ</span>'}`).join(' &nbsp; ')}
      </div>
      <div class="divider"></div>
      <button class="btn btn-success" id="btnFinish">เสร็จสิ้น กลับหน้าโปรไฟล์ผู้ป่วย</button>
    </div>
  `;
  body.querySelector('#btnFinish').onclick = () => { toast('บันทึกเรียบร้อย'); navigate('/patient', { uid: ctx.patientUid }); };
}

function statusBadge(status) {
  const map = { draft: ['ฉบับร่าง', 'gray'], completed: ['เสร็จสิ้น', 'green'], reviewed: ['ตรวจทานแล้ว', 'blue'], cancelled: ['ยกเลิก', 'gray'] };
  const m = map[status] || [status, 'gray'];
  return `<span class="badge ${m[1]}">${m[0]}</span>`;
}

function needVisitFirst(body) {
  body.innerHTML = `<div class="empty-state">กรุณากรอกและบันทึก "ข้อมูลการเยี่ยม" (ขั้นตอนที่ 1) ก่อน</div>`;
}

// ---------- generic field/form helpers ----------
function fieldHtml(f, value) {
  value = value == null ? '' : value;
  if (f.type === 'boolean') {
    return `<div class="field checkbox"><input type="checkbox" name="${f.key}" id="f_${f.key}" ${value === true || value === 'true' ? 'checked' : ''} /><label for="f_${f.key}" style="margin:0;">${f.label}</label></div>`;
  }
  if (f.type === 'textarea') {
    return `<div class="field"><label>${f.label}</label><textarea name="${f.key}">${escapeHtml(value)}</textarea></div>`;
  }
  if (f.type === 'number') {
    return `<div class="field"><label>${f.label}</label><input type="number" step="any" name="${f.key}" value="${escapeHtml(value)}" /></div>`;
  }
  if (f.type === 'select') {
    const opts = f.lookupGroup ? selectOptions(f.lookupGroup, value) : plainOptions(f.options, value);
    return `<div class="field"><label>${f.label}</label><select name="${f.key}"><option value="">-</option>${opts}</select></div>`;
  }
  return `<div class="field"><label>${f.label}</label><input name="${f.key}" value="${escapeHtml(value)}" /></div>`;
}

function plainOptions(options, current) {
  return (options || []).map(o => {
    // รองรับทั้ง option แบบค่าเดี่ยว (เช่น 0/5/10 หรือสตริงของหมวด INHOMESS) และแบบ { value, label } ที่มีคำอธิบาย
    const isObj = o && typeof o === 'object';
    const val = isObj ? o.value : o;
    const text = isObj ? o.label : (String(o) + (typeof o === 'number' ? ' คะแนน' : ''));
    return `<option value="${escapeHtml(val)}" ${String(current) === String(val) ? 'selected' : ''}>${escapeHtml(text)}</option>`;
  }).join('');
}

function selectOptions(group, current) {
  const list = ctx.lookups[group] || [];
  return list.map(o => `<option value="${o.key}" ${current === o.key ? 'selected' : ''}>${escapeHtml(o.th)}</option>`).join('');
}

function bindGenericForm(root, selector, onSubmit, resetAfter) {
  const form = root.querySelector(selector);
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = collectFormData(form);
    const res = await onSubmit(data);
    if (!res.success) { toast(res.message); return; }
    toast('บันทึกแล้ว');
    if (resetAfter) form.reset();
    const refreshed = await call('getHomeVisit', { visit_uid: ctx.visitUid });
    if (refreshed.success) { ctx.visitData = refreshed.data; if (!resetAfter) renderCurrentStep(document.getElementById('app')); else renderCurrentStep(document.getElementById('app')); }
  });
}

function collectFormData(form) {
  const data = Object.fromEntries(new FormData(form));
  Array.from(form.querySelectorAll('input[type=checkbox]')).forEach(chk => { data[chk.name] = chk.checked; });
  return data;
}
