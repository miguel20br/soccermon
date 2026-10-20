#!/usr/bin/env bash
# Fila pesada (regra 7 do CLAUDE.md): roda o comando na vez dele no cadeado da máquina, um pesado por vez
# (vitest, build, Playwright, calibrate, ffmpeg, render do HyperFrames, outros projetos).
#   scripts/pesado.sh ffmpeg -i entrada.mp4 ...       npm run pesado -- npx vitest run --maxWorkers=2
# Alias pra usar de qualquer pasta: alias pesado=~/Projects/soccermon/scripts/pesado.sh
# Já dentro da fila (SOCCERMON_PESADO=1)? Roda direto: dois flock no mesmo cadeado travariam um ao outro.
if [ -n "$SOCCERMON_PESADO" ]; then exec "$@"; fi
export SOCCERMON_PESADO=1
exec flock /tmp/soccermon-heavy.lock "$@"
