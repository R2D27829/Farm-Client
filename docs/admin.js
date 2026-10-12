/* Farm Client — админ-панель. Один и тот же файл работает на сайте (docs/admin.html) и в лаунчере (Настройки → Админ-панель).
   FarmAdmin.mount(root, call, { toast }) — call(method, path, body) → Promise с JSON-ответом сервера. */
(function () {
  const E = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const D = (t) => (t ? new Date(t * 1000).toLocaleDateString('ru') : '—');
  const term = (days, until) => (until ? 'до ' + D(until) : +days ? +days + ' дн.' : 'навсегда');
  const exp = (e) => (e ? (e * 1000 < Date.now() ? '<span class="fa-bad">истёк ' + D(e) + '</span>' : 'до ' + D(e)) : 'бессрочно');
  const TYPE = { hwid: 'по HWID', free: 'без HWID', admin: 'админская' };
  const CSS = `.fa{--fa-line:var(--line,rgba(255,255,255,.1));font-size:13.5px}.fa [hidden]{display:none!important}
.fa-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}.fa-tabs button{font:inherit;font-size:13px;font-weight:600;padding:7px 13px;border-radius:999px;border:1px solid var(--fa-line);background:transparent;color:inherit;opacity:.75;cursor:pointer}
.fa-tabs button:hover{opacity:1}.fa-tabs button.on{opacity:1;background:var(--gold,var(--accent,#e8b04a));border-color:transparent;color:#17130a}
.fa-form{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:10px}.fa-f{display:flex;flex-direction:column;gap:4px;font-size:12px;opacity:.95}.fa-f>span{opacity:.7}
.fa-f input,.fa-f select{min-width:0;height:36px;padding:0 10px;box-sizing:border-box}.fa-f input[type=number]{width:100px}.fa-grow{flex:1;min-width:180px}
.fa-chk{display:flex;align-items:center;gap:7px;height:36px;font-size:13px;cursor:pointer;white-space:nowrap}.fa-chk input{width:16px;height:16px;margin:0;padding:0;flex:none;accent-color:var(--gold,var(--accent,#e8b04a))}
.fa-hint{font-size:12px;opacity:.65;margin:-2px 0 10px;line-height:1.45}.fa-list{max-height:460px;overflow:auto;margin-top:6px}
.fa-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:9px 2px;border-top:1px solid var(--fa-line)}.fa-row:first-child{border-top:0}
.fa-row .fa-main{flex:1;min-width:200px}.fa-row .fa-sub{font-size:12px;opacity:.65;margin-top:2px;word-break:break-word}.fa-row code{font-size:12px}
.fa-acts{display:flex;gap:6px;flex-wrap:wrap}.fa-acts .btn,.fa .btn.fa-s{padding:5px 11px;font-size:12.5px;height:auto;min-height:0}
.fa-out{margin:8px 0 12px}.fa-out textarea,.fa-out input{width:100%;box-sizing:border-box;font-family:ui-monospace,Consolas,monospace;font-size:12px;padding:8px}
.fa-pill{display:inline-block;font-size:11px;padding:1px 7px;border-radius:999px;border:1px solid var(--fa-line);margin-left:4px;opacity:.85}
.fa-bad{color:var(--red,#ef6b6b)}.fa-ok{color:var(--green,#6fd36f)}.fa-empty{opacity:.6;padding:10px 2px}
.fa-plan{display:grid;grid-template-columns:90px 1fr 90px 130px 80px auto auto;gap:8px;align-items:center;padding:8px 0;border-top:1px solid var(--fa-line)}
.fa-plan input:not([type=checkbox]),.fa-plan select{height:34px;padding:0 8px;min-width:0;box-sizing:border-box;width:100%}.fa-plan .fa-desc{grid-column:1/-1}
@media(max-width:720px){.fa-plan{grid-template-columns:1fr 1fr}.fa-plan .fa-desc{grid-column:1/-1}}`;

  function termHtml(id, def = 'forever') {
    return `<label class="fa-f"><span>Срок</span><select data-term="${id}"><option value="forever"${def === 'forever' ? ' selected' : ''}>Навсегда</option><option value="days"${def === 'days' ? ' selected' : ''}>Своё кол-во дней</option><option value="until">До даты</option></select></label>
      <label class="fa-f" data-tdays="${id}" hidden><span>Дней</span><input type="number" min="1" max="36500" value="30"></label>
      <label class="fa-f" data-tuntil="${id}" hidden><span>Действует до</span><input type="date"></label>`;
  }
  function termBind(root, id) {
    const s = root.querySelector(`[data-term="${id}"]`), d = root.querySelector(`[data-tdays="${id}"]`), u = root.querySelector(`[data-tuntil="${id}"]`);
    const upd = () => { d.hidden = s.value !== 'days'; u.hidden = s.value !== 'until'; };
    s.onchange = upd; upd();
    const ui = u.querySelector('input'); const t = new Date(Date.now() + 30 * 864e5); ui.value = t.toISOString().slice(0, 10);
    return () => {
      if (s.value === 'forever') return { forever: true };
      if (s.value === 'days') { const n = +d.querySelector('input').value; if (!(n > 0)) throw new Error('Укажи количество дней'); return { days: n }; }
      if (!ui.value) throw new Error('Выбери дату');
      const [y, m, dd] = ui.value.split('-').map(Number); return { until: Math.floor(new Date(y, m - 1, dd, 23, 59, 59).getTime() / 1000) };
    };
  }
  function copy(text, toast) {
    const done = () => toast('Скопировано');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fb); else fb();
    function fb() { const t = document.createElement('textarea'); t.value = text; document.body.append(t); t.select(); try { document.execCommand('copy'); done(); } catch {} t.remove(); }
  }
  // вместо prompt() (в Electron его нет): кнопка превращается в поле ввода + «ОК»
  function ask(btn, ph, cb) {
    const w = document.createElement('span'); w.className = 'fa-acts';
    w.innerHTML = `<input placeholder="${E(ph)}" style="height:30px;padding:0 8px;min-width:150px"><button class="btn fa-s">ОК</button><button class="btn fa-s">✕</button>`;
    btn.replaceWith(w); const i = w.querySelector('input'); i.focus();
    const [ok, no] = w.querySelectorAll('button');
    ok.onclick = () => cb(i.value.trim()); i.onkeydown = (e) => { if (e.key === 'Enter') ok.click(); if (e.key === 'Escape') no.click(); };
    no.onclick = () => w.replaceWith(btn);
  }

  function mount(root, call, opts = {}) {
    const toast = opts.toast || ((m) => alert(m));
    if (!document.getElementById('fa-css')) { const st = document.createElement('style'); st.id = 'fa-css'; st.textContent = CSS; document.head.append(st); }
    const run = async (fn, okMsg) => { try { const r = await fn(); if (okMsg) toast(okMsg); return r; } catch (e) { toast(e.message || String(e), true); return null; } };
    if (opts.inputClass) { // в лаунчере поля берут стиль текущей темы (Классика / «Яблочный» / Минимализм)
      const deco = () => root.querySelectorAll('input:not([type=checkbox]),select,textarea').forEach((i) => i.classList.add(opts.inputClass));
      new MutationObserver(deco).observe(root, { childList: true, subtree: true });
    }
    const tabs = [['stats', '📊 Статистика'], ['keys', '🔑 Ключи'], ['codes', '🎟️ Коды'], ['promo', '🏷️ Промокоды'], ['users', '👥 Игроки'], ['shop', '🛒 Тарифы'], ['orders', '📦 Заказы'], ['news', '📰 Новости'], ['verify', '✓ Галочки'], ['log', '📜 Журнал']];
    root.classList.add('fa');
    root.innerHTML = `<div class="fa-tabs">${tabs.map(([k, t]) => `<button data-fa-tab="${k}">${t}</button>`).join('')}</div>${tabs.map(([k]) => `<div data-fa-pane="${k}" hidden></div>`).join('')}`;
    const pane = (k) => root.querySelector(`[data-fa-pane="${k}"]`);
    const loaded = {};
    function show(k) {
      root.querySelectorAll('[data-fa-tab]').forEach((b) => b.classList.toggle('on', b.dataset.faTab === k));
      root.querySelectorAll('[data-fa-pane]').forEach((p) => (p.hidden = p.dataset.faPane !== k));
      if (!loaded[k]) { loaded[k] = true; R[k](pane(k)); } else if (R[k].refresh) R[k].refresh();
    }
    root.querySelectorAll('[data-fa-tab]').forEach((b) => (b.onclick = () => show(b.dataset.faTab)));
    const R = {};


    // ---------- статистика ----------
    const bars = (l, label) => { const mx = Math.max(1, ...l.map((x) => x.n)); return `<div class="fa-sub" style="margin:10px 0 4px">${label}</div><div style="display:flex;align-items:flex-end;gap:3px;height:70px">${l.map((x) => `<div title="${E(x.d)}: ${x.n}" style="flex:1;min-width:6px;height:${Math.max(4, x.n / mx * 100)}%;background:var(--gold,var(--accent,#e8b04a));border-radius:3px 3px 0 0;opacity:.85"></div>`).join('') || '<span class="fa-empty">нет данных</span>'}</div>`; };
    R.stats = (el) => {
      async function load() {
        const r = await run(() => call('GET', '/api/admin/stats')); if (!r) return;
        const box = (v, t) => `<div style="flex:1;min-width:120px;padding:12px;border:1px solid var(--fa-line);border-radius:12px"><div style="font-size:22px;font-weight:800">${v}</div><div class="fa-sub">${t}</div></div>`;
        el.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px">${box(r.online, 'онлайн сейчас')}${box(r.inGame, 'в игре')}${box(r.users, 'всего игроков')}${box('+' + r.new24, 'за сутки')}${box('+' + r.new7, 'за неделю')}${box(r.activeLicenses, 'активных ключей')}${box(r.paidOrders + ' · ' + r.revenue + ' ₽', 'оплачено заказов')}${box(r.vouchersUsed, 'кодов активировано')}${box(r.trials, 'пробных периодов')}${box(r.clans, 'кланов')}${box(r.uploads + ' · ' + r.downloads, 'публикаций · скачиваний')}</div>
          ${bars(r.activeByDay, 'Заходили по дням (14 дней)')}${bars(r.registrations, 'Новые игроки по дням')}
          <div class="fa-form" style="margin-top:16px"><b style="font-size:13px">Пробный период</b><label class="fa-f"><span>Дней</span><input type="number" min="1" max="30" data-t="d" value="3"></label><label class="fa-chk"><input type="checkbox" data-t="off"> выключить</label><button class="btn fa-s" data-t="save">Сохранить</button><button class="btn fa-s" data-t="ref">Обновить статистику</button></div>`;
        const ti = await run(() => call('GET', '/api/trial/info')); if (ti) { el.querySelector('[data-t="d"]').value = ti.days; el.querySelector('[data-t="off"]').checked = ti.off; }
        el.querySelector('[data-t="save"]').onclick = () => run(() => call('POST', '/api/admin/trial', { days: el.querySelector('[data-t="d"]').value, off: el.querySelector('[data-t="off"]').checked }), 'Сохранено');
        el.querySelector('[data-t="ref"]').onclick = load;
      }
      load(); R.stats.refresh = load;
    };

    // ---------- промокоды ----------
    R.promo = (el) => {
      el.innerHTML = `<div class="fa-hint">Скидка на тарифы магазина. Игрок вводит промокод на странице «Купить». Можно ограничить число использований, срок и тарифы.</div>
        <div class="fa-form"><label class="fa-f"><span>Код (пусто = случайный)</span><input data-p="code" maxlength="24" style="width:150px;text-transform:uppercase"></label>
        <label class="fa-f"><span>Скидка, %</span><input type="number" data-p="pct" min="1" max="99" value="20"></label>
        <label class="fa-f"><span>Использований (0 = ∞)</span><input type="number" data-p="max" min="0" value="0"></label>
        ${termHtml('p', 'forever').replace('<option value="days">Своё кол-во дней</option>', '')}
        <label class="fa-f"><span>Только тарифы (id через запятую)</span><input data-p="plans" style="width:150px" placeholder="все"></label>
        <label class="fa-f fa-grow"><span>Заметка</span><input data-p="note" maxlength="60"></label><button class="btn gold" data-p="go">Создать</button></div><div class="fa-list" data-p="list"></div>`;
      const $ = (k) => el.querySelector(`[data-p="${k}"]`); const getTerm = termBind(el, 'p');
      $('go').onclick = () => run(async () => { const t = getTerm(); const r = await call('POST', '/api/admin/promo', { code: $('code').value.trim(), pct: $('pct').value, maxUses: $('max').value, until: t.until || 0, forever: !t.until, plans: $('plans').value.trim(), note: $('note').value.trim() }); copy(r.code, toast); list(); }, 'Промокод создан и скопирован');
      async function list() {
        const l = await run(() => call('GET', '/api/admin/promo')); if (!l) return;
        $('list').innerHTML = l.map((x) => `<div class="fa-row"><div class="fa-main"><code style="user-select:all">${E(x.code)}</code><span class="fa-pill">−${x.pct}%</span><span class="fa-pill">${x.uses}${x.max_uses ? '/' + x.max_uses : ''} исп.</span>
          <div class="fa-sub">${x.until ? (x.until < Date.now() / 1000 ? '<span class="fa-bad">истёк</span> ' : 'до ') + D(x.until) : 'бессрочно'}${x.plans ? ' · тарифы: ' + E(x.plans) : ''}${x.note ? ' · ' + E(x.note) : ''}</div></div>
          <div class="fa-acts"><button class="btn fa-s" data-copy="${E(x.code)}">Копировать</button><button class="btn fa-s red" data-del="${E(x.code)}">Удалить</button></div></div>`).join('') || '<div class="fa-empty">Промокодов нет.</div>';
        $('list').querySelectorAll('[data-copy]').forEach((b) => (b.onclick = () => copy(b.dataset.copy, toast)));
        $('list').querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => confirm('Удалить промокод?') && run(() => call('POST', '/api/admin/promo', { delete: b.dataset.del }), 'Удалено').then(list)));
      }
      list();
    };

    // ---------- новости ----------
    R.news = (el) => {
      el.innerHTML = `<div class="fa-hint">Новость сразу появится на главной лаунчера, на сайте и в приложении (уведомлением на телефоне). Старые скрываются сами через 2 месяца, закреплённые — нет.</div>
        <div class="fa-form"><label class="fa-f fa-grow"><span>Заголовок</span><input data-n="title" maxlength="120"></label><label class="fa-f"><span>Метка</span><select data-n="tag"><option>Новость</option><option>Обновление</option><option>Событие</option><option>Альфа-тест</option><option>Сервер</option><option>Важно</option></select></label><label class="fa-chk"><input type="checkbox" data-n="pin"> закрепить</label></div>
        <div class="fa-form"><label class="fa-f fa-grow"><span>Текст</span><textarea data-n="text" rows="3" maxlength="2000" style="min-height:70px;padding:8px"></textarea></label></div>
        <div class="fa-form"><label class="fa-f fa-grow"><span>Ссылка (https://…, необязательно)</span><input data-n="url"></label><label class="fa-f fa-grow"><span>Картинка (https://…, необязательно)</span><input data-n="image"></label><button class="btn gold" data-n="go">Опубликовать</button></div>
        <div class="fa-list" data-n="list"></div>`;
      const $ = (k) => el.querySelector(`[data-n="${k}"]`);
      $('go').onclick = () => run(async () => { await call('POST', '/api/admin/news', { title: $('title').value, tag: $('tag').value, text: $('text').value, url: $('url').value.trim(), image: $('image').value.trim(), pinned: $('pin').checked }); $('title').value = $('text').value = ''; list(); }, 'Новость опубликована');
      async function list() {
        const l = await run(() => call('GET', '/api/news')); if (!l) return;
        $('list').innerHTML = l.map((x) => `<div class="fa-row"><div class="fa-main"><b>${E(x.title)}</b><span class="fa-pill">${E(x.tag)}</span>${x.pinned ? '<span class="fa-pill">📌</span>' : ''}<div class="fa-sub">${E(x.date)} · ${E(String(x.text || '').slice(0, 140))}</div></div><div class="fa-acts"><button class="btn fa-s red" data-del="${E(x.id)}">Удалить</button></div></div>`).join('') || '<div class="fa-empty">Новостей из админки пока нет (старые лежат в docs/news.json на GitHub).</div>';
        $('list').querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => confirm('Удалить новость?') && run(() => call('POST', '/api/admin/news', { delete: b.dataset.del }), 'Удалено').then(list)));
      }
      list();
    };

    // ---------- журнал действий ----------
    const ACT = { 'license.issue': '🔑 выдал ключ', 'license.revoke': '⛔ отозвал ключ', 'license.unrevoke': '↩️ вернул ключ', 'user.update': '👤 изменил игрока', 'vouchers.create': '🎟️ создал коды', 'shop.update': '🛒 изменил тарифы', 'order.manualPaid': '📦 подтвердил оплату', 'promo.create': '🏷️ промокод', 'promo.delete': '🏷️ удалил промокод', 'news.post': '📰 новость', 'news.delete': '📰 удалил новость', 'trial.settings': '⏳ пробный период' };
    R.log = (el) => {
      async function list() {
        const l = await run(() => call('GET', '/api/admin/log')); if (!l) return;
        el.innerHTML = `<div class="fa-acts" style="margin-bottom:6px"><button class="btn fa-s">Обновить</button></div><div class="fa-list">${l.map((x) => `<div class="fa-row"><div class="fa-main"><b>${E(x.admin_name || x.admin_id)}</b> ${ACT[x.action] || E(x.action)} <code>${E(x.target)}</code><div class="fa-sub">${new Date(x.created * 1000).toLocaleString('ru')} · ${E(x.detail)}</div></div></div>`).join('') || '<div class="fa-empty">Пока пусто.</div>'}</div>`;
        el.querySelector('button').onclick = list;
      }
      list(); R.log.refresh = list;
    };

    // ---------- ключи ----------
    R.keys = (el) => {
      el.innerHTML = `<div class="fa-hint">Ключ подписывает сервер. Срок — любой: своё число дней, до конкретной даты или навсегда. «Без HWID» — ключ работает на любом ПК. Если указать Farm ID игрока, ключ сам подтянется у него в лаунчере.</div>
        <div class="fa-form">
          <label class="fa-chk"><input type="checkbox" data-k="nohw"> Без HWID</label>
          <label class="fa-f fa-grow" data-k="hwbox"><span>HWID</span><input data-k="hwid" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX (пусто = HWID игрока)"></label>
          ${termHtml('k', 'forever')}
        </div>
        <div class="fa-form">
          <label class="fa-f"><span>Farm ID игрока (необязательно)</span><input data-k="uid" placeholder="u_…" style="width:170px"></label>
          <label class="fa-f"><span>Имя в ключе</span><input data-k="name" maxlength="40" style="width:150px"></label>
          <label class="fa-f fa-grow"><span>Заметка</span><input data-k="note" maxlength="80" placeholder="например: оплата переводом"></label>
          <button class="btn gold" data-k="go">Выдать ключ</button>
        </div>
        <div class="fa-out" data-k="out"></div>
        <div class="fa-form"><input data-k="q" class="fa-grow" placeholder="Поиск по выданным: ID ключа, имя, заметка" style="height:36px;padding:0 10px"><button class="btn fa-s" data-k="find">Обновить</button></div>
        <div class="fa-list" data-k="list"></div>`;
      const $ = (k) => el.querySelector(`[data-k="${k}"]`);
      const getTerm = termBind(el, 'k');
      $('nohw').onchange = () => { $('hwbox').style.opacity = $('nohw').checked ? .35 : 1; $('hwid').disabled = $('nohw').checked; };
      R.keys.prefill = (u) => { $('uid').value = u.id; $('name').value = u.name || ''; $('hwid').value = ''; $('uid').focus(); };
      $('go').onclick = () => run(async () => {
        const b = { ...getTerm(), noHwid: $('nohw').checked, hwid: $('hwid').value.trim(), userId: $('uid').value.trim(), name: $('name').value.trim(), note: $('note').value.trim() };
        const r = await call('POST', '/api/admin/license', b);
        $('out').innerHTML = `<div class="fa-sub" style="margin-bottom:4px">Ключ <code>${E(r.payload.id)}</code> · ${TYPE[r.payload.t]} · ${exp(r.payload.e)} — отправь игроку</div><input readonly value="${E(r.key)}"><div class="fa-acts" style="margin-top:6px"><button class="btn fa-s">Скопировать</button></div>`;
        $('out').querySelector('button').onclick = () => copy(r.key, toast); copy(r.key, toast); list();
      });
      async function list() {
        const l = await run(() => call('GET', '/api/admin/licenses?q=' + encodeURIComponent($('q').value.trim()))); if (!l) return;
        $('list').innerHTML = l.map((x) => `<div class="fa-row"><div class="fa-main"><code>${E(x.license_id)}</code><span class="fa-pill">${TYPE[x.type] || E(x.type)}</span> ${x.revoked != null ? '<span class="fa-bad">· отозван</span>' : ''}
          <div class="fa-sub">${exp(x.exp)} · ${E(x.user_name || x.name || 'без игрока')}${x.hwid ? ' · ' + E(x.hwid) : ''}${x.note ? ' · ' + E(x.note) : ''} · выдан ${D(x.created)}</div></div>
          <div class="fa-acts"><button class="btn fa-s" data-copy="${E(x.license_key)}">Копировать</button>${x.revoked != null ? `<button class="btn fa-s" data-unrev="${E(x.license_id)}">Вернуть</button>` : `<button class="btn fa-s red" data-rev="${E(x.license_id)}">Отозвать</button>`}</div></div>`).join('') || '<div class="fa-empty">Сервер ещё не выдавал ключей.</div>';
        wireRevoke($('list'), list);
        $('list').querySelectorAll('[data-copy]').forEach((b) => (b.onclick = () => copy(b.dataset.copy, toast)));
      }
      $('find').onclick = list; $('q').onkeydown = (e) => e.key === 'Enter' && list(); list();
    };
    function wireRevoke(box, after) {
      box.querySelectorAll('[data-rev]').forEach((b) => (b.onclick = () => ask(b, 'Причина отзыва', (why) => run(() => call('POST', '/api/admin/revoke', { licenseId: b.dataset.rev, reason: why }), 'Ключ отозван').then(after))));
      box.querySelectorAll('[data-unrev]').forEach((b) => (b.onclick = () => run(() => call('POST', '/api/admin/revoke', { licenseId: b.dataset.unrev, undo: true }), 'Ключ снова действует').then(after)));
    }

    // ---------- коды активации ----------
    R.codes = (el) => {
      el.innerHTML = `<div class="fa-hint">Код продаёшь игроку — он вводит его в лаунчере (Настройки → Лицензия). «Своё кол-во дней» считается с момента активации, «До даты» — фиксированная дата для всех. С HWID ключ привяжется к ПК игрока, «Без HWID» — будет работать на любом.</div>
        <div class="fa-form">
          <label class="fa-f"><span>Сколько</span><input type="number" data-c="n" min="1" max="200" value="5"></label>
          ${termHtml('c', 'days')}
          <label class="fa-chk"><input type="checkbox" data-c="nohw"> Без HWID</label>
          <label class="fa-f fa-grow"><span>Заметка</span><input data-c="note" maxlength="60" placeholder="например: альфа-тест"></label>
          <button class="btn gold" data-c="go">Создать коды</button>
        </div>
        <div class="fa-out" data-c="out"></div>
        <div class="fa-form"><label class="fa-chk"><input type="checkbox" data-c="free" checked> только свободные</label><button class="btn fa-s" data-c="ref">Обновить</button><button class="btn fa-s" data-c="copyall">Скопировать свободные</button></div>
        <div class="fa-list" data-c="list"></div>`;
      const $ = (k) => el.querySelector(`[data-c="${k}"]`);
      const getTerm = termBind(el, 'c'); let all = [];
      $('go').onclick = () => run(async () => {
        const r = await call('POST', '/api/admin/vouchers', { count: $('n').value, ...getTerm(), noHwid: $('nohw').checked, note: $('note').value.trim() });
        $('out').innerHTML = `<div class="fa-sub" style="margin-bottom:4px">Готово: ${r.codes.length} шт. · ${term(r.days, r.until)} · ${r.hwid ? 'с привязкой к ПК' : 'без HWID'}</div><textarea readonly rows="${Math.min(8, r.codes.length)}">${E(r.codes.join('\n'))}</textarea><div class="fa-acts" style="margin-top:6px"><button class="btn fa-s">Скопировать все</button></div>`;
        $('out').querySelector('button').onclick = () => copy(r.codes.join('\n'), toast); list();
      });
      async function list() {
        const l = await run(() => call('GET', '/api/admin/vouchers')); if (!l) return; all = l;
        const v = l.filter((x) => !$('free').checked || !x.used_at);
        $('list').innerHTML = v.map((x) => `<div class="fa-row"><div class="fa-main"><code style="user-select:all">${E(x.code)}</code><span class="fa-pill">${term(x.days, x.until)}</span><span class="fa-pill">${x.hwid === 0 ? 'без HWID' : 'HWID'}</span>
          <div class="fa-sub">${x.note ? E(x.note) + ' · ' : ''}${x.used_at ? '<span class="fa-ok">✔ ' + E(x.used_name || 'активирован') + ' ' + D(x.used_at) + '</span>' : 'свободен'} · создан ${D(x.created)}</div></div>
          <div class="fa-acts">${x.used_at ? '' : `<button class="btn fa-s" data-copy="${E(x.code)}">Копировать</button><button class="btn fa-s red" data-del="${E(x.code)}">Удалить</button>`}</div></div>`).join('') || '<div class="fa-empty">Кодов нет.</div>';
        $('list').querySelectorAll('[data-copy]').forEach((b) => (b.onclick = () => copy(b.dataset.copy, toast)));
        $('list').querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => confirm('Удалить код ' + b.dataset.del + '?') && run(() => call('POST', '/api/admin/vouchers/delete', { code: b.dataset.del }), 'Удалено').then(list)));
      }
      $('free').onchange = list; $('ref').onclick = list;
      $('copyall').onclick = () => { const c = all.filter((x) => !x.used_at).map((x) => x.code); c.length ? copy(c.join('\n'), toast) : toast('Свободных кодов нет'); };
      list();
    };

    // ---------- игроки ----------
    R.users = (el) => {
      el.innerHTML = `<div class="fa-form"><input data-u="q" class="fa-grow" placeholder="Ник, Farm ID или ID ключа" style="height:36px;padding:0 10px"><button class="btn gold" data-u="go">Найти</button></div><div class="fa-list" data-u="list"></div>`;
      const $ = (k) => el.querySelector(`[data-u="${k}"]`);
      async function list() {
        const l = await run(() => call('GET', '/api/admin/users?q=' + encodeURIComponent($('q').value.trim()))); if (!l) return;
        $('list').innerHTML = l.map((u) => `<div class="fa-row"><div class="fa-main"><b>${E(u.name || '—')}</b> ${u.verified ? '<span class="fa-pill">✓</span>' : ''}${u.role === 'admin' ? '<span class="fa-pill">🛡️ админ</span>' : ''}${u.banned ? '<span class="fa-pill fa-bad">⛔ бан</span>' : ''} <code>${E(u.id)}</code>
          <div class="fa-sub">${u.license_id ? 'Ключ ' + E(u.license_id) + ' · ' + (TYPE[u.license_type] || E(u.license_type)) + ' · ' + exp(u.license_exp) + (u.revoked != null ? ' · <span class="fa-bad">отозван</span>' : '') : 'без ключа'}${u.links ? ' · ' + E(u.links) : ''}${u.hwid ? ' · HWID ' + E(u.hwid) : ''} · с ${D(u.created)}</div></div>
          <div class="fa-acts"><button class="btn fa-s" data-give="${E(u.id)}" data-n="${E(u.name || '')}">Выдать ключ</button>
          ${u.license_id ? (u.revoked != null ? `<button class="btn fa-s" data-unrev="${E(u.license_id)}">Вернуть ключ</button>` : `<button class="btn fa-s" data-rev="${E(u.license_id)}">Отозвать ключ</button>`) : ''}
          <button class="btn fa-s" data-set="${E(u.id)}" data-f="verified" data-v="${u.verified ? 0 : 1}">${u.verified ? 'Снять ✓' : 'Дать ✓'}</button>
          <button class="btn fa-s" data-set="${E(u.id)}" data-f="role" data-v="${u.role === 'admin' ? 'user' : 'admin'}">${u.role === 'admin' ? 'Убрать админа' : 'Сделать админом'}</button>
          <button class="btn fa-s ${u.banned ? '' : 'red'}" data-set="${E(u.id)}" data-f="banned" data-v="${u.banned ? 0 : 1}">${u.banned ? 'Разбанить' : 'Забанить'}</button></div></div>`).join('') || '<div class="fa-empty">Никого не нашлось.</div>';
        wireRevoke($('list'), list);
        $('list').querySelectorAll('[data-give]').forEach((b) => (b.onclick = () => { show('keys'); R.keys.prefill && R.keys.prefill({ id: b.dataset.give, name: b.dataset.n }); }));
        $('list').querySelectorAll('[data-set]').forEach((b) => (b.onclick = () => {
          const f = b.dataset.f, v = b.dataset.v;
          if ((f === 'banned' && v === '1' && !confirm('Забанить игрока? Все его сессии завершатся.')) || (f === 'role' && !confirm(v === 'admin' ? 'Дать права администратора?' : 'Убрать права администратора?'))) return;
          run(() => call('POST', '/api/admin/user', { userId: b.dataset.set, [f]: f === 'role' ? v : v === '1' }), 'Готово').then(list);
        }));
      }
      $('go').onclick = list; $('q').onkeydown = (e) => e.key === 'Enter' && list(); list();
    };

    // ---------- тарифы магазина ----------
    R.shop = (el) => {
      el.innerHTML = `<div class="fa-hint">Тарифы страницы «Купить». Срок любой (0 = навсегда), с привязкой к ПК или без. Изменения применяются сразу — без перезапуска сервера.</div><div data-s="st" class="fa-sub" style="margin-bottom:8px"></div>
        <div data-s="rows"></div><div class="fa-acts" style="margin:10px 0"><button class="btn fa-s" data-s="add">+ Тариф</button></div>
        <div class="fa-form"><label class="fa-f fa-grow"><span>Контакт «Купить у админа» (если онлайн-оплата выключена)</span><input data-s="contact" maxlength="120" placeholder="discord:ник или https://t.me/…"></label><button class="btn gold" data-s="save">Сохранить</button></div>`;
      const $ = (k) => el.querySelector(`[data-s="${k}"]`);
      const row = (p = {}) => {
        const d = document.createElement('div'); d.className = 'fa-plan';
        d.innerHTML = `<input data-p="id" placeholder="id" value="${E(p.id || '')}" title="ID латиницей"><input data-p="title" placeholder="Название" value="${E(p.title || '')}"><input data-p="price" type="number" min="1" placeholder="₽" value="${p.price || ''}" title="Цена, ₽">
          <select data-p="term"><option value="0">Навсегда</option><option value="d"${+p.days ? ' selected' : ''}>Дней:</option></select>
          <input data-p="days" type="number" min="1" value="${+p.days || 30}" style="${+p.days ? '' : 'visibility:hidden'}">
          <label class="fa-chk" title="Ключ привязывается к ПК покупателя"><input type="checkbox" data-p="hwid" ${p.hwid !== false ? 'checked' : ''}> HWID</label>
          <button class="btn fa-s red" title="Удалить тариф">Удалить</button>
          <input class="fa-desc" data-p="desc" placeholder="Описание (необязательно)" value="${E(p.desc || '')}">
          <label class="fa-chk fa-desc" style="height:22px"><input type="checkbox" data-p="off" ${p.off ? 'checked' : ''}> скрыть с сайта</label>`;
        const t = d.querySelector('[data-p="term"]'), dy = d.querySelector('[data-p="days"]');
        t.onchange = () => (dy.style.visibility = t.value === 'd' ? '' : 'hidden');
        d.querySelector('button').onclick = () => d.remove();
        $('rows').append(d);
      };
      $('add').onclick = () => row({ hwid: true });
      $('save').onclick = () => run(async () => {
        const plans = [...$('rows').children].map((d) => { const g = (k) => d.querySelector(`[data-p="${k}"]`); return { id: g('id').value.trim(), title: g('title').value.trim(), price: +g('price').value, days: g('term').value === 'd' ? +g('days').value : 0, hwid: g('hwid').checked, desc: g('desc').value.trim(), off: g('off').checked }; });
        await call('POST', '/api/admin/shop', { plans, contact: $('contact').value.trim() }); load();
      }, 'Тарифы сохранены');
      async function load() {
        const r = await run(() => call('GET', '/api/admin/shop')); if (!r) return;
        $('rows').innerHTML = ''; r.plans.forEach(row); $('contact').value = r.contact || '';
        const f = (ok, t) => `<span class="${ok ? 'fa-ok' : 'fa-bad'}">${ok ? '✔' : '✕'} ${t}</span>`;
        $('st').innerHTML = `Онлайн-оплата: ${r.enabled ? '<b class="fa-ok">включена</b>' : '<b>выключена</b> — игроки видят кнопку «Купить у админа»'} · ${f(r.wallet, 'кошелёк ЮMoney')} · ${f(r.secret, 'секрет уведомлений')} · ${f(r.signer, 'подпись ключей')}`;
      }
      load();
    };

    // ---------- заказы ----------
    R.orders = (el) => {
      el.innerHTML = `<div class="fa-hint">Если игрок оплатил переводом мимо формы — нажми «Подтвердить оплату», ключ выдастся автоматически.</div><div class="fa-acts" style="margin-bottom:6px"><button class="btn fa-s" data-o="ref">Обновить</button></div><div class="fa-list" data-o="list"></div>`;
      const ST = { new: 'ожидает оплаты', paid: '<span class="fa-ok">оплачен</span>', underpaid: '<span class="fa-bad">недоплата</span>', cancelled: 'отменён' };
      async function list() {
        const l = await run(() => call('GET', '/api/admin/orders')); if (!l) return;
        el.querySelector('[data-o="list"]').innerHTML = l.map((o) => `<div class="fa-row"><div class="fa-main"><b>${E(o.title || o.plan)}</b> · ${o.price} ₽ <span class="fa-pill">${term(o.days)}</span> <code>${E(o.id)}</code>
          <div class="fa-sub">${E(o.name || o.user_id)} · ${ST[o.status] || E(o.status)} · ${D(o.created)}${o.license_id ? ' · ключ ' + E(o.license_id) : ''}</div></div>
          <div class="fa-acts">${o.status !== 'paid' ? `<button class="btn fa-s gold" data-pay="${E(o.id)}">Подтвердить оплату</button>${o.status !== 'cancelled' ? `<button class="btn fa-s" data-cancel="${E(o.id)}">Отменить</button>` : ''}` : `<button class="btn fa-s" data-copy="${E(o.license_key || '')}">Копировать ключ</button>`}</div></div>`).join('') || '<div class="fa-empty">Заказов пока нет.</div>';
        el.querySelectorAll('[data-pay]').forEach((b) => (b.onclick = () => confirm('Подтвердить оплату и выдать ключ?') && run(() => call('POST', '/api/admin/order', { id: b.dataset.pay }), 'Ключ выдан').then(list)));
        el.querySelectorAll('[data-cancel]').forEach((b) => (b.onclick = () => run(() => call('POST', '/api/admin/order', { id: b.dataset.cancel, action: 'cancel' }), 'Отменён').then(list)));
        el.querySelectorAll('[data-copy]').forEach((b) => (b.onclick = () => copy(b.dataset.copy, toast)));
      }
      el.querySelector('[data-o="ref"]').onclick = list; list();
    };

    // ---------- галочки ----------
    R.verify = (el) => {
      el.innerHTML = `<div class="fa-form"><label class="fa-f fa-grow"><span>Выдать галочку по Farm ID</span><input data-v="id" placeholder="u_…"></label><button class="btn gold" data-v="give">Выдать ✓</button></div><div class="fa-list" data-v="list"></div>`;
      const act = (id, approve, note) => run(() => call('POST', '/api/admin/verify', { userId: id, approve, note }), approve ? 'Галочка выдана' : 'Готово').then(list);
      el.querySelector('[data-v="give"]').onclick = () => { const id = el.querySelector('[data-v="id"]').value.trim(); if (id) act(id, true); };
      async function list() {
        const d = await run(() => call('GET', '/api/admin/verify')); if (!d) return;
        const row = (x, b) => `<div class="fa-row"><div class="fa-main"><b>${E(x.name || 'Игрок')}</b> <code>${E(x.user_id || x.id)}</code><div class="fa-sub">${E(x.links || 'без привязок')}</div>${x.text ? `<div style="white-space:pre-wrap;margin-top:4px;font-size:12.5px">${E(x.text)}</div>` : ''}</div><div class="fa-acts">${b}</div></div>`;
        el.querySelector('[data-v="list"]').innerHTML = '<div class="fa-sub" style="margin:4px 0">Заявки:</div>' + ((d.pending || []).map((x) => row(x, `<button class="btn fa-s gold" data-ok="${E(x.user_id)}">✔ Выдать</button><button class="btn fa-s red" data-no="${E(x.user_id)}">Отклонить</button>`)).join('') || '<div class="fa-empty">Новых заявок нет.</div>') +
          `<div class="fa-sub" style="margin:12px 0 4px">С галочкой (${(d.verified || []).length}):</div>` + (d.verified || []).map((x) => row(x, `<button class="btn fa-s" data-rm="${E(x.id)}">Снять</button>`)).join('');
        el.querySelectorAll('[data-ok]').forEach((b) => (b.onclick = () => act(b.dataset.ok, true)));
        el.querySelectorAll('[data-no]').forEach((b) => (b.onclick = () => ask(b, 'Причина (необязательно)', (n) => act(b.dataset.no, false, n))));
        el.querySelectorAll('[data-rm]').forEach((b) => (b.onclick = () => confirm('Снять галочку?') && act(b.dataset.rm, false, 'галочка снята')));
      }
      list();
    };

    show(opts.tab || 'stats');
    return { show };
  }
  window.FarmAdmin = { mount, termHtml, termBind, term };
})();
