import type { Ticket } from '@/types/hall'

const STORAGE_KEY = 'kod-edinstva.tickets.v1'

function readAll(): Ticket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Ticket[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(tickets: Ticket[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
}

export function listTickets(): Ticket[] {
  return readAll()
}

export function listSoldSeatIds(sessionId: string): string[] {
  return readAll()
    .filter((t) => t.sessionId === sessionId)
    .map((t) => t.seatId)
}

export function purchaseSeat(input: {
  sessionId: string
  seatId: string
  price: number
}): Ticket {
  const tickets = readAll()
  const already = tickets.find(
    (t) => t.sessionId === input.sessionId && t.seatId === input.seatId,
  )
  if (already) {
    throw new Error(`Место ${input.seatId} уже куплено на этот сеанс`)
  }

  const ticket: Ticket = {
    id: `tkt-${input.sessionId}-${input.seatId}-${Date.now()}`,
    sessionId: input.sessionId,
    seatId: input.seatId,
    price: input.price,
    purchasedAt: new Date().toISOString(),
  }
  tickets.push(ticket)
  writeAll(tickets)
  return ticket
}
