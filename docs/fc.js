// Общее для страниц сайта: адрес API, сессия, навигация, тосты.
// Адрес воркера (server/) — тот же, что apiBase в src/config.js лаунчера.
window.FC_API = window.FC_API || 'https://farmclient-api.farmclient.workers.dev';   // например 'https://farmclient-api.<ник>.workers.dev'
const FC = {
  get token() { return localStorage.getItem('fc_token') || ''; },
  set token(v) { v ? localStorage.setItem('fc_token', v) : localStorage.removeItem('fc_token'); FC.appSync(); window.dispatchEvent(new Event('fc:session')); },
  // Android-приложение 1.3+: передаём токен для фоновых уведомлений
  appSync() { try { if (window.FarmApp && FarmApp.setToken) FarmApp.setToken(localStorage.getItem('fc_token') || ''); } catch {} },
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
    n.innerHTML = `<div class="wrap"><a class="logo" href="index.html"><img src="img/logo.png" alt="">FARM <span>CLIENT</span></a><button class="nb" aria-label="Menu" onclick="this.closest('nav').classList.toggle('open')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button><div class="links">
      <a href="index.html">Главная</a><a href="u.html" class="${active === 'players' ? 'on' : ''}" ${active === 'players' ? 'aria-current="page"' : ''}>Игроки</a><a href="gallery.html" class="${active === 'gallery' ? 'on' : ''}">Галерея</a><a href="chat.html" class="${active === 'chat' ? 'on' : ''}">Мессенджер</a><a href="clans.html" class="${active === 'clans' ? 'on' : ''}">Кланы</a><a href="community.html" class="${active === 'community' ? 'on' : ''}">Опросы</a><a href="support.html" class="${active === 'support' ? 'on' : ''}">Поддержка</a><a href="faq.html" class="${active === 'faq' ? 'on' : ''}">Помощь</a><a href="buy.html" class="${active === 'buy' ? 'on' : ''}">Купить</a><a href="account.html" class="${active === 'account' ? 'on' : ''}">Кабинет</a><a href="en.html" title="English">EN</a></div></div>`;
    document.body.prepend(n); const g = document.createElement('div'); g.className = 'glow'; document.body.prepend(g);
  },
  size: (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' МБ' : Math.max(1, Math.round(n / 1024)) + ' КБ'),
  date: (s) => new Date(s * 1000).toLocaleDateString('ru'),
};
FC.appSync();

// Android 1.3 users see the upgrade link even before the native checker exists.
(async()=>{try{if(!window.FarmApp||!FarmApp.version)return;const cur=FarmApp.version();if(localStorage.getItem('fc_apk_notice')===new Date().toDateString())return;const r=await(await fetch('android-release.json?check='+Date.now())).json();const n=v=>v.split('.').reduce((a,x)=>a*1000+(+x||0),0);if(n(r.version)>n(cur)){localStorage.setItem('fc_apk_notice',new Date().toDateString());FC.toast('Доступно приложение '+r.version+' — обновление в Кабинете');}}catch{}})();
