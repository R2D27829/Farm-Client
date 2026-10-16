// Informational notice for the website, never for Farm Client's native wrappers.
(() => {
  if (window.FarmApp || /(?:FarmClientApp|Electron)\//i.test(navigator.userAgent)) return;
  const key = 'fc_cookie_notice_v1', laterKey = key + '_later';
  try { if (localStorage.getItem(key) === 'accepted') return; } catch {}
  try { if (sessionStorage.getItem(laterKey) === 'later') return; } catch {}
  const en = document.documentElement.lang.toLowerCase().startsWith('en');
  const copy = en ? {
    title: 'Cookies and site data',
    text: 'This site uses browser storage to keep you signed in and remember settings. Passwords are not stored there. This notice does not enable advertising cookies.',
    accept: 'Accept cookies', later: 'Later', error: 'Could not save your choice. Please check browser storage permissions.'
  } : {
    title: 'Cookies и данные сайта',
    text: 'Сайт использует хранилище браузера для сохранения входа и настроек. Пароли в нём не сохраняются. Это уведомление не включает рекламные cookies.',
    accept: 'Принять cookies', later: 'Позже', error: 'Не удалось сохранить выбор. Проверь разрешения браузера на хранение данных.'
  };
  function show() {
    if (document.getElementById('fc-cookie-notice')) return;
    const box = document.createElement('section');
    box.id = 'fc-cookie-notice'; box.setAttribute('role', 'region'); box.setAttribute('aria-labelledby', 'fc-cookie-title');
    const title = document.createElement('h2'); title.id = 'fc-cookie-title'; title.textContent = copy.title;
    const text = document.createElement('p'); text.textContent = copy.text;
    const status = document.createElement('p'); status.className = 'fc-cookie-status'; status.setAttribute('role', 'status'); status.hidden = true;
    const actions = document.createElement('div'); actions.className = 'fc-cookie-actions';
    const accept = document.createElement('button'); accept.type = 'button'; accept.className = 'fc-cookie-accept'; accept.textContent = copy.accept;
    const later = document.createElement('button'); later.type = 'button'; later.className = 'fc-cookie-later'; later.textContent = copy.later;
    accept.addEventListener('click', () => {
      try { localStorage.setItem(key, 'accepted'); box.remove(); }
      catch { status.hidden = false; status.textContent = copy.error; }
    });
    later.addEventListener('click', () => {
      try { sessionStorage.setItem(laterKey, 'later'); } catch {}
      box.remove();
    });
    actions.append(accept, later); box.append(title, text, status, actions); document.body.append(box);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show, {once: true}); else show();
})();
