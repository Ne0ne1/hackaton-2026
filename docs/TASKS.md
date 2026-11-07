# Задачи

Общий журнал хакатона «Код Единства». Перед работой прочитай этот файл, `docs/DECISIONS.md` и `docs/TEAM_PROTOCOL.md`.

Статусы: `todo`, `in_progress`, `blocked`, `review`, `done`.

Исполнители в этом файле: `cursor`, `codex`. OpenRouter сюда не ставить, пока пользователь явно не подтвердил расход API.

**Важно:** `docs/TASKS.md` и `docs/DECISIONS.md` обновляет только Cursor. MiniMax (Cline) читает эти файлы и ведёт прогресс в `docs/CLINE_PROGRESS.md` в своей ветке.

## Активные блокировки

Пустая таблица означает, что файлы свободны. Блокировку снимает тот же исполнитель после записи результата.

| Путь | Владелец | Задача | С |
|------|----------|--------|---|
| — | — | — | — |

## Очередь

| ID | Статус | Исполнитель | Задача | Файлы | Проверки |
|----|--------|-------------|--------|-------|----------|
| T-001 | done | cursor | Подготовить протокол совместной работы агентов, без конкурсного продукта | `AGENTS.md`, `.cursor/rules/agent-routing.mdc`, `.cursor/rules/shared-context.mdc`, `docs/TASKS.md`, `docs/DECISIONS.md`, `scripts/run-codex.sh` | `zsh -n scripts/run-codex.sh`; отдельных тестов проекта нет |
| T-002 | done | cursor | Безопасная диагностика готовности, без запуска Codex и без установки программ | `docs/TASKS.md` | `zsh -n scripts/run-codex.sh`; `codex --version`; `codex login status`; `git --version`; `node --version` |
| T-003 | done | cursor | Создать GitHub-репозиторий и залить текущий каркас | `.gitignore`, `docs/TASKS.md`, `docs/DECISIONS.md`, git remote | `gh repo view Ne0ne1/hackaton-2026`; `git status` |
| T-004 | done | cursor | Адаптировать инструкции под параллельную работу Cursor и Cline/MiniMax | `AGENTS.md`, `.cursor/rules/**`, `.clinerules/**`, `docs/TEAM_PROTOCOL.md`, `docs/INTEGRATION_CONTRACT.md`, `docs/CLINE_PROGRESS.md`, `docs/TASKS.md`, `docs/DECISIONS.md` | сверка правил; продукт не разрабатывался |
| T-005 | done | cursor | Создать ветки на GitHub; каркас ядра, модель мест, утвердить контракт | `feat/cursor-core`, `feat/cline-experience`, `src/**`, `docs/INTEGRATION_CONTRACT.md`, `package.json` | `npm run build` |
| T-006 | done | cursor | Снять устаревшие «предварительный контракт» после аудита готовности SeatMatch | `docs/TEAM_PROTOCOL.md`, `docs/CLINE_PROGRESS.md`, `.clinerules/01-minimax-executor.md` | сверка формулировок |

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

### T-003 — GitHub-репозиторий

- Исполнитель: Cursor Agent. Модель чата не переключалась. Codex не запускался.
- Результат: локальный git на `main`, remote `origin`, публичный репозиторий https://github.com/Ne0ne1/hackaton-2026, каркас запушен. Collaborator: `liquidsss` (write).
- Проверки: `git status` чистый после пуша; ветка tracking `origin/main`.

### T-004 — протокол двух исполнителей

- Исполнитель: Cursor Agent. Модель чата не переключалась. Codex не запускался. Продукт не разрабатывался.
- Результат: добавлены `docs/TEAM_PROTOCOL.md`, `docs/INTEGRATION_CONTRACT.md`, `docs/CLINE_PROGRESS.md`; обновлены `AGENTS.md`, `.cursor/rules/*`, `.clinerules/01-minimax-executor.md`, журналы. Параллельные ветки `feat/cursor-core` и `feat/cline-experience`; журналы разделены; контракт предварительный.
- Проверки: набор тестов продукта отсутствует; сверка правил на противоречия выполнена вручную.

### T-005 — ветки, каркас ядра, контракт v1

- Исполнитель: Cursor Agent на `feat/cursor-core`. Codex не запускался. SeatMatch не начинался.
- Результат: на GitHub опубликованы `feat/cursor-core` и `feat/cline-experience`. Vite+React+R3F каркас: кинотеатр/сеанс, схема мест, 3D-вид с места, покупка в localStorage. API в `src/core/hallApi.ts`. Контракт утверждён (`docs/INTEGRATION_CONTRACT.md` v1). Зона MiniMax: `src/experience/`.
- Проверки: `npm run build`.

### T-006 — выравнивание после аудита

- Исполнитель: Cursor Agent. Аудит: [Codex-style audit](b26c423a-9c24-4b19-ade0-255dbc133904). Вердикт: MiniMax может начинать SeatMatch.
- Результат: убраны устаревшие «предварительный контракт»; обновлены TEAM_PROTOCOL, CLINE_PROGRESS, clinerules; зафиксирован push на GitHub (`github` remote).
- Проверки: сверка формулировок.

### T-006 — актуализация протоколов после аудита

- Исполнитель: Cursor Agent. Аудит готовности: [Codex-style audit](b26c423a-9c24-4b19-ade0-255dbc133904) — вердикт «MiniMax может начинать SeatMatch».
- Результат: убраны устаревшие формулировки «предварительный контракт»; в протоколе указан remote GitHub для напарника.
- Проверки: сверка grep по «предварительн».
