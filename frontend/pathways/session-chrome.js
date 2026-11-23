(function(){
  var nav=document.getElementById('navbar');
  var toggle=document.getElementById('site-nav-toggle');
  var menu=document.getElementById('mobile-nav');
  function close(){toggle.setAttribute('aria-expanded','false');menu.classList.remove('is-open');}
  if(toggle&&menu){
    toggle.addEventListener('click',function(){var open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));menu.classList.toggle('is-open',open);});
    menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',close);});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){close();toggle.focus();}});
    window.addEventListener('resize',function(){if(window.innerWidth>=1024)close();});
  }
  function update(){if(nav)nav.classList.toggle('nav-scrolled',window.scrollY>50);}
  window.addEventListener('scroll',update,{passive:true});update();
})();
