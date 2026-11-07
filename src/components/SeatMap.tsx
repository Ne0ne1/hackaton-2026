import type { SeatWithStatus } from '@/core/hallApi'

type Props = {
  seats: SeatWithStatus[]
  selectedSeatId: string | null
  onSelect: (seatId: string) => void
  onSitAndWatch?: (seatId: string) => void
}

export function SeatMap({ seats, selectedSeatId, onSelect, onSitAndWatch }: Props) {
  const rows = [...new Set(seats.map((seat) => seat.row))].sort((a, b) => a - b)
  const rowSeats = rows.map((row) =>
    seats.filter((seat) => seat.row === row).sort((a, b) => a.number - b.number),
  )
  const selected = seats.find((seat) => seat.id === selectedSeatId)

  return (
    <div className="seat-map-scroll">
      <div className="seat-map" aria-label="Схема зала">
        <div className="map-screen">
          <svg viewBox="0 0 600 50" aria-hidden="true">
            <path d="M12 8 Q300 65 588 8" fill="none" stroke="currentColor" strokeWidth="3" />
          </svg>
          <span>ЭКРАН</span>
        </div>

        <div className="seat-map__rows">
          {rowSeats.map((items, index) => {
            const row = rows[index]
            const sofa = items[0]?.category === 'vip'
            return (
              <div className={'seat-row' + (sofa ? ' seat-row--sofa' : '')} key={row}>
                <span className="row-label">{row}</span>
                <div className="seat-row-seats">
                  {items.map((seat, seatIndex) => {
                    const isSelected = seat.id === selectedSeatId
                    const sold = seat.status === 'sold'
                    const mid = (items.length - 1) / 2
                    const normalized = mid === 0 ? 0 : (seatIndex - mid) / Math.max(mid, 1)
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        className={
                          'seat' +
                          (sofa ? ' seat--sofa' : '') +
                          (isSelected ? ' seat--selected' : '') +
                          (sold ? ' seat--sold' : '')
                        }
                        style={{
                          transform:
                            'translateY(' +
                            (8 - normalized * normalized * 12) +
                            'px) rotate(' +
                            -normalized * 7 +
                            'deg)',
                        }}
                        disabled={sold}
                        title={
                          'Ряд ' +
                          seat.row +
                          ', место ' +
                          seat.number +
                          ' · ' +
                          seat.price +
                          ' ₽'
                        }
                        aria-label={
                          'Ряд ' +
                          seat.row +
                          ' место ' +
                          seat.number +
                          ', ' +
                          seat.price +
                          ' рублей' +
                          (sold ? ', занято' : '')
                        }
                        aria-pressed={isSelected}
                        onClick={() => onSelect(seat.id)}
                      >
                        <span>{seat.number}</span>
                        <i />
                      </button>
                    )
                  })}
                </div>
                <span className="row-price">{items[0]?.price} ₽</span>
              </div>
            )
          })}
        </div>

        {selected && selected.status === 'free' && (
          <div className="seat-tip" role="status">
            <strong>{selected.price} ₽</strong>
            <span>
              Ряд {selected.row} · место {selected.number}
            </span>
            {onSitAndWatch && (
              <button type="button" onClick={() => onSitAndWatch(selected.id)}>
                Сесть и посмотреть →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
