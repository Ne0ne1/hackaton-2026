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
  registerExperienceModule,
} from '@/core/hallApi'
import { SeatMatch } from '@/experience/seatMatch'
import type { Ticket } from '@/types/hall'

registerExperienceModule({
  id: 'seat-match',
  title: 'Подбор места',
  render: SeatMatch,
})

const CATEGORY_RU: Record<string, string> = {
  standard: 'Стандарт',
  comfort: 'Комфорт',
  vip: 'VIP',
}

export default function App() {
  const cinemas = listCinemas()
  const [cinemaId, setCinemaId] = useState(cinemas[0]?.id ?? '')
  const sessions = useMemo(() => listSessions(cinemaId), [cinemaId])
  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? '')
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const [buying, setBuying] = useState(false)

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
  const session = sessions.find((s) => s.id === sessionId)
  const cinema = cinemas.find((c) => c.id === cinemaId)

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

  function onSelectSeat(id: string) {
    setSelectedSeatId(id)
    setTicket(null)
    setError(null)
  }

  function onBuy() {
    if (!selectedSeatId || buying) return
    setBuying(true)
    try {
      const bought = buySeat(sessionId, selectedSeatId)
      setTicket(bought)
      setError(null)
      setRevision((n) => n + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось купить билет')
    } finally {
      setBuying(false)
    }
  }

  return (
    <div className="app">
      <div className="app__atmosphere" aria-hidden />

      <header className="hero">
        <p className="brand">Билет с видом на экран</p>
        <h1>Смотри фильм ещё до покупки — с вашего кресла</h1>
        <p className="lede">
          Выберите место, увидьте перспективу зала и оформите билет за один шаг.
        </p>
      </header>

      <section className="controls" aria-label="Кинотеатр и сеанс">
        <label>
          <span>Кинотеатр</span>
          <select value={cinemaId} onChange={(e) => onCinemaChange(e.target.value)}>
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Сеанс</span>
          <select value={sessionId} onChange={(e) => onSessionChange(e.target.value)}>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.movieTitle} · {new Date(s.startsAt).toLocaleString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </option>
            ))}
          </select>
        </label>
        {session && (
          <p className="controls__meta">
            {cinema?.name} · {hall?.name ?? 'Зал'} · {session.movieTitle}
          </p>
        )}
      </section>

      <div className="workspace">
        <section className="panel panel--map">
          <div className="panel__head">
            <h2>Схема зала</h2>
            <p className="panel__hint">Нажмите кресло или выберите из подбора</p>
          </div>
          <SeatMap
            seats={seats}
            selectedSeatId={selectedSeatId}
            onSelect={onSelectSeat}
          />
          <ul className="legend">
            <li><span className="swatch swatch--vip" /> VIP</li>
            <li><span className="swatch swatch--comfort" /> Комфорт</li>
            <li><span className="swatch swatch--standard" /> Стандарт</li>
            <li><span className="swatch swatch--sold" /> Занято</li>
          </ul>
        </section>

        <section className="panel panel--view">
          <div className="panel__head">
            <h2>Вид на экран</h2>
            <p className="panel__hint">
              {selectedSeatId
                ? `С места ${selectedSeatId}`
                : 'Выберите место, чтобы увидеть перспективу'}
            </p>
          </div>
          {hall ? (
            <SeatView3D
              hall={hall}
              cameraView={cameraView}
              occupiedSeatIds={occupied}
            />
          ) : (
            <p className="panel__empty">Зал не найден</p>
          )}
        </section>
      </div>

      <section className="panel seat-match-panel" aria-label="Умный подбор места">
        <SeatMatch
          sessionId={sessionId}
          revision={revision}
          onPickSeat={onSelectSeat}
        />
      </section>

      <section className="checkout" aria-label="Покупка">
        {selected ? (
          <div className="checkout__grid">
            <div>
              <p className="checkout__eyebrow">Ваш билет</p>
              <p className="checkout__title">
                Ряд {selected.row}, место {selected.number}
              </p>
              <p className="checkout__meta">
                {CATEGORY_RU[selected.category] ?? selected.category} · {selected.id} ·{' '}
                {selected.status === 'sold' ? 'уже занято' : 'свободно'}
              </p>
            </div>
            <div className="checkout__action">
              <p className="checkout__price">{selected.price} ₽</p>
              <button
                type="button"
                className="buy"
                disabled={selected.status === 'sold' || buying}
                onClick={onBuy}
              >
                {buying ? 'Оформляем…' : 'Купить билет'}
              </button>
            </div>
          </div>
        ) : (
          <p className="checkout__idle">Выберите свободное место на схеме или в подборе</p>
        )}
        {ticket && (
          <p className="ok" role="status">
            Билет сохранён. Место {ticket.seatId} занято на этот сеанс.
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
