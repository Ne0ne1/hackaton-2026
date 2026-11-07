# Контракт интеграции модулей

Статус: **утверждено (v1)** — 2026-11-07; уточнение владения 3D — 2026-11-07 (передача сцены MiniMax).  
MiniMax **не меняет** контракт данных самостоятельно. Breaking-изменения API — только Cursor через `docs/DECISIONS.md` + этот файл.

Связанный протокол: `docs/TEAM_PROTOCOL.md` (новые правила **заменяют** старое «3D = Cursor»).

## 1. Цель

- Cursor даёт **источник истины** по залу, местам, статусам и параметрам камеры.
- MiniMax реализует **единственную** визуальную 3D-сцену и модули опыта.
- Без второй модели Seat и без второго независимого движка/Canvas основного вида.

## 2. Фактические пути

| Что | Путь | Владелец |
|-----|------|----------|
| Типы | `src/types/hall.ts` | Cursor |
| Демо-геометрия (данные) | `src/data/demoHall.ts` | Cursor |
| API ядра | `src/core/hallApi.ts` | Cursor |
| Билеты | `src/core/ticketStore.ts` | Cursor |
| 2D-схема | `src/components/SeatMap.tsx` | Cursor |
| 3D-сцена | `src/components/SeatView3D.tsx` (+ CSS / `src/scene/**`) | **MiniMax** |
| Модули опыта | `src/experience/**` | **MiniMax** |
| Сборка UI | `src/App.tsx` | Cursor (только wiring) |

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

## 3. Сущности (без изменений v1)

`Seat`, `SeatWithStatus`, `ScreenSpec`, `HallGeometry`, `SeatCameraView`, `Session`, `Cinema`, `Ticket` — см. `src/types/hall.ts`.

## 4. Операции API (`src/core/hallApi.ts`)

Без изменений по смыслу v1: `listCinemas`, `listSessions`, `getSession`, `getHallGeometry`, `getHallGeometryForSession`, `getSeatsWithStatus`, `getSeat`, `getSeatCameraView`, `buySeat`, `registerExperienceModule`, `listExperienceModules`.

Покупку и статусы мутирует только ядро (`buySeat`).

## 5. Контракт компонента 3D

MiniMax владеет реализацией. **Внешние props сохраняются:**

```ts
type SeatView3DProps = {
  hall: HallGeometry
  cameraView: SeatCameraView | null
  occupiedSeatIds: string[]
}
```

- Камера следует `cameraView` (позиция / target / fov из Cursor).
- Занятые места читаются из `occupiedSeatIds` + данные `hall.seats`.
- Если нужны новые поля API — MiniMax описывает запрос; Cursor согласованно расширяет контракт.

Запрещено: второй Canvas основного вида; локальная копия координат кресел «мимо» `hall`.

## 6. Зона MiniMax

Разрешено: `SeatView3D`, стили 3D, `src/scene/**`, `src/experience/seatMatch|seatCompare|honestView|spatialSound/**`, `docs/CLINE_PROGRESS.md`.

Не трогать без согласования: `src/core/**`, `src/data/**`, `src/types/hall.ts`, `SeatMap.tsx`, `package.json`, логику покупки; `App.tsx` — только через Cursor при интеграции.

## 7. Чеклист интеграции

- [x] Контракт данных v1 утверждён.
- [x] Владелец 3D — MiniMax; Cursor не правит сцену.
- [ ] Один 3D-рендерер, props сохранены.
- [ ] Нет своей модели Seat.
- [ ] Статусы только через ядро.
- [ ] Запись в `docs/CLINE_PROGRESS.md`.
- [ ] Cursor перенёс итог в `docs/TASKS.md` после merge.
