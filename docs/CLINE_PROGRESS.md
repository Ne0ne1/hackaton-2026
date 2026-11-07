# Прогресс MiniMax (Cline)

Короткий журнал исполнителя B. Ведётся **только** в ветке `feat/cline-experience`.  
Не заменяет `docs/TASKS.md`. Cursor переносит итоги сюда в общий журнал после интеграции.

Формат записи:

```text
### YYYY-MM-DD — краткий заголовок
- Задача Codex / цель:
- Модуль: SeatMatch | SeatCompare | HonestView | SpatialSound
- Статус: todo | in_progress | done | blocked
- Изменено: файлы
- Проверено:
- Блокеры / вопросы:
```

## Записи

Контракт **утверждён v1** (`docs/INTEGRATION_CONTRACT.md`). Каркас ядра на `feat/cursor-core` / `feat/cline-experience`.  
Можно начинать SeatMatch в `src/experience/seatMatch/`. Записи модуля — ниже по мере работы.

### 2026-11-07 — SeatMatch: рекомендация лучших свободных мест

- Задача Codex / цель: P1-модуль SeatMatch — рекомендация свободных мест по цене, расположению и качеству обзора.
- Модуль: SeatMatch
- Статус: done
- Изменено:
  - `src/experience/seatMatch/seatMatchEngine.ts` — чистая логика подбора: `seatAngleDeg`, `viewQuality`, `centrality`, `recommendSeats`, профили весов, метки причин.
  - `src/experience/seatMatch/SeatMatch.tsx` — UI подбора: 3 профиля (Баланс / Лучший обзор / Дешевле), карточки рекомендаций с баллами, ценой, тегами причин и кнопкой «Выбрать».
  - `src/experience/seatMatch/seatMatch.css` — оформление на переменных ядра (`--bg-elev`, `--line`, `--accent`, `--vip`/`--comfort`/`--standard`), адаптив до 640 px.
  - `src/experience/seatMatch/index.ts` — barrel-экспорт модуля.
  - `src/experience/seatMatch/seatMatch.test.mjs` — 12 тестов на встроенном `node:test`.
- Проверено:
  - `node --experimental-strip-types --test src/experience/seatMatch/seatMatch.test.mjs` → 12/12 passed, 0 failed (151 ms).
  - `npm run build` (`tsc --noEmit && vite build`) → exit 0, dist 312.63 kB.
  - `npm ci` → 133 пакета, exit 0.
  - Покрытие тестами: исключение занятых мест, пустой результат при отсутствии свободных мест, угол обзора (центр = 0°), качество обзора (центр лучше края), центральность, расстояние до экрана (6.8 / 8.9 м), влияние цены на порядок, диапазон оценки 0…100, сортировка по убыванию, детерминированность, лимит, медиана цены, метки причин.
- Контракт:
  - Модуль не создаёт второй 3D-движок и не монтирует Canvas — только читает `getSeatsWithStatus`, `getHallGeometryForSession`, `getSeatCameraView`.
  - Своей модели `Seat` нет: используются `Seat`/`HallGeometry` из `@/types/hall` и `SeatWithStatus` из `@/core/hallApi`.
  - Статусы мест не мутируются, покупка не выполняется — только рекомендация.
  - `App.tsx`, `package.json`, `src/core/**`, `src/types/**`, 3D-рендерер не изменялись.
- Блокеры / вопросы:
  - Подключение к `App.tsx` не выполнялось (зона Cursor) — модуль экспортируется через `src/experience/seatMatch/index.ts` и подключается через `registerExperienceModule` при merge.
  - Скрипт `test` в `package.json` не добавлялся (файл в зоне Cursor) — запуск тестов: `node --experimental-strip-types --test src/experience/seatMatch/seatMatch.test.mjs`.

### 2026-11-07 — SeatMatch: редизайн UI в концепции «Cinematic Luxury»

- Задача Codex / цель: превратить SeatMatch в премиальный киноинтерфейс, сохранив функциональность и алгоритм.
- Модуль: SeatMatch
- Статус: done
- Изменено:
  - `src/experience/seatMatch/SeatMatch.tsx` — новая визуальная иерархия: eyebrow-заголовок, крупный display-заголовок, пояснение, блок показателей (свободно мест / цена от / зал), настоящий segmented control (`role="radiogroup"` + `role="radio"`, `aria-checked`, roving tabindex, стрелки/Home/End), карточки с «Ряд N · место M» вместо технического ID, человекочитаемым вердиктом качества обзора и шкалой, причинами-«пилюлями», кнопкой «Выбрать место»; пустые состояния переведены на `section` + `aria-live`.
  - `src/experience/seatMatch/seatMatch.css` — полная переработка оформления: золотистые радиальные/линейные градиенты, тонкие градиентные границы, мягкие световые акценты, ступенчатое появление карточек, hover/press/focus-visible, `prefers-reduced-motion`, адаптив 720 px и 380 px. Только переменные ядра (`--bg`, `--bg-elev`, `--ink`, `--muted`, `--accent`, `--accent-ink`, `--line`, `--vip`/`--comfort`/`--standard`, `--font-display`/`--font-body`), новых цветов нет.
  - `docs/CLINE_PROGRESS.md` — эта запись.
- Проверено:
  - `node --experimental-strip-types --test src/experience/seatMatch/seatMatch.test.mjs` → 12/12 passed, 0 failed, exit 0.
  - `npm run build` (`tsc --noEmit && vite build`) → exit 0, dist 312.63 kB.
  - Изоляция стилей: все селекторы в `seatMatch.css` имеют префикс `.seat-match` (плюс `@keyframes`/`@media`/`from`/`to`) — глобальных селекторов нет, другие части приложения не затрагиваются.
- Контракт:
  - `seatMatchEngine.ts` не изменялся — алгоритм рекомендации, профили весов и порядок вывода прежние.
  - `onPickSeat` и `revision` работают как раньше: `revision` остаётся в зависимостях `useMemo` для `getSeatsWithStatus`.
  - Данные читаются только через `getSeatsWithStatus` / `getHallGeometryForSession` / `getSeatCameraView`; статусы не мутируются, покупка не выполняется.
  - `src/core/**`, `src/data/**`, `src/types/**`, `src/components/SeatView3D.tsx`, `src/App.tsx`, `src/styles.css`, `package.json`, `docs/TASKS.md`, `docs/DECISIONS.md` не изменялись.
- Блокеры / вопросы:
  - Push не выполнялся — ждём разрешения пользователя.

