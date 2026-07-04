// mockData.js — โหมดสาธิต (DEMO MODE) จำลอง backend ทั้งหมดในเบราว์เซอร์ด้วย localStorage
// ใช้ตอนยังไม่ได้ deploy Apps Script จริง (ดู frontend/js/config.js: GAS_URL ว่าง = โหมดนี้)
import { INHOMESS_STEPS } from './formSchema.js';

const DB_KEY = 'ihs_mock_db_v1';

function uid(prefix) { return prefix + '_' + Math.random().toString(36).slice(2, 10); }
function nowIso() { return new Date().toISOString(); }

function seedDb() {
  const patients = [
    { patient_uid: uid('pt'), hn: 'HN0001', cid: '1100000000011', cid_masked: '1-XXXX-XXXXX-XX-1', first_name: 'สมชาย', last_name: 'ใจดี', sex: 'male', dependency_level: 'social', age_year: 51, active_status: 'active', consent_status: 'ยินยอม', main_diagnosis: 'ความดันโลหิตสูง' },
    { patient_uid: uid('pt'), hn: 'HN0002', cid: '1100000000029', cid_masked: '1-XXXX-XXXXX-XX-9', first_name: 'สมหญิง', last_name: 'รักสงบ', sex: 'female', dependency_level: 'home', age_year: 68, active_status: 'active', consent_status: 'ยินยอม', main_diagnosis: 'เบาหวาน' },
    { patient_uid: uid('pt'), hn: 'HN0003', cid: '1100000000037', cid_masked: '1-XXXX-XXXXX-XX-7', first_name: 'สมศักดิ์', last_name: 'มั่นคง', sex: 'male', dependency_level: 'bed', age_year: 85, active_status: 'active', consent_status: 'ยินยอม', main_diagnosis: 'อัมพาตครึ่งซีก' }
  ];

  const households = patients.map(p => ({
    household_uid: uid('hh'), patient_uid: p.patient_uid, is_current: true,
    village_name: 'บ้านตัวอย่าง', subdistrict: 'ตำบลตัวอย่าง', district: 'อำเภอตัวอย่าง', province: 'จังหวัดตัวอย่าง'
  }));

  const caregivers = patients.map(p => ({
    caregiver_uid: uid('cg'), patient_uid: p.patient_uid, caregiver_name: 'ญาติผู้ดูแล (ตัวอย่าง)',
    relationship: 'บุตร', is_main_caregiver: true, phone: '0812345678'
  }));

  const visit1 = {
    visit_uid: uid('visit'), patient_uid: patients[0].patient_uid, visit_no: 1,
    visit_date: nowIso().slice(0, 10), visit_type: 'assessment', visitor_name: 'เจ้าหน้าที่ตัวอย่าง',
    red_flag: false, visit_status: 'completed', created_at: nowIso(), updated_at: nowIso()
  };
  const visit3 = {
    visit_uid: uid('visit'), patient_uid: patients[2].patient_uid, visit_no: 1,
    visit_date: nowIso().slice(0, 10), visit_type: 'assessment', visitor_name: 'เจ้าหน้าที่ตัวอย่าง',
    red_flag: true, red_flag_detail: 'ผู้ป่วยติดเตียง ไม่มีผู้ดูแลตอนกลางคืน', visit_status: 'draft',
    created_at: nowIso(), updated_at: nowIso()
  };

  const adl = [{ adl_uid: uid('adl'), visit_uid: visit1.visit_uid, patient_uid: patients[0].patient_uid, feeding: 10, grooming: 5, transfer: 15, toilet_use: 10, mobility: 15, dressing: 10, stairs: 10, bathing: 5, bowels: 10, bladder: 10, adl_total: 100, adl_interpretation: 'พึ่งตนเองได้' }];

  const inhomess = {};
  INHOMESS_STEPS.forEach(s => { inhomess[s.code] = []; });
  INHOMESS_STEPS.forEach(s => {
    inhomess[s.code].push({ [s.code.toLowerCase() + '_uid']: uid(s.code.toLowerCase()), visit_uid: visit1.visit_uid, patient_uid: patients[0].patient_uid });
  });

  const referrals = [{ referral_uid: uid('ref'), patient_uid: patients[2].patient_uid, refer_to: 'กายภาพบำบัด', reason: 'ผู้ป่วยติดเตียง ต้องการฟื้นฟูสภาพ', urgency: 'soon', referral_date: nowIso().slice(0, 10), status: 'pending' }];

  const problems = [{ problem_uid: uid('prob'), patient_uid: patients[2].patient_uid, visit_uid: visit3.visit_uid, domain_code: 'S1', problem_detail: 'ไม่มีผู้ดูแลตอนกลางคืน เสี่ยงอันตราย', severity: 'urgent', is_red_flag: true, followup_required: true, status: 'open' }];

  const plans = [{ plan_uid: uid('plan'), patient_uid: patients[1].patient_uid, planned_date: nowIso().slice(0, 10), visit_type: 'followup', priority_level: 'medium', purpose: 'ติดตามระดับน้ำตาล', status: 'planned' }];

  return {
    users: [
      { user_uid: 'u_admin', username: 'admin', password: 'admin123', display_name: 'ผู้ดูแลระบบ (สาธิต)', role_code: 'ADMIN', email: '', phone: '', unit_name: '', is_active: true, created_at: nowIso() },
      { user_uid: 'u_staff', username: 'staff', password: 'staff123', display_name: 'เจ้าหน้าที่เยี่ยมบ้าน (สาธิต)', role_code: 'STAFF', email: '', phone: '', unit_name: '', is_active: true, created_at: nowIso() },
      { user_uid: 'u_viewer', username: 'viewer', password: 'viewer123', display_name: 'ผู้บริหาร (สาธิต)', role_code: 'VIEWER', email: '', phone: '', unit_name: '', is_active: true, created_at: nowIso() }
    ],
    patients, households, caregivers,
    visits: [visit1, visit3], adl, inhomess, referrals, problems, plans,
    carePlans: [], attachments: [], auditLogs: []
  };
}

function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  const fresh = seedDb();
  saveDb(fresh);
  return fresh;
}

function saveDb(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

export function resetDemoData() {
  localStorage.removeItem(DB_KEY);
  return loadDb();
}

const ROLE_FLAGS = {
  ADMIN: { can_view_all: true, can_create_patient: true, can_edit_patient: true, can_create_visit: true, can_edit_visit: true, can_delete: true, can_export: true, can_manage_users: true },
  STAFF: { can_view_all: false, can_create_patient: true, can_edit_patient: true, can_create_visit: true, can_edit_visit: true, can_delete: false, can_export: true, can_manage_users: false },
  VIEWER: { can_view_all: true, can_create_patient: false, can_edit_patient: false, can_create_visit: false, can_edit_visit: false, can_delete: false, can_export: false, can_manage_users: false }
};

function maskCid(cid) {
  const s = String(cid || '');
  if (s.length !== 13) return s;
  return s.slice(0, 1) + '-XXXX-XXXXX-XX-' + s.slice(11);
}

function toListItem(db, p) {
  const hh = db.households.find(h => h.patient_uid === p.patient_uid && h.is_current);
  return {
    patient_uid: p.patient_uid, hn: p.hn, cid_masked: p.cid_masked || maskCid(p.cid),
    first_name: p.first_name, last_name: p.last_name, age_year: p.age_year,
    village_name: hh ? hh.village_name : '', subdistrict: hh ? hh.subdistrict : '',
    dependency_level: p.dependency_level, active_status: p.active_status
  };
}

function interpretAdl(total) {
  if (total >= 20) return 'พึ่งตนเองได้';
  if (total >= 12) return 'ช่วยเหลือบางส่วน';
  return 'พึ่งพาผู้อื่นทั้งหมด';
}

const LOOKUPS = {
  sex: [{ key: 'male', th: 'ชาย' }, { key: 'female', th: 'หญิง' }],
  visit_type: [{ key: 'illness', th: 'เจ็บป่วย' }, { key: 'assessment', th: 'ประเมิน' }, { key: 'post_discharge', th: 'หลัง D/C' }, { key: 'followup', th: 'ติดตาม' }, { key: 'palliative', th: 'ใกล้เสียชีวิต' }],
  home_environment_risk: [{ key: 'low', th: 'ต่ำ' }, { key: 'medium', th: 'กลาง' }, { key: 'high', th: 'สูง' }],
  med_adherence: [{ key: 'good', th: 'ดี' }, { key: 'sometimes_forget', th: 'ลืมบ้าง' }, { key: 'irregular', th: 'ไม่สม่ำเสมอ' }],
  fall_risk: [{ key: 'low', th: 'ต่ำ' }, { key: 'medium', th: 'กลาง' }, { key: 'high', th: 'สูง' }],
  safety_risk_level: [{ key: 'low', th: 'ต่ำ' }, { key: 'medium', th: 'กลาง' }, { key: 'high', th: 'สูง' }, { key: 'urgent', th: 'เร่งด่วน' }],
  priority_level: [{ key: 'low', th: 'ต่ำ' }, { key: 'medium', th: 'กลาง' }, { key: 'high', th: 'สูง' }, { key: 'urgent', th: 'เร่งด่วน' }],
  referral_urgency: [{ key: 'routine', th: 'ปกติ' }, { key: 'soon', th: 'เร็ว ๆ นี้' }, { key: 'urgent', th: 'เร่งด่วน' }],
  problem_severity: [{ key: 'low', th: 'ต่ำ' }, { key: 'medium', th: 'กลาง' }, { key: 'high', th: 'สูง' }, { key: 'urgent', th: 'เร่งด่วน' }]
};

// จำลอง network delay เล็กน้อยให้ความรู้สึกเหมือน fetch จริง
function delay(v) { return new Promise(res => setTimeout(() => res(v), 180)); }

export async function mockCall(action, payload, session) {
  const db = loadDb();
  payload = payload || {};
  try {
    switch (action) {
      case 'ping': return delay(envelope(true, { service: 'DEMO MODE' }));

      case 'login': {
        const u = db.users.find(x => x.username === payload.username && x.password === payload.password);
        if (!u) return delay(envelope(false, null, 'username หรือ password ไม่ถูกต้อง'));
        return delay(envelope(true, { accessToken: 'demo-token-' + u.user_uid, userUid: u.user_uid, displayName: u.display_name, roleCode: u.role_code }));
      }
      case 'logout': return delay(envelope(true, {}));

      case 'getSettings': return delay(envelope(true, { APP_NAME: 'ระบบเยี่ยมบ้าน INHOMESS (โหมดสาธิต)', ORG_NAME: 'โรงพยาบาลตัวอย่าง' }));
      case 'getLookups': return delay(envelope(true, payload.group ? { [payload.group]: LOOKUPS[payload.group] || [] } : LOOKUPS));

      case 'getDrugList': return delay(envelope(true, [
        'Paracetamol 500 mg', 'Amlodipine 5 mg', 'Metformin 500 mg', 'Simvastatin 20 mg',
        'Enalapril 5 mg', 'Aspirin 81 mg', 'Omeprazole 20 mg', 'Losartan 50 mg',
        'Hydrochlorothiazide 25 mg', 'Glipizide 5 mg', 'Atorvastatin 40 mg', 'Warfarin 3 mg',
        'Furosemide 40 mg', 'Insulin RI', 'Salbutamol inhaler', 'Gabapentin 300 mg',
        'Allopurinol 100 mg', 'Levothyroxine 50 mcg', 'Prednisolone 5 mg', 'Tramadol 50 mg'
      ]));

      case 'searchPatient': {
        const hn = (payload.hn || '').trim(), cid = (payload.cid || '').trim(), name = (payload.name || '').trim().toLowerCase();
        const results = db.patients.filter(p => {
          if (hn && p.hn !== hn) return false;
          if (cid && p.cid !== cid) return false;
          if (name && !((p.first_name + ' ' + p.last_name).toLowerCase().includes(name))) return false;
          return true;
        });
        return delay(envelope(true, results.map(p => toListItem(db, p))));
      }

      case 'createPatient': {
        const dup = db.patients.find(p => p.hn === payload.hn || p.cid === payload.cid);
        if (dup) return delay(envelope(true, { duplicate: true, message: 'พบ HN/CID ซ้ำในระบบ', existingPatient: toListItem(db, dup) }));
        const p = Object.assign({ patient_uid: uid('pt'), cid_masked: maskCid(payload.cid), active_status: 'active', consent_status: payload.consent_status || 'รอเอกสาร' }, payload);
        db.patients.push(p);
        saveDb(db);
        return delay(envelope(true, { duplicate: false, patient_uid: p.patient_uid }));
      }

      case 'updatePatient': {
        const p = db.patients.find(x => x.patient_uid === payload.patient_uid);
        if (!p) return delay(envelope(false, null, 'ไม่พบผู้ป่วย'));
        Object.assign(p, payload);
        if (payload.cid) p.cid_masked = maskCid(payload.cid);
        saveDb(db);
        return delay(envelope(true, { patient_uid: p.patient_uid }));
      }

      case 'getPatientProfile': {
        const p = db.patients.find(x => x.patient_uid === payload.patient_uid);
        if (!p) return delay(envelope(false, null, 'ไม่พบผู้ป่วย'));
        const households = db.households.filter(h => h.patient_uid === p.patient_uid);
        const caregivers = db.caregivers.filter(c => c.patient_uid === p.patient_uid);
        const visits = db.visits.filter(v => v.patient_uid === p.patient_uid).sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
        const latestVisit = visits[0] || null;
        const latestAdl = latestVisit ? db.adl.find(a => a.visit_uid === latestVisit.visit_uid) : null;
        const openProblems = db.problems.filter(pr => pr.patient_uid === p.patient_uid && pr.status !== 'resolved');
        const nextVisitPlan = db.plans.filter(pl => pl.patient_uid === p.patient_uid && pl.status === 'planned').sort((a, b) => new Date(a.planned_date) - new Date(b.planned_date))[0] || null;
        return delay(envelope(true, {
          patient: Object.assign({}, p, { cid_masked: p.cid_masked || maskCid(p.cid) }),
          household: households.find(h => h.is_current) || households[0] || null,
          households, caregivers, latestVisit, latestAdl: latestAdl || null, openProblems,
          nextVisitPlan, visitCount: visits.length, attachmentCount: db.attachments.filter(a => a.patient_uid === p.patient_uid).length
        }));
      }

      case 'upsertHousehold': {
        if (payload.is_current) db.households.forEach(h => { if (h.patient_uid === payload.patient_uid) h.is_current = false; });
        let hh = db.households.find(h => h.household_uid === payload.household_uid);
        if (hh) Object.assign(hh, payload); else { hh = Object.assign({ household_uid: uid('hh') }, payload); db.households.push(hh); }
        saveDb(db);
        return delay(envelope(true, { household_uid: hh.household_uid }));
      }

      case 'upsertCaregiver': {
        let cg = db.caregivers.find(c => c.caregiver_uid === payload.caregiver_uid);
        if (cg) Object.assign(cg, payload); else { cg = Object.assign({ caregiver_uid: uid('cg') }, payload); db.caregivers.push(cg); }
        saveDb(db);
        return delay(envelope(true, { caregiver_uid: cg.caregiver_uid }));
      }

      case 'createVisitPlan': {
        const plan = Object.assign({ plan_uid: uid('plan'), status: 'planned' }, payload);
        db.plans.push(plan); saveDb(db);
        return delay(envelope(true, { plan_uid: plan.plan_uid }));
      }

      case 'listVisitPlans': {
        let rows = db.plans.filter(p => !payload.patient_uid || p.patient_uid === payload.patient_uid);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        rows = rows.map(r => Object.assign({}, r, { is_overdue: r.status === 'planned' && new Date(r.planned_date) < today }));
        return delay(envelope(true, rows));
      }

      case 'createHomeVisit': {
        if (payload.red_flag && !payload.red_flag_detail) return delay(envelope(false, null, 'พบ Red flag ต้องระบุรายละเอียด'));
        const visitNo = db.visits.filter(v => v.patient_uid === payload.patient_uid).length + 1;
        const visit = Object.assign({ visit_uid: uid('visit'), visit_no: visitNo, visit_status: 'draft', created_at: nowIso(), updated_at: nowIso() }, payload);
        db.visits.push(visit);
        if (payload.next_visit_date) {
          db.plans.push({ plan_uid: uid('plan'), patient_uid: payload.patient_uid, planned_date: payload.next_visit_date, visit_type: 'followup', priority_level: payload.red_flag ? 'high' : 'medium', purpose: payload.next_visit_purpose || 'ติดตามอาการต่อเนื่อง', status: 'planned' });
        }
        saveDb(db);
        return delay(envelope(true, { visit_uid: visit.visit_uid, visit_no: visitNo }));
      }

      case 'updateHomeVisit': {
        const v = db.visits.find(x => x.visit_uid === payload.visit_uid);
        if (!v) return delay(envelope(false, null, 'ไม่พบข้อมูลการเยี่ยม'));
        if (payload.red_flag && !payload.red_flag_detail && !v.red_flag_detail) return delay(envelope(false, null, 'พบ Red flag ต้องระบุรายละเอียด'));
        Object.assign(v, payload, { updated_at: nowIso() });
        recomputeVisitStatus(db, v.visit_uid);
        saveDb(db);
        return delay(envelope(true, { visit_uid: v.visit_uid }));
      }

      case 'getHomeVisit': {
        const v = db.visits.find(x => x.visit_uid === payload.visit_uid);
        if (!v) return delay(envelope(false, null, 'ไม่พบข้อมูลการเยี่ยม'));
        const inhomess = {};
        INHOMESS_STEPS.forEach(s => { inhomess[s.code] = (db.inhomess[s.code] || []).find(r => r.visit_uid === v.visit_uid) || null; });
        return delay(envelope(true, {
          visit: v,
          adl: db.adl.find(a => a.visit_uid === v.visit_uid) || null,
          inhomess,
          problems: db.problems.filter(p => p.visit_uid === v.visit_uid),
          carePlans: db.carePlans.filter(c => c.visit_uid === v.visit_uid),
          referrals: db.referrals.filter(r => r.visit_uid === v.visit_uid),
          attachments: db.attachments.filter(a => a.visit_uid === v.visit_uid)
        }));
      }

      case 'listHomeVisitsByPatient': {
        const rows = db.visits.filter(v => v.patient_uid === payload.patient_uid).sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
        return delay(envelope(true, rows));
      }

      case 'saveADL': {
        const items = ['feeding', 'grooming', 'transfer', 'toilet_use', 'mobility', 'dressing', 'stairs', 'bathing', 'bowels', 'bladder'];
        const total = items.reduce((s, k) => s + (Number(payload[k]) || 0), 0);
        let rec = db.adl.find(a => a.visit_uid === payload.visit_uid);
        const data = Object.assign({}, payload, { adl_total: total, adl_interpretation: interpretAdl(total) });
        if (rec) Object.assign(rec, data); else { rec = Object.assign({ adl_uid: uid('adl') }, data); db.adl.push(rec); }
        recomputeVisitStatus(db, payload.visit_uid);
        saveDb(db);
        return delay(envelope(true, { adl_uid: rec.adl_uid, adl_total: total, adl_interpretation: rec.adl_interpretation }));
      }

      case 'saveINHOMESS': {
        const code = payload.domain;
        db.inhomess[code] = db.inhomess[code] || [];
        let rec = db.inhomess[code].find(r => r.visit_uid === payload.visit_uid);
        const data = Object.assign({}, payload.fields, { visit_uid: payload.visit_uid, patient_uid: payload.patient_uid });
        if (code === 'N' && data.weight_kg && data.height_cm) {
          const m = data.height_cm / 100;
          data.bmi = Math.round((data.weight_kg / (m * m)) * 10) / 10;
        }
        if (rec) Object.assign(rec, data); else { rec = Object.assign({ [code.toLowerCase() + '_uid']: uid(code.toLowerCase()) }, data); db.inhomess[code].push(rec); }
        recomputeVisitStatus(db, payload.visit_uid);
        saveDb(db);
        return delay(envelope(true, rec));
      }

      case 'saveCarePlan': {
        const cp = Object.assign({ careplan_uid: uid('cp'), status: 'active' }, payload);
        db.carePlans.push(cp); saveDb(db);
        return delay(envelope(true, { careplan_uid: cp.careplan_uid }));
      }

      case 'saveVisitProblem': {
        const pr = Object.assign({ problem_uid: uid('prob'), status: 'open' }, payload);
        db.problems.push(pr); saveDb(db);
        return delay(envelope(true, { problem_uid: pr.problem_uid }));
      }

      case 'saveReferral': {
        const rf = Object.assign({ referral_uid: uid('ref'), status: 'pending' }, payload);
        db.referrals.push(rf); saveDb(db);
        return delay(envelope(true, { referral_uid: rf.referral_uid }));
      }

      case 'uploadAttachment': {
        if (!payload.consent_confirmed) return delay(envelope(false, null, 'ต้องยืนยันการยินยอมก่อนแนบไฟล์'));
        const att = { attach_uid: uid('att'), patient_uid: payload.patient_uid, visit_uid: payload.visit_uid || '', file_category: payload.file_category, drive_file_url: payload.dataUrl, uploaded_at: nowIso() };
        db.attachments.push(att); saveDb(db);
        return delay(envelope(true, { attach_uid: att.attach_uid, drive_file_url: att.drive_file_url }));
      }

      case 'getDashboardSummary': {
        const today = nowIso().slice(0, 10);
        const inSafety = (db.inhomess['S1'] || []);
        return delay(envelope(true, {
          totalPatients: db.patients.length,
          activePatients: db.patients.filter(p => p.active_status === 'active').length,
          totalVisits: db.visits.length,
          visitsToday: db.visits.filter(v => v.visit_date === today).length,
          upcomingWithin7Days: db.plans.filter(p => p.status === 'planned').length,
          overduePlans: db.plans.filter(p => p.status === 'planned' && new Date(p.planned_date) < new Date(today)).length,
          redFlagVisits: db.visits.filter(v => v.red_flag).length,
          medicationProblems: db.problems.filter(p => p.domain_code === 'M' && p.status !== 'resolved').length,
          highFallRisk: inSafety.filter(s => s.fall_risk === 'high').length,
          pendingReferrals: db.referrals.filter(r => r.status === 'pending').length,
          bedOrHomeBound: db.patients.filter(p => p.dependency_level === 'home' || p.dependency_level === 'bed').length,
          avgAdlLatest: db.adl.length ? Math.round(db.adl.reduce((s, a) => s + (a.adl_total || 0), 0) / db.adl.length) : 0,
          generatedAt: nowIso()
        }));
      }

      case 'exportPatientReport': {
        const profileRes = await mockCall('getPatientProfile', payload, session);
        const visitsRes = await mockCall('listHomeVisitsByPatient', payload, session);
        return delay(envelope(true, { profile: profileRes.data, visits: visitsRes.data }));
      }

      case 'getAuditLogs': return delay(envelope(true, db.auditLogs.slice(0, 200)));

      case 'listUsers': {
        return delay(envelope(true, db.users.map(u => ({
          user_uid: u.user_uid, username: u.username, display_name: u.display_name,
          email: u.email || '', phone: u.phone || '', role_code: u.role_code,
          unit_name: u.unit_name || '', is_active: u.is_active !== false,
          last_login_at: u.last_login_at || '', created_at: u.created_at || ''
        }))));
      }

      case 'createUser': {
        if (db.users.find(u => u.username === payload.username)) return delay(envelope(false, null, 'มีชื่อผู้ใช้นี้อยู่แล้ว'));
        const u = Object.assign({ user_uid: uid('usr'), is_active: true, created_at: nowIso() }, payload);
        db.users.push(u); saveDb(db);
        return delay(envelope(true, { user_uid: u.user_uid }));
      }

      case 'updateUser': {
        const u = db.users.find(x => x.user_uid === payload.user_uid);
        if (!u) return delay(envelope(false, null, 'ไม่พบผู้ใช้งาน'));
        Object.assign(u, payload);
        saveDb(db);
        return delay(envelope(true, { user_uid: u.user_uid }));
      }

      case 'deleteUser': {
        const idx = db.users.findIndex(x => x.user_uid === payload.user_uid);
        if (idx === -1) return delay(envelope(false, null, 'ไม่พบผู้ใช้งาน'));
        if (session && payload.user_uid === session.userUid) return delay(envelope(false, null, 'ไม่สามารถลบบัญชีของตนเองได้'));
        const target = db.users[idx];
        if (target.role_code === 'ADMIN') {
          const otherActiveAdmins = db.users.filter(x => x.role_code === 'ADMIN' && x.user_uid !== payload.user_uid && x.is_active !== false);
          if (!otherActiveAdmins.length) return delay(envelope(false, null, 'ต้องมีผู้ดูแลระบบ (ADMIN) ที่ใช้งานอยู่อย่างน้อย 1 คน'));
        }
        // ยกเลิกการมอบหมายผู้ป่วยที่ผูกกับผู้ใช้นี้
        db.patients.forEach(p => { if (p.responsible_staff === payload.user_uid) p.responsible_staff = ''; });
        db.users.splice(idx, 1);
        saveDb(db);
        return delay(envelope(true, { user_uid: payload.user_uid }));
      }

      case 'listPatientsBrief': {
        return delay(envelope(true, db.patients.map(p => ({
          patient_uid: p.patient_uid, hn: p.hn, first_name: p.first_name, last_name: p.last_name,
          active_status: p.active_status, responsible_staff: p.responsible_staff || '',
          responsible_staff_name: (db.users.find(u => u.user_uid === p.responsible_staff) || {}).display_name || ''
        }))));
      }

      case 'assignPatientStaff': {
        const p = db.patients.find(x => x.patient_uid === payload.patient_uid);
        if (!p) return delay(envelope(false, null, 'ไม่พบผู้ป่วย'));
        p.responsible_staff = payload.user_uid || '';
        saveDb(db);
        return delay(envelope(true, { patient_uid: p.patient_uid, responsible_staff: p.responsible_staff }));
      }

      default: return delay(envelope(false, null, 'ไม่รู้จักคำสั่ง (demo): ' + action));
    }
  } catch (err) {
    return delay(envelope(false, null, err.message));
  }
}

function recomputeVisitStatus(db, visitUid) {
  const v = db.visits.find(x => x.visit_uid === visitUid);
  if (!v || v.visit_status === 'reviewed' || v.visit_status === 'cancelled') return;
  const hasAdl = !!db.adl.find(a => a.visit_uid === visitUid);
  const allDone = ['I', 'N', 'H', 'O', 'M', 'E', 'S1', 'S2', 'S3'].every(code => (db.inhomess[code] || []).some(r => r.visit_uid === visitUid));
  v.visit_status = (hasAdl && allDone) ? 'completed' : 'draft';
}

function envelope(success, data, message) {
  return { success, message: message || (success ? 'สำเร็จ (โหมดสาธิต)' : 'ผิดพลาด'), data: data || null, error: success ? null : (message || 'error'), timestamp: nowIso() };
}

export function getRoleFlags(roleCode) { return ROLE_FLAGS[roleCode] || {}; }
