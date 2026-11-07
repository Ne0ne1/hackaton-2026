/**
 * SeatMatch — рекомендация лучших свободных мест.
 *
 * Модуль работает только с утверждённым контрактом ядра (`@/core/hallApi`)
 * и типами (`@/types/hall`). Собственного 3D-движка и своей модели Seat нет.
 */
import type { HallGeometry, Seat } from '@/types/hall'
import type { SeatWithStatus } from '@/core/hallApi'

/** Профиль предпочтений пользователя. */
export type SeatMatchProfile = {
  /** Насколько важна цена: 0 — не важна, 1 — максимально важна. */
  priceWeight: number
  /** Насколько важен качественный обзор экрана: 0…1. */
  viewWeight: number
  /** Насколько важно положение относительно центра зала: 0…1. */
  centerWeight: number
}

export const DEFAULT_PROFILE: SeatMatchProfile = {
  priceWeight: 0.5,
  viewWeight: 1,
  centerWeight: 0.6,
}

export type SeatMatchReason =
  | 'center'
  | 'wide-screen'
  | 'close'
  | 'row'
  | 'price'
  | 'category'

export type SeatRecommendation = {
  seat: SeatWithStatus
  /** Итоговая оценка 0…100. */
  score: number
  /** Оценка качества обзора 0…1. */
  viewScore: number
  /** Оценка центральности 0…1. */
  centerScore: number
  /** Угловое отклонение от центра зала, градусы. */
  angleDeg: number
  /** Расстояние до экрана, метры. */
  distance: number
  reasons: SeatMatchReason[]
}

export type SeatMatchOptions = {
  profile?: SeatMatchProfile
  /** Сколько мест вернуть. */
  limit?: number
}

export type SeatMatchResult = {
  recommendations: SeatRecommendation[]
  /** Свободных мест всего в зале. */
  freeCount: number
  /** Рекомендованная цена (медиана лучших мест). */
  medianPrice: number
}

const CATEGORY_LABEL: Record<Seat['category'], string> = {
  standard: 'Стандарт',
  comfort: 'Комфорт',
  vip: 'VIP',
}

export function categoryLabel(category: Seat['category']): string {
  return CATEGORY_LABEL[category]
}

/** Горизонтальное смещение относительно центра зала и глубина до экрана. */
function offsets(seat: Seat, hall: HallGeometry) {
  const screen = hall.screen.position
  const dx = seat.position.x - screen.x
  const dz = seat.position.z - screen.z
  return { dx, dz, distance: Math.hypot(dx, dz) }
}

/**
 * Угол отклонения от нормали к экрану. 0° — ровно по центру,
 * больше 60° — сильно сбоку, обзор экрана под вопросом.
 */
export function seatAngleDeg(seat: Seat, hall: HallGeometry): number {
  const { dx, dz } = offsets(seat, hall)
  if (dx === 0) return 0
  return (Math.atan2(Math.abs(dx), Math.abs(dz)) * 180) / Math.PI
}

/**
 * Качество обзора 0…1: учитывает угол бокового отклонения и расстояние.
 * Слишком близко к экрану — тоже плохо, поэтому близость оценивается отдельно.
 */
export function viewQuality(seat: Seat, hall: HallGeometry): number {
  const angle = seatAngleDeg(seat, hall)
  const { distance } = offsets(seat, hall)

  // Угол: 0° → 1.0, 60° → 0.0.
  const angleScore = Math.max(0, 1 - angle / 60)

  // Расстояние: комфортное окно примерно 7…18 м, дальше — чуть хуже.
  const ideal = 12
  const distanceScore = Math.max(0, 1 - Math.abs(distance - ideal) / ideal)

  return clamp01(angleScore * 0.65 + distanceScore * 0.35)
}

/** Центральность 0…1: насколько место близко к оси зала (по X). */
export function centrality(seat: Seat, hall: HallGeometry): number {
  const halfWidth = ((hall.seatsPerRow - 1) * 0.9) / 2
  if (halfWidth <= 0) return 1
  const ratio = Math.abs(seat.position.x) / halfWidth
  return clamp01(1 - ratio)
}

/** Нормализованная цена 0…1 в пределах зала: дешёвая → 0, дорогая → 1. */
function priceNorm(seat: Seat, prices: number[]): number {
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (max === min) return 0
  return (seat.price - min) / (max - min)
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0
  return Math.min(1, Math.max(0, v))
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}
/**
 * Главная функция модуля: ранжирует свободные места по «лучшему балансу»
 * цены, обзора и центральности.
 */
export function recommendSeats(
  seats: SeatWithStatus[],
  hall: HallGeometry,
  options: SeatMatchOptions = {},
): SeatMatchResult {
  const profile = options.profile ?? DEFAULT_PROFILE
  const limit = options.limit ?? 3
  const free = seats.filter((s) => s.status === 'free')

  if (free.length === 0) {
    return { recommendations: [], freeCount: 0, medianPrice: 0 }
  }

  const prices = seats.map((s) => s.price)

  const scored: SeatRecommendation[] = free.map((seat) => {
    const viewScore = viewQuality(seat, hall)
    const centerScore = centrality(seat, hall)
    const cheap = 1 - priceNorm(seat, prices)
    const angle = seatAngleDeg(seat, hall)
    const { distance } = offsets(seat, hall)

    const weightSum = profile.priceWeight + profile.viewWeight + profile.centerWeight
    const weighted =
      (cheap * profile.priceWeight +
        viewScore * profile.viewWeight +
        centerScore * profile.centerWeight) /
      (weightSum || 1)

    const reasons: SeatMatchReason[] = []
    if (centerScore >= 0.75) reasons.push('center')
    if (viewScore >= 0.8) reasons.push('wide-screen')
    if (distance <= 8) reasons.push('close')
    if (seat.row <= 2) reasons.push('row')
    if (cheap >= 0.99) reasons.push('price')
    if (seat.category === 'vip' || seat.category === 'comfort') reasons.push('category')

    return {
      seat,
      score: Math.round(clamp01(weighted) * 100),
      viewScore,
      centerScore,
      angleDeg: Math.round(angle),
      distance: Math.round(distance * 10) / 10,
      reasons,
    }
  })

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (a.seat.price !== b.seat.price) return a.seat.price - b.seat.price
    return a.seat.id.localeCompare(b.seat.id)
  })

  const top = scored.slice(0, limit)
  return {
    recommendations: top,
    freeCount: free.length,
    medianPrice: median(top.map((r) => r.seat.price)),
  }
}

export const REASON_LABEL: Record<SeatMatchReason, string> = {
  center: 'по центру зала',
  'wide-screen': 'широкий обзор экрана',
  close: 'близко к экрану',
  row: 'первые ряды',
  price: 'выгодная цена',
  category: 'повышенная категория',
}

export function formatReason(reason: SeatMatchReason): string {
  return REASON_LABEL[reason]
}
