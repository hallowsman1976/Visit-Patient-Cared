// config.js — ตั้งค่าการเชื่อมต่อ backend
// หลัง deploy Apps Script Web App แล้ว ให้ใส่ URL (ลงท้าย /exec) และ API Key (จากเมนู "2) สร้าง/รีเซ็ต API Key")
// หมายเหตุความปลอดภัย: ค่าพวกนี้อยู่ในไฟล์ static ที่ผู้ใช้ทุกคนเห็นได้ (repo public) จึงใช้เป็นแค่ตัวกรองเบื้องต้น
// การป้องกันจริงอยู่ที่ session token หลัง login ทุกครั้ง (ดู backend/Auth.js)
export const CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbzy-kNNVyu-wbdAw0dG0hUxSK7l_cpCkkLwcNHBIE3jRpqbra8WNvrTEvmZzmx_iIZyOg/exec', // เช่น 'https://script.google.com/macros/s/AKfycb.../exec' — ปล่อยว่าง = โหมดสาธิต (DEMO MODE)
  API_KEY: 'AIzaSyDI8lRtoQf4UIDp9TNBXzpvY2u-ymffeqc',
  APP_NAME: 'ระบบเยี่ยมบ้าน INHOMESS',
  ORG_NAME: 'โรงพยาบาล/รพ.สต.'
};

export const DEMO_MODE = !CONFIG.GAS_URL;
