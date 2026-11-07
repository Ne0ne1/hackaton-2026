import type { SeatWithStatus } from '@/core/hallApi'

type Props = {
  seats: SeatWithStatus[]
  selectedSeatId: string | null
  onSelect: (seatId: string) => void
}

const CATEGORY_LABEL: Record<string, string> = {
  standard: 'Стандарт',
  comfort: 'Комфорт',
  vip: 'VIP',
}

export function SeatMap({ seats, selectedSeatId, onSelect }: Props) {
  const rows = [...new Set(seats.map((s) => s.row))].sort((a, b) => a - b)
  const seatsPerRow = Math.max(...seats.map((s) => s.number), 0)
  const aisleAfter = Math.floor(seatsPerRow / 2)

  return (
    <div className="seat-map" aria-label="Схема зала">
      <div className="screen-label" aria-hidden>
        <span className="screen-label__glow" />
        <span className="screen-label__text">Экран</span>
      </div>

      <div className="seat-map__rows">
        {rows.map((row) => {
          const rowSeats = seats
            .filter((s) => s.row === row)
            .sort((a, b) => a.number - b.number)

          return (
            <div className="seat-row" key={row}>
              <span className="row-label">{row}</span>
              <div className="seat-row-seats">
                {rowSeats.map((seat) => {
                  const selected = seat.id === selectedSeatId
                  const sold = seat.status === 'sold'
                  const aisleGap = seat.number === aisleAfter
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      className={[
                        'seat',
                        `seat--${seat.category}`,
                        sold ? 'seat--sold' : '',
                        selected ? 'seat--selected' : '',
                        aisleGap ? 'seat--before-aisle' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      disabled={sold}
                      title={`${CATEGORY_LABEL[seat.category]} · ${seat.price} ₽`}
                      aria-label={`Ряд ${seat.row} место ${seat.number}, ${seat.price} рублей${sold ? ', занято' : ''}`}
                      aria-pressed={selected}
                      onClick={() => onSelect(seat.id)}
                    >
                      <span className="seat__num">{seat.number}</span>
                    </button>
                  )
                })}
              </div>
              <span className="row-label row-label--end">{row}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
