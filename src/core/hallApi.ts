/**
 * Утверждённый контракт ядра для модулей опыта (SeatMatch и др.).
 * MiniMax импортирует только отсюда и из `@/types/hall` — без своего 3D-движка.
 */
import { DEMO_CINEMAS, DEMO_HALL, DEMO_SESSIONS } from '@/data/demoHall'
import { listSoldSeatIds, purchaseSeat } from '@/core/ticketStore'
import type {
  Cinema,
  HallGeometry,
  Seat,
  SeatCameraView,
  SeatStatus,
  Session,
  Ticket,
} from '@/types/hall'

export type SeatWithStatus = Seat & { status: SeatStatus }

const hallsById: Record<string, HallGeometry> = {
  [DEMO_HALL.id]: DEMO_HALL,
}

export function listCinemas(): Cinema[] {
  return DEMO_CINEMAS
}

export function listSessions(cinemaId?: string): Session[] {
  return cinemaId
    ? DEMO_SESSIONS.filter((s) => s.cinemaId === cinemaId)
    : DEMO_SESSIONS
}

export function getSession(sessionId: string): Session | undefined {
  return DEMO_SESSIONS.find((s) => s.id === sessionId)
}

export function getHallGeometry(hallId: string): HallGeometry | undefined {
  return hallsById[hallId]
}

export function getHallGeometryForSession(sessionId: string): HallGeometry | undefined {
  const session = getSession(sessionId)
  if (!session) return undefined
  return getHallGeometry(session.hallId)
}

export function getSeatsWithStatus(sessionId: string): SeatWithStatus[] {
  const hall = getHallGeometryForSession(sessionId)
  if (!hall) return []
  const sold = new Set(listSoldSeatIds(sessionId))
  return hall.seats.map((seat) => ({
    ...seat,
    status: sold.has(seat.id) ? 'sold' : 'free',
  }))
}

export function getSeat(sessionId: string, seatId: string): SeatWithStatus | undefined {
  return getSeatsWithStatus(sessionId).find((s) => s.id === seatId)
}

/**
 * Камера с высоты глаз на кресле.
 * FOV и лёгкий сдвиг цели зависят от ряда и бокового смещения —
 * спереди экран крупный и «в лоб», сзади мельче, сбоку — заметный угол.
 */
export function getSeatCameraView(
  sessionId: string,
  seatId: string,
): SeatCameraView | undefined {
  const hall = getHallGeometryForSession(sessionId)
  const seat = hall?.seats.find((s) => s.id === seatId)
  if (!hall || !seat) return undefined

  const screen = hall.screen
  const dx = seat.position.x - screen.position.x
  const dz = seat.position.z - screen.position.z
  const dist = Math.hypot(dx, dz)
  const near = 5.2
  const far = 15.5
  const depthT = Math.min(1, Math.max(0, (dist - near) / (far - near)))
  const sideT = Math.min(1, Math.abs(dx) / Math.max(screen.width * 0.42, 1))

  // Спереди экран крупный и «ломает» кадр; сзади — мельче; сбоку шире угол.
  const fov = 78 - depthT * 28 + sideT * 6

  // С первого ряда смотрим вверх; с последнего — чуть ниже центра экрана.
  const targetY = screen.position.y + (0.75 - depthT * 1.15)

  return {
    seatId,
    position: {
      x: seat.position.x,
      y: seat.position.y + 0.02,
      z: seat.position.z,
    },
    target: {
      x: screen.position.x,
      y: targetY,
      z: screen.position.z,
    },
    fov,
  }
}

export function buySeat(sessionId: string, seatId: string): Ticket {
  const seat = getSeat(sessionId, seatId)
  if (!seat) throw new Error(`Место ${seatId} не найдено`)
  if (seat.status === 'sold') throw new Error(`Место ${seatId} уже занято`)
  return purchaseSeat({ sessionId, seatId, price: seat.price })
}

/** Точка расширения UI для модулей MiniMax — пока регистрация в памяти. */
export type ExperienceModule = {
  id: 'seat-match' | 'seat-compare' | 'honest-view' | 'spatial-sound'
  title: string
  /** React-компонент или фабрика — тип ослаблен до unknown до интеграции. */
  render?: unknown
}

const experienceModules: ExperienceModule[] = []

export function registerExperienceModule(module: ExperienceModule): void {
  const idx = experienceModules.findIndex((m) => m.id === module.id)
  if (idx >= 0) experienceModules[idx] = module
  else experienceModules.push(module)
}

export function listExperienceModules(): ExperienceModule[] {
  return [...experienceModules]
}
