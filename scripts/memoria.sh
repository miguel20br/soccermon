#!/usr/bin/env bash
# Copia as memórias do Claude deste PC pra docs/memoria (o repo leva pros outros aparelhos). Rode antes de lançar.
set -euo pipefail
root=$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")
src="$HOME/.claude/projects/${root//\//-}/memory/"
[ -d "$src" ] || { echo "sem memórias em $src (outro aparelho?): nada a copiar"; exit 0; }
# repo público: nenhum e-mail além do noreply
if grep -rnoE '[[:alnum:]._%+-]+@[[:alnum:].-]+\.[a-z]{2,}' "$src" | grep -v 'users.noreply.github.com'; then
    echo "memória com e-mail acima: tire antes de copiar"; exit 1
fi
rsync -a --delete "$src" "$(git rev-parse --show-toplevel)/docs/memoria/"
git status --short docs/memoria
