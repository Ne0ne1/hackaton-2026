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

  return (
    <div className="seat-map" aria-label="Схема зала">
      <div className="screen-label">Экран</div>
      {rows.map((row) => (
        <div className="seat-row" key={row}>
          <span className="row-label">{row}</span>
          <div className="seat-row-seats">
            {seats
              .filter((s) => s.row === row)
              .sort((a, b) => a.number - b.number)
              .map((seat) => {
                const selected = seat.id === selectedSeatId
                const sold = seat.status === 'sold'
                return (
                  <button
                    key={seat.id}
                    type="button"
                    className={[
                      'seat',
                      `seat--${seat.category}`,
                      sold ? 'seat--sold' : '',
                      selected ? 'seat--selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    disabled={sold}
                    title={`${CATEGORY_LABEL[seat.category]} · ${seat.price} ₽`}
                    aria-label={`Ряд ${seat.row} место ${seat.number}, ${seat.price} рублей${sold ? ', занято' : ''}`}
                    onClick={() => onSelect(seat.id)}
                  >
                    {seat.number}
                  </button>
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}
