#!/bin/zsh
# Безопасный неинтерактивный запуск официального Codex CLI.
# Использование из корня проекта:
#   scripts/run-codex.sh read-only docs/codex-prompt.md
#   scripts/run-codex.sh write docs/codex-prompt.md

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-}"
PROMPT_FILE="${2:-}"

if [[ "$MODE" != "read-only" && "$MODE" != "write" ]]; then
  echo "Использование: scripts/run-codex.sh read-only|write path/to/prompt.md" >&2
  exit 2
fi

if [[ -z "$PROMPT_FILE" || ! -f "$PROMPT_FILE" ]]; then
  echo "Файл задания не найден: ${PROMPT_FILE:-<не указан>}" >&2
  exit 2
fi

if ! command -v codex >/dev/null 2>&1; then
  echo "Codex CLI не найден. Установку без разрешения не выполняю." >&2
  echo "Ручной запуск после входа: scripts/run-codex.sh $MODE $PROMPT_FILE" >&2
  exit 127
fi

if ! codex login status 2>&1 | grep -q "Logged in"; then
  echo "Codex CLI установлен, но вход не выполнен. Автоматический запуск остановлен." >&2
  echo "Войдите командой: codex login" >&2
  echo "Затем из корня проекта: scripts/run-codex.sh $MODE $PROMPT_FILE" >&2
  exit 1
fi

mkdir -p "$ROOT/docs"
OUT="$ROOT/docs/codex-last.md"
COMBINED="$(mktemp)"
trap 'rm -f "$COMBINED"' EXIT

{
  if [[ "$MODE" == "read-only" ]]; then
    cat <<'EOF'
Ты Codex в проекте хакатона «Код Единства». Следуй AGENTS.md.
Это аудит: не изменяй файлы и не предлагай команды установки.
Не вызывай OpenRouter и другие платные API. Не обходи лимиты.
Ответ на русском: выводы, риски и что осталось проверить.
Задание:
EOF
  else
    cat <<'EOF'
Ты Codex в проекте хакатона «Код Единства». Следуй AGENTS.md.
Меняй только файлы из раздела «Можно менять».
Не изменяй AGENTS.md, .cursor/**, scripts/**, docs/TASKS.md, docs/DECISIONS.md, docs/codex-prompt.md, docs/codex-last.md.
Не вызывай OpenRouter и другие платные API. Не обходи лимиты. Не устанавливай программы.
Ответ на русском: что изменено, какие проверки выполнены, какие риски остались.
Задание:
EOF
  fi
  echo
  cat "$PROMPT_FILE"
} > "$COMBINED"

cd "$ROOT"

if [[ "$MODE" == "write" ]]; then
  codex exec \
    --sandbox workspace-write \
    --approve-for-me \
    --skip-git-repo-check \
    -C "$ROOT" \
    -o "$OUT" \
    - < "$COMBINED"
else
  codex exec \
    --sandbox read-only \
    --skip-git-repo-check \
    -C "$ROOT" \
    -o "$OUT" \
    - < "$COMBINED"
fi

echo "Codex завершился. Последний ответ: docs/codex-last.md"
