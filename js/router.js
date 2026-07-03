// router.js — hash router แบบง่าย ไม่พึ่ง framework
import { isLoggedIn } from './state.js';

const routes = {};

export function route(path, handler) { routes[path] = handler; }

function parseHash() {
  const hash = location.hash.slice(1) || '/login';
  const [path, queryStr] = hash.split('?');
  const params = Object.fromEntries(new URLSearchParams(queryStr || ''));
  return { path: path || '/dashboard', params };
}

export function navigate(path, params) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  location.hash = '#' + path + qs;
}

export async function renderRoute() {
  const { path, params } = parseHash();
  const app = document.getElementById('app');

  if (path !== '/login' && !isLoggedIn()) {
    navigate('/login');
    return;
  }
  if (path === '/login' && isLoggedIn()) {
    navigate('/dashboard');
    return;
  }

  const handler = routes[path] || routes['/dashboard'];
  document.body.classList.toggle('is-login', path === '/login');
  updateBottomNav(path);
  app.innerHTML = '<div class="container"><div class="empty-state">กำลังโหลด...</div></div>';
  window.scrollTo(0, 0);
  try {
    await handler(app, params);
  } catch (err) {
    app.innerHTML = `<div class="container"><div class="card"><b>เกิดข้อผิดพลาด:</b> ${err.message}</div></div>`;
  }
}

function updateBottomNav(path) {
  const nav = document.getElementById('bottomNav');
  if (!nav) return;
  nav.style.display = path === '/login' ? 'none' : 'flex';
  Array.from(nav.querySelectorAll('a')).forEach(a => {
    a.classList.toggle('active', a.dataset.path === path);
  });
}

window.addEventListener('hashchange', renderRoute);
