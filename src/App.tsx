import { useMemo, useState } from 'react'
import { SeatMap } from '@/components/SeatMap'
import { SeatView3D } from '@/components/SeatView3D'
import {
  buySeat,
  getHallGeometryForSession,
  getSeat,
  getSeatCameraView,
  getSeatsWithStatus,
  listCinemas,
  listSessions,
} from '@/core/hallApi'
import type { Ticket } from '@/types/hall'

export default function App() {
  const cinemas = listCinemas()
  const [cinemaId, setCinemaId] = useState(cinemas[0]?.id ?? '')
  const sessions = useMemo(() => listSessions(cinemaId), [cinemaId])
  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? '')
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)

  const hall = getHallGeometryForSession(sessionId)
  const seats = useMemo(
    () => getSeatsWithStatus(sessionId),
    [sessionId, revision],
  )
  const selected = selectedSeatId ? getSeat(sessionId, selectedSeatId) : undefined
  const cameraView = selectedSeatId
    ? getSeatCameraView(sessionId, selectedSeatId) ?? null
    : null
  const occupied = seats.filter((s) => s.status === 'sold').map((s) => s.id)

  function onCinemaChange(id: string) {
    setCinemaId(id)
    const nextSessions = listSessions(id)
    setSessionId(nextSessions[0]?.id ?? '')
    setSelectedSeatId(null)
    setTicket(null)
    setError(null)
  }

  function onSessionChange(id: string) {
    setSessionId(id)
    setSelectedSeatId(null)
    setTicket(null)
    setError(null)
  }

  function onBuy() {
    if (!selectedSeatId) return
    try {
      const bought = buySeat(sessionId, selectedSeatId)
      setTicket(bought)
      setError(null)
      setRevision((n) => n + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось купить билет')
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <p className="brand">Билет с видом на экран</p>
        <h1>Выберите место и посмотрите на экран оттуда</h1>
        <p className="lede">
          Хакатон «Код Единства» — покупка с живой перспективой зала.
        </p>
      </header>

      <section className="controls" aria-label="Кинотеатр и сеанс">
        <label>
          Кинотеатр
          <select value={cinemaId} onChange={(e) => onCinemaChange(e.target.value)}>
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Сеанс
          <select value={sessionId} onChange={(e) => onSessionChange(e.target.value)}>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.movieTitle} · {new Date(s.startsAt).toLocaleString('ru-RU')}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="workspace">
        <section className="panel">
          <h2>Схема зала</h2>
          <SeatMap
            seats={seats}
            selectedSeatId={selectedSeatId}
            onSelect={(id) => {
              setSelectedSeatId(id)
              setTicket(null)
              setError(null)
            }}
          />
          <ul className="legend">
            <li><span className="swatch swatch--vip" /> VIP</li>
            <li><span className="swatch swatch--comfort" /> Комфорт</li>
            <li><span className="swatch swatch--standard" /> Стандарт</li>
            <li><span className="swatch swatch--sold" /> Занято</li>
          </ul>
        </section>

        <section className="panel">
          <h2>Вид на экран</h2>
          {hall ? (
            <SeatView3D
              hall={hall}
              cameraView={cameraView}
              occupiedSeatIds={occupied}
            />
          ) : (
            <p>Зал не найден</p>
          )}
        </section>
      </div>

      <section className="checkout" aria-label="Покупка">
        {selected ? (
          <>
            <p>
              Место <strong>{selected.id}</strong> · ряд {selected.row}, № {selected.number} ·{' '}
              {selected.price} ₽ · {selected.status === 'sold' ? 'занято' : 'свободно'}
            </p>
            <button
              type="button"
              className="buy"
              disabled={selected.status === 'sold'}
              onClick={onBuy}
            >
              Купить билет
            </button>
          </>
        ) : (
          <p>Выберите свободное место на схеме</p>
        )}
        {ticket && (
          <p className="ok" role="status">
            Билет сохранён: {ticket.id}. Место занято для этого сеанса.
          </p>
        )}
        {error && (
          <p className="err" role="alert">
            {error}
          </p>
        )}
      </section>
    </div>
  )
}
