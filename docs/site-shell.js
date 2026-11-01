/* Visual shell only: no session, account data or analytics access. */
(() => {'use strict';
const en=document.documentElement.lang.toLowerCase().startsWith('en');
const file=location.pathname.split('/').pop()||'index.html';
const home=en?'en.html':'index.html';
const alternate=file.includes('privacy')?(en?'privacy.html':'privacy-en.html'):file.includes('terms')?(en?'terms.html':'terms-en.html'):(en?'index.html':'en.html');
const groups=[{name:en?'Farm Client':'Farm Client',items:[['index.html',en?'Home':'Главная'],['versions.html',en?'All downloads':'Все версии'],['buy.html',en?'License':'Лицензия'],['farm-coins.html',en?'Farm Coins · soon':'Farm Coins · скоро'],['install.html',en?'Installation':'Установка'],['emotes.html',en?'Emotes & cosmetics':'Эмоции и косметика'],['faq.html',en?'Help':'Помощь'],['support.html',en?'Support':'Поддержка']]},{name:en?'Community':'Сообщество',items:[['account.html',en?'My account':'Кабинет'],['u.html',en?'Players':'Игроки'],['gallery.html',en?'Gallery':'Галерея'],['chat.html',en?'Messenger':'Мессенджер'],['clans.html',en?'Clans':'Кланы'],['community.html',en?'Polls':'Опросы'],['play-with-friends.html',en?'Play with friends':'Игра с друзьями'],[alternate,en?'Русский':'English']]}];
const link=([href,text])=>`<a href="${href}"${file===href?' aria-current="page"':''}>${text}</a>`;
function createNav(){
 if(document.querySelector('.fc-site-header'))return;
 const header=document.createElement('header');header.className='fc-site-header';
 header.innerHTML=`<div class="fc-header-in"><a class="fc-site-brand" href="${home}"><img src="img/logo.png" alt="" width="30" height="30">FARM <b>CLIENT</b></a><div class="fc-main-links">${[['buy.html',en?'License':'Лицензия'],['farm-coins.html','Farm Coins'],['gallery.html',en?'Gallery':'Галерея'],['faq.html',en?'Help':'Помощь'],['account.html',en?'Account':'Кабинет']].map(link).join('')}</div><div class="fc-header-actions"><a class="fc-header-download" href="versions.html">${en?'Download':'Скачать'}</a><button class="fc-menu-toggle" type="button" aria-label="${en?'Site menu':'Меню сайта'}" aria-controls="fc-site-menu" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button></div></div><nav class="fc-menu-panel" id="fc-site-menu" aria-label="${en?'All pages':'Все страницы'}" hidden>${groups.map(g=>`<div class="fc-menu-section"><span>${g.name}</span>${g.items.map(link).join('')}</div>`).join('')}</nav>`;
 const panel=header.querySelector('.fc-menu-panel'),button=header.querySelector('button');
 const toggle=v=>{panel.hidden=!v;button.setAttribute('aria-expanded',String(v))};
 button.addEventListener('click',()=>toggle(panel.hidden));
 header.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){toggle(false);button.focus()}});
 document.addEventListener('click',e=>{if(!header.contains(e.target))toggle(false)});
 header.addEventListener('focusout',()=>setTimeout(()=>{if(!header.contains(document.activeElement))toggle(false)},0));
 document.body.prepend(header);
 const bg=document.createElement('div');bg.className='glow';bg.setAttribute('aria-hidden','true');document.body.prepend(bg);
}
window.FarmSite={createNav};
function init(){
 if(!document.body.classList.contains('site-inner'))return;
 if(file==='tg.html')return;
 const old=document.querySelector('.legal-head');if(old)old.remove();
 createNav();
 const main=document.querySelector('main')||document.querySelector('.c');
 if(main){if(!main.id)main.id='fc-main';const skip=document.createElement('a');skip.className='fc-skip';skip.href='#'+main.id;skip.textContent=en?'Skip to content':'К содержимому';document.body.prepend(skip);main.setAttribute('tabindex','-1');
 if(!main.querySelector('.eyebrow')&&main.querySelector('h1')){const label=document.createElement('p');label.className='fc-page-label';const sections={'account.html':'FARM ID','admin.html':'УПРАВЛЕНИЕ','chat.html':'МЕССЕНДЖЕР','gallery.html':'ГАЛЕРЕЯ','faq.html':'ПОМОЩЬ','support.html':'ПОДДЕРЖКА','clans.html':'КЛАНЫ','community.html':'СООБЩЕСТВО','devices.html':'БЕЗОПАСНОСТЬ','join.html':'ИГРА С ДРУЗЬЯМИ','pack.html':'СБОРКИ'};label.textContent='FARM CLIENT / '+(sections[file]||(en?'YOUR SPACE':'ТВОЁ ПРОСТРАНСТВО'));main.insertBefore(label,main.firstChild)}
 }
 document.querySelector('.legal-bottom')?.remove();
 if(!document.querySelector('.fc-site-footer')){const footer=document.createElement('footer');footer.className='fc-site-footer';footer.innerHTML=`<div class="fc-footer-top"><div><a class="fc-site-brand" href="${home}"><img src="img/logo.png" alt="" width="30" height="30">FARM <b>CLIENT</b></a><p class="fc-footer-note">${en?'Your Minecraft. Your style. Launcher, modpacks and friends in one place.':'Твой Minecraft. Твой стиль. Лаунчер, сборки и друзья в одном месте.'}</p></div><div class="fc-footer-nav" aria-label="${en?'Useful links':'Полезные ссылки'}">${[['versions.html',en?'Downloads':'Все загрузки'],['buy.html',en?'License':'Лицензия'],['farm-coins.html','Farm Coins'],['support.html',en?'Support':'Поддержка'],['account.html',en?'Account':'Кабинет']].map(link).join('')}</div></div><div class="fc-footer-bottom"><p>© ${new Date().getFullYear()} Farm Client · ${en?'Not an official Minecraft product.':'Не является официальным продуктом Minecraft.'}</p><div class="fc-footer-nav">${[[en?'privacy-en.html':'privacy.html',en?'Privacy':'Конфиденциальность'],[en?'terms-en.html':'terms.html',en?'Terms':'Условия'],[alternate,en?'Русский':'English']].map(link).join('')}</div></div>`;const caution=document.createElement('p');caution.className='fc-footer-note';caution.textContent=en?'Check each server’s rules before use. You are responsible for the features you enable. No guarantee against bans; liability is limited only to the extent permitted by law.':'Перед использованием проверьте правила сервера. Вы отвечаете за выбор включённых функций. Гарантии отсутствия банов нет; ответственность ограничена только в пределах, разрешённых законом.';footer.append(caution);document.body.append(footer)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
