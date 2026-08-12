/* Base de JS compartilhada pelas 4 páginas: header que encolhe ao rolar,
   menu mobile, o efeito PillNav do menu e o botão "voltar ao topo". Cada
   página chama PSINDCE.iniciarRevelacao(grupos) com sua própria lista de
   seletores para o scroll-reveal, e mantém inline o que for exclusivo
   dela (formulário de contato, grade do Instagram, embeds...). */
window.PSINDCE = window.PSINDCE || {};

(function(){
  /* --- HEADER: encolhe e ganha sombra ao rolar --- */
  /* Ao encolher, o header perde ~12px de altura e o navegador reancora a
     rolagem — com um limiar único isso devolvia a página para baixo do
     limiar e a barra ficava piscando. Daí a faixa morta: entra em 96px,
     só sai em 32px, bem além da variação de altura. */
  var header = document.querySelector('header');
  var ENTRA = 96, SAI = 32;
  var ultimoEstado = false;
  var agendado = false;
  function aplicaHeader(){
    agendado = false;
    var y = window.scrollY;
    var rolou = ultimoEstado ? y > SAI : y > ENTRA;
    if (rolou !== ultimoEstado) {
      ultimoEstado = rolou;
      header.classList.toggle('scrolled', rolou);
    }
  }
  function atualizaHeader(){
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(aplicaHeader);
  }
  aplicaHeader();
  window.addEventListener('scroll', atualizaHeader, {passive:true});
})();

(function(){
  /* --- MENU MOBILE --- */
  var btn = document.getElementById('menuBtn');
  var nav = document.getElementById('nav');
  btn.addEventListener('click', function(){
    var aberto = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', aberto ? 'true' : 'false');
  });
  nav.addEventListener('click', function(e){
    if (e.target.tagName === 'A') {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
    }
  });
})();

/* --- SURGIMENTO AO ROLAR: cascata por grupo + IntersectionObserver ---
   grupos é uma lista de [seletorContainer, seletorItem, passoDoAtraso],
   própria de cada página — ex.: [['.cards', '.card', 0.12], ...]. */
PSINDCE.iniciarRevelacao = function(grupos){
  var reduzido = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  (grupos || []).forEach(function(g){
    Array.prototype.forEach.call(document.querySelectorAll(g[0]), function(container){
      Array.prototype.forEach.call(container.querySelectorAll(g[1]), function(el, i){
        el.style.setProperty('--reveal-delay', (i * g[2]).toFixed(2) + 's');
      });
    });
  });

  var alvos = document.querySelectorAll('.js-reveal');
  if (reduzido || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(alvos, function(el){ el.classList.add('in-view'); });
  } else {
    var observador = new IntersectionObserver(function(entradas){
      entradas.forEach(function(entrada){
        if (entrada.isIntersecting) {
          entrada.target.classList.add('in-view');
          observador.unobserve(entrada.target);
        }
      });
    }, {rootMargin:'0px 0px -10% 0px', threshold:0.12});
    Array.prototype.forEach.call(alvos, function(el){ observador.observe(el); });
  }
};

/* --- Efeito PillNav (porte vanilla do componente React Bits) --- */
(function(){
  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || reduzido) {
    document.documentElement.classList.add('no-gsap');
    return;
  }

  var ease   = 'power3.easeOut';
  var pilulas = [].slice.call(document.querySelectorAll('#nav .pill, header .tel-topo'));
  var linhas = [], tweens = [];

  function noDesktop(){ return window.matchMedia('(min-width:901px)').matches; }

  // as pílulas do menu só animam no desktop (no celular viram lista simples);
  // o botão do telefone anima sempre que estiver visível
  function animavel(el){
    if (!el.offsetParent) return false;
    return el.closest('#nav') ? noDesktop() : true;
  }

  function medir(){
    pilulas.forEach(function(pilula, i){
      var circulo = pilula.querySelector('.hover-circle');
      var rotulo  = pilula.querySelector('.pill-label');
      var sobre   = pilula.querySelector('.pill-label-hover');

      if (linhas[i]) { linhas[i].kill(); linhas[i] = null; }

      if (!animavel(pilula) || !circulo) {
        gsap.set([circulo, rotulo, sobre].filter(Boolean), {clearProps:'all'});
        return;
      }

      var caixa = pilula.getBoundingClientRect();
      var l = caixa.width, a = caixa.height;
      if (!l || !a) return;

      // raio do círculo que cobre a pílula inteira ao subir a partir da base
      var R = ((l * l) / 4 + a * a) / (2 * a);
      var D = Math.ceil(2 * R) + 2;
      var recuo = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (l * l) / 4))) + 1;

      circulo.style.width  = D + 'px';
      circulo.style.height = D + 'px';
      circulo.style.bottom = '-' + recuo + 'px';
      gsap.set(circulo, {xPercent:-50, scale:0, transformOrigin:'50% ' + (D - recuo) + 'px'});

      if (rotulo) gsap.set(rotulo, {y:0});
      if (sobre)  gsap.set(sobre,  {y:Math.ceil(a + 100), opacity:0});

      var linha = gsap.timeline({paused:true});
      linha.to(circulo, {scale:1.2, xPercent:-50, duration:2, ease:ease, overwrite:'auto'}, 0);
      if (rotulo) linha.to(rotulo, {y:-(a + 8), duration:2, ease:ease, overwrite:'auto'}, 0);
      if (sobre)  linha.to(sobre,  {y:0, opacity:1, duration:2, ease:ease, overwrite:'auto'}, 0);
      linhas[i] = linha;
    });
  }

  function entrar(i){
    var linha = linhas[i]; if (!linha) return;
    if (tweens[i]) tweens[i].kill();
    tweens[i] = linha.tweenTo(linha.duration(), {duration:.3, ease:ease, overwrite:'auto'});
  }
  function sair(i){
    var linha = linhas[i]; if (!linha) return;
    if (tweens[i]) tweens[i].kill();
    tweens[i] = linha.tweenTo(0, {duration:.2, ease:ease, overwrite:'auto'});
  }

  pilulas.forEach(function(pilula, i){
    pilula.addEventListener('mouseenter', function(){ entrar(i); });
    pilula.addEventListener('mouseleave', function(){ sair(i); });
    pilula.addEventListener('focus',      function(){ entrar(i); });
    pilula.addEventListener('blur',       function(){ sair(i); });
  });

  // revelação da barra ao carregar
  var lista = document.querySelector('#nav .pill-list');
  if (noDesktop() && lista) {
    gsap.set(lista, {width:0, overflow:'hidden'});
    gsap.to(lista, {width:'auto', duration:.6, ease:ease, clearProps:'width,overflow', onComplete:medir});
  } else {
    medir();
  }

  window.addEventListener('resize', medir);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(medir).catch(function(){});
  }
})();

/* --- VOLTAR AO TOPO -----------------------------------------------------
   O botão fica escondido até a página passar de uma dobra de rolagem.
   Sem JS ele nunca aparece — e nunca fica um botão morto na tela.     */
(function(){
  var btn = document.getElementById('btnTopo');
  if (!btn) return;

  var LIMIAR = 600;
  var visivel = false, agendado2 = false;

  function aplica(){
    agendado2 = false;
    var mostrar = window.scrollY > LIMIAR;
    if (mostrar === visivel) return;
    visivel = mostrar;
    btn.classList.toggle('visivel', mostrar);
  }
  function atualiza(){
    if (agendado2) return;
    agendado2 = true;
    requestAnimationFrame(aplica);
  }
  aplica();
  window.addEventListener('scroll', atualiza, {passive:true});

  btn.addEventListener('click', function(){
    var reduzido = window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({top:0, behavior: reduzido ? 'auto' : 'smooth'});

    /* leva o foco junto com a rolagem, para quem navega por teclado */
    var topo = document.getElementById('topo');
    if (topo) {
      topo.setAttribute('tabindex','-1');
      topo.focus({preventScroll:true});
    }
  });
})();
