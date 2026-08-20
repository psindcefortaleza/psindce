# PSINDCE — site institucional

Site estático do **Sindicato dos Psicólogos do Ceará (PSINDCE)**.
HTML, CSS e JavaScript puros — sem framework, sem build, sem backend.

- **Produção:** Cloudflare Pages
- **Domínio:** `psindce.org.br` (em migração da KingHost)
- **CNPJ:** 01.128.005/0001-67

---

## Estrutura

```
index.html            página inicial (hero, missão, quiz, estatuto, contato, formulário)
sobre.html            missão, filiações, diretoria e linha do tempo
noticias.html         destaques, atividades, campanhas, vídeos, podcast e redes
sindicalize-se.html   vantagens, convênios e Cartão do Associado
privacidade.html      Política de Privacidade (LGPD)
cookies.html          Política de Cookies e conteúdo de terceiros
termos.html           Termos de Uso
404.html              página de erro (autônoma, não usa css/site.css)

css/site.css          tokens, reset, componentes e o que é comum às páginas
js/site.js            header, menu, scroll-reveal, voltar-ao-topo, contatos
js/consentimento.js   banner LGPD e bloqueio dos embeds de terceiros
vendor/gsap.min.js    só para o efeito de hover do menu

_headers              cabeçalhos de segurança e cache do Cloudflare Pages
sitemap.xml           7 páginas (o 404 fica de fora, de propósito)
robots.txt            libera tudo e aponta o sitemap
llms.txt              resumo do site para agentes de IA
img/grade/            grade do Instagram: uma ficha .html por post + a arte
```

Cada página carrega o CSS comum e mantém, no próprio `<style>`, só o que
é exclusivo dela. O mesmo vale para o JavaScript.

---

## Publicação

O Cloudflare Pages publica automaticamente a cada push na branch `main`.
Não há passo de build: o que está no repositório é o que vai ao ar.

Ao **criar uma página nova**, lembre de:

1. acrescentá-la ao `sitemap.xml`;
2. acrescentar a regra de cache dela no `_headers` (as páginas são
   enumeradas uma a uma, e não por `/*.html` — veja o comentário no arquivo);
3. incluir o link no rodapé, se for de navegação.

---

## Backup e recuperação

**O GitHub é o backup.** Não existe outra cópia versionada, e não há banco
de dados nem conteúdo gerado em produção — todo o site vive neste
repositório. O Cloudflare Pages é apenas um espelho do que está em `main`.

Isso significa que:

- **Reverter uma publicação ruim:** `git revert <commit>` e push. O Pages
  republica em cerca de um minuto. O painel do Cloudflare também guarda os
  deploys anteriores e permite promover um deles com um clique
  (*Deployments → ⋯ → Rollback*), o que é mais rápido em emergência.
- **Restaurar o site do zero:** `git clone` deste repositório e apontar um
  projeto novo do Pages para ele. Não há nada a configurar além do domínio.
- **Perder a conta do GitHub** seria perder o site. Vale manter ao menos um
  clone local atualizado (`git clone --mirror`) numa máquina do sindicato,
  e mais de uma pessoa com acesso de administrador ao repositório.

Arquivos `*.bak` gerados antes de edições manuais ficam fora do versionamento
(veja `.gitignore`) — o histórico do git é o backup durável.

---

## Decisões registradas

### Sem Google Analytics (por ora)

Não há GA4, GTM, Meta Pixel nem qualquer ferramenta de medição no site —
decisão da diretoria. Se um dia entrar, **ela precisa ficar atrás do
consentimento**, e o gancho já existe:

```js
PSINDCE.consentimento.aoAceitar(function () {
  // carregar o gtag.js aqui — só roda depois do aceite no banner
});
```

Antes de ativar, atualizar a `cookies.html` (seção "Não usamos analytics")
e subir o `VERSAO` em `js/consentimento.js`, para o banner ser
reapresentado a quem já respondeu.

Uma alternativa sem cookie e sem banner é o **Cloudflare Web Analytics**,
que se liga no painel do Pages e não exige código no site.

### Sem meta de verificação do Search Console

Não há `<meta name="google-site-verification">` nas páginas — decisão da
diretoria. Quando for verificar a propriedade, a rota recomendada é o
**registro TXT no DNS**, e não a meta tag:

1. No Search Console, criar propriedade do tipo **Domínio** (`psindce.org.br`).
2. Copiar o valor `google-site-verification=...` oferecido.
3. Adicionar como registro **TXT** na zona do domínio (Registro.br ou
   Cloudflare DNS, conforme onde os nameservers estiverem apontados).

A verificação por DNS vale para o domínio inteiro, cobre `www` e
subdomínios de uma vez, e **sobrevive à virada de hospedagem** — a meta tag
teria de ser mantida em toda página nova.

### Consentimento antes de conteúdo de terceiros

Mapa do Google, plugin do Facebook, YouTube e Spotify **não carregam
sozinhos**. Enquanto não houver decisão, cada um aparece como um cartão
explicativo com um botão para carregar só aquele item.

O motivo é jurídico, não estético: quem procura um sindicato de psicólogos
revela, nesse ato, interesse em filiação sindical — dado sensível pelo
art. 5º, II da LGPD. Ver `js/consentimento.js`, que documenta como marcar
um embed novo.

### O número de WhatsApp não aparece no HTML

Nenhum arquivo servido contém a sequência do número. Ele é remontado em
`js/site.js` a partir de pedaços, e os links usam `data-zap`. Sem
JavaScript, os links caem no formulário de contato. Isso não segura um
raspador dedicado, mas tira o site do alcance dos robôs que varrem páginas
atrás de `wa.me/55…`.

Para usar num link novo:

```html
<a href="index.html#contato" data-zap data-zap-msg="Olá, gostaria de…">Fale conosco</a>
```

---

## Pendências conhecidas

- **`<link rel="canonical">`** ainda não existe em nenhuma página.
- **URLs absolutas** (`og:url`, `og:image`, JSON-LD, `sitemap.xml`,
  `robots.txt`, `llms.txt`) ainda apontam para `sitemoderno.pages.dev`.
  Trocar por `psindce.org.br` na virada do domínio.
- **Placeholders em `noticias.html`:** os dois embeds do Spotify estão com
  `COLE_O_ID_AQUI` e os três vídeos com `data-video=""`.
- **`capa.webp`** tem 295 KB e é a maior imagem do site (LCP da home).
