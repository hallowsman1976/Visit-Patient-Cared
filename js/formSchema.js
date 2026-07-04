// formSchema.js — นิยามฟิลด์ของแต่ละหมวดประเมิน ให้ตรงกับ backend/Config.js (HEADERS)
// ใช้ schema เดียวกันสร้างฟอร์มทุกหมวด ลดโอกาสฟิลด์เพี้ยนระหว่าง 9 หมวดที่โครงสร้างคล้ายกัน
// type: text | number | textarea | boolean | select | date
// options: ['low','medium','high'] (ใช้ตรงถ้าไม่ผูก lookupGroup) หรือระบุ lookupGroup เพื่อดึงจาก getLookups

// คะแนน ADL ตามเกณฑ์ Barthel Index (ฉบับไทย) — แต่ละ option มีคำอธิบายกำกับความหมายของคะแนน
export const ADL_FIELDS = [
  { key: 'feeding', label: 'กินอาหาร', type: 'select', options: [
    { value: 0, label: '0 – ตักอาหารเข้าปากเองไม่ได้ ต้องมีคนป้อน' },
    { value: 5, label: '5 – ตักเองได้ แต่ต้องมีคนช่วยเตรียม/หั่นให้' },
    { value: 10, label: '10 – ตักและกินเองได้ตามปกติ' }
  ] },
  { key: 'grooming', label: 'ล้างหน้า/หวีผม/แปรงฟัน', type: 'select', options: [
    { value: 0, label: '0 – ต้องมีคนช่วย' },
    { value: 5, label: '5 – ทำเองได้ (เมื่อเตรียมอุปกรณ์ให้)' }
  ] },
  { key: 'transfer', label: 'ลุกนั่ง/เคลื่อนย้าย', type: 'select', options: [
    { value: 0, label: '0 – นั่งเองไม่ได้ ต้องใช้คน 2 คนช่วยยก' },
    { value: 5, label: '5 – ต้องช่วยอย่างมาก (คนแข็งแรง 1 คนพยุง)' },
    { value: 10, label: '10 – ต้องช่วยบ้าง (พยุง/บอกวิธี)' },
    { value: 15, label: '15 – ทำได้เอง' }
  ] },
  { key: 'toilet_use', label: 'ใช้ห้องน้ำ', type: 'select', options: [
    { value: 0, label: '0 – ช่วยตัวเองไม่ได้' },
    { value: 5, label: '5 – ทำได้บ้าง แต่ต้องช่วยบางส่วน' },
    { value: 10, label: '10 – เข้าออก/ทำความสะอาดเองได้ดี' }
  ] },
  { key: 'mobility', label: 'เดิน/เคลื่อนที่', type: 'select', options: [
    { value: 0, label: '0 – เคลื่อนที่ไม่ได้' },
    { value: 5, label: '5 – ใช้รถเข็นช่วยตัวเองได้ (ไม่ต้องมีคนเข็น)' },
    { value: 10, label: '10 – เดินได้โดยมีคนช่วยพยุง' },
    { value: 15, label: '15 – เดินได้เอง (ใช้เครื่องช่วยเดินได้)' }
  ] },
  { key: 'dressing', label: 'แต่งตัว', type: 'select', options: [
    { value: 0, label: '0 – ต้องมีคนแต่งตัวให้' },
    { value: 5, label: '5 – ช่วยตัวเองได้ประมาณครึ่งหนึ่ง' },
    { value: 10, label: '10 – แต่งตัวเองได้ดี (กระดุม/ซิป/รองเท้า)' }
  ] },
  { key: 'stairs', label: 'ขึ้นลงบันได', type: 'select', options: [
    { value: 0, label: '0 – ทำไม่ได้' },
    { value: 5, label: '5 – ต้องมีคนช่วย' },
    { value: 10, label: '10 – ขึ้นลงเองได้ (ใช้เครื่องช่วยเดินได้)' }
  ] },
  { key: 'bathing', label: 'อาบน้ำ', type: 'select', options: [
    { value: 0, label: '0 – ต้องมีคนช่วย' },
    { value: 5, label: '5 – อาบน้ำเองได้' }
  ] },
  { key: 'bowels', label: 'กลั้นอุจจาระ', type: 'select', options: [
    { value: 0, label: '0 – กลั้นไม่ได้ หรือต้องสวนอุจจาระประจำ' },
    { value: 5, label: '5 – กลั้นไม่ได้เป็นบางครั้ง (นาน ๆ ครั้ง)' },
    { value: 10, label: '10 – กลั้นได้ตามปกติ' }
  ] },
  { key: 'bladder', label: 'กลั้นปัสสาวะ', type: 'select', options: [
    { value: 0, label: '0 – กลั้นไม่ได้ หรือคาสายสวนแต่ดูแลเองไม่ได้' },
    { value: 5, label: '5 – กลั้นไม่ได้เป็นบางครั้ง (นาน ๆ ครั้ง)' },
    { value: 10, label: '10 – กลั้นได้ตามปกติ' }
  ] },
  { key: 'adl_note', label: 'หมายเหตุ', type: 'textarea' }
];

export const INHOMESS_STEPS = [
  {
    code: 'I', title: 'I: Immobility', subtitle: 'การเคลื่อนไหว / ADL / IADL',
    fields: [
      { key: 'mobility_status', label: 'สภาพการเคลื่อนไหว', type: 'select', options: ['เดินได้', 'ใช้อุปกรณ์ช่วยเดิน', 'ติดบ้าน', 'ติดเตียง'] },
      { key: 'bedbound_status', label: 'ติดเตียง', type: 'boolean' },
      { key: 'assistive_device', label: 'อุปกรณ์ช่วยเดิน', type: 'select', options: ['ไม่มี', 'ไม้เท้า', 'Walker', 'Wheelchair', 'อื่น ๆ'] },
      { key: 'iadl_status', label: 'IADL (กิจวัตรซับซ้อน)', type: 'select', options: ['ทำได้', 'ทำไม่ได้'] },
      { key: 'fall_history_6m', label: 'เคยหกล้มใน 6 เดือนที่ผ่านมา', type: 'boolean' },
      { key: 'pressure_ulcer_risk', label: 'ความเสี่ยงแผลกดทับ', type: 'select', options: ['ไม่เสี่ยง', 'เสี่ยง', 'มีแผลแล้ว'] },
      { key: 'rehab_need', label: 'ความต้องการกายภาพบำบัด', type: 'text' },
      { key: 'i_problem', label: 'ปัญหาที่พบ', type: 'textarea' },
      { key: 'i_plan', label: 'แผนการดูแล', type: 'textarea' }
    ]
  },
  {
    code: 'N', title: 'N: Nutrition', subtitle: 'โภชนาการ',
    fields: [
      { key: 'weight_kg', label: 'น้ำหนัก (กก.)', type: 'number' },
      { key: 'height_cm', label: 'ส่วนสูง (ซม.)', type: 'number' },
      { key: 'nutrition_status', label: 'ภาวะโภชนาการ', type: 'select', options: ['ปกติ', 'ผอม', 'อ้วน', 'เสี่ยงขาดสารอาหาร'] },
      { key: 'diet_suitability', label: 'อาหารเหมาะสมกับโรคหรือไม่', type: 'select', options: ['เหมาะสม', 'ไม่เหมาะสม'] },
      { key: 'diet_problem_detail', label: 'รายละเอียดอาหารไม่เหมาะสม', type: 'textarea' },
      { key: 'food_source', label: 'แหล่งอาหาร', type: 'select', options: ['ปรุงเอง', 'ซื้อ', 'ญาติจัดหา', 'อื่น ๆ'] },
      { key: 'swallowing_problem', label: 'กลืนลำบาก', type: 'boolean' },
      { key: 'alcohol_use', label: 'การดื่มแอลกอฮอล์', type: 'select', options: ['ไม่ดื่ม', 'ดื่มบ้าง', 'ดื่มประจำ'] },
      { key: 'smoking_status', label: 'การสูบบุหรี่', type: 'select', options: ['ไม่สูบ', 'สูบ', 'เลิกแล้ว'] },
      { key: 'n_problem', label: 'ปัญหาที่พบ', type: 'textarea' },
      { key: 'n_plan', label: 'แผนการดูแล', type: 'textarea' }
    ]
  },
  {
    code: 'H', title: 'H: Home Environment', subtitle: 'สภาพบ้านและสิ่งแวดล้อม',
    fields: [
      { key: 'indoor_cleanliness', label: 'ความสะอาดภายในบ้าน', type: 'select', options: ['สะอาด', 'พอใช้', 'สกปรก'] },
      { key: 'ventilation', label: 'การถ่ายเทอากาศ', type: 'select', options: ['โปร่ง', 'อับ', 'แออัด'] },
      { key: 'crowding', label: 'ความแออัด', type: 'select', options: ['ไม่แออัด', 'แออัด'] },
      { key: 'pets_in_house', label: 'มีสัตว์เลี้ยงในบ้าน', type: 'boolean' },
      { key: 'toilet_safety', label: 'ความปลอดภัยห้องน้ำ', type: 'select', options: ['ปลอดภัย', 'ไม่ปลอดภัย'] },
      { key: 'accessibility', label: 'การเข้าถึงบ้าน', type: 'select', options: ['รถเข้าได้', 'เดินทางลำบาก'] },
      { key: 'home_environment_risk', label: 'ระดับความเสี่ยงสภาพบ้าน', type: 'select', lookupGroup: 'home_environment_risk' },
      { key: 'home_risk_detail', label: 'รายละเอียดความเสี่ยง', type: 'textarea' },
      { key: 'h_problem', label: 'ปัญหาที่พบ', type: 'textarea' },
      { key: 'h_plan', label: 'แผนปรับสภาพบ้าน', type: 'textarea' }
    ]
  },
  {
    code: 'O', title: 'O: Other People', subtitle: 'ครอบครัว ผู้ดูแล เครือข่ายสังคม',
    fields: [
      { key: 'main_caregiver_name', label: 'ผู้ดูแลหลัก', type: 'text' },
      { key: 'caregiver_relationship', label: 'ความสัมพันธ์', type: 'select', options: [
        'บิดา', 'มารดา', 'ปู่/ตา', 'ย่า/ยาย', 'ลุง/อา (ชาย)', 'ป้า/น้า/อา (หญิง)', 'ลูกพี่ลูกน้อง/ญาติ', 'บุตร', 'เพื่อนบ้าน'
      ] },
      { key: 'caregiver_support_level', label: 'ระดับการสนับสนุนของผู้ดูแล', type: 'select', options: ['ดี', 'ปานกลาง', 'น้อย'] },
      { key: 'family_conflict', label: 'มีความขัดแย้งในครอบครัว', type: 'boolean' },
      { key: 'social_support', label: 'เครือข่ายสนับสนุน', type: 'select', options: ['อสม.', 'ชุมชน', 'ญาติ', 'อบต.', 'อื่น ๆ'] },
      { key: 'financial_problem', label: 'ปัญหาเศรษฐกิจ', type: 'boolean' },
      { key: 'violence_or_neglect_risk', label: 'เสี่ยงถูกทอดทิ้ง/ความรุนแรง', type: 'boolean' },
      { key: 'o_problem', label: 'ปัญหาที่พบ', type: 'textarea' },
      { key: 'o_plan', label: 'แผนสนับสนุนครอบครัว/ชุมชน', type: 'textarea' }
    ]
  },
  {
    code: 'M', title: 'M: Medication', subtitle: 'การใช้ยา',
    fields: [
      { key: 'current_medications', label: 'รายการยาปัจจุบัน (สรุป)', type: 'textarea' },
      { key: 'medications_count', label: 'จำนวนรายการยา', type: 'number' },
      { key: 'med_adherence', label: 'ความร่วมมือในการใช้ยา', type: 'select', lookupGroup: 'med_adherence' },
      { key: 'missed_dose', label: 'ลืมยา', type: 'boolean' },
      { key: 'duplicate_medication', label: 'ยาซ้ำซ้อน', type: 'boolean' },
      { key: 'expired_medication_found', label: 'พบยาหมดอายุ', type: 'boolean' },
      { key: 'herbal_or_otc_use', label: 'สมุนไพร/ยาซื้อเอง', type: 'text' },
      { key: 'side_effect_suspected', label: 'สงสัยผลข้างเคียง', type: 'boolean' },
      { key: 'med_storage', label: 'การเก็บยา', type: 'text' },
      { key: 'pharmacist_referral_needed', label: 'ต้องส่งต่อเภสัชกร', type: 'boolean' },
      { key: 'm_problem', label: 'ปัญหาที่พบ', type: 'textarea' },
      { key: 'm_plan', label: 'แผนแก้ไข', type: 'textarea' }
    ]
  },
  {
    code: 'E', title: 'E: Examination', subtitle: 'การตรวจร่างกายและสัญญาณชีพ',
    fields: [
      { key: 'sbp', label: 'SBP (มม.ปรอท)', type: 'number' },
      { key: 'dbp', label: 'DBP (มม.ปรอท)', type: 'number' },
      { key: 'pulse', label: 'ชีพจร (ครั้ง/นาที)', type: 'number' },
      { key: 'respiratory_rate', label: 'RR (ครั้ง/นาที)', type: 'number' },
      { key: 'temperature_c', label: 'อุณหภูมิ (°C)', type: 'number' },
      { key: 'spo2', label: 'SpO2 (%)', type: 'number' },
      { key: 'dtx', label: 'DTX (มก./ดล.)', type: 'number' },
      { key: 'pain_score', label: 'คะแนนปวด (0-10)', type: 'number' },
      { key: 'mental_status', label: 'สติ/อารมณ์', type: 'select', options: ['ปกติ', 'สับสน', 'ซึม', 'อื่น ๆ'] },
      { key: 'pallor', label: 'ซีด', type: 'boolean' },
      { key: 'edema', label: 'บวม', type: 'boolean' },
      { key: 'wound_present', label: 'มีแผล', type: 'boolean' },
      { key: 'wound_detail', label: 'รายละเอียดแผล', type: 'textarea' },
      { key: 'abnormal_finding', label: 'ความผิดปกติที่พบ', type: 'textarea' },
      { key: 'urgent_physician_consult', label: 'ต้องปรึกษาแพทย์เร่งด่วน', type: 'boolean' },
      { key: 'e_problem', label: 'ปัญหาที่พบ', type: 'textarea' },
      { key: 'e_plan', label: 'แผนการดูแล', type: 'textarea' }
    ]
  },
  {
    code: 'S1', title: 'S1: Safety', subtitle: 'ความปลอดภัยในบ้าน',
    fields: [
      { key: 'fall_risk', label: 'ความเสี่ยงหกล้ม', type: 'select', lookupGroup: 'fall_risk' },
      { key: 'floor_slippery', label: 'พื้นลื่น', type: 'boolean' },
      { key: 'clutter_or_obstacle', label: 'ของวางเกะกะ', type: 'boolean' },
      { key: 'poor_lighting', label: 'แสงสว่างไม่เพียงพอ', type: 'boolean' },
      { key: 'unsafe_stairs', label: 'บันไดไม่ปลอดภัย', type: 'boolean' },
      { key: 'unsafe_bathroom', label: 'ห้องน้ำไม่ปลอดภัย', type: 'boolean' },
      { key: 'electric_risk', label: 'ปลั๊ก/สายไฟเสี่ยง', type: 'boolean' },
      { key: 'emergency_contact_available', label: 'มีเบอร์ติดต่อฉุกเฉิน', type: 'boolean' },
      { key: 'emergency_plan', label: 'แผนฉุกเฉิน', type: 'textarea' },
      { key: 'safety_risk_level', label: 'ระดับความเสี่ยงโดยรวม', type: 'select', lookupGroup: 'safety_risk_level' },
      { key: 'safety_problem', label: 'ปัญหาที่พบ', type: 'textarea' },
      { key: 'safety_plan', label: 'แผนปรับความปลอดภัย', type: 'textarea' }
    ]
  },
  {
    code: 'S2', title: 'S2: Spiritual Health', subtitle: 'จิตวิญญาณ ความเชื่อ คุณค่าชีวิต',
    fields: [
      { key: 'religion_or_belief', label: 'ศาสนา/ความเชื่อ', type: 'text' },
      { key: 'belief_affecting_care', label: 'ความเชื่อที่มีผลต่อการดูแล', type: 'textarea' },
      { key: 'meaning_of_life', label: 'สิ่งยึดเหนี่ยว/คุณค่าชีวิต', type: 'textarea' },
      { key: 'emotional_support', label: 'แหล่งกำลังใจ', type: 'text' },
      { key: 'stress_or_anxiety', label: 'ความเครียด/ความกังวล', type: 'textarea' },
      { key: 'spiritual_need', label: 'ความต้องการด้านจิตวิญญาณ', type: 'textarea' },
      { key: 'spiritual_problem', label: 'ปัญหาที่พบ', type: 'textarea' },
      { key: 'spiritual_plan', label: 'แผนสนับสนุน', type: 'textarea' }
    ]
  },
  {
    code: 'S3', title: 'S3: Story', subtitle: 'เรื่องราวครอบครัวและผู้ป่วย',
    fields: [
      { key: 'family_story', label: 'เรื่องราวครอบครัว', type: 'textarea' },
      { key: 'illness_narrative', label: 'เรื่องเล่าการเจ็บป่วย', type: 'textarea' },
      { key: 'important_life_events', label: 'เหตุการณ์สำคัญ', type: 'textarea' },
      { key: 'patient_goal', label: 'เป้าหมายของผู้ป่วย', type: 'textarea' },
      { key: 'family_expectation', label: 'ความคาดหวังของครอบครัว', type: 'textarea' },
      { key: 'care_barrier', label: 'อุปสรรคต่อการดูแล', type: 'textarea' },
      { key: 'strength_or_resource', label: 'จุดแข็ง/ทรัพยากรของครอบครัว', type: 'textarea' },
      { key: 'story_problem', label: 'ปัญหาที่พบ', type: 'textarea' },
      { key: 'story_plan', label: 'แผนดูแลที่สอดคล้องกับบริบท', type: 'textarea' }
    ]
  }
];

export const CAREGIVER_FIELDS = [
  { key: 'caregiver_name', label: 'ชื่อผู้ดูแล', type: 'text', required: true },
  { key: 'relationship', label: 'ความสัมพันธ์', type: 'text' },
  { key: 'phone', label: 'เบอร์โทร', type: 'text' },
  { key: 'is_main_caregiver', label: 'เป็นผู้ดูแลหลัก', type: 'boolean' },
  { key: 'lives_with_patient', label: 'อยู่บ้านเดียวกัน', type: 'boolean' },
  { key: 'caregiver_burden_level', label: 'ภาระของผู้ดูแล', type: 'select', options: ['ต่ำ', 'กลาง', 'สูง'] }
];

export const HOUSEHOLD_FIELDS = [
  { key: 'village_name', label: 'บ้าน/ชุมชน', type: 'text' },
  { key: 'subdistrict', label: 'ตำบล', type: 'text' },
  { key: 'district', label: 'อำเภอ', type: 'text' },
  { key: 'province', label: 'จังหวัด', type: 'text' },
  { key: 'house_type', label: 'ลักษณะบ้าน', type: 'text' },
  { key: 'distance_to_hospital_km', label: 'ระยะทางจากรพ. (กม.)', type: 'number' }
];
