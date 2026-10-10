# -*- coding: utf-8 -*-
# Gera as páginas internas da Falzinho Games e ajusta a home. Rodar de dentro da pasta forja-games.
import os, re
SITE = "https://falzinhogames.com.br"

CSS = """
:root { --bg:#EEF1F6; --surface:#FFFFFF; --line:#D5DBE6; --fg:#151B26; --muted:#566074; --ember:#E8530E; --ember-ink:#FFFFFF;
  --font-display:'Alfa Slab One',Georgia,'Times New Roman',serif; --font-body:'Figtree',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif; --gutter:16px; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#11151D; --surface:#1A2030; --line:#2B3447; --fg:#EEF1F7; --muted:#9AA5BA; --ember:#FF8A3D; --ember-ink:#1A1209; color-scheme:dark; } }
:root[data-theme="dark"] { --bg:#11151D; --surface:#1A2030; --line:#2B3447; --fg:#EEF1F7; --muted:#9AA5BA; --ember:#FF8A3D; --ember-ink:#1A1209; color-scheme:dark; }
* { box-sizing:border-box; }
html { scroll-behavior:smooth; }
body { margin:0; background:var(--bg); color:var(--fg); font-family:var(--font-body); font-size:16px; line-height:1.6; padding-inline:var(--gutter); }
[hidden] { display:none !important; }
a { color:inherit; }
:focus-visible { outline:3px solid var(--ember); outline-offset:3px; border-radius:6px; }
.wrap { max-width:1080px; margin-inline:auto; }
.top { display:flex; align-items:center; justify-content:space-between; gap:16px; padding-block:18px; flex-wrap:wrap; }
.brand { display:flex; align-items:center; gap:12px; text-decoration:none; }
.brand svg { width:44px; height:44px; flex:none; }
.brand .name { font-family:var(--font-display); font-size:20px; line-height:1; letter-spacing:.5px; }
.brand .name small { display:block; font-family:var(--font-body); font-weight:700; font-size:11px; letter-spacing:6px; color:var(--ember); margin-top:4px; }
.nav { display:flex; gap:20px; font-weight:600; font-size:15px; flex-wrap:wrap; }
.nav a { text-decoration:none; color:var(--muted); }
.nav a:hover { color:var(--fg); }
.gh { margin-top:12px; padding:36px 24px; border-radius:14px; background:var(--c1); color:#fff; display:grid; gap:14px; }
.gh .back { color:#fff; opacity:.85; font-weight:600; text-decoration:none; font-size:14px; }
.gh h1 { font-family:var(--font-display); font-weight:400; font-size:clamp(34px,7vw,56px); line-height:1.05; margin:0; }
.gh .genre { font-size:12px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; opacity:.9; }
.gh .lead { margin:0; font-size:18px; max-width:60ch; opacity:.95; }
.cta { display:inline-flex; width:fit-content; background:#fff; color:#151B26; font-weight:700; text-decoration:none; padding:13px 22px; border-radius:10px; }
.cta:hover { filter:brightness(.94); }
.txt { max-width:760px; padding-block:32px 12px; }
.txt h1 { font-family:var(--font-display); font-weight:400; font-size:clamp(30px,6vw,44px); line-height:1.1; margin:8px 0 4px; }
.txt h2 { font-family:var(--font-display); font-weight:400; font-size:24px; margin:32px 0 8px; }
.txt p, .txt li { color:var(--muted); }
.txt p strong, .txt li strong { color:var(--fg); }
.txt ul { padding-left:20px; display:grid; gap:6px; }
.txt dt { font-weight:700; margin-top:14px; }
.txt dd { margin:4px 0 0; color:var(--muted); }
.upd { color:var(--muted); font-size:14px; }
.ad { margin-block:28px; min-height:90px; display:grid; place-items:center; border:1px dashed var(--line); border-radius:10px; color:var(--muted); font-size:12px; letter-spacing:1px; text-transform:uppercase; }
footer { border-top:1px solid var(--line); margin-top:36px; padding-block:28px 36px; display:flex; justify-content:space-between; gap:12px 24px; flex-wrap:wrap; color:var(--muted); font-size:14px; }
footer nav { display:flex; gap:18px; flex-wrap:wrap; }
footer a { text-decoration:none; }
footer a:hover { color:var(--fg); }
.ck { position:fixed; left:var(--gutter); right:var(--gutter); bottom:calc(var(--gutter) + env(safe-area-inset-bottom,0px)); max-width:620px; margin-inline:auto; background:var(--surface); color:var(--fg); border:1px solid var(--line); border-radius:12px; padding:16px; display:flex; gap:14px; align-items:center; flex-wrap:wrap; box-shadow:0 10px 30px rgba(0,0,0,.25); z-index:50; font-size:14px; }
.ck p { margin:0; flex:1 1 240px; color:var(--muted); }
.ck a { color:var(--fg); }
.ck button { font:inherit; font-weight:700; background:var(--ember); color:var(--ember-ink); border:0; border-radius:8px; padding:10px 18px; cursor:pointer; }
"""

LOGO = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M16 20C9 20 4 30 4 41C4 48 9 53 14 50C18 48 19 44 23 44H41C45 44 46 48 50 50C55 53 60 48 60 41C60 30 55 20 48 20Z" fill="currentColor"/><path d="M18 26H22V30H26V34H22V38H18V34H14V30H18Z" fill="var(--bg)"/><circle cx="43" cy="31" r="3.4" fill="#FF6B2C"/><circle cx="50" cy="37" r="3.4" fill="#FFB03A"/></svg>'

COOKIES_JS = """(function(){
  var k='forja_cookie_ok';
  try { if (localStorage.getItem(k)) return; } catch(e) {}
  var d=document.createElement('div'); d.className='ck'; d.setAttribute('role','region'); d.setAttribute('aria-label','Aviso de cookies');
  d.innerHTML='<p>Usamos cookies para o site funcionar, medir as visitas com o Google Analytics e, quando houver anúncios, exibir publicidade do Google. Veja os detalhes na <a href="/privacidade.html">Política de Privacidade</a>.</p><button type="button" id="ck-ok">Entendi</button>';
  document.body.appendChild(d);
  document.getElementById('ck-ok').addEventListener('click',function(){ try{localStorage.setItem(k,'1');}catch(e){} d.remove(); });
})();
"""

def shell(title, desc, path, body):
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{SITE}{path}">
<link rel="icon" href="/logo.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Figtree:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/style.css">
<script src="/analytics.js"></script>
</head>
<body>
<div class="wrap">
  <header class="top">
    <a class="brand" href="/" aria-label="Falzinho Games, início">{LOGO}<span class="name">FALZINHO<small>GAMES</small></span></a>
    <nav class="nav" aria-label="Principal"><a href="/#jogos">Jogos</a><a href="/atelon.html">Atelon</a><a href="/novo-mundo.html">Novo Mundo</a><a href="/master-fut.html">Master Fut</a></nav>
  </header>
  <main>
{body}
  </main>
  <footer>
    <span>© <span id="ano"></span> Falzinho Games. Todos os direitos reservados.</span>
    <nav aria-label="Rodapé"><a href="/privacidade.html">Política de Privacidade e Cookies</a><a href="/">Início</a></nav>
  </footer>
</div>
<script>document.getElementById('ano').textContent=new Date().getFullYear();</script>
<script src="/cookies.js"></script>
</body>
</html>
"""

AD = '    <div class="ad" hidden>Publicidade</div>'

GAMES = [
  dict(slug="atelon", nome="Atelon", genero="Reino medieval · Estratégia", c1="#8A1F3A",
       url="https://atelon.onrender.com",
       lead="Crie o seu reino, explore um mundo aberto medieval e decida se vai conquistar, defender ou se aliar.",
       sobre=["Atelon é um jogo de estratégia medieval que roda direto no navegador. Cada jogador começa do zero com o seu próprio reino e vai crescendo em um mundo aberto, dividindo o mapa com outros reinos.",
              "O jogo se inspira na jogabilidade dos clássicos de construção de reino em redes sociais, com foco em planejar bem o território e os recursos."],
       lista=["<strong>Crie o seu reino</strong> e expanda o território aos poucos.",
              "<strong>Explore o mundo aberto</strong> e encontre locais de recursos, como fazendas e minas.",
              "<strong>Conquiste ou defenda</strong> o seu espaço no mapa.",
              "<strong>Faça alianças</strong> com outros jogadores."],
       faq=[("Preciso instalar alguma coisa?","Não. O Atelon abre no navegador, no computador ou no celular."),
            ("O jogo está completo?","Ele está em desenvolvimento e recebe novidades com frequência.")]),
  dict(slug="novo-mundo", nome="Novo Mundo", genero="Cidade política · Construção", c1="#0E6B5C",
       url="https://novomundo.onrender.com",
       lead="Construa uma cidade isométrica do zero e governe com decisões políticas que mudam o rumo do seu povo.",
       sobre=["Novo Mundo é um jogo de construção de cidades com tema político. Você planeja o mapa, administra a cidade e lida com as consequências de cada decisão de governo.",
              "Ele tem a mesma dinâmica de reino do Atelon, mas com visual isométrico e foco em governar uma cidade moderna."],
       lista=["<strong>Construa e organize</strong> a sua cidade em visão isométrica.",
              "<strong>Governe</strong> e acompanhe como as decisões políticas afetam a população.",
              "<strong>Cultura e lazer</strong>: estádios, museus, praças e outros espaços da cidade.",
              "<strong>Economia</strong>: arrecade impostos e atraia empresas que geram empregos."],
       faq=[("Preciso instalar alguma coisa?","Não. O Novo Mundo abre no navegador."),
            ("O jogo está completo?","Ele está em fase de testes e recebe novidades com frequência.")]),
  dict(slug="master-fut", nome="Master Fut 2026", genero="Futebol · Gerenciador", c1="#1F6B2A",
       url="https://masterfut.onrender.com",
       lead="Monte o elenco, defina a tática e leve o seu clube ao topo da temporada.",
       sobre=["Master Fut 2026 é um gerenciador de futebol para jogar no navegador. Você assume um clube e cuida de tudo que acontece fora de campo e dentro dele.",
              "O jogo segue a ideia dos gerenciadores clássicos de carreira, em uma versão mais simples e rápida de jogar."],
       lista=["<strong>Elenco e tática</strong>: escale o time e defina como ele joga.",
              "<strong>Mercado</strong>: negocie contratações, empréstimos e salários.",
              "<strong>Clube</strong>: estádio, ingressos, sócio-torcedor e patrocínios.",
              "<strong>Formação</strong>: treino e categorias de base."],
       faq=[("Preciso instalar alguma coisa?","Não. O Master Fut abre no navegador."),
            ("O jogo está completo?","Ele está em desenvolvimento e recebe novidades com frequência.")]),
]

def game_page(g):
    sobre = "\n".join(f"    <p>{p}</p>" for p in g["sobre"])
    lista = "\n".join(f"      <li>{i}</li>" for i in g["lista"])
    faq = "\n".join(f"      <dt>{q}</dt><dd>{a}</dd>" for q, a in g["faq"])
    body = f"""    <section class="gh" style="--c1:{g['c1']}">
      <a class="back" href="/#jogos">← Todos os jogos</a>
      <span class="genre">{g['genero']}</span>
      <h1>{g['nome']}</h1>
      <p class="lead">{g['lead']}</p>
      <a class="cta" href="/jogar/{g['slug']}/">Jogar {g['nome']} →</a>
    </section>
{AD}
    <section class="txt">
      <h2>Sobre o jogo</h2>
{sobre}
      <h2>O que você faz</h2>
      <ul>
{lista}
      </ul>
      <h2>Perguntas frequentes</h2>
      <dl>
{faq}
      </dl>
    </section>
{AD}"""
    return shell(f"{g['nome']} | Falzinho Games", g["lead"], f"/{g['slug']}.html", body)

PRIV = """    <article class="txt">
      <h1>Política de Privacidade e Cookies</h1>
      <p class="upd">Atualizada em 09/10/2026</p>
      <p>Esta página explica quais informações o site Falzinho Games e os jogos disponíveis nele podem coletar, para que servem e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).</p>

      <h2>Quem somos</h2>
      <p>O Falzinho Games é um conjunto de jogos de navegador criados de forma independente. Este site reúne os jogos e leva você até eles.</p>

      <h2>Quais informações coletamos</h2>
      <ul>
        <li><strong>Navegação:</strong> dados técnicos comuns, como tipo de navegador, dispositivo e páginas visitadas, que ficam registrados pelo servidor onde o site é hospedado.</li>
        <li><strong>Estatísticas de visita:</strong> usamos o Google Analytics para saber quantas pessoas visitam o site, quais páginas e jogos são mais acessados, de qual região e por qual tipo de aparelho. Os endereços IP são anonimizados pelo Google e os dados aparecem para nós apenas de forma agregada.</li>
        <li><strong>Contas nos jogos:</strong> alguns jogos permitem criar conta. Nesse caso, podem ser guardados o nome de usuário e o progresso no jogo. Cada jogo usa essas informações apenas para o próprio funcionamento.</li>
        <li><strong>Armazenamento no seu navegador:</strong> o site guarda localmente a sua escolha sobre o aviso de cookies, e os jogos podem guardar preferências e progresso.</li>
      </ul>

      <h2>Cookies e publicidade</h2>
      <p>Cookies são pequenos arquivos que o navegador guarda para lembrar informações. Usamos cookies essenciais para o site funcionar.</p>
      <p>O Google Analytics só grava cookies de estatística depois que você toca em <strong>Entendi</strong> no aviso de cookies. Antes disso, o Google recebe apenas sinais anônimos, sem identificador. Saiba como o Google usa esses dados em <a href="https://policies.google.com/technologies/partner-sites?hl=pt-BR" target="_blank" rel="noopener">policies.google.com</a> e, se quiser, bloqueie a medição com o <a href="https://tools.google.com/dlpage/gaoptout?hl=pt-BR" target="_blank" rel="noopener">complemento de desativação do Google Analytics</a>.</p>
      <p>Quando houver anúncios, eles serão exibidos pelo Google AdSense. O Google e seus parceiros podem usar cookies para mostrar anúncios com base nas suas visitas a este e a outros sites. Você pode gerenciar ou desativar a personalização de anúncios em <a href="https://adssettings.google.com" target="_blank" rel="noopener">adssettings.google.com</a>. Saiba mais sobre como o Google usa dados em <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">policies.google.com/technologies/partner-sites</a>.</p>
      <p>Você também pode bloquear ou apagar cookies nas configurações do seu navegador. Alguns recursos podem deixar de funcionar.</p>

      <h2>Anúncios com recompensa</h2>
      <p>Alguns jogos poderão oferecer vídeos opcionais em troca de prêmios dentro do jogo. A recompensa é dada por assistir ao vídeo, nunca por clicar no anúncio, e participar é sempre uma escolha sua.</p>

      <h2>Como usamos as informações</h2>
      <p>Usamos as informações para fazer os jogos funcionarem, manter o progresso de cada jogador, melhorar a experiência e exibir publicidade. Não vendemos dados pessoais.</p>

      <h2>Seus direitos</h2>
      <p>Pela LGPD, você pode pedir acesso, correção ou exclusão dos seus dados, além de informações sobre como eles são tratados.</p>

      <h2>Crianças</h2>
      <p>Os jogos não são direcionados a menores de 13 anos. Se você é responsável por uma criança que criou conta, entre em contato para pedirmos a exclusão.</p>

      <h2>Mudanças nesta política</h2>
      <p>Podemos atualizar esta página quando necessário. A data da última atualização aparece no topo.</p>
    </article>"""

SITEMAP_PAGES = ["/", "/atelon.html", "/novo-mundo.html", "/master-fut.html", "/privacidade.html", "/sobre.html", "/contato.html", "/tampinhas/", "/mestre-do-taco/", "/mente-em-jogo/", "/xadrez/", "/elydran/", "/apex/", "/laylla/", "/fazendinha/", "/pebolim/", "/cruzadas/", "/cartas/", "/corrida/"]

def write(name, text):
    with open(name, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)

def main():
    import json
    write("style.css", CSS.strip() + "\n")
    ck_css = "\n".join(l for l in CSS.splitlines() if l.startswith(".ck"))
    ck_vars = ":root{--surface:#FFFFFF;--line:#D5DBE6;--fg:#151B26;--muted:#566074;--ember:#E8530E;--ember-ink:#FFFFFF;--gutter:16px}" \
              "@media (prefers-color-scheme:dark){:root:not([data-theme=\"light\"]){--surface:#1A2030;--line:#2B3447;--fg:#EEF1F7;--muted:#9AA5BA;--ember:#FF8A3D;--ember-ink:#1A1209}}" \
              ":root[data-theme=\"dark\"]{--surface:#1A2030;--line:#2B3447;--fg:#EEF1F7;--muted:#9AA5BA;--ember:#FF8A3D;--ember-ink:#1A1209}"
    js = COOKIES_JS.replace("var d=document.createElement('div');",
         "var s=document.createElement('style'); s.textContent=" + json.dumps(ck_vars + "\n" + ck_css) + "; document.head.appendChild(s);\n  var d=document.createElement('div');", 1)
    write("cookies.js", js)

    for g in GAMES:
        write(g["slug"] + ".html", game_page(g))
    write("privacidade.html", shell("Política de Privacidade | Falzinho Games",
          "Como a Falzinho Games trata dados, cookies e anúncios, conforme a LGPD.", "/privacidade.html", PRIV))

    urls = "\n".join(f"  <url><loc>{SITE}{p}</loc></url>" for p in SITEMAP_PAGES)
    write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "\n</urlset>\n")
    write("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")

    # Ajusta a home (só uma vez)
    with open("index.html", encoding="utf-8") as f:
        h = f.read()
    if "cookies.js" not in h:
        for arte, pag in (("castelo", "atelon.html"), ("cidade", "novo-mundo.html"), ("campo", "master-fut.html")):
            h = h.replace(f'arte: "{arte}"', f'arte: "{arte}", pagina: "{pag}"')
        h = h.replace('<div class="play">${botao}</div>',
                      '<div class="play">${botao}<a class="more" href="/${j.pagina}">Saiba mais sobre o jogo</a></div>')
        h = h.replace(".play span {", ".more { display:block; margin-top:12px; text-align:center; font-weight:600; font-size:14px; color:var(--muted); }\n.more:hover { color:var(--fg); }\n.play span {", 1)
        h = h.replace("",
                      '<nav aria-label="Rodapé" style="display:flex;gap:18px;flex-wrap:wrap"><a href="/privacidade.html" style="text-decoration:none">Política de Privacidade e Cookies</a></nav>')
        h = h.replace("</body>", '<script src="/cookies.js"></script>\n</body>')
        write("index.html", h)
    print("ok")

main()
