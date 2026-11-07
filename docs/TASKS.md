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
| T-011 | done | cursor | Тёмный билетный UI + 3D с поворотом головы и зрителями | `App`, `SeatMap`, `styles`, `hallApi`, `demoHall`, `SeatView3D`, `src/scene/**` | `npm run build`; 14/14; head-look + audience |
| T-001 | done | cursor | Подготовить протокол совместной работы агентов, без конкурсного продукта | `AGENTS.md`, `.cursor/rules/agent-routing.mdc`, `.cursor/rules/shared-context.mdc`, `docs/TASKS.md`, `docs/DECISIONS.md`, `scripts/run-codex.sh` | `zsh -n scripts/run-codex.sh`; отдельных тестов проекта нет |
| T-002 | done | cursor | Безопасная диагностика готовности, без запуска Codex и без установки программ | `docs/TASKS.md` | `zsh -n scripts/run-codex.sh`; `codex --version`; `codex login status`; `git --version`; `node --version` |
| T-003 | done | cursor | Создать GitHub-репозиторий и залить текущий каркас | `.gitignore`, `docs/TASKS.md`, `docs/DECISIONS.md`, git remote | `gh repo view Ne0ne1/hackaton-2026`; `git status` |
| T-004 | done | cursor | Адаптировать инструкции под параллельную работу Cursor и Cline/MiniMax | `AGENTS.md`, `.cursor/rules/**`, `.clinerules/**`, `docs/TEAM_PROTOCOL.md`, `docs/INTEGRATION_CONTRACT.md`, `docs/CLINE_PROGRESS.md`, `docs/TASKS.md`, `docs/DECISIONS.md` | сверка правил; продукт не разрабатывался |
| T-005 | done | cursor | Создать ветки на GitHub; каркас ядра, модель мест, утвердить контракт | `feat/cursor-core`, `feat/cline-experience`, `src/**`, `docs/INTEGRATION_CONTRACT.md`, `package.json` | `npm run build` |
| T-006 | done | cursor | Снять устаревшие «предварительный контракт» после аудита готовности SeatMatch | `docs/TEAM_PROTOCOL.md`, `docs/CLINE_PROGRESS.md`, `.clinerules/01-minimax-executor.md` | сверка формулировок |
| T-007 | done | cursor | Интегрировать SeatMatch (cherry-pick fef2196) в App | `src/App.tsx`, `src/styles.css`, `src/experience/seatMatch/**` | `npm run build`; `node --test` 12/12 |
| T-008 | done | cursor | Передать владение 3D MiniMax (только правила, два коммита) | 6 файлов протокола; `docs/TASKS.md`; `docs/DECISIONS.md` | `git show --stat`; 3D-код не менялся |
| T-009 | done | cursor | Дизайн схемы/покупки + cherry-pick редизайна SeatMatch | `App.tsx`, `SeatMap.tsx`, `styles.css`, `index.html`, seatMatch | `npm run build` |
| T-010 | done | cursor | Интерактивная 3D-кинозона с двумя трейлерами и HRTF-звуком | `src/scene/cinema/**`, `SeatView3D.tsx`, `public/assets/**` | `npm run build`; `node --test` cinema+seatMatch |

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
- Результат: убраны устаревшие «предварительный контракт»; обновлены TEAM_PROTOCOL, CLINE_PROGRESS, clinerules; для напарника канонический push — `github`.
- Проверки: сверка формулировок.

### T-007 — интеграция SeatMatch

- Исполнитель: Cursor Agent на `feat/cursor-core`. Cherry-pick `fef21960` (без merge всей ветки MiniMax).
- Результат: `SeatMatch` подключён в `App.tsx` через `onPickSeat` → выделение на схеме + смена 3D-камеры; `registerExperienceModule({ id: 'seat-match' })`; профили Баланс / Лучший обзор / Дешевле из UI модуля. Алгоритм MiniMax не переписывался.
- Проверки: `npm run build` OK; `node --test src/experience/seatMatch/seatMatch.test.mjs` — 12/12. Push в `main` не делался.

### T-008 — передача 3D MiniMax

- Исполнитель: Cursor Agent на `feat/cursor-core`. 3D-код не перерабатывался.
- Коммит №1 (только правила, для cherry-pick MiniMax): `d5135be6543fe55dbf45f7700d491b9da2c82b96` — 6 файлов протокола.
- Коммит №2: журналы `TASKS`/`DECISIONS`.
- Результат: Cursor больше не владеет 3D; дальше — backend/покупка/интеграция. Push ждал команды пользователя.

### T-009 — UI покупки и схемы под оценку дизайна

- Исполнитель: Cursor. `SeatView3D` не менялся.
- Результат: киношный UI (шрифты Cormorant/Outfit, схема с проходом, checkout); cherry-pick `6b8066f` (редизайн SeatMatch MiniMax).
- Проверки: `npm run build`.

### T-010 — 3D-кинозона трейлеров

- Исполнитель: Cursor на `feature/3d-cinema-trailers` (база: merge `feat/cline-experience` → `96789fd`).
- Результат: две боковые панели (Sintel, Big Buck Bunny), video texture, DOM-контролы, `trailerStore` (один активный), Web Audio HRTF, локальные mp4/webm ≤720p, атрибуция CC BY 3.0.
- Проверки: `npm run build` OK; `node --experimental-strip-types --test` seatMatch + cinema — pass. Пространственный звук — ручная проверка в браузере.
