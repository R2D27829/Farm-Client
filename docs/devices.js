FC.nav('account');
(async()=>{
 const box=document.getElementById('sessions');
 async function load(){try{const r=await FC.api('GET','/api/sessions');box.innerHTML=r.sessions.map(s=>`<div class="feature-row"><div><b>${FC.esc(s.label)}</b>${s.current?' <span class="tag">Этот вход</span>':''}<p class="muted small">Создан: ${FC.esc(new Date(s.created*1000).toLocaleString('ru'))}<br>Последняя активность: ${s.last_used?FC.esc(new Date(s.last_used*1000).toLocaleString('ru')):'неизвестно'}</p></div><button class="btn" data-session="${FC.esc(s.id)}">Завершить${s.current?' этот вход':''}</button></div>`).join('')||'<p class="muted">Активных входов нет</p>';box.querySelectorAll('[data-session]').forEach(b=>b.onclick=()=>revoke({id:b.dataset.session}));}catch(e){box.innerHTML='<p class="muted">'+FC.esc(e.message)+' · <a href="account.html">Войти в кабинет</a></p>';}}
 async function revoke(body){if(!confirm('Завершить вход? На этом устройстве потребуется войти заново.'))return;try{const r=await FC.api('POST','/api/sessions/revoke',{body});if(r.current){FC.token='';location.href='account.html';return;}FC.toast('Вход завершён');load();}catch(e){FC.toast(e.message,true);}}
 document.getElementById('others').onclick=()=>revoke({others:true});
 document.getElementById('pc-code').onclick=async()=>{try{const r=await FC.api('POST','/api/site/code',{body:{page:'device'}});document.getElementById('pc-output').textContent=r.code;}catch(e){FC.toast(e.message,true);}};
 load();
})();
