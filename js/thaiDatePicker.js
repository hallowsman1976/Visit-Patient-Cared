// thaiDatePicker.js — ตัวเลือกวันที่แบบปฏิทินไทย แสดงปีเป็น พ.ศ. แต่เก็บค่าจริงเป็น ISO (ค.ศ.) ตาม docs/blueprint.md ข้อ 4.1

const BE_OFFSET = 543;
const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const THAI_DOW = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function toIso(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatDisplay(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear() + BE_OFFSET}`;
}

function sameDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// container: element ว่างที่จะถูกเติม markup ของ field (label + input) เข้าไป
export function initThaiDatePicker(container, { name, label = 'วันเกิด', value = '', required = false } = {}) {
  let selected = value ? new Date(value + 'T00:00:00') : null;
  let viewDate = selected ? new Date(selected) : new Date();

  container.innerHTML = `
    <label>${label}</label>
    <div class="thai-datepicker">
      <input type="text" class="tdp-display" readonly placeholder="เลือกวันที่" ${required ? 'required' : ''} value="${selected ? formatDisplay(selected) : ''}" />
      <input type="hidden" name="${name}" value="${selected ? toIso(selected) : ''}" />
      <div class="tdp-panel" hidden>
        <div class="tdp-header">
          <button type="button" class="tdp-nav" data-nav="-1">‹</button>
          <div class="tdp-title">
            <select class="tdp-month"></select>
            <select class="tdp-year"></select>
          </div>
          <button type="button" class="tdp-nav" data-nav="1">›</button>
        </div>
        <div class="tdp-dow">${THAI_DOW.map(d => `<span>${d}</span>`).join('')}</div>
        <div class="tdp-grid"></div>
        <div class="tdp-footer">
          <button type="button" class="tdp-today">วันนี้</button>
          <button type="button" class="tdp-clear">ล้างค่า</button>
        </div>
      </div>
    </div>
  `;

  const display = container.querySelector('.tdp-display');
  const hidden = container.querySelector(`input[name="${name}"]`);
  const panel = container.querySelector('.tdp-panel');
  const monthSel = container.querySelector('.tdp-month');
  const yearSel = container.querySelector('.tdp-year');
  const grid = container.querySelector('.tdp-grid');

  THAI_MONTHS.forEach((m, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = m;
    monthSel.appendChild(opt);
  });

  const nowYear = new Date().getFullYear();
  for (let y = nowYear; y >= nowYear - 120; y--) {
    const opt = document.createElement('option');
    opt.value = String(y);
    opt.textContent = String(y + BE_OFFSET);
    yearSel.appendChild(opt);
  }

  function renderGrid() {
    monthSel.value = String(viewDate.getMonth());
    yearSel.value = String(viewDate.getFullYear());
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    let html = '';
    for (let i = 0; i < firstDow; i++) html += `<span class="tdp-day empty"></span>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month, d);
      const cls = ['tdp-day'];
      if (selected && sameDate(selected, dayDate)) cls.push('selected');
      if (sameDate(today, dayDate)) cls.push('today');
      html += `<span class="${cls.join(' ')}" data-day="${d}">${d}</span>`;
    }
    grid.innerHTML = html;
    grid.querySelectorAll('.tdp-day:not(.empty)').forEach(dayEl => {
      dayEl.onclick = () => {
        selected = new Date(year, month, Number(dayEl.dataset.day));
        hidden.value = toIso(selected);
        display.value = formatDisplay(selected);
        closePanel();
      };
    });
  }

  function openPanel() {
    viewDate = selected ? new Date(selected) : new Date();
    renderGrid();
    panel.hidden = false;
    document.addEventListener('click', onOutsideClick, true);
  }

  function closePanel() {
    panel.hidden = true;
    document.removeEventListener('click', onOutsideClick, true);
  }

  function onOutsideClick(e) {
    if (!container.contains(e.target)) closePanel();
  }

  display.addEventListener('click', () => (panel.hidden ? openPanel() : closePanel()));
  monthSel.addEventListener('change', () => { viewDate = new Date(Number(yearSel.value), Number(monthSel.value), 1); renderGrid(); });
  yearSel.addEventListener('change', () => { viewDate = new Date(Number(yearSel.value), Number(monthSel.value), 1); renderGrid(); });
  container.querySelector('[data-nav="-1"]').onclick = () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1); renderGrid(); };
  container.querySelector('[data-nav="1"]').onclick = () => { viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1); renderGrid(); };
  container.querySelector('.tdp-today').onclick = () => {
    selected = new Date();
    hidden.value = toIso(selected);
    display.value = formatDisplay(selected);
    closePanel();
  };
  container.querySelector('.tdp-clear').onclick = () => {
    selected = null;
    hidden.value = '';
    display.value = '';
    closePanel();
  };
}
