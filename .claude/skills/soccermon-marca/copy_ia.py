"""Acha os tiques de texto de IA numa copy do Soccermon (HTML, Markdown, texto ou os .ts do i18n).

Adaptado do brand-guide da Midgar (scripts/copy_ia.py) com o método de escrita do Miguel
(docs/marca/brand-guide.md, seção 4).

Uso:
  python3 -I .claude/skills/soccermon-marca/copy_ia.py arquivo [outro ...]
  python3 -I .claude/skills/soccermon-marca/copy_ia.py --legenda legendas.txt   # uma legenda de vídeo por linha
Imprime arquivo:linha, o tique e o trecho. Sai com 1 se achar algo.
Linha com data-copy-ia="exemplo" (ou "copy-ia: exemplo") é pulada: é o tique mostrado de propósito.
Filtro grosso: confirme cada achado lendo a frase em voz alta.
"""

import html
import re
import sys

PALAVRAS = (
    "jornada|mergulh\\w+|potencializ\\w+|alavanc\\w+|ecossistema|"
    "revolucion\\w+|robust[oa]s?|incríve(?:l|is)|poderos[oa]s?|inovador\\w*|extraordinári\\w+|"
    "universo de|cenário atual|no mundo de hoje|experiência única|sem complicação|"
    "simples e intuitiv[oa]|solução completa|próximo nível|feit[oa] para você|"
    "no final do dia|game.changer|deep dive|eleve\\w*|elevar|usuári[oa]s?"
)

TIQUES = [
    ("travessão de efeito", re.compile(r"\S\s?—\s?\S")),
    ("não é X, é Y", re.compile(r"\bnão (?:é|são|foi)\b[^.!?\n]{1,60}[,;:]\s*(?:é|são|foi)\b", re.I)),
    ("não apenas X, mas Y", re.compile(r"\bnão (?:só|apenas|somente)\b[^.!?\n]{1,60}\bmas\b", re.I)),
    ("palavra inflada", re.compile(rf"\b(?:{PALAVRAS})\b", re.I)),
    ("anúncio em vez de dizer", re.compile(r"\b(?:vale ressaltar|é importante (?:notar|destacar|lembrar)|em suma|aqui está|confira a seguir)\b", re.I)),
    ("abertura retórica", re.compile(r"(?:^|[.!?]\s+)(?:imagine\b|já imaginou|cansad[oa] de|chama aquele amigo)", re.I)),
    ("dois-pontos de revelação", re.compile(r"\b(?:o segredo|o resultado|a resposta|a verdade)\s*[?:]", re.I)),
    # tricolon de IA: "Monte. Escale. Evolua."
    ("frases de efeito em fila", re.compile(r"(?:\b\w+[.!]\s+){2}\w+[.!](?:\s|$)")),
    ("?! de empolgação/ironia", re.compile(r"\?!|!\?")),
    ("gênero de formulário", re.compile(r"[or]\((?:a|as)\)", re.I)),
    # qualquer emoji: na interface é proibido (no texto de Compartilhar e nos posts pode: marque como exemplo)
    # (símbolo de texto como ★ ▲ ♥ não conta: o brand guide diz onde ele pode ficar)
    ("emoji", re.compile("[\U0001F300-\U0001FAFF]|[☀-➿]️|[⚽⚡✨✅❌⭐]")),
    ("frase de conforto vazia", re.compile(r"\b(?:continua aqui|estamos aqui para|conte com a gente|pode contar com a gente)", re.I)),
    ("fecho motivacional", re.compile(r"\b(?:vamos juntos|o futuro começa|sem limites)", re.I)),
]

TITULO = re.compile(r"^(?:[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wáéíóúâêôãõç]+\s+(?:(?:de|da|do|e|a|o|para|com)\s+)?){3,}")
# nomes próprios do jogo que seguem em maiúscula (não são Title Case)
NOMES = re.compile(r"Liga Índigo|Equipe Rocket|Mr\. Mime|Hyper Beam|Copa de Futsal|Pewter|Cinnabar|Viridian|Game Freak|Pokémon Company|Creatures Inc")


def texto_visivel(bruto: str) -> list[str]:
    bruto = re.sub(r"<(script|style)\b.*?</\1>", lambda m: "\n" * m.group(0).count("\n"), bruto, flags=re.S | re.I)
    # tag ou comentário de várias linhas: mantém as quebras (senão o número da linha escorrega)
    bruto = re.sub(r"<!--.*?-->|<[^>]+>", lambda m: " " + "\n" * m.group(0).count("\n"), bruto, flags=re.S)
    return [html.unescape(linha) for linha in bruto.split("\n")]


def achar(linhas: list[str]) -> list[tuple[int, str, str]]:
    achados = []
    for n, linha in enumerate(linhas, 1):
        limpa = linha.strip()
        for nome, padrao in TIQUES:
            m = padrao.search(limpa)
            if m:
                achados.append((n, nome, limpa[max(0, m.start() - 30) : m.end() + 30]))
        for pedaco in re.split(r"\s{2,}|\|", limpa):
            pedaco = NOMES.sub("x", pedaco.strip())
            if len(pedaco) < 70 and TITULO.match(pedaco) and not pedaco.isupper():
                achados.append((n, "Title Case", pedaco))
    return achados


def legenda(linhas: list[str]) -> list[tuple[int, str, str]]:
    """Legenda de vídeo: 2 a 5 palavras, a feature dita sem gracinha."""
    out = []
    for n, linha in enumerate(linhas, 1):
        t = linha.strip()
        if not t:
            continue
        k = len(t.split())
        if not 2 <= k <= 5:
            out.append((n, f"legenda com {k} palavras (2 a 5)", t))
        if "?" in t:
            out.append((n, "legenda com pergunta (diga a feature, sem ironia)", t))
    return out + achar(linhas)


def _teste() -> None:
    def nomes(t: str) -> set[str]:
        return {a[1] for a in achar([t])}

    assert "frases de efeito em fila" in nomes("Monte. Escale. Evolua.")
    assert "?! de empolgação/ironia" in nomes("ELE EVOLUIU NO MEIO DO JOGO?!")
    assert "abertura retórica" in nomes("CHAMA AQUELE AMIGO QUE DIZ QUE É MESTRE POKÉMON")
    assert "emoji" in nomes("Gol! ⚽")
    assert "Title Case" in nomes("Como Funciona Nossa Copa")
    assert not achar(["Temos que chutar!", "ABAIXA QUE É HYPER BEAM", "Sua insígnia é minha!", "Até o último PP!"])
    assert not achar(["Monte seu time com os 151 de Kanto e ganhe a Copa de Futsal.", "Charmander → Charmeleon"])
    assert not legenda(["EVOLUÇÕES NO MEIO DO JOGO", "MULTIPLAYER ONLINE", "COPA RANKEADA"])
    assert legenda(["CHAMA AQUELE AMIGO QUE DIZ QUE É MESTRE POKÉMON"])


if __name__ == "__main__":
    _teste()
    args = sys.argv[1:]
    modo_legenda = "--legenda" in args
    total = 0
    for caminho in [a for a in args if a != "--legenda"]:
        with open(caminho, encoding="utf-8") as f:
            bruto = f.read()
        exemplos = {n for n, linha in enumerate(bruto.split("\n"), 1) if 'data-copy-ia="exemplo"' in linha or "copy-ia: exemplo" in linha}
        linhas = bruto.split("\n") if modo_legenda else texto_visivel(bruto)
        for n, nome, trecho in legenda(linhas) if modo_legenda else achar(linhas):
            if n not in exemplos:
                print(f"{caminho}:{n}  [{nome}]  {trecho}")
                total += 1
    print(f"{total} achado(s)." if total else "Nada encontrado. Agora leia em voz alta.")
    sys.exit(1 if total else 0)
