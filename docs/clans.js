/* Farm Client — кланы (как в Clash Royale). Один файл для сайта (docs/clans.html) и лаунчера (Друзья → Клан).
   FarmClans.mount(root, call, { toast, onJoin(addr, version), myWorld() → {addr, version} | null, upload(file) → {url} }) */
(function () {
  const E = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const D = (t) => new Date(t * 1000).toLocaleDateString('ru');
  const T = (t) => new Date(t * 1000).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  const BADGES = ['🛡️', '⚔️', '👑', '🐉', '🔥', '❄️', '⚡', '🌾', '💎', '🏰', '🦁', '🐺', '🦅', '💀', '🌙', '⭐', '🍀', '🎯', '🏹', '🪓'];
  const TYPE = { open: 'Открытый', invite: 'По приглашению', closed: 'Закрытый' };
  const ROLE = { leader: 'Лидер', co: 'Соруководитель', elder: 'Старейшина', member: 'Участник' };
  const RK = { member: 0, elder: 1, co: 2, leader: 3 };
  const ST = { game: ['#6fd36f', 'в игре'], menu: ['#e8b04a', 'в лаунчере'], dnd: ['#ef6b6b', 'не беспокоить'], away: ['#9a9890', 'отошёл'], offline: ['#555', 'не в сети'] };
  const CSS = `.fcl{--l:var(--line,rgba(255,255,255,.1));font-size:13.5px}.fcl [hidden]{display:none!important}
.fcl-head{display:flex;gap:14px;align-items:center;flex-wrap:wrap;padding:14px;border-radius:16px;background:linear-gradient(135deg,rgba(232,176,74,.16),rgba(94,92,230,.12));border:1px solid var(--l);margin-bottom:12px}
.fcl-badge{font-size:44px;line-height:1;width:64px;height:64px;display:grid;place-items:center;border-radius:16px;background:rgba(0,0,0,.25)}
.fcl-head h3{margin:0;font-size:20px}.fcl-sub{font-size:12px;opacity:.7}.fcl-stats{display:flex;gap:14px;flex-wrap:wrap;margin-top:6px;font-size:13px}.fcl-stats b{font-size:15px}
.fcl-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}.fcl-tabs button{font:inherit;font-size:13px;font-weight:600;padding:7px 13px;border-radius:999px;border:1px solid var(--l);background:transparent;color:inherit;opacity:.75;cursor:pointer}.fcl-tabs button.on{opacity:1;background:var(--gold,var(--accent,#e8b04a));color:#17130a;border-color:transparent}
.fcl-chat{height:360px;overflow:auto;display:flex;flex-direction:column;gap:6px;padding:8px;border:1px solid var(--l);border-radius:12px;background:rgba(0,0,0,.15)}
.fcl-m{max-width:80%;padding:7px 10px;border-radius:12px;background:rgba(255,255,255,.06);align-self:flex-start;word-break:break-word}.fcl-m.me{align-self:flex-end;background:rgba(232,176,74,.18)}
.fcl-m .who{font-size:11.5px;font-weight:700;opacity:.85;margin-bottom:2px}.fcl-m .who small{font-weight:400;opacity:.6;margin-left:6px}.fcl-m.sys{align-self:center;background:transparent;font-size:12px;opacity:.6;padding:2px}
.fcl-m.card{border:1px solid var(--l)}.fcl-m img,.fcl-m video{max-width:240px;max-height:200px;border-radius:8px;display:block;margin-top:4px}.fcl-m audio{margin-top:4px;max-width:240px}
.fcl-send{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}.fcl-send input[type=text]{flex:1;min-width:160px;height:38px;padding:0 12px;box-sizing:border-box}
.fcl-row{display:flex;align-items:center;gap:10px;padding:8px 2px;border-top:1px solid var(--l);flex-wrap:wrap}.fcl-row:first-child{border-top:0}.fcl-row .grow{flex:1;min-width:150px}
.fcl-dot{width:9px;height:9px;border-radius:50%;display:inline-block;margin-right:6px;vertical-align:middle}.fcl-pill{display:inline-block;font-size:11px;padding:1px 7px;border-radius:999px;border:1px solid var(--l);margin-left:4px;opacity:.85}
.fcl-acts{display:flex;gap:5px;flex-wrap:wrap}.fcl .btn.s{padding:5px 11px;font-size:12.5px;height:auto;min-height:0}
.fcl-form{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin:8px 0}.fcl-f{display:flex;flex-direction:column;gap:4px;font-size:12px}.fcl-f>span{opacity:.7}.fcl-f input,.fcl-f select,.fcl-f textarea{height:36px;padding:0 10px;box-sizing:border-box;min-width:0}.fcl-f textarea{height:60px;padding:8px}
.fcl-badges{display:flex;flex-wrap:wrap;gap:4px}.fcl-badges button{font-size:20px;width:38px;height:38px;border-radius:10px;border:1px solid var(--l);background:transparent;cursor:pointer}.fcl-badges button.on{border-color:var(--gold,#e8b04a);background:rgba(232,176,74,.18)}
.fcl-list .fcl-row .fcl-badge{font-size:26px;width:42px;height:42px;border-radius:12px}.fcl-empty{opacity:.6;padding:10px 2px}`;

  function mount(root, call, opts = {}) {
    const toast = opts.toast || ((m) => alert(m));
    if (!document.getElementById('fcl-css')) { const st = document.createElement('style'); st.id = 'fcl-css'; st.textContent = CSS; document.head.append(st); }
    root.classList.add('fcl');
    const run = async (fn, okMsg) => { try { const r = await fn(); if (okMsg) toast(okMsg); return r; } catch (e) { toast(e.message || String(e), true); return null; } };
    const deco = () => opts.inputClass && root.querySelectorAll('input:not([type=checkbox]):not([type=file]),select,textarea').forEach((i) => i.classList.add(opts.inputClass));
    let clan = null, me = null, tab = 'chat', timer = null, lastT = 0, seen = new Set();
    async function start() {
      clearInterval(timer);
      const meR = await run(() => call('GET', '/api/me')); if (!meR) { root.innerHTML = '<div class="fcl-empty">Войди в Farm ID, чтобы вступить в клан.</div>'; return; }
      me = meR; clan = await run(() => call('GET', '/api/clans/mine'));
      clan ? renderClan() : renderBrowse();
    }
    // ---------- нет клана: поиск и создание ----------
    function renderBrowse() {
      root.innerHTML = `<div class="fcl-head" style="background:linear-gradient(135deg,rgba(94,92,230,.14),rgba(232,176,74,.1))"><div class="fcl-badge">🛡️</div><div style="flex:1;min-width:200px"><h3>Кланы</h3><div class="fcl-sub">Вступи в клан или создай свой: общий чат, приглашения в мир, просьбы о помощи, роли и 🏆 трофеи (часы в игре). До 50 человек.</div></div></div>
        <div class="fcl-form"><input type="text" data-c="q" placeholder="Название или тег #…" style="flex:1;min-width:180px;height:38px;padding:0 12px"><button class="btn gold" data-c="find">Найти</button><button class="btn" data-c="new">+ Создать клан</button></div>
        <div data-c="create" hidden></div><div class="fcl-list" data-c="list"></div>`;
      const $ = (k) => root.querySelector(`[data-c="${k}"]`);
      if (opts.q) { $('q').value = opts.q; opts.q = ''; }
      async function list() {
        const l = await run(() => call('GET', '/api/clans?q=' + encodeURIComponent($('q').value.trim()))); if (!l) return;
        $('list').innerHTML = l.map((c) => `<div class="fcl-row"><div class="fcl-badge">${E(c.badge)}</div><div class="grow"><b>${E(c.name)}</b> <span class="fcl-sub">${E(c.tag)}</span><div class="fcl-sub">🏆 ${c.trophies} · 👥 ${c.count}/50 · ${TYPE[c.type]}${c.min_hours ? ' · от ' + c.min_hours + ' 🏆' : ''}${c.descr ? ' · ' + E(c.descr.slice(0, 90)) : ''}</div></div>
          <div class="fcl-acts">${c.type === 'closed' ? '<span class="fcl-sub">закрыт</span>' : `<button class="btn s gold" data-join="${E(c.id)}" data-t="${c.type}">${c.type === 'invite' ? 'Подать заявку' : 'Вступить'}</button>`}</div></div>`).join('') || '<div class="fcl-empty">Кланов пока нет — создай первый!</div>';
        $('list').querySelectorAll('[data-join]').forEach((b) => (b.onclick = async () => { const r = await run(() => call('POST', `/api/clans/${b.dataset.join}/join`, {})); if (!r) return; if (r.requested) { toast('Заявка отправлена'); b.disabled = true; b.textContent = 'Заявка отправлена'; } else { clan = r; renderClan(); } }));
      }
      $('find').onclick = list; $('q').onkeydown = (e) => e.key === 'Enter' && list();
      $('new').onclick = () => { $('create').hidden = !$('create').hidden; if (!$('create').hidden) editForm($('create'), null); };
      deco(); list();
    }
    function editForm(box, c) {
      let badge = (c && c.badge) || BADGES[0];
      box.innerHTML = `<div style="padding:12px;border:1px solid var(--l);border-radius:12px;margin-bottom:10px"><div class="fcl-badges">${BADGES.map((b) => `<button type="button" class="${b === badge ? 'on' : ''}">${b}</button>`).join('')}</div>
        <div class="fcl-form"><label class="fcl-f" style="flex:1;min-width:160px"><span>Название</span><input data-e="name" maxlength="24" value="${E(c ? c.name : '')}"></label>
        <label class="fcl-f"><span>Тип</span><select data-e="type">${Object.entries(TYPE).map(([k, v]) => `<option value="${k}" ${c && c.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="fcl-f"><span>Нужно 🏆 (часов)</span><input data-e="min" type="number" min="0" value="${c ? c.minHours || 0 : 0}" style="width:110px"></label>
        <label class="fcl-f"><span>Регион</span><input data-e="region" maxlength="30" value="${E(c ? c.region : '')}" placeholder="Россия" style="width:120px"></label></div>
        <label class="fcl-f"><span>Описание</span><textarea data-e="descr" maxlength="300">${E(c ? c.descr : '')}</textarea></label>
        <div class="fcl-acts" style="margin-top:8px"><button class="btn gold" data-e="save">${c ? 'Сохранить' : 'Создать клан'}</button></div></div>`;
      box.querySelectorAll('.fcl-badges button').forEach((b) => (b.onclick = () => { badge = b.textContent; box.querySelectorAll('.fcl-badges button').forEach((x) => x.classList.toggle('on', x === b)); }));
      const g = (k) => box.querySelector(`[data-e="${k}"]`).value;
      box.querySelector('[data-e="save"]').onclick = async () => {
        const body = { name: g('name'), type: g('type'), minHours: g('min'), region: g('region'), descr: g('descr'), badge };
        const r = await run(() => call('POST', c ? `/api/clans/${c.id}/edit` : '/api/clans', body), c ? 'Сохранено' : 'Клан создан!'); if (r) { clan = r; tab = c ? 'members' : 'chat'; renderClan(); }
      };
      deco();
    }
    // ---------- мой клан ----------
    function renderClan() {
      clearInterval(timer);
      const c = clan, my = RK[c.myRole] ?? -1;
      root.innerHTML = `<div class="fcl-head"><div class="fcl-badge">${E(c.badge)}</div><div style="flex:1;min-width:200px"><h3>${E(c.name)} <span class="fcl-sub">${E(c.tag)}</span></h3><div class="fcl-sub">${E(c.descr || '')}</div>
        <div class="fcl-stats"><span>🏆 <b>${c.trophies}</b></span><span>👥 <b>${c.count}</b>/50</span><span>${TYPE[c.type]}</span>${c.minHours ? `<span>от ${c.minHours} 🏆</span>` : ''}${c.region ? `<span>📍 ${E(c.region)}</span>` : ''}<span>Ты: <b>${ROLE[c.myRole]}</b></span></div></div></div>
        <div class="fcl-tabs"><button data-t="chat">💬 Чат</button><button data-t="events">📅 События</button><button data-t="members">👥 Участники</button>${my >= 1 ? `<button data-t="req">📨 Заявки${c.requests.length ? ' (' + c.requests.length + ')' : ''}</button>` : ''}${my >= 2 ? '<button data-t="edit">⚙️ Настройки</button>' : ''}<button data-t="leave">🚪 Выйти</button></div><div data-pane></div>`;
      root.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { tab = b.dataset.t; show(); }));
      show();
    }
    function show() {
      clearInterval(timer);
      root.querySelectorAll('[data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
      const p = root.querySelector('[data-pane]'), c = clan, my = RK[c.myRole] ?? -1;
      if (tab === 'chat') return chat(p);
      if (tab === 'events') return events(p);
      if (tab === 'members') {
        p.innerHTML = c.members.map((m, i) => { const st = ST[m.presence.state] || ST.offline;
          return `<div class="fcl-row"><b style="width:22px;opacity:.6">${i + 1}</b><div class="grow"><span class="fcl-dot" style="background:${st[0]}" title="${st[1]}"></span><b>${E(m.name)}</b>${m.verified ? ' ✓' : ''}<span class="fcl-pill">${ROLE[m.role]}</span>
            <div class="fcl-sub">🏆 ${m.hours} · помог ${m.donations} раз · ${st[1]}${m.presence.server ? ' — ' + E(m.presence.server) : ''}${m.presence.version ? ' · ' + E(m.presence.version) : ''} · с ${D(m.joined)}</div></div>
            <div class="fcl-acts">${m.id !== me.id && my >= 1 && my > RK[m.role] ? `${RK[m.role] + 1 < my || c.myRole === 'leader' ? `<button class="btn s" data-a="promote" data-u="${E(m.id)}">${RK[m.role] === 2 ? 'Сделать лидером' : 'Повысить'}</button>` : ''}${m.role !== 'member' ? `<button class="btn s" data-a="demote" data-u="${E(m.id)}">Понизить</button>` : ''}<button class="btn s red" data-a="kick" data-u="${E(m.id)}">Исключить</button>` : ''}</div></div>`; }).join('');
        p.querySelectorAll('[data-a]').forEach((b) => (b.onclick = async () => {
          if (b.dataset.a === 'kick' && !confirm('Исключить из клана?')) return;
          if (b.textContent === 'Сделать лидером' && !confirm('Передать лидерство? Ты станешь соруководителем.')) return;
          const r = await run(() => call('POST', `/api/clans/${c.id}/member`, { userId: b.dataset.u, action: b.dataset.a })); if (r) { clan = r; renderClan(); tab = 'members'; show(); }
        }));
        return;
      }
      if (tab === 'req') {
        p.innerHTML = c.requests.map((r) => `<div class="fcl-row"><div class="grow"><b>${E(r.name)}</b> <span class="fcl-sub">🏆 ${r.hours || 0} · ${D(r.created)}</span>${r.text ? `<div class="fcl-sub">${E(r.text)}</div>` : ''}</div><div class="fcl-acts"><button class="btn s gold" data-ok="${E(r.user_id)}">Принять</button><button class="btn s" data-no="${E(r.user_id)}">Отклонить</button></div></div>`).join('') || '<div class="fcl-empty">Заявок нет.</div>';
        p.querySelectorAll('[data-ok],[data-no]').forEach((b) => (b.onclick = async () => { const r = await run(() => call('POST', `/api/clans/${c.id}/request`, { userId: b.dataset.ok || b.dataset.no, accept: !!b.dataset.ok })); if (r) { clan = r; tab = 'req'; renderClan(); } }));
        return;
      }
      if (tab === 'edit') return editForm(p, c);
      if (tab === 'leave') {
        p.innerHTML = `<div style="padding:12px">${c.myRole === 'leader' && c.count > 1 ? 'Ты лидер — лидерство перейдёт соруководителю (или самому активному).' : c.count === 1 ? 'Ты последний — клан будет удалён.' : 'Выйти из клана?'}<div class="fcl-acts" style="margin-top:10px"><button class="btn red">Выйти из клана</button></div></div>`;
        p.querySelector('button').onclick = async () => { if (await run(() => call('POST', `/api/clans/${c.id}/leave`, {}), 'Ты вышел из клана')) { clan = null; renderBrowse(); } };
      }
    }
    async function events(p) {
      const r = await run(() => call('GET', `/api/clans/${clan.id}/events`)); if (!r || !p.isConnected) return;
      const date = (t) => new Date(t*1000).toLocaleString('ru');
      p.innerHTML = '<p class="fcl-sub">Запишись — напоминание придёт в Android-приложение примерно за час до начала (фоновая проверка ~15 минут).</p>' + r.events.map(e=>`<div class="fcl-row"><div class="grow"><b>${E(e.title)}</b><div class="fcl-sub">${E(date(e.starts_at))} · ${e.going} участников${e.cancelled?' · отменено':''}</div><p style="white-space:pre-wrap">${E(e.descr)}</p>${e.server?'<div class="fcl-sub">Сервер: '+E(e.server)+'</div>':''}${e.version?'<div class="fcl-sub">Версия: '+E(e.version)+'</div>':''}</div><div class="fcl-acts">${!e.cancelled&&e.starts_at>Date.now()/1000?`<button class="btn gold" data-rsvp="${E(e.id)}" data-going="${e.mine?0:1}">${e.mine?'✓ Записан · отказаться':'Я участвую'}</button>`:''}${r.canManage?`<button class="btn" data-cancel="${E(e.id)}" data-value="${e.cancelled?0:1}">${e.cancelled?'Восстановить':'Отменить'}</button>`:''}</div></div>`).join('') + (!r.events.length?'<div class="fcl-empty">Событий пока нет.</div>':'') + (r.canManage?`<form data-event-form style="display:grid;gap:12px;margin-top:24px"><h3>Создать событие</h3><label>Название<input name="title" maxlength="100" minlength="3" required style="width:100%;box-sizing:border-box"></label><label>Дата и время на твоём устройстве<input name="date" type="datetime-local" required style="width:100%;box-sizing:border-box"></label><label>Описание<textarea name="descr" maxlength="1000" rows="3" style="width:100%;box-sizing:border-box"></textarea></label><label>Сервер<input name="server" maxlength="100" style="width:100%;box-sizing:border-box"></label><label>Версия Minecraft<input name="version" maxlength="40" style="width:100%;box-sizing:border-box"></label><button class="btn gold">Создать</button></form>`:'');
      p.querySelectorAll('[data-rsvp]').forEach(b=>b.onclick=async()=>{if(await run(()=>call('POST',`/api/clans/${clan.id}/events/${b.dataset.rsvp}/rsvp`,{going:b.dataset.going==='1'})))events(p);});
      p.querySelectorAll('[data-cancel]').forEach(b=>b.onclick=async()=>{if(await run(()=>call('POST',`/api/clans/${clan.id}/events/${b.dataset.cancel}/status`,{cancelled:b.dataset.value==='1'})))events(p);});
      const f=p.querySelector('[data-event-form]');if(f)f.onsubmit=async e=>{e.preventDefault();const button=f.querySelector('button');button.disabled=true;const d=f.elements;const r=await run(()=>call('POST',`/api/clans/${clan.id}/events`,{title:d.title.value,starts_at:Math.floor(new Date(d.date.value).getTime()/1000),descr:d.descr.value,server:d.server.value,version:d.version.value}));if(r){toast('Событие создано');events(p);}else button.disabled=false;};
    }
    function msgHtml(m) {
      if (m.kind === 'sys') return `<div class="fcl-m sys" data-id="${E(m.id)}">${E(m.text)} · ${T(m.created)}</div>`;
      const mine = m.user_id === me.id, d = m.data || {};
      let body = m.text ? `<div>${E(m.text)}</div>` : '';
      if (m.kind === 'invite') body = `<div>🌍 Приглашает в свой мир${d.version ? ' (' + E(d.version) + ')' : ''}</div>${m.text ? `<div class="fcl-sub">${E(m.text)}</div>` : ''}<div class="fcl-acts" style="margin-top:6px">${!mine && opts.onJoin ? `<button class="btn s gold" data-join="${E(d.addr)}" data-v="${E(d.version || '')}">Зайти</button>` : ''}<code style="user-select:all;font-size:11.5px">${E(d.addr)}</code></div>`;
      if (m.kind === 'help') body = `<div>🙏 <b>Просит помощи:</b> ${E(m.text)}</div><div class="fcl-sub">${(d.done || []).length ? 'Помогли: ' + d.done.map(E).join(', ') : 'Пока никто не откликнулся'}</div>${!mine && !(d.done || []).includes(me.name) ? `<div class="fcl-acts" style="margin-top:6px"><button class="btn s gold" data-help="${E(m.id)}">Помогу!</button></div>` : ''}`;
      if (m.kind === 'media') { const u = E(d.url); body = (/^audio\//.test(d.type) ? `<div>🎤 Голосовое</div><audio controls src="${u}"></audio>` : /^video\//.test(d.type) ? `<video controls src="${u}"></video>` : /^image\//.test(d.type) ? `<a href="${u}" target="_blank"><img src="${u}" alt=""></a>` : `<a href="${u}" target="_blank">📎 ${E(d.name || 'файл')}</a>`) + (m.text ? `<div>${E(m.text)}</div>` : ''); }
      return `<div class="fcl-m ${mine ? 'me' : ''} ${m.kind !== 'text' ? 'card' : ''}" data-id="${E(m.id)}"><div class="who">${E(m.name || 'Игрок')}${m.verified ? ' ✓' : ''}${m.role && m.role !== 'member' ? ' · ' + ROLE[m.role] : ''}<small>${T(m.created)}</small></div>${body}</div>`;
    }
    function chat(p) {
      const canMedia = !!opts.upload;
      p.innerHTML = `<div class="fcl-chat" data-box></div><div class="fcl-send"><input type="text" data-in maxlength="1000" placeholder="Сообщение клану…"><button class="btn gold" data-send>➤</button>
        <button class="btn" data-inv title="Пригласить клан в свой мир">🌍</button><button class="btn" data-help title="Попросить помощи (сборка, конфиг, совет)">🙏</button>${canMedia ? '<button class="btn" data-file title="Картинка / видео / файл">📎</button><button class="btn" data-voice title="Голосовое (нажми — запись, ещё раз — отправить)">🎤</button><input type="file" data-fi hidden accept="image/*,video/*,audio/*,.zip,.json,.txt">' : ''}</div>`;
      const box = p.querySelector('[data-box]'), inp = p.querySelector('[data-in]'); lastT = 0; seen = new Set();
      const send = async (body) => { if (await run(() => call('POST', `/api/clans/${clan.id}/chat`, body))) poll(); };
      p.querySelector('[data-send]').onclick = () => { const t = inp.value.trim(); if (!t) return; inp.value = ''; send({ kind: 'text', text: t }); };
      inp.onkeydown = (e) => { if (e.key === 'Enter') p.querySelector('[data-send]').click(); };
      p.querySelector('[data-inv]').onclick = async () => {
        let w = opts.myWorld ? await opts.myWorld() : null;
        if (!w) { w = { addr: inp.value.trim() }; if (!/^[\w.-]+(:\d+)?$/.test(w.addr)) return toast(opts.myWorld ? 'Открой мир для сети (Esc → «Открыть для сети») или впиши адрес в поле сообщения' : 'Впиши адрес мира (IP:порт) в поле сообщения и нажми 🌍', true); inp.value = ''; }
        send({ kind: 'invite', addr: w.addr, version: w.version || '', text: '' });
      };
      p.querySelector('[data-help]').onclick = () => { const t = inp.value.trim(); if (t.length < 3) return toast('Напиши в поле, с чем нужна помощь, и нажми 🙏', true); inp.value = ''; send({ kind: 'help', text: t }); };
      if (canMedia) {
        const fi = p.querySelector('[data-fi]');
        const up = async (file) => { toast('Загружаю…'); const r = await run(() => opts.upload(file)); if (r) send({ kind: 'media', url: r.url, type: file.type || '', name: file.name || 'файл', text: inp.value.trim() }); inp.value = ''; };
        p.querySelector('[data-file]').onclick = () => fi.click(); fi.onchange = () => fi.files[0] && up(fi.files[0]);
        let rec = null; const vb = p.querySelector('[data-voice]');
        vb.onclick = async () => {
          if (rec) { rec.stop(); return; }
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const ch = [];
            rec = new MediaRecorder(stream); rec.ondataavailable = (e) => ch.push(e.data);
            rec.onstop = () => { stream.getTracks().forEach((t) => t.stop()); vb.textContent = '🎤'; const b = new Blob(ch, { type: rec.mimeType || 'audio/webm' }); rec = null; if (b.size > 800) up(new File([b], 'voice.webm', { type: b.type })); };
            rec.start(); vb.textContent = '⏺️'; toast('Запись… нажми ещё раз, чтобы отправить'); setTimeout(() => rec && rec.state === 'recording' && rec.stop(), 120000);
          } catch { toast('Нет доступа к микрофону', true); }
        };
      }
      async function poll() {
        const l = await call('GET', `/api/clans/${clan.id}/chat?after=${lastT}`).catch(() => null); if (!l) return;
        const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
        for (const m of l) {
          lastT = Math.max(lastT, m.created);
          const old = box.querySelector(`[data-id="${CSS_ESC(m.id)}"]`);
          if (old) { if (m.kind === 'help') old.outerHTML = msgHtml(m); continue; }
          box.insertAdjacentHTML('beforeend', msgHtml(m)); seen.add(m.id);
        }
        box.querySelectorAll('[data-join]').forEach((b) => (b.onclick = () => opts.onJoin(b.dataset.join, b.dataset.v)));
        box.querySelectorAll('[data-help]').forEach((b) => (b.onclick = async () => { if (await run(() => call('POST', `/api/clans/${clan.id}/help/${b.dataset.help}`, {}), 'Спасибо за помощь! +1 🤝')) { lastT = 0; box.innerHTML = ''; poll(); } }));
        if (atBottom || l.length && !box.dataset.init) { box.scrollTop = box.scrollHeight; box.dataset.init = 1; }
        if (!l.length && !box.children.length) box.innerHTML = '<div class="fcl-m sys">Чат пуст — напиши первым!</div>';
      }
      poll(); timer = setInterval(() => { if (!root.isConnected) return clearInterval(timer); if (!document.hidden) poll(); }, 4000);
      deco();
    }
    const CSS_ESC = (s) => (window.CSS && window.CSS.escape ? window.CSS.escape(s) : String(s).replace(/[^\w-]/g, '\\$&'));
    start();
    return { reload: start };
  }
  window.FarmClans = { mount };
})();
