---
name: reference-postar-pelo-chrome
description: Como postar nas redes do Soccermon pelo Claude in Chrome (funcionou em 24/10/2026): conta, pasta, pegadinhas de cada rede
metadata:
  type: reference
---

Postar funciona só com o Claude Code logado na conta PESSOAL do Miguel (`/login`) e o Chrome no perfil "Miguel" (Profile 1) com a extensão na mesma conta; depois do `/login` foi preciso reiniciar a sessão (`claude -c`). Upload exige `/add-dir ~/Vídeos/soccermon-postar` (limite 10 MB por arquivo).

- Contas: TikTok @soccermongame, Instagram soccermongame, YouTube canal "Soccermon" (não o "Migueleixon", que também aparece no Studio).
- Aba em segundo plano congela (screenshot dá timeout, texto não entra): abrir aba nova com `tabs_create_mcp` pra cada rede.
- Instagram web: Criar → Post; escolher "Original" no recorte (senão corta pra 4:5); capa por "Select from computer"; não agenda.
- TikTok Studio: legenda com shift+Enter entre linhas; capa em "Edit cover" → Upload cover; post entra "under review" e vira Everyone em ~5 min; o botão de enviar comentário só funciona clicando pelo ref do `find` ("Post").
- YouTube: vídeo 9:16 < 60 s vira Short sozinho; marcar "Não é conteúdo para crianças"; Público na última etapa.
- Registrar links na tabela "Registro" de docs/marketing/pauta.md. Ver [[feedback-social-media-em-lote]] e [[feedback-video-sem-inspiracao]].
- ANTES de postar qualquer vídeo: `ffmpeg -i X.mp4 -vf freezedetect=n=0.01:d=0.5 -map 0:v -f null -` não pode acusar nada. Em 24/10 o POV foi ao ar com 3 s de tela final quase parada + GOL congelado, o Miguel achou que "travou" e apagou; tela final ≤ ~2,5 s e sempre com movimento.
- Comentário com link no TikTok só sai depois que o post sai da revisão ("under review"); se falhar, tentar de novo uns minutos depois.
