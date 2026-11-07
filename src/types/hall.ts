/** Категория места — влияет на цену и цвет на схеме. */
export type SeatCategory = 'standard' | 'comfort' | 'vip'

/** Статус места в рамках конкретного сеанса. */
export type SeatStatus = 'free' | 'sold'

/** Координаты кресла в метрах, начало координат — центр зала на полу. */
export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface Seat {
  /** Уникальный id в рамках зала: `R{row}-S{number}` */
  id: string
  row: number
  number: number
  category: SeatCategory
  /** Базовая цена в рублях до применения правил сеанса. */
  price: number
  /** Положение глаз/камеры зрителя на этом месте. */
  position: Vec3
  /** Направление взгляда на экран (нормализованный вектор, опционально). */
  lookAt?: Vec3
}

export interface ScreenSpec {
  width: number
  height: number
  /** Центр экрана в пространстве зала. */
  position: Vec3
}

export interface SpeakerSpec {
  id: string
  position: Vec3
}

export interface HallGeometry {
  id: string
  name: string
  rows: number
  seatsPerRow: number
  screen: ScreenSpec
  seats: Seat[]
  /** Точки колонок — для будущего SpatialSound. */
  speakers: SpeakerSpec[]
}

export interface Cinema {
  id: string
  name: string
  hallId: string
}

export interface Session {
  id: string
  cinemaId: string
  hallId: string
  movieTitle: string
  startsAt: string
}

export interface Ticket {
  id: string
  sessionId: string
  seatId: string
  price: number
  purchasedAt: string
}

/** Параметры камеры для 3D-вида с выбранного места. */
export interface SeatCameraView {
  seatId: string
  position: Vec3
  target: Vec3
  fov: number
}
