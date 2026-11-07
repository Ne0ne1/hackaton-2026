# Контракт интеграции модулей

Статус: **утверждено (v1)** — 2026-11-07, Cursor на ветке `feat/cursor-core`.  
MiniMax следует этой версии и **не меняет** контракт самостоятельно.  
Breaking-изменения — только через `docs/DECISIONS.md` + обновление этого файла (Cursor).

Связанный протокол: `docs/TEAM_PROTOCOL.md`.

## 1. Цель

Дополнительные модули (SeatMatch, SeatCompare, HonestView, SpatialSound) читают данные зала и 3D-вид через ядро Cursor — **без** собственного 3D-движка и **без** второй модели данных.

## 2. Фактические пути

| Что | Путь |
|-----|------|
| Типы | `src/types/hall.ts` |
| Демо-геометрия зала | `src/data/demoHall.ts` |
| Контрактный API ядра | `src/core/hallApi.ts` |
| Хранение билетов | `src/core/ticketStore.ts` (внутренний; снаружи — `buySeat`) |
| 3D-вид ядра | `src/components/SeatView3D.tsx` |
| Схема мест | `src/components/SeatMap.tsx` |
| Зона модулей MiniMax | `src/experience/**` |

Импортировать из приложения так:

```ts
import type { Seat, HallGeometry, SeatCameraView } from '@/types/hall'
import {
  getHallGeometryForSession,
  getSeatsWithStatus,
  getSeat,
  getSeatCameraView,
  buySeat,
  registerExperienceModule,
  listExperienceModules,
} from '@/core/hallApi'
```

## 3. Сущности

### `Seat`

| Поле | Тип | Смысл |
|------|-----|--------|
| `id` | `string` | Уникальный id в зале, формат `R{row}-S{number}` |
| `row` | `number` | Ряд (1…) |
| `number` | `number` | Номер в ряду (1…) |
| `category` | `'standard' \| 'comfort' \| 'vip'` | Категория / цена |
| `price` | `number` | Цена в ₽ |
| `position` | `{ x, y, z }` | Положение глаз/камеры, метры |
| `lookAt?` | `{ x, y, z }` | Подсказка направления взгляда |

### `SeatWithStatus`

`Seat` + `status: 'free' | 'sold'`.

### `ScreenSpec` / `HallGeometry`

- `HallGeometry.screen`: `width`, `height`, `position`
- `HallGeometry.seats: Seat[]`
- `HallGeometry.speakers[]` — точки колонок для будущего SpatialSound
- `HallGeometry.id`, `name`, `rows`, `seatsPerRow`

### `SeatCameraView`

| Поле | Смысл |
|------|--------|
| `seatId` | id места |
| `position` | позиция камеры |
| `target` | точка взгляда (центр экрана) |
| `fov` | поле зрения |

### `Session` / `Cinema` / `Ticket`

См. `src/types/hall.ts`. Билет хранится в `localStorage` после `buySeat`.

## 4. Операции API (`src/core/hallApi.ts`)

| Функция | Назначение |
|---------|------------|
| `listCinemas()` | список кинотеатров |
| `listSessions(cinemaId?)` | сеансы |
| `getSession(sessionId)` | один сеанс |
| `getHallGeometry(hallId)` | геометрия зала |
| `getHallGeometryForSession(sessionId)` | геометрия по сеансу |
| `getSeatsWithStatus(sessionId)` | места с `free`/`sold` и ценами |
| `getSeat(sessionId, seatId)` | одно место |
| `getSeatCameraView(sessionId, seatId)` | 3D-вид / камера с места |
| `buySeat(sessionId, seatId)` | покупка; место становится `sold` |
| `registerExperienceModule(module)` | регистрация UI-модуля опыта |
| `listExperienceModules()` | список зарегистрированных модулей |

Покупку и запись статуса выполняет **только** ядро (`buySeat`). Модули MiniMax статусы не мутируют.

## 5. 3D

Единственный рендерер сцены зала — `SeatView3D` (+ Three / R3F в ядре).  
Модули могут:

- вызывать `getSeatCameraView` для сравнения/оценки;
- при интеграции монтироваться рядом через `registerExperienceModule`.

Модули **не** создают второй Canvas/движок для основного вида зала.

## 6. Зона MiniMax

Разрешённые пути для Cline: `src/experience/seatMatch/`, `src/experience/seatCompare/`, `src/experience/honestView/`, `src/experience/spatialSound/` (создавать по мере ТЗ).

Не трогать без согласования: `src/core/**`, `src/data/**`, `src/types/hall.ts`, `src/components/SeatView3D.tsx`, `package.json`, корневые маршруты/`App.tsx` (подключение модулей в `App` делает Cursor при merge).

## 7. Чеклист перед интеграцией модуля

- [x] Cursor подтвердил фактический интерфейс (этот файл, статус утверждено).
- [ ] Модуль не создаёт второй 3D-движок.
- [ ] Модуль не вводит свою модель Seat.
- [ ] Модуль читает статусы только через `getSeatsWithStatus` / `getSeat`.
- [ ] Есть запись в `docs/CLINE_PROGRESS.md`.
- [ ] Cursor перенёс итог в `docs/TASKS.md` после merge.
