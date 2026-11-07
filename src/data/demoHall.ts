import type { Cinema, HallGeometry, Seat, SeatCategory, Session } from '@/types/hall'

const PRICE: Record<SeatCategory, number> = {
  standard: 350,
  comfort: 480,
  vip: 650,
}

function categoryForRow(row: number, totalRows: number): SeatCategory {
  if (row <= 2) return 'vip'
  if (row <= Math.ceil(totalRows * 0.55)) return 'comfort'
  return 'standard'
}

/** Строит прямоугольный зал: ряды вдоль Z, места вдоль X, экран впереди (z отрицательный). */
export function buildRectangularHall(options: {
  id: string
  name: string
  rows: number
  seatsPerRow: number
  rowSpacing?: number
  seatSpacing?: number
  firstRowZ?: number
}): HallGeometry {
  const rowSpacing = options.rowSpacing ?? 1.05
  const seatSpacing = options.seatSpacing ?? 0.9
  const firstRowZ = options.firstRowZ ?? -4.2
  const seats: Seat[] = []

  for (let row = 1; row <= options.rows; row += 1) {
    const category = categoryForRow(row, options.rows)
    const z = firstRowZ + (row - 1) * rowSpacing
    const rowWidth = (options.seatsPerRow - 1) * seatSpacing
    for (let number = 1; number <= options.seatsPerRow; number += 1) {
      const x = -rowWidth / 2 + (number - 1) * seatSpacing
      const y = 1.15
      seats.push({
        id: `R${row}-S${number}`,
        row,
        number,
        category,
        price: PRICE[category],
        position: { x, y, z },
        lookAt: { x: 0, y: 1.6, z: -11 },
      })
    }
  }

  return {
    id: options.id,
    name: options.name,
    rows: options.rows,
    seatsPerRow: options.seatsPerRow,
    screen: {
      width: 10,
      height: 4.2,
      position: { x: 0, y: 2.4, z: -11 },
    },
    seats,
    speakers: [
      { id: 'sp-left', position: { x: -5.5, y: 2.2, z: -10 } },
      { id: 'sp-right', position: { x: 5.5, y: 2.2, z: -10 } },
      { id: 'sp-rear-left', position: { x: -4, y: 2.0, z: 3 } },
      { id: 'sp-rear-right', position: { x: 4, y: 2.0, z: 3 } },
    ],
  }
}

export const DEMO_HALL = buildRectangularHall({
  id: 'hall-aurora-1',
  name: 'Зал 1 «Аврора»',
  rows: 8,
  seatsPerRow: 12,
})

export const DEMO_CINEMAS: Cinema[] = [
  { id: 'cinema-aurora', name: 'Кинотеатр «Аврора»', hallId: DEMO_HALL.id },
]

export const DEMO_SESSIONS: Session[] = [
  {
    id: 'session-aurora-evening',
    cinemaId: 'cinema-aurora',
    hallId: DEMO_HALL.id,
    movieTitle: 'Северный свет',
    startsAt: '2026-11-07T19:30:00+03:00',
  },
  {
    id: 'session-aurora-late',
    cinemaId: 'cinema-aurora',
    hallId: DEMO_HALL.id,
    movieTitle: 'Северный свет',
    startsAt: '2026-11-07T22:00:00+03:00',
  },
]
