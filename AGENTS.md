# Совместная работа агентов — хакатон «Код Единства»

Протокол для Cursor и Codex CLI.  
**Командное разделение** — `docs/TEAM_PROTOCOL.md` (новые правила **заменяют** старое: 3D больше не зона Cursor).  
Контракт: `docs/INTEGRATION_CONTRACT.md`.

Продукт: «Билет с видом на экран».

## Роли

### Cursor Agent — исполнитель A (ядро, не 3D)

Ветка `feat/cursor-core`:

- архитектура, backend, API;
- данные кинотеатров/сеансов/кресел (источник истины);
- схема зала `SeatMap`, покупка и статусы;
- `App.tsx`, общие стили, навигация, сборка, деплой, интеграция модулей;
- `docs/TASKS.md`, `docs/DECISIONS.md`.

**Не разрабатывает 3D-сцену.** Не правит `SeatView3D.tsx`, `SeatView3D.css`, `src/scene/**`, `src/experience/**` (кроме точки монтирования в `App.tsx`).

### Cline + MiniMax M3 — исполнитель B (3D + модули опыта)

По `.clinerules/01-minimax-executor.md` и `docs/TEAM_PROTOCOL.md`.  
Ветка: `feat/cline-experience`.

**Единственный владелец 3D:** зал, кресла, материалы, свет, камера в сцене, анимации, WebGL-оптимизация; файл `SeatView3D.tsx` (+ `src/scene/**`).  
Также: SeatMatch, SeatCompare, HonestView, SpatialSound.  
Журнал: `docs/CLINE_PROGRESS.md`. Не пишет `TASKS`/`DECISIONS`.

Данные кресел и `getSeatCameraView` берёт из контракта Cursor; второй движок и своя модель Seat запрещены.

### Codex — ТЗ, архитектура, аудит

Архитектура границ, ТЗ для MiniMax, сквозные ошибки, аудит готовности — через `scripts/run-codex.sh`.  
Не правит одновременно те же файлы, что Cursor/Cline. Не смена модели чата.

### OpenRouter — резерв

Только после исчерпания лимита и явного подтверждения пользователя. Секреты и обход лимитов запрещены.

## Перед каждой задачей (Cursor / Codex)

1. Прочитать `docs/TEAM_PROTOCOL.md`, `docs/TASKS.md`, `docs/DECISIONS.md`.
2. Ветка: `feat/cursor-core` для ядра.
3. Выбрать исполнителя: `cursor` | `codex` | зона MiniMax | OpenRouter.
4. Проверить блокировки. **Не менять зону 3D и `src/experience/**` MiniMax.**
5. Записать задачу в `docs/TASKS.md`.

Короткий выбор:

- покупка, схема, API, интеграция → Cursor;
- 3D-зал / SeatView3D / SeatMatch… → MiniMax;
- контракт/аудит → Codex;
- лимит → спросить про OpenRouter.

## Git

- Параллельно: `feat/cursor-core` и `feat/cline-experience`.
- Не пушить продукт в `main` без разрешения.
- Запрещены force push, `reset --hard`, удаление чужих коммитов, автослияние.
- Подробности — `docs/TEAM_PROTOCOL.md`.

## Запуск Codex

```bash
codex --version
codex login status
scripts/run-codex.sh write docs/codex-prompt.md
scripts/run-codex.sh read-only docs/codex-prompt.md
```

Ничего не устанавливать. Скрипт только `workspace-write` / `read-only`. Ответ → `docs/codex-last.md`.  
Пока Codex работает — не трогать его файлы и журналы. После — перенести итог в `TASKS`/`DECISIONS`.

### Шаблон задания для Codex

```text
Задача: <одно предложение>
Зачем: <риск или решение>
Можно менять: <пути>
Нельзя менять: всё остальное, включая AGENTS.md, .cursor/**, .clinerules/**, scripts/**, docs/TASKS.md, docs/DECISIONS.md, docs/codex-prompt.md; зону 3D/experience MiniMax без согласования
Контекст: <TEAM_PROTOCOL, TASKS, DECISIONS, INTEGRATION_CONTRACT>
Ожидаемый результат: <…>
Проверки: <…>
Критерий готовности: <…>
```

## OpenRouter при исчерпании лимита

1. Кто остановился и что сделано.  
2. Полный текст задания.  
3. Вопрос о подтверждении расхода API. До ответа не вызывать.

## Общие ограничения

- Один файл — один исполнитель.
- `TASKS`/`DECISIONS` — Cursor; `CLINE_PROGRESS` — MiniMax.
- Не утверждать смену модели чата, если её не было.
- Без платных API и обхода лимитов без подтверждения.
- Ответы на русском.
- После задачи — существующие проверки проекта.
