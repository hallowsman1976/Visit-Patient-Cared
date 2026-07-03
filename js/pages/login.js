import { call, DEMO_MODE } from '../api.js';
import { setSession } from '../state.js';
import { navigate } from '../router.js';
import { toast } from '../utils.js';
import { CONFIG } from '../config.js';

export async function render(app) {
  app.innerHTML = `
    <div class="login-wrap">
      <div class="login-card card">
        <div class="logo">🏠</div>
        <h1>${CONFIG.APP_NAME}</h1>
        <div class="sub">${CONFIG.ORG_NAME}</div>
        ${DEMO_MODE ? `<div class="demo-banner">โหมดสาธิต (DEMO MODE) — ยังไม่ได้เชื่อมต่อ Apps Script จริง<br>ทดลอง login: <b>admin/admin123</b>, <b>staff/staff123</b>, <b>viewer/viewer123</b></div>` : ''}
        <form id="loginForm">
          <div class="field text-left">
            <label>ชื่อผู้ใช้</label>
            <input name="username" required autocomplete="username" />
          </div>
          <div class="field text-left">
            <label>รหัสผ่าน</label>
            <input name="password" type="password" required autocomplete="current-password" />
          </div>
          <div class="field checkbox text-left">
            <input type="checkbox" id="pdpa" required />
            <label for="pdpa" style="margin:0;font-weight:400;">ข้าพเจ้ายอมรับการใช้งานข้อมูลตามนโยบาย PDPA ของหน่วยงาน</label>
          </div>
          <button class="btn btn-primary" type="submit">เข้าสู่ระบบ</button>
        </form>
      </div>
    </div>
  `;

  app.querySelector('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true; btn.textContent = 'กำลังเข้าสู่ระบบ...';
    const fd = new FormData(e.target);
    const res = await call('login', { username: fd.get('username'), password: fd.get('password') });
    btn.disabled = false; btn.textContent = 'เข้าสู่ระบบ';
    if (!res.success) { toast(res.message); return; }
    setSession(res.data);
    toast('เข้าสู่ระบบสำเร็จ');
    navigate('/dashboard');
  });
}
