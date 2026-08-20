/* ======================================================================
   CONSENTIMENTO DE COOKIES E CONTEÚDO DE TERCEIROS — LGPD
   ======================================================================

   O site do PSINDCE não grava cookie próprio e não tem analytics. O que
   existe são embeds de terceiros (Google Maps, plugin do Facebook,
   YouTube, Spotify) que, ao carregar, gravam identificadores no navegador
   de quem visita — antes de qualquer decisão da pessoa.

   Como quem procura um sindicato de psicólogos revela, ao fazer isso,
   interesse em filiação sindical (dado sensível — LGPD art. 5º, II),
   esses embeds NÃO carregam sozinhos. Cada um só entra no DOM depois de
   consentimento: o geral, pelo banner, ou o individual, pelo botão do
   próprio cartão.

   COMO MARCAR UM EMBED NO HTML
     <div data-embed
          data-embed-titulo="Mapa da sede"
          data-embed-servico="Google Maps"
          data-embed-tipo="iframe"
          data-embed-src="https://..."
          data-embed-attrs='{"title":"...","loading":"lazy"}'></div>

   O elemento nasce vazio. Este script põe nele o cartão "conteúdo
   bloqueado" ou o iframe, conforme a decisão guardada.

   SE UM DIA ENTRAR GA4 (ou qualquer analytics), o gancho é
   PSINDCE.consentimento.aoAceitar(fn) — ver o fim do arquivo.
   ====================================================================== */
window.PSINDCE = window.PSINDCE || {};

(function () {
  'use strict';

  var CHAVE   = 'psindce.consentimento';
  var VERSAO  = 1;   // subir isto reapresenta o banner a todo mundo

  var ouvintes = [];

  /* --- estado guardado ------------------------------------------------
     localStorage pode lançar (navegação privada, cookies bloqueados no
     Safari, iframe sem permissão). Em qualquer falha o site trata como
     "sem decisão": mostra o banner e não carrega nada de terceiro.    */
  function ler() {
    try {
      var bruto = window.localStorage.getItem(CHAVE);
      if (!bruto) return null;
      var d = JSON.parse(bruto);
      return (d && d.versao === VERSAO) ? d : null;
    } catch (e) { return null; }
  }

  function gravar(aceito) {
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify({
        versao: VERSAO,
        terceiros: !!aceito,
        data: new Date().toISOString()
      }));
    } catch (e) { /* sem persistência: vale só para esta navegação */ }
  }

  var decisao = ler();
  var aceitoNestaSessao = decisao ? decisao.terceiros : false;

  function aceitou() { return aceitoNestaSessao; }

  /* --- montagem dos embeds -------------------------------------------- */

  function montarIframe(caixa) {
    var attrs = {};
    try { attrs = JSON.parse(caixa.getAttribute('data-embed-attrs') || '{}'); }
    catch (e) { attrs = {}; }

    var frame = document.createElement('iframe');
    frame.src = caixa.getAttribute('data-embed-src') || '';
    Object.keys(attrs).forEach(function (k) {
      if (k === 'allowfullscreen') { frame.allowFullscreen = true; return; }
      frame.setAttribute(k, attrs[k]);
    });
    caixa.textContent = '';
    caixa.appendChild(frame);
    caixa.setAttribute('data-embed-estado', 'carregado');
  }

  /* gerenciar(caixa, montar)
     Ponto único de decisão para QUALQUER embed de terceiro — os marcados
     com [data-embed] e os que têm lógica própria (o plugin do Facebook
     precisa medir a largura antes; o Spotify espera a rolagem chegar).
       - com consentimento: chama montar() na hora;
       - sem: desenha o cartão de bloqueio, cujo botão chama montar();
       - e registra montar() para rodar caso o consentimento venha depois. */
  function gerenciar(caixa, montar) {
    if (aceitou()) { montar(); return; }
    montarBloqueio(caixa, montar);
    PSINDCE.consentimento.aoAceitar(function () {
      if (caixa.getAttribute('data-embed-estado') !== 'carregado') montar();
    });
  }

  function montarBloqueio(caixa, aoLiberar) {
    var titulo  = caixa.getAttribute('data-embed-titulo')  || 'Conteúdo externo';
    var servico = caixa.getAttribute('data-embed-servico') || 'um serviço externo';

    var bloco = document.createElement('div');
    bloco.className = 'embed-bloqueado';

    var h = document.createElement('h3');
    h.textContent = titulo;

    var p = document.createElement('p');
    p.appendChild(document.createTextNode(
      'Este conteúdo vem do ' + servico + ' e, ao ser carregado, esse serviço ' +
      'pode registrar dados do seu navegador. Veja a '));
    var link = document.createElement('a');
    link.href = caixa.getAttribute('data-embed-politica') || 'cookies.html';
    link.textContent = 'Política de Cookies';
    p.appendChild(link);
    p.appendChild(document.createTextNode('.'));

    var botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'btn btn-primary';
    botao.textContent = 'Carregar ' + servico;
    /* consentimento pontual: vale só para este embed, não grava nada e
       não liga os outros. É o "só desta vez" da LGPD. */
    botao.addEventListener('click', function () {
      if (typeof aoLiberar === 'function') aoLiberar();
      else montarIframe(caixa);
    });

    bloco.appendChild(h);
    bloco.appendChild(p);
    bloco.appendChild(botao);

    caixa.textContent = '';
    caixa.appendChild(bloco);
    caixa.setAttribute('data-embed-estado', 'bloqueado');
  }

  function aplicarEmbeds() {
    var caixas = document.querySelectorAll('[data-embed]');
    Array.prototype.forEach.call(caixas, function (caixa) {
      var estado = caixa.getAttribute('data-embed-estado');
      if (estado === 'carregado') return;
      if (aceitou()) { montarIframe(caixa); return; }
      if (estado !== 'bloqueado') {
        montarBloqueio(caixa, function () { montarIframe(caixa); });
      }
    });
  }

  /* --- banner ---------------------------------------------------------- */

  function decidir(aceito) {
    aceitoNestaSessao = !!aceito;
    gravar(aceito);

    var banner = document.getElementById('consentBanner');
    if (banner) banner.hidden = true;

    aplicarEmbeds();

    if (aceito) {
      ouvintes.forEach(function (fn) {
        try { fn(); } catch (e) {}
      });
      ouvintes = [];
    }
  }

  function ligarBanner() {
    var banner = document.getElementById('consentBanner');
    if (!banner) return;

    var aceitar = document.getElementById('consentAceitar');
    var recusar = document.getElementById('consentRecusar');
    if (aceitar) aceitar.addEventListener('click', function () { decidir(true); });
    if (recusar) recusar.addEventListener('click', function () { decidir(false); });

    // sem decisão guardada, o banner aparece
    if (!decisao) banner.hidden = false;
  }

  /* --- API pública ------------------------------------------------------
     PSINDCE.consentimento.aceitou()   → true/false
     PSINDCE.consentimento.reabrir()   → apaga a decisão e mostra o banner
                                          (é o que o link "rever escolha"
                                           da página de cookies chama)
     PSINDCE.consentimento.aoAceitar(fn) → roda fn quando houver aceite;
                                          se já houver, roda na hora.
                                          É AQUI que um GA4 futuro entra. */
  PSINDCE.consentimento = {
    aceitou: aceitou,
    gerenciar: gerenciar,
    marcarCarregado: function (caixa) {
      if (caixa) caixa.setAttribute('data-embed-estado', 'carregado');
    },
    aoAceitar: function (fn) {
      if (typeof fn !== 'function') return;
      if (aceitou()) { try { fn(); } catch (e) {} }
      else ouvintes.push(fn);
    },
    reabrir: function () {
      try { window.localStorage.removeItem(CHAVE); } catch (e) {}
      decisao = null;
      aceitoNestaSessao = false;
      var banner = document.getElementById('consentBanner');
      if (banner) banner.hidden = false;
      // os embeds já carregados continuam nesta tela; a próxima volta
      // à página já nasce bloqueada
      aplicarEmbeds();
    }
  };

  function iniciar() {
    ligarBanner();
    aplicarEmbeds();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
