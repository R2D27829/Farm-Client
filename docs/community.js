/* Public poll interface, shared styling for new community pages. */
window.FarmCommunity={
 async polls(root,call,opts={}){
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  try{const polls=await call('GET','/api/polls');root.innerHTML=polls.map(p=>`<article class="card poll"><div class="row between"><span class="tag">${p.closed?'Завершён':'Голосование'}</span><span class="muted small">${p.total} голосов</span></div><h2>${E(p.question)}</h2>${p.closes?`<p class="muted small">До ${E(new Date(p.closes*1000).toLocaleString('ru'))}</p>`:''}<div class="poll-options">${p.options.map(o=>`<button class="poll-choice${p.mine===o.id?' selected':''}" data-poll="${E(p.id)}" data-option="${E(o.id)}" ${p.closed?'disabled':''}><span>${p.mine===o.id?'✓ ':''}${E(o.label)}</span><b>${o.votes}</b></button>`).join('')}</div>${opts.admin?`<button class="btn" style="margin-top:16px" data-close="${E(p.id)}" data-closed="${p.closed?1:0}">${p.closed?'Открыть':'Завершить'} опрос</button>`:''}</article>`).join('')||'<div class="card"><h2>Пока нет опросов</h2><p class="muted">Администраторы скоро смогут спросить, что добавить в Farm Client.</p></div>';
  root.querySelectorAll('[data-poll]').forEach(b=>b.onclick=async()=>{if(opts.canVote===false)return opts.toast('Войди в кабинет, чтобы голосовать',true);b.disabled=true;try{await call('POST',`/api/polls/${b.dataset.poll}/vote`,{option:b.dataset.option});await FarmCommunity.polls(root,call,opts);}catch(e){opts.toast(e.message,true);b.disabled=false;}});
  root.querySelectorAll('[data-close]').forEach(b=>b.onclick=async()=>{try{await call('POST',`/api/admin/polls/${b.dataset.close}/status`,{closed:b.dataset.closed!=='1'});await FarmCommunity.polls(root,call,opts);}catch(e){opts.toast(e.message,true);}});
  }catch(e){root.innerHTML='<p class="muted">'+E(e.message)+'</p>';}
 }
};
