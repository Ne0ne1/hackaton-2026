# Промпт для продолжения работы (GPT Sol / новый агент)

Скопируй блок ниже целиком в новый чат.

---

```text
Ты продолжаешь хакатонный проект «Билет с видом на экран» (Код Единства 2026).

## Репозиторий
- GitHub: https://github.com/Ne0ne1/hackaton-2026
- Рабочая ветка с актуальной переработкой: `feature/3d-cinema-trailers`
- Коммит handoff: `71117fb` (feat(ui): тёмный билетный зал, осмотр головой и зрители в 3D)
- Локальный путь у владельца (если есть): `/Users/isadadasev/Documents/ChatGPT/чгу проекты/hackaton-2026`
- Не путай с копией на Desktop — источник истины после пуша: GitHub ветка `feature/3d-cinema-trailers`.

## Старт с нуля
1. `git clone https://github.com/Ne0ne1/hackaton-2026.git`
2. `cd hackaton-2026 && git checkout feature/3d-cinema-trailers && git pull`
3. `npm ci` (или `npm install`)
4. `npm run dev -- --host 127.0.0.1 --port 5174`
5. Открой http://127.0.0.1:5174/
6. Прочитай обязательно:
   - `AGENTS.md`
   - `docs/TEAM_PROTOCOL.md`
   - `docs/INTEGRATION_CONTRACT.md`
   - `docs/TASKS.md`
   - `docs/DECISIONS.md`
   - этот файл `docs/HANDOFF_PROMPT.md`

## Продукт (обязательный сценарий)
Кинотеатр → сеанс → место → «Сесть и посмотреть» → вид из кресла в 3D → покупка → место sold.
После reload билет сохраняется (localStorage). Места независимы между сеансами.
Схема, 3D и цены — одни данные (`hallApi` / `demoHall`).
SeatView3D контракт props: `hall`, `cameraView`, `occupiedSeatIds`. Один Canvas, без второго 3D-движка.

## Дизайн-референс
PDF: `/Users/isadadasev/Library/Containers/ru.keepcoder.Telegram/Data/tmp/Вариант_1_тёмный_зал.pdf`
(если файла нет — ориентир: почти чёрный фон, молочный текст, акцент `#ff4d2e`, билетная эстетика, контурная схема мест, без шаблонного «AI purple/dashboard» UI).

## Что уже сделано (T-011)
- Тёмный билетный UI: `App.tsx`, `SeatMap.tsx`, `styles.css`
- 10 рядов; цены 350 / 550 / 900; VIP-диваны в последнем ряду
- 3D зал: `HallArchitecture`, `CinemaSeat`, `ScreenPanel`, `SeatCameraRig`
- С места: медленный поворот «головой» (узкий yaw/pitch + damping), не orbit вокруг зала
- Силуэты сидящих зрителей в креслах
- Трейлеры: один активный; пауза при уходе из 3D
- Проверки на момент handoff: `npm run build` OK; `node --experimental-strip-types --test` — 14/14
- Playwright-скрипт: `scripts/e2e-check.mjs` (нужен playwright)

## Что доработать дальше (приоритет)
1. Визуал 3D до уровня жюри: кресла ещё больше похожи на кресла; экран стабильно яркий; перспектива спереди/сзади/сбоку заметно разная; люди-силуэты читаются как на слайде презентации.
2. Полный ручной/Playwright прогон всех кнопок: два сеанса, лучший вид, Схема/3D, возврат, 4 стрелки пересадки, покупка, «Мои билеты», reload, независимость сеансов.
3. Трейлеры: play/pause/resume/restart/mute/смена фильма; одно видео; стоп при выходе из 3D.
4. Desktop 1440 и mobile 390 — без поломок вёрстки.
5. Не ломай контракт `SeatView3D` и единый источник данных мест.

## Правила работы
- Ответы на русском.
- Перед правками читай TASKS/DECISIONS/TEAM_PROTOCOL; блокировки в `docs/TASKS.md`.
- Не force push, не `reset --hard`, не пушь в `main` без явной команды пользователя.
- Не коммить и не пушь без явной просьбы пользователя (если не сказано иначе).
- Не вызывай платные внешние API без подтверждения.
- Зона MiniMax по протоколу: `SeatView3D` / `src/scene/**` / `src/experience/**` — но текущая ветка уже содержит согласованную переработку 3D пользователем; продолжай полировать продукт end-to-end, не откатывай UI к старому «зелёному cinematic» виду.
- Неиспользуемый черновик `src/scene/SceneAtmosphere.tsx` мог остаться локально незакоммиченным — не обязателен.

## Команды проверки
```bash
npm run build
node --experimental-strip-types --test src/experience/seatMatch/seatMatch.test.mjs src/scene/cinema/trailerStore.test.mjs src/scene/cinema/spatialAudio.test.mjs
# опционально:
# npx playwright install chromium && node scripts/e2e-check.mjs
```

## Критерий готовности для жюри
Стабильный end-to-end: выбор → вид из кресла с естественным осмотром → покупка → sold после reload; красивый тёмный билетный UI; заметная смена перспективы по местам; без падений на demo.
```
