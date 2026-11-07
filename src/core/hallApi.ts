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

/** Камера с высоты глаз на кресле, смотрит в центр экрана. */
export function getSeatCameraView(
  sessionId: string,
  seatId: string,
): SeatCameraView | undefined {
  const hall = getHallGeometryForSession(sessionId)
  const seat = hall?.seats.find((s) => s.id === seatId)
  if (!hall || !seat) return undefined

  return {
    seatId,
    position: { ...seat.position },
    target: {
      x: hall.screen.position.x,
      y: hall.screen.position.y,
      z: hall.screen.position.z,
    },
    fov: 55,
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
