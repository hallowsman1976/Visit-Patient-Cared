// api.js — เรียก backend ตาม contract ใน docs/blueprint.md ข้อ 8
// ส่งเป็น text/plain เพื่อไม่ให้ browser ยิง CORS preflight (GAS ไม่ตอบ OPTIONS)
import { CONFIG, DEMO_MODE } from './config.js';
import { getSession, clearSession } from './state.js';
import { mockCall } from './mockData.js';

export { DEMO_MODE };

async function callReal(action, payload) {
  const session = getSession();
  const body = {
    action,
    apiKey: CONFIG.API_KEY,
    accessToken: session ? session.accessToken : '',
    userUid: session ? session.userUid : '',
    payload: payload || {}
  };
  const res = await fetch(CONFIG.GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
    redirect: 'follow'
  });
  const text = await res.text();
  if (!text || text.trim().startsWith('<')) {
    throw new Error('เชื่อมต่อ backend ไม่ถูกต้อง (ได้ HTML กลับมา) — ตรวจสอบการ deploy Web App (Execute as / Who has access)');
  }
  return JSON.parse(text);
}

export async function call(action, payload) {
  try {
    const result = DEMO_MODE ? await mockCall(action, payload, getSession()) : await callReal(action, payload);
    if (!result.success && /session|login/i.test(result.message || '')) {
      clearSession();
    }
    return result;
  } catch (err) {
    return { success: false, message: 'เชื่อมต่อ server ไม่สำเร็จ: ' + err.message, data: null, error: err.message, timestamp: new Date().toISOString() };
  }
}
