// utils.js — helper ทั่วไปฝั่ง frontend

export function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2400);
}

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function qs(sel, root = document) { return root.querySelector(sel); }
export function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

// แสดงวันที่ ISO เป็น พ.ศ. รูปแบบไทย เฉพาะตอนแสดงผล (ข้อมูลจริงเก็บเป็น ค.ศ./ISO ตาม docs/blueprint.md ข้อ 4.1)
export function formatThaiDate(isoOrYmd) {
  if (!isoOrYmd) return '-';
  const d = new Date(isoOrYmd);
  if (isNaN(d.getTime())) return String(isoOrYmd);
  const be = d.getFullYear() + 543;
  const dd = String(d.getDate()).padStart(2, '0');
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return `${dd} ${months[d.getMonth()]} ${be}`;
}

export function todayYmd() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function compressImage(dataUrl, maxWidth = 1280, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

export function debounce(fn, ms = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ---------- Overlay / popup ระหว่างทำงาน (ใช้ร่วมกันทั้งแอป) ----------
// แสดงฉากมืดพร้อม spinner ระหว่างรอผลจาก backend
export function showOverlay(message = 'กำลังทำงาน...') {
  hideOverlay();
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.id = 'appOverlay';
  ov.innerHTML = `<div class="overlay-box"><div class="spinner"></div><div class="overlay-msg">${escapeHtml(message)}</div></div>`;
  document.body.appendChild(ov);
  return ov;
}

export function hideOverlay() {
  const ov = document.getElementById('appOverlay');
  if (ov) ov.remove();
}

// popup เครื่องหมายถูกแบบ animation แล้วปิดเอง (คืน Promise เมื่อปิด)
export function successPopup(message = 'สำเร็จ', ms = 1100) {
  return new Promise((resolve) => {
    const pop = document.createElement('div');
    pop.className = 'overlay';
    pop.innerHTML = `<div class="overlay-box success-pop">
      <div class="success-check"><svg viewBox="0 0 52 52"><circle class="sc-circle" cx="26" cy="26" r="24"/><path class="sc-check" d="M14 27l8 8 16-16"/></svg></div>
      <div class="overlay-msg">${escapeHtml(message)}</div>
    </div>`;
    document.body.appendChild(pop);
    setTimeout(() => { pop.remove(); resolve(); }, ms);
  });
}

// กล่องยืนยัน (แทน confirm ของเบราว์เซอร์) คืน Promise<boolean>
export function confirmDialog(message, { okText = 'ยืนยัน', cancelText = 'ยกเลิก', danger = false } = {}) {
  return new Promise((resolve) => {
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = `<div class="overlay-box confirm-box">
      <div class="confirm-msg">${escapeHtml(message)}</div>
      <div class="btn-row">
        <button class="btn btn-secondary" data-act="cancel">${escapeHtml(cancelText)}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="ok">${escapeHtml(okText)}</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
    const done = (val) => { ov.remove(); resolve(val); };
    ov.querySelector('[data-act=cancel]').onclick = () => done(false);
    ov.querySelector('[data-act=ok]').onclick = () => done(true);
    ov.addEventListener('click', (e) => { if (e.target === ov) done(false); });
  });
}
