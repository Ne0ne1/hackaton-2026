/**
 * Геометрия кинозала, вычисленная из `HallGeometry`.
 *
 * ВАЖНО: `Seat.position` — это положение глаз зрителя (y = 1.15 в демо-зале),
 * а не основание кресла. Основание выводим из данных зала: минимальная высота
 * глаз минус «рост сидящего» — получаем уровень пола.
 *
 * Никаких отдельных массивов координат: всё считается из `hall`.
 */
import type { HallGeometry, Seat, Vec3 } from '@/types/hall'

/** Высота сидящего человека над полом (глаза — верхушка головы). */
export const SEATED_EYE_HEIGHT = 1.15

/** Глубина кресла (вдоль Z). */
export const SEAT_DEPTH = 0.82

/** Ширина кресла. */
export const SEAT_WIDTH = 0.56

/** Ширина прохода между блоками кресел, м. */
export const AISLE_WIDTH = 1.15

/** Высота потолка над полом, м. */
export const CEILING_HEIGHT = 3.4

export type HallMetrics = {
  /** Уровень пола (в демо-зале 0). */
  floorY: number
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  /** Отступ от крайних кресел до стен. */
  wallMarginX: number
  /** Глубина зала от задней стены до передней. */
  depth: number
  /** Ширина зала. */
  width: number
  /** Позиция передней стены (за экраном). */
  frontWallZ: number
  /** Позиция задней стены. */
  backWallZ: number
  /** Центр экрана. */
  screenCenter: Vec3
  /** Позиции проходов по X. */
  aisleXs: number[]
  /** Радиус прохода в плане (половина ширины). */
  aisleRadius: number
}

export type SeatPlacement = {
  seat: Seat
  /** Мировая позиция основания кресла (центр сиденья на полу). */
  base: Vec3
  /** Поворот кресла: лицом к экрану, с небольшим разворотом к центру. */
  rotationY: number
  category: Seat['category']
  /** Приподнятость ряда над базовым полом (ступени). */
  riserHeight: number
}

/**
 * Считает метрики зала: границы, пол, проходы.
 * Всё выводится из `hall.seats` и `hall.screen` — никаких магических координат.
 */
export function computeHallMetrics(hall: HallGeometry): HallMetrics {
  const seats = hall.seats
  const screen = hall.screen

  let minEyeY = Infinity
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity

  for (const seat of seats) {
    minEyeY = Math.min(minEyeY, seat.position.y)
    minX = Math.min(minX, seat.position.x)
    maxX = Math.max(maxX, seat.position.x)
    minZ = Math.min(minZ, seat.position.z)
    maxZ = Math.max(maxZ, seat.position.z)
  }

  if (!Number.isFinite(minEyeY)) {
    // Пустой зал — безопасные значения по экрану.
    return {
      floorY: screen.position.y - 2.4,
      minX: screen.position.x - screen.width / 2,
      maxX: screen.position.x + screen.width / 2,
      minZ: screen.position.z,
      maxZ: screen.position.z + 10,
      wallMarginX: 1.5,
      depth: 10,
      width: screen.width + 3,
      frontWallZ: screen.position.z - 0.55,
      backWallZ: screen.position.z + 10,
      screenCenter: { ...screen.position },
      aisleXs: [],
      aisleRadius: AISLE_WIDTH / 2,
    }
  }

  // Пол: уровень глаз минус рост сидящего.
  const floorY = minEyeY - SEATED_EYE_HEIGHT
  const seatHalfWidth = SEAT_WIDTH / 2
  const wallMarginX = 1.5
  const frontWallZ = screen.position.z - 0.55
  const backWallZ = maxZ + 2.6

  // Проходы: внутренние (между блоками кресел) + боковые (вдоль стен).
  const innerAisles = computeAisleXs(seats)
  const sideAisles = computeSideAisleXs({
    minX: minX - seatHalfWidth,
    maxX: maxX + seatHalfWidth,
  })
  const aisleXs = [...new Set([...sideAisles, ...innerAisles])].sort(
    (a, b) => a - b,
  )

  return {
    floorY,
    minX: minX - seatHalfWidth,
    maxX: maxX + seatHalfWidth,
    minZ,
    maxZ,
    wallMarginX,
    depth: backWallZ - frontWallZ,
    width: maxX - minX + seatHalfWidth * 2 + wallMarginX * 2,
    frontWallZ,
    backWallZ,
    screenCenter: { ...screen.position },
    aisleXs,
    aisleRadius: AISLE_WIDTH / 2,
  }
}

/**
 * Находит X-координаты проходов: промежутки между соседними местами,
 * которые шире обычного шага между креслами.
 */
function computeAisleXs(seats: Seat[]): number[] {
  if (seats.length === 0) return []

  const byRow = new Map<number, Seat[]>()
  for (const seat of seats) {
    const row = byRow.get(seat.row)
    if (row) row.push(seat)
    else byRow.set(seat.row, [seat])
  }

  // Медианный шаг между соседними креслами — это «обычный» шаг.
  const gaps: number[] = []
  for (const rowSeats of byRow.values()) {
    rowSeats.sort((a, b) => a.position.x - b.position.x)
    for (let i = 1; i < rowSeats.length; i += 1) {
      gaps.push(rowSeats[i].position.x - rowSeats[i - 1].position.x)
    }
  }
  if (gaps.length === 0) return []

  gaps.sort((a, b) => a - b)
  const medianGap = gaps[Math.floor(gaps.length / 2)]
  const seatGap = medianGap - SEAT_WIDTH
  const aisleThreshold = seatGap + AISLE_WIDTH * 0.55

  const result = new Set<number>()
  for (const rowSeats of byRow.values()) {
    rowSeats.sort((a, b) => a.position.x - b.position.x)
    for (let i = 1; i < rowSeats.length; i += 1) {
      const gap = rowSeats[i].position.x - rowSeats[i - 1].position.x
      if (gap >= aisleThreshold) {
        const center = (rowSeats[i].position.x + rowSeats[i - 1].position.x) / 2
        result.add(Number(center.toFixed(3)))
      }
    }
  }

  return [...result].sort((a, b) => a - b)
}

/**
 * Боковые проходы: пространство между крайними креслами и стенами зала.
 * В реальном кинозале проходы идут вдоль стен по обе стороны от кресел —
 * даже если места в ряду идут подряд.
 */
export function computeSideAisleXs(
  metrics: Pick<HallMetrics, 'minX' | 'maxX'>,
): number[] {
  const half = AISLE_WIDTH / 2
  const left = metrics.minX - half * 0.6
  const right = metrics.maxX + half * 0.6
  return [Number(left.toFixed(3)), Number(right.toFixed(3))]
}

/**
 * Расставляет кресла: основание на полу, лёгкий разворот к центру зала.
 */
export function computeSeatPlacements(
  hall: HallGeometry,
  metrics: HallMetrics,
): SeatPlacement[] {
  return hall.seats.map((seat) => {
    const baseY = seat.position.y - SEATED_EYE_HEIGHT
    const dx = metrics.screenCenter.x - seat.position.x
    const dz = metrics.screenCenter.z - seat.position.z
    const rotationY = Math.atan2(dx, -dz) * 0.12

    return {
      seat,
      base: { x: seat.position.x, y: baseY, z: seat.position.z },
      rotationY,
      category: seat.category,
      riserHeight: baseY - metrics.floorY,
    }
  })
}
