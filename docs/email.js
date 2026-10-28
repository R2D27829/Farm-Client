// Passwords remain in these forms only; never persisted to localStorage, URLs or logs.
const FCE = (() => {
    const q = id => document.getElementById(id);
    let hasPassword = false, enabled = false, verification = false, resendUntil = 0, sendBusy = false;
    function error(id, text) { const e = q(id); e.textContent = text || ''; e.classList.toggle('hidden', !text); }
    function clearPasswords() { document.querySelectorAll('#email-entry input[type=password],#email-account-form input[type=password]').forEach(e => { e.value = ''; e.setCustomValidity(''); }); }
    function tab(register) {
        q('email-login-form').classList.toggle('hidden', register);
        q('email-register-form').classList.toggle('hidden', !register);
        for (const [id, on] of [['email-login-tab', !register], ['email-register-tab', register]]) {
            q(id).classList.toggle('gold', on);
            q(id).setAttribute('aria-selected', String(on));
        }
        clearPasswords();
        error('email-auth-error', '');
    }
    q('email-login-tab').onclick = () => tab(false);
    q('email-register-tab').onclick = () => tab(true);
    for (const id of ['email-login-tab', 'email-register-tab'])
        q(id).onkeydown = e => {
            if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                const register = id === 'email-login-tab';
                tab(register);
                q(register ? 'email-register-tab' : 'email-login-tab').focus();
            }
        };
    const ready = FC.api('GET', '/api/email/status', { auth: false }).then(r => {
        enabled = !!r.enabled;
        verification = !!r.verification;
        if (!enabled)
            q('email-auth-note').textContent = 'Почтовый вход временно недоступен. Войди через соцсеть или по коду.';
        document.querySelectorAll('.email-form button[type=submit],#email-account-form button').forEach(b => b.disabled = !enabled);
    }).catch(() => { q('email-auth-note').textContent = 'Не удалось проверить почтовый вход. Обнови страницу или войди через соцсеть.'; });
    document.querySelectorAll('.email-form button[type=submit],#email-account-form button').forEach(b => b.disabled = true);
    async function enter(e, register) {
        e.preventDefault();
        const form = e.currentTarget, button = form.querySelector('button');
        error('email-auth-error', '');
        await ready;
        if (!enabled)
            return error('email-auth-error', 'Почтовый вход пока недоступен');
        const prefix = register ? 'email-register' : 'email-login', password = q(prefix + '-password').value;
        if (register && password !== q('email-register-confirm').value) {
            error('email-auth-error', 'Пароли не совпадают');
            q('email-register-confirm').focus();
            return;
        }
        button.disabled = true;
        try {
            const r = await FC.api('POST', '/api/email/' + (register ? 'register' : 'login'), { auth: false, body: { email: q(prefix + '-address').value, password } });
            FC.token = r.token;
            clearPasswords();
            FC.toast(register ? 'Farm ID создан — добро пожаловать!' : 'Ты вошёл');
            await loadMe();
        }
        catch (err) {
            error('email-auth-error', err.message);
        }
        finally {
            button.disabled = !enabled;
        }
    }
    q('email-login-form').onsubmit = e => enter(e, false);
    q('email-register-form').onsubmit = e => enter(e, true);
    async function load() {
        await ready;
        try {
            const r = await FC.api('GET', '/api/email/account');
            hasPassword = !!r.hasPassword;
            q('email-account-status').textContent = hasPassword ? 'Вход по почте: ' + r.email + (r.verified ? ' · подтверждена' : ' · адрес не подтверждён') : 'Добавь почту и пароль к этому Farm ID — без ПК и без создания второго профиля.';
            q('email-account-address').value = r.email || '';
            q('email-old-password-box').classList.toggle('hidden', !hasPassword);
            q('email-old-password').required = hasPassword;
            clearPasswords();
            error('email-account-error', '');
            q('email-verify-panel').classList.toggle('hidden', !hasPassword || !!r.verified);
            q('email-verify-note').textContent = verification ? 'Код отправляется на ' + r.email + '. Он действует 10 минут. Никому не сообщай его.' : 'Отправка писем подтверждения временно недоступна. Попробуй позже.';
            q('email-verify-form').classList.toggle('hidden', !verification);
            q('email-verify-code').value = '';
            updateSendButton();
        }
        catch (err) {
            q('email-account-status').textContent = err.message;
        }
    }
    q('email-account-form').onsubmit = async (e) => {
        e.preventDefault();
        await ready;
        error('email-account-error', '');
        if (!enabled)
            return error('email-account-error', 'Почтовый вход пока недоступен');
        const password = q('email-account-password').value;
        if (password !== q('email-account-confirm').value) {
            error('email-account-error', 'Пароли не совпадают');
            q('email-account-confirm').focus();
            return;
        }
        const b = e.currentTarget.querySelector('button');
        b.disabled = true;
        try {
            const r = await FC.api('POST', '/api/email/account', { body: { email: q('email-account-address').value, password, oldPassword: hasPassword ? q('email-old-password').value : undefined } });
            clearPasswords();
            await load();
            FC.toast(r.otherSessionsRevoked ? 'Пароль изменён; остальные входы завершены' : 'Вход по почте добавлен к этому Farm ID');
        }
        catch (err) {
            error('email-account-error', err.message);
        }
        finally {
            b.disabled = !enabled;
        }
    };
    function updateSendButton() {
        const left = Math.max(0, Math.ceil((resendUntil - Date.now()) / 1000)), b = q('email-verify-send');
        b.disabled = !verification || sendBusy || left > 0;
        b.textContent = sendBusy ? 'Отправляем…' : left ? 'Повторить через ' + left + ' с' : 'Отправить код';
    }
    setInterval(updateSendButton, 1000);
    q('email-verify-send').onclick = async () => {
        if (sendBusy || !verification || Date.now() < resendUntil)
            return;
        error('email-verify-error', '');
        error('email-verify-message', '');
        sendBusy = true;
        updateSendButton();
        try {
            const r = await FC.api('POST', '/api/email/verify/request', { body: {} });
            if (r.verified) {
                await load();
                return;
            }
            resendUntil = Date.now() + (r.resendAfter || 60) * 1000;
            q('email-verify-form').classList.remove('hidden');
            error('email-verify-message', 'Письмо отправлено. Проверь «Входящие» и «Спам». Если писем несколько, используй последний код.');
            q('email-verify-code').focus();
        }
        catch (err) {
            resendUntil = Date.now() + 60000;
            error('email-verify-error', err.message);
        }
        finally {
            sendBusy = false;
            updateSendButton();
        }
    };
    q('email-verify-form').onsubmit = async (e) => {
        e.preventDefault();
        const b = e.currentTarget.querySelector('button');
        b.disabled = true;
        error('email-verify-error', '');
        try {
            await FC.api('POST', '/api/email/verify/confirm', { body: { code: q('email-verify-code').value.trim() } });
            q('email-verify-code').value = '';
            error('email-verify-message', '');
            await load();
            FC.toast('Почта подтверждена');
        }
        catch (err) {
            error('email-verify-error', err.message);
        }
        finally {
            b.disabled = false;
        }
    };
    return { load };
})();
