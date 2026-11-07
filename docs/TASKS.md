# Задачи

Общий журнал хакатона «Код Единства». Перед работой прочитай этот файл и `docs/DECISIONS.md`.

Статусы: `todo`, `in_progress`, `blocked`, `review`, `done`.

Исполнители: `cursor`, `codex`. OpenRouter сюда не ставить, пока пользователь явно не подтвердил расход API.

## Активные блокировки

Пустая таблица означает, что файлы свободны. Блокировку снимает тот же исполнитель после записи результата.

| Путь | Владелец | Задача | С |
|------|----------|--------|---|
| `.gitignore` | cursor | T-003 | создание GitHub-репозитория |
| `docs/TASKS.md` | cursor | T-003 | создание GitHub-репозитория |
| `docs/DECISIONS.md` | cursor | T-003 | создание GitHub-репозитория |

## Очередь

| ID | Статус | Исполнитель | Задача | Файлы | Проверки |
|----|--------|-------------|--------|-------|----------|
| T-001 | done | cursor | Подготовить протокол совместной работы агентов, без конкурсного продукта | `AGENTS.md`, `.cursor/rules/agent-routing.mdc`, `.cursor/rules/shared-context.mdc`, `docs/TASKS.md`, `docs/DECISIONS.md`, `scripts/run-codex.sh` | `zsh -n scripts/run-codex.sh`; отдельных тестов проекта нет |
| T-002 | done | cursor | Безопасная диагностика готовности, без запуска Codex и без установки программ | `docs/TASKS.md` | `zsh -n scripts/run-codex.sh`; `codex --version`; `codex login status`; `git --version`; `node --version` |
| T-003 | in_progress | cursor | Создать GitHub-репозиторий и залить текущий каркас | `.gitignore`, `docs/TASKS.md`, `docs/DECISIONS.md`, git remote | `gh repo view`; `git status` |

## Журнал

### T-001 — протокол агентов

- Исполнитель: Cursor Agent. Модель чата не переключалась.
- Результат: добавлены инструкции Cursor, `AGENTS.md`, журналы и безопасный запуск Codex CLI.
- Codex не запускался: конкурсная задача ещё не поставлена.
- Проверки: синтаксис `scripts/run-codex.sh`. Набора тестов продукта нет.

### T-002 — диагностика готовности

- Исполнитель: Cursor Agent. Модель чата не переключалась. Codex с заданием не запускался.
- Результат: инструкции, CLI, вход Codex, Git и Node.js на месте. Платные API проект не требует. Папка ещё не git-репозиторий.
- Проверки: синтаксис скрипта успешен; `codex-cli 0.153.4`, вход через ChatGPT; Git 2.50.1; Node.js v24.22.2. Тестов продукта нет.
