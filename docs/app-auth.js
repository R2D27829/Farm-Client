// A confirmed browser sign-in can return to Android without custom-scheme token transfer.
(() => {
    var _a, _b;
    const app = !!window.FarmApp && /FarmClientApp\//.test(navigator.userAgent);
    const stored = 'fc_app_handoff_v1', browserKey = 'fc_browser_app_handoff_v1';
    const preferred = new URLSearchParams(location.search).get('login_provider') || '';
    const allowedProviders = ['google', 'discord', 'telegram', 'vk'];
    const q = new URLSearchParams(location.search);
    let browserId = q.get('app_login') || sessionStorage.getItem(browserKey) || '';
    if (!/^app_[A-Za-z0-9_-]{24}$/.test(browserId))
        browserId = '';
    if (browserId)
        sessionStorage.setItem(browserKey, browserId);
    const card = document.createElement('section');
    card.className = 'card app-auth-card';
    const heading = document.createElement('h2'), note = document.createElement('p'), button = document.createElement('button');
    note.className = 'muted';
    note.setAttribute('role', 'status');
    button.className = 'btn gold';
    button.type = 'button';
    card.append(heading, note, button);
    let loading = false, timer = 0, polling = false;
    const read = () => {
        try {
            return JSON.parse(sessionStorage.getItem(stored) || 'null');
        }
        catch (_a) {
            return null;
        }
    };
    const clear = () => { sessionStorage.removeItem(stored); clearTimeout(timer); };
    const setNote = t => { note.textContent = t; };
    const hex = buf => [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
    async function poll() {
        if (polling)
            return;
        const state = read();
        if (!state)
            return;
        if (state.expires * 1000 <= Date.now()) {
            clear();
            setNote('Запрос устарел. Нажми кнопку и повтори вход.');
            button.disabled = false;
            return;
        }
        polling = true;
        try {
            const r = await FC.api('POST', '/api/app/auth/poll', { auth: false, body: { id: state.id, verifier: state.verifier } });
            if (r.status === 'complete' && r.token) {
                clear();
                FC.token = r.token;
                setNote('Вход выполнен. Один Farm ID на всех устройствах.');
                button.disabled = false;
                if (typeof loadMe === 'function')
                    await loadMe();
                return;
            }
        }
        catch (e) {
            if (/устарел|использован|не подходит|завершена/.test(e.message)) {
                clear();
                setNote(e.message);
                button.disabled = false;
                return;
            }
            setNote('Ожидаю подтверждение. Если браузер уже открыт, заверши вход и вернись сюда.');
        }
        finally {
            polling = false;
        }
        if (read())
            timer = setTimeout(poll, 3000);
    }
    async function start(provider) {
        if (loading)
            return;
        loading = true;
        button.disabled = true;
        clear();
        try {
            const bytes = crypto.getRandomValues(new Uint8Array(32));
            const verifier = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            const verifierHash = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
            const r = await FC.api('POST', '/api/app/auth/start', { auth: false, body: { verifierHash } });
            sessionStorage.setItem(stored, JSON.stringify({ id: r.id, verifier, expires: r.expires }));
            const target = new URL('account.html', location.href);
            target.searchParams.set('app_login', r.id);
            if (allowedProviders.includes(provider))
                target.searchParams.set('login_provider', provider);
            FarmApp.openExternal(target.href);
            setNote('Войди в браузере и нажми «Подтвердить вход в приложение». Затем вернись сюда — вход завершится автоматически.');
            poll();
        }
        catch (e) {
            clear();
            setNote(e.message);
            button.disabled = false;
        }
        finally {
            loading = false;
        }
    }
    async function approve() {
        button.disabled = true;
        try {
            if (!FC.token)
                throw new Error('Сначала войди в свой Farm ID ниже.');
            await FC.api('POST', '/api/app/auth/approve', { body: { id: browserId } });
            sessionStorage.removeItem(browserKey);
            setNote('Готово. Вернись в приложение — оно завершит вход автоматически.');
            button.textContent = 'Вернуться в приложение';
            button.disabled = false;
            button.onclick = () => { location.href = 'fcapp://auth?handoff=' + encodeURIComponent(browserId); };
        }
        catch (e) {
            setNote(e.message);
            button.disabled = false;
        }
    }
    async function refresh() {
        if (app)
            return;
        if (!browserId)
            return;
        button.disabled = !FC.token;
        if (FC.token) {
            try {
                const me = await FC.api('GET', '/api/me');
                setNote('Подтверди вход как ' + (me.name || 'Игрок') + ' · ' + me.id + '. Только если ты сам начал вход в своём приложении.');
            }
            catch (e) {
                setNote(e.message);
            }
        }
        else
            setNote('Войди в существующий Farm ID ниже, затем подтверди подключение приложения. Новый профиль создавать не нужно.');
    }
    if (app) {
        heading.textContent = 'Вход в приложении';
        setNote('Войди через обычный браузер: Google, Discord, Telegram, VK или почта. Аккаунт и лицензия останутся теми же.');
        button.textContent = 'Войти через браузер';
        button.onclick = start;
        (_a = document.getElementById('login')) === null || _a === void 0 ? void 0 : _a.prepend(card);
        if (read()) {
            button.disabled = true;
            setNote('Ожидаю подтверждение в браузере…');
            poll();
        }
    }
    else if (browserId) {
        heading.textContent = 'Подключить Android';
        button.textContent = 'Подтвердить вход в приложение';
        button.onclick = approve;
        (_b = document.querySelector('main')) === null || _b === void 0 ? void 0 : _b.prepend(card);
        refresh();
    }
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            clearTimeout(timer);
            if (app)
                poll();
            else
                refresh();
        }
    });
    window.addEventListener('fc:session', refresh);
    window.addEventListener('fc:providers-ready', event => {
        if (app || !browserId || FC.token || !allowedProviders.includes(preferred))
            return;
        if (!event.detail || event.detail[preferred] !== true)
            return;
        const once = 'fc_provider_started_' + browserId;
        if (sessionStorage.getItem(once))
            return;
        sessionStorage.setItem(once, '1');
        if (typeof window.start === 'function')
            window.start(preferred, 'login', document.getElementById('tg-login-box'));
    });
    window.FarmAppAuth = { start: app ? start : undefined, resume() {
            clearTimeout(timer);
            if (app)
                poll();
        } };
})();
