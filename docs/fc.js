// Общее для страниц сайта: адрес API, сессия, навигация, тосты.
// Адрес воркера (server/) — тот же, что apiBase в src/config.js лаунчера.
window.FC_API = window.FC_API || '';   // например 'https://farmclient-api.<ник>.workers.dev'
const FC = {
  get token() { return localStorage.getItem('fc_token') || ''; },
  set token(v) { v ? localStorage.setItem('fc_token', v) : localStorage.removeItem('fc_token'); },
  async api(method, path, { body, raw, auth = true } = {}) {
    if (!window.FC_API) throw new Error('Сервер ещё не подключён (FC_API в docs/fc.js)');
    const h = {};
    if (auth && FC.token) h.Authorization = 'Bearer ' + FC.token;
    let b; if (raw) b = raw; else if (body !== undefined) { b = JSON.stringify(body); h['Content-Type'] = 'application/json'; }
    const r = await fetch(window.FC_API + path, { method, headers: h, body: b });
    if (r.status === 401 && auth) FC.token = '';
    if (!r.ok) { let m = 'HTTP ' + r.status; try { m = (await r.json()).error || m; } catch {} throw new Error(m); }
    return (r.headers.get('content-type') || '').includes('json') ? r.json() : r.blob();
  },
  esc: (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  toast(msg, err) { let t = document.getElementById('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.append(t); } t.textContent = msg; t.className = 'on' + (err ? ' err' : ''); clearTimeout(FC._t); FC._t = setTimeout(() => (t.className = ''), 3500); },
  nav(active) {
    const n = document.createElement('nav');
    n.innerHTML = `<div class="wrap"><a class="logo" href="index.html">FARM <span>CLIENT</span></a><div class="links">
      <a href="index.html">Главная</a><a href="gallery.html" class="${active === 'gallery' ? 'on' : ''}">Галерея</a><a href="chat.html" class="${active === 'chat' ? 'on' : ''}">Мессенджер</a><a href="account.html" class="${active === 'account' ? 'on' : ''}">Кабинет</a></div></div>`;
    document.body.prepend(n); const g = document.createElement('div'); g.className = 'glow'; document.body.prepend(g);
  },
  size: (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' МБ' : Math.max(1, Math.round(n / 1024)) + ' КБ'),
  date: (s) => new Date(s * 1000).toLocaleDateString('ru'),
};
