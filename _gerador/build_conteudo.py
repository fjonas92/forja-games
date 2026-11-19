# -*- coding: utf-8 -*-
# Gera paginas de jogos, guias, termos e sobre, e ajusta home/sitemap/rodapes.
# Uso: python3 build_conteudo.py /caminho/do/repo   (NAO rode o build.py antigo depois)
import os, re, sys, html as H
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from content2 import GAMES, GUIAS

ROOT = sys.argv[1]
os.chdir(ROOT)
SITE = "https://falzinhogames.com.br"
DATA = "19/11/2026"
e = H.escape

def rd(p): return open(p, encoding="utf-8").read()
def wr(p, t):
    d = os.path.dirname(p)
    if d: os.makedirs(d, exist_ok=True)
    open(p, "w", encoding="utf-8", newline="\n").write(t)

NAV = '<nav class="nav" aria-label="Principal"><a href="/#jogos">Jogos</a><a href="/guias/">Guias</a><a href="/sobre.html">Sobre</a><a href="/contato.html">Contato</a></nav>'
FOOT = '<nav aria-label="Rodapé"><a href="/privacidade.html">Política de Privacidade e Cookies</a><a href="/termos.html">Termos de Uso</a><a href="/guias/">Guias</a><a href="/sobre.html">Sobre</a><a href="/contato.html">Contato</a><a href="/">Início</a><a href="https://www.instagram.com/falzingames" target="_blank" rel="noopener">Instagram</a><a href="https://x.com/falzinhogames" target="_blank" rel="noopener">X</a></nav>'
FOOT_IDX = FOOT.replace('<nav aria-label="Rodapé">', '<nav aria-label="Rodapé" style="display:flex;gap:18px;flex-wrap:wrap">')

# ---- dados do index atual (cores e url de cada jogo) ----
idx = rd("index.html")
meta = {}
for m in re.finditer(r'\{ nome: "([^"]+)", genero: "([^"]+)".*?texto: "((?:[^"\\]|\\.)*)",\s*url: "([^"]*)", c1: "(#[0-9A-Fa-f]+)"', idx, re.S):
    meta[m.group(1)] = dict(texto=m.group(3), url=m.group(4), c1=m.group(5))
NOME2SLUG = {g["nome"]: g["slug"] for g in GAMES}
NOME2SLUG.update({"ELYDRAN": "elydran", "Master Fut 2026": "master-fut", "TURBO MOTO": "moto"})
for g in GAMES:
    mm = meta.get(g["nome"]) or meta.get(g["nome"].split(":")[0]) or {}
    g["url"] = mm.get("url") or ("/%s/" % g["slug"])
    g["c1"] = mm.get("c1") or g.get("c1", "#8A1F3A")
    g["texto"] = mm.get("texto", g["lead"])

# ---- shell, a partir de uma pagina existente ----
base = rd("atelon.html")
pre, rest = base.split("<main>", 1)
_, post = rest.split("</main>", 1)
pre = re.sub(r'<nav class="nav" aria-label="Principal">.*?</nav>', NAV, pre, flags=re.S)
post = re.sub(r'<nav aria-label="Rodapé">.*?</nav>', FOOT, post, flags=re.S)

def shell(title, desc, path, body, ld=""):
    p = re.sub(r"<title>.*?</title>", "<title>%s</title>" % e(title), pre, flags=re.S)
    p = re.sub(r'<meta name="description" content=".*?">', '<meta name="description" content="%s">' % e(desc, quote=True), p)
    p = re.sub(r'<link rel="canonical" href=".*?">', '<link rel="canonical" href="%s%s">' % (SITE, path), p)
    if ld: p = p.replace("</head>", ld + "\n</head>", 1)
    return p + "<main>\n" + body + "\n  </main>" + post

AD = '    <div class="ad" hidden>Publicidade</div>'
GUIA = {g["slug"]: g for g in GUIAS}
JOGO = {g["slug"]: g for g in GAMES}

def ul(items, tag="ul"):
    return "      <%s>\n%s\n      </%s>" % (tag, "\n".join("        <li>%s</li>" % i for i in items), tag)

# ---- paginas de jogo ----
def game_page(g):
    sobre = "\n".join("      <p>%s</p>" % e(p) for p in g["sobre"])
    faq = "\n".join("        <dt>%s</dt><dd>%s</dd>" % (e(q), e(a)) for q, a in g["faq"])
    outros = [x for x in GAMES if x["slug"] != g["slug"]]
    i = [x["slug"] for x in GAMES].index(g["slug"])
    outros = [GAMES[(i + k) % len(GAMES)] for k in range(1, 5)]
    rel_g = "\n".join('        <li><a href="/guias/%s.html">%s</a></li>' % (s, e(GUIA[s]["titulo"])) for s in g["guias"] if s in GUIA)
    rel_j = "\n".join('        <li><a href="/%s.html">%s</a></li>' % (x["slug"], e(x["nome"])) for x in outros)
    body = f"""    <section class="gh" style="--c1:{g['c1']}">
      <a class="back" href="/#jogos">← Todos os jogos</a>
      <span class="genre">{e(g['genero'])}</span>
      <h1>{e(g['nome'])}</h1>
      <p class="lead">{e(g['lead'])}</p>
      <a class="cta" href="{g['url']}">Jogar {e(g['nome'])} →</a>
    </section>
{AD}
    <article class="txt">
      <h2>Sobre o jogo</h2>
{sobre}
      <h2>Como jogar</h2>
{ul([e(x) for x in g['como']], 'ol')}
      <h2>Dicas</h2>
{ul([e(x) for x in g['dicas']])}
      <h2>Principais recursos</h2>
{ul([e(x) for x in g['recursos']])}
      <h2>Perguntas frequentes</h2>
      <dl>
{faq}
      </dl>
      <h2>Leia também</h2>
      <ul>
{rel_g}
      </ul>
      <h2>Outros jogos</h2>
      <ul>
{rel_j}
      </ul>
    </article>
{AD}"""
    return shell("%s: como jogar, dicas e recursos | Falzinho Games" % g["nome"], g["lead"], "/%s.html" % g["slug"], body)

for g in GAMES:
    wr(g["slug"] + ".html", game_page(g))

# ---- guias ----
def guide_page(gd):
    secs = []
    for h2, paras in gd["corpo"]:
        secs.append("      <h2>%s</h2>\n%s" % (e(h2), "\n".join("      <p>%s</p>" % e(p) for p in paras)))
    j = JOGO.get(gd["jogo"]) if gd["jogo"] else None
    cta = ""
    if j:
        cta = '\n      <p><a class="cta2" href="%s">Jogar %s agora →</a> <a href="/%s.html">Saiba mais sobre o jogo</a></p>' % (j["url"], e(j["nome"]), j["slug"])
    others = [x for x in GUIAS if x["slug"] != gd["slug"]]
    k = [x["slug"] for x in GUIAS].index(gd["slug"])
    others = [GUIAS[(k + n) % len(GUIAS)] for n in range(1, 4)]
    rel = "\n".join('        <li><a href="/guias/%s.html">%s</a></li>' % (x["slug"], e(x["titulo"])) for x in others)
    body = f"""    <article class="txt">
      <p class="crumb"><a href="/">Início</a> › <a href="/guias/">Guias</a></p>
      <h1>{e(gd['titulo'])}</h1>
      <p class="upd">Publicado em {DATA} · Por Falzinho Games</p>
      <p><strong>{e(gd['desc'])}</strong></p>
{AD}
{chr(10).join(secs)}{cta}
      <h2>Continue lendo</h2>
      <ul>
{rel}
      </ul>
    </article>
{AD}"""
    return shell("%s | Falzinho Games" % gd["titulo"], gd["desc"], "/guias/%s.html" % gd["slug"], body)

for gd in GUIAS:
    wr("guias/%s.html" % gd["slug"], guide_page(gd))

items = "\n".join('      <li><a href="/guias/%s.html"><strong>%s</strong><span>%s</span></a></li>' % (x["slug"], e(x["titulo"]), e(x["desc"])) for x in GUIAS)
body = f"""    <article class="txt" style="max-width:1080px">
      <p class="crumb"><a href="/">Início</a> › Guias</p>
      <h1>Guias e dicas</h1>
      <p>Textos feitos pelo Falzinho Games para ajudar você a jogar melhor: regras, controles, estratégias e dicas dos nossos jogos de navegador.</p>
      <ul class="gl">
{items}
      </ul>
    </article>
{AD}"""
wr("guias/index.html", shell("Guias e dicas dos jogos | Falzinho Games", "Guias, regras e dicas dos jogos de navegador do Falzinho Games: Tampinhas, Mestre do Taco, Mente em Jogo, Xadrez 3D, APEX e mais.", "/guias/", body))

# ---- sobre ----
lista = "\n".join('        <li><strong><a href="/%s.html">%s</a>:</strong> %s</li>' % (g["slug"], e(g["nome"]), e(g["texto"])) for g in GAMES)
body = f"""    <article class="txt">
      <h1>Sobre o Falzinho Games</h1>
      <p>O Falzinho Games é um estúdio independente de jogos de navegador. Aqui você joga direto no celular ou no computador, sem baixar nada e sem precisar de instalação.</p>

      <h2>O que fazemos</h2>
      <p>Criamos jogos de estratégia, esporte, corrida, aventura, quebra-cabeça e passatempo, pensados para rodar leve no navegador. Hoje o site reúne {len(GAMES)} jogos:</p>
      <ul>
{lista}
      </ul>

      <h2>Como nasce cada jogo</h2>
      <p>Os jogos são criados e mantidos por uma pessoa só, o Falzinho, que desenha, programa e testa tudo, com ajuda de ferramentas de inteligência artificial no processo. Novidades e correções entram com frequência, e o feedback de quem joga ajuda a decidir o que vem a seguir.</p>

      <h2>Guias e conteúdo</h2>
      <p>Além dos jogos, mantemos uma seção de <a href="/guias/">guias e dicas</a> com regras, controles e estratégias, para quem quer entender melhor cada jogo. Cada jogo também tem uma página própria com explicação de como jogar.</p>

      <h2>Contas e progresso</h2>
      <p>Você pode jogar sem conta. Com uma conta, o progresso, os recordes e os rankings ficam salvos e você continua de qualquer aparelho. Veja como tratamos os dados na <a href="/privacidade.html">Política de Privacidade e Cookies</a> e as regras de uso nos <a href="/termos.html">Termos de Uso</a>.</p>

      <h2>Como o site se mantém</h2>
      <p>Os jogos são gratuitos. Para cobrir os custos, o site poderá exibir anúncios, e alguns jogos poderão oferecer vídeos opcionais em troca de prêmios dentro do jogo.</p>

      <h2>Fale com a gente</h2>
      <p>Dúvidas, sugestões ou erros nos jogos? Use a página de <a href="/contato.html">contato</a>.</p>
    </article>"""
wr("sobre.html", shell("Sobre o Falzinho Games", "Conheça o Falzinho Games, estúdio independente de jogos de navegador: %d jogos grátis, guias e dicas." % len(GAMES), "/sobre.html", body))

# ---- termos ----
TERMOS = [
 ("Aceitação", ["Ao usar o site Falzinho Games e os jogos disponíveis nele, você concorda com estes Termos de Uso. Se não concordar, não use o site."]),
 ("O que oferecemos", ["O Falzinho Games reúne jogos de navegador gratuitos, criados de forma independente, e uma seção de guias e dicas. Os jogos podem ser alterados, pausados ou removidos a qualquer momento, e muitos estão em desenvolvimento ou em fase de testes."]),
 ("Contas", ["Alguns jogos permitem criar uma conta para salvar progresso, recordes e participar de rankings. Você é responsável por manter os dados da sua conta em segurança e pelas informações que fornece. Podemos suspender contas usadas para fraudes ou abusos."]),
 ("Uso permitido", ["Você pode jogar para uso pessoal e sem fins comerciais. Não é permitido tentar burlar rankings, usar programas para trapacear, explorar falhas de forma abusiva, copiar o site ou os jogos para republicar, nem sobrecarregar os servidores."]),
 ("Rankings e pontos", ["Pontos, fichas e moedas dos jogos são virtuais, não têm valor em dinheiro e não podem ser trocados por prêmios reais. Podemos corrigir ou zerar pontuações obtidas de forma irregular."]),
 ("Propriedade intelectual", ["O código, a arte, os textos e os sons originais do Falzinho Games pertencem aos seus criadores. Algumas músicas e sons são de bibliotecas de licença livre, com os devidos créditos nos jogos. Equipes, pilotos e pistas dos jogos de corrida são fictícios. Nomes de clubes, seleções ou marcas que apareçam nos jogos pertencem aos seus respectivos donos e são usados apenas para identificação."]),
 ("Anúncios", ["O site poderá exibir anúncios do Google AdSense e oferecer vídeos opcionais com recompensa nos jogos. Você não deve clicar nos anúncios de forma artificial ou pedir que outros o façam."]),
 ("Isenção de garantias", ["Os jogos são oferecidos como estão, sem garantia de funcionamento contínuo, de ausência de erros ou de que o progresso nunca será perdido. Alguns jogos rodam em servidores gratuitos que podem demorar para responder ou ficar fora do ar."]),
 ("Limitação de responsabilidade", ["O Falzinho Games não se responsabiliza por danos decorrentes do uso ou da impossibilidade de uso do site, dentro do que a lei permite."]),
 ("Crianças", ["Os jogos não são direcionados a menores de 13 anos. Menores devem usar o site com a supervisão de um responsável."]),
 ("Mudanças nestes termos", ["Podemos atualizar estes termos quando necessário. A data da última atualização aparece no topo desta página, e continuar usando o site depois da mudança significa que você aceita a nova versão."]),
 ("Lei aplicável e contato", ["Estes termos seguem as leis do Brasil. Para dúvidas, escreva para falzinhogames@outlook.com ou use a página de <a href=\"/contato.html\">contato</a>."]),
]
tp = []
for h2, ps in TERMOS:
    tp.append("      <h2>%s</h2>\n%s" % (e(h2), "\n".join("      <p>%s</p>" % (p if "<a " in p else e(p)) for p in ps)))
body = f"""    <article class="txt">
      <h1>Termos de Uso</h1>
      <p class="upd">Atualizados em {DATA}</p>
{chr(10).join(tp)}
    </article>"""
wr("termos.html", shell("Termos de Uso | Falzinho Games", "Termos de Uso do Falzinho Games: regras de uso do site, das contas, dos rankings e dos jogos.", "/termos.html", body))

# ---- ajusta paginas existentes (nav/rodape, links quebrados) ----
for f in ("privacidade.html", "contato.html"):
    t = rd(f)
    t = re.sub(r'<nav class="nav" aria-label="Principal">.*?</nav>', NAV, t, flags=re.S)
    t = re.sub(r'<nav aria-label="Rodapé">.*?</nav>', FOOT, t, flags=re.S)
    t = t.replace('</a><a href="/sobre.html">Sobre</a><a href="/contato.html">Contato</a>.', '</a>.')
    wr(f, t)

# ---- home ----
t = idx
t = t.replace("<title>Falzinho Games</title>", "<title>Falzinho Games: jogos de navegador grátis, sem baixar nada</title>")
t = re.sub(r'<meta name="description" content=".*?">', '<meta name="description" content="Jogos de navegador grátis: estratégia, futebol de botão, sinuca, quiz, xadrez 3D, corridas, RPG, fazenda e mais. Jogue no celular ou no computador, sem instalar nada.">', t, count=1)
t = t.replace("<p>Reino medieval, cidade política e gerenciador de futebol. Escolha um, clique em jogar e comece direto do celular ou do computador.</p>",
              "<p>Estratégia, esportes, corridas 3D, RPG, quebra-cabeças, fazenda e cartas. Escolha um jogo, clique em jogar e comece direto do celular ou do computador, sem baixar nada.</p>")
t = re.sub(r'<nav class="nav" aria-label="Principal">.*?</nav>', NAV, t, count=1, flags=re.S)
t = re.sub(r'<nav aria-label="Rodapé"[^>]*>.*?</nav>', FOOT_IDX, t, count=1, flags=re.S)
# link "Saiba mais" para todos os jogos
for g in GAMES:
    for nm in (g["nome"], g["nome"].split(":")[0]):
        pat = re.compile(r'(\{ nome: "%s",[^}]*?pagina: ")(")' % re.escape(nm), re.S)
        t = pat.sub(lambda m: m.group(1) + g["slug"] + ".html" + m.group(2), t, count=1)
CSS_EXTRA = """
.sec { padding-block: 40px 8px; border-top: 1px solid var(--line); margin-top: 24px; }
.sec h2 { font-family: var(--font-display); font-weight: 400; font-size: 28px; margin: 0 0 12px; }
.sec p, .sec li, .sec dd { color: var(--muted); max-width: 72ch; }
.sec dt { font-weight: 700; margin-top: 14px; }
.sec dd { margin: 4px 0 0; }
.cat { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 14px 28px; }
.cat a { color: var(--fg); font-weight: 700; text-decoration: none; }
.cat a:hover { color: var(--ember); }
.gl { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 14px; }
.gl a { display: block; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 16px; text-decoration: none; height: 100%; }
.gl a:hover { border-color: var(--ember); }
.gl strong { display: block; color: var(--fg); margin-bottom: 4px; }
.gl span { color: var(--muted); font-size: 14px; }
"""
t = t.replace("</style>", CSS_EXTRA + "</style>", 1)
cat = "\n".join('        <li><a href="/%s.html">%s</a>: %s</li>' % (g["slug"], e(g["nome"]), e(g["texto"])) for g in GAMES)
gl6 = "\n".join('        <li><a href="/guias/%s.html"><strong>%s</strong><span>%s</span></a></li>' % (x["slug"], e(x["titulo"]), e(x["desc"])) for x in GUIAS[:6])
NOVO = f"""<section class="sec" id="sobre" aria-labelledby="t-sobre">
      <h2 id="t-sobre">Sobre o Falzinho Games</h2>
      <p>O Falzinho Games é um estúdio independente de jogos de navegador. Todos os jogos são gratuitos e abrem direto no celular ou no computador, sem instalação. Você pode jogar sem conta, e quem cria uma conta guarda o progresso, os recordes e participa dos rankings.</p>
      <p>Os jogos são criados e mantidos por uma pessoa só, o Falzinho, que desenha, programa e testa tudo. O catálogo vai de estratégia medieval e gerenciador de futebol a corridas em 3D, RPG, jogos de tabuleiro, cartas, quiz e fazenda.</p>
    </section>

    <section class="sec" aria-labelledby="t-cat">
      <h2 id="t-cat">Todos os jogos</h2>
      <ul class="cat">
{cat}
      </ul>
    </section>

    <section class="sec" aria-labelledby="t-guias">
      <h2 id="t-guias">Guias e dicas</h2>
      <p>Regras, controles e estratégias para jogar melhor.</p>
      <ul class="gl">
{gl6}
      </ul>
      <p><a href="/guias/">Ver todos os guias →</a></p>
    </section>

    <section class="sec" aria-labelledby="t-faq">
      <h2 id="t-faq">Perguntas frequentes</h2>
      <dl>
        <dt>Os jogos são grátis?</dt><dd>Sim. Para cobrir os custos, o site poderá exibir anúncios.</dd>
        <dt>Preciso instalar alguma coisa?</dt><dd>Não. Tudo roda no navegador, no celular ou no computador.</dd>
        <dt>Preciso de conta?</dt><dd>Não para jogar. Com uma conta, o progresso e os rankings ficam salvos e você continua de qualquer aparelho.</dd>
        <dt>Alguns jogos demoram para abrir. Por quê?</dt><dd>Alguns jogos rodam em servidores gratuitos que podem levar até um minuto para acordar no primeiro acesso do dia.</dd>
        <dt>Como falo com vocês?</dt><dd>Pela página de <a href="/contato.html">contato</a> ou pelas redes sociais.</dd>
      </dl>
    </section>
"""
t = re.sub(r'<section class="facts" id="sobre" aria-label="Sobre a Falzinho Games">(.*?)</section>',
           lambda m: '<section class="facts" aria-label="Destaques">' + m.group(1) + '</section>\n\n    ' + NOVO, t, count=1, flags=re.S)
wr("index.html", t)

# ---- css compartilhado ----
css = rd("style.css")
if ".crumb" not in css:
    css += """
.txt ol { padding-left: 22px; display: grid; gap: 6px; }
.crumb { font-size: 14px; color: var(--muted); margin: 0; }
.crumb a { text-decoration: none; }
.txt a { color: var(--fg); }
.cta2 { display: inline-block; background: var(--ember); color: var(--ember-ink) !important; font-weight: 700; text-decoration: none; padding: 11px 18px; border-radius: 10px; margin-right: 12px; }
.gl { list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 14px; }
.gl a { display: block; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 16px; text-decoration: none; height: 100%; }
.gl a:hover { border-color: var(--ember); }
.gl strong { display: block; color: var(--fg); margin-bottom: 4px; }
.gl span { color: var(--muted); font-size: 14px; }
"""
    wr("style.css", css)

# ---- sitemap ----
urls = ["/", "/sobre.html", "/contato.html", "/privacidade.html", "/termos.html", "/guias/"]
urls += ["/%s.html" % g["slug"] for g in GAMES] + ["/guias/%s.html" % x["slug"] for x in GUIAS]
urls += [g["url"] for g in GAMES if g["url"].startswith("/")]
seen = []
for u in urls:
    if u not in seen: seen.append(u)
wr("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join("  <url><loc>%s%s</loc></url>" % (SITE, u) for u in seen) + "\n</urlset>\n")
print("ok", len(GAMES), "jogos", len(GUIAS), "guias")
