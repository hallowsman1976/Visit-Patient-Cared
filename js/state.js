// state.js — session ผู้ใช้ปัจจุบัน เก็บใน localStorage
const KEY = 'ihs_session';

export function getSession() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
}

export function setSession(session) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function isLoggedIn() {
  const s = getSession();
  return !!(s && s.accessToken && s.userUid);
}
