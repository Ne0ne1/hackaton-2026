import { useEffect, useMemo, useState } from 'react'
import { SeatMap } from '@/components/SeatMap'
import { SeatView3D } from '@/components/SeatView3D'
import { buySeat, getHallGeometryForSession, getSeatCameraView, getSeatsWithStatus, listCinemas, listSessions } from '@/core/hallApi'
import { listTickets } from '@/core/ticketStore'
import type { Ticket } from '@/types/hall'

const categoryNames = { standard: 'Стандарт', comfort: 'Комфорт', vip: 'VIP' }
const dateLabel = (value: string) => new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
const timeLabel = (value: string) => new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

export default function App() {
  const cinemas = listCinemas()
  const [cinemaId, setCinemaId] = useState(cinemas[0]?.id ?? '')
  const sessions = useMemo(() => listSessions(cinemaId), [cinemaId])
  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? '')
  const [seatId, setSeatId] = useState<string | null>(null)
  const [mode, setMode] = useState<'map' | 'view'>('map')
  const [revision, setRevision] = useState(0)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [error, setError] = useState('')
  const [showTickets, setShowTickets] = useState(false)
  const hall = getHallGeometryForSession(sessionId)
  const session = sessions.find(item => item.id === sessionId)
  const seats = useMemo(() => getSeatsWithStatus(sessionId), [sessionId, revision])
  const selected = seats.find(seat => seat.id === seatId)
  const occupied = useMemo(() => seats.filter(seat => seat.status === 'sold').map(seat => seat.id), [seats])
  const cameraView = useMemo(() => seatId ? getSeatCameraView(sessionId, seatId) ?? null : null, [seatId, sessionId])
  const tickets = useMemo(() => listTickets(), [revision])

  useEffect(() => {
    const refresh = () => setRevision(value => value + 1)
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [])

  function selectSeat(id: string) {
    setSeatId(id)
    setTicket(null)
    setError('')
  }
  function changeSession(id: string) {
    setSessionId(id)
    setSeatId(null)
    setTicket(null)
    setError('')
    setMode('map')
  }
  function purchase() {
    if (!selected || selected.status === 'sold') return
    try {
      setTicket(buySeat(sessionId, selected.id))
      setRevision(value => value + 1)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить билет')
      setRevision(value => value + 1)
    }
  }
  function moveSeat(rowDelta: number, numberDelta: number) {
    if (!selected) return
    const next = seats.find(seat => seat.row === selected.row + rowDelta && seat.number === selected.number + numberDelta && seat.status === 'free')
    if (next) selectSeat(next.id)
  }
  function canMove(rowDelta: number, numberDelta: number) {
    return !!selected && seats.some(seat => seat.row === selected.row + rowDelta && seat.number === selected.number + numberDelta && seat.status === 'free')
  }
  function bestSeat() {
    if (!hall) return
    const free = seats.filter(seat => seat.status === 'free')
    free.sort((a, b) => (Math.abs(a.row - hall.rows * .65) + Math.abs(a.position.x) * .7) - (Math.abs(b.row - hall.rows * .65) + Math.abs(b.position.x) * .7))
    if (free[0]) selectSeat(free[0].id)
  }

  return (
    <div className="booking-app">
      <header className="topbar">
        <a className="wordmark" href="#main" aria-label="Билет с видом — к выбору мест"><span className="brand-mark">б.</span> билет с видом</a>
        <span className="topbar-note">Сначала почувствуйте. Потом выбирайте.</span>
        <button className="text-button" onClick={() => setShowTickets(value => !value)}>Мои билеты <span className="count">{tickets.length}</span></button>
      </header>
      {showTickets && <section className="ticket-drawer" aria-label="Мои билеты">
        <div className="section-heading"><h2>Мои билеты</h2><button className="text-button" onClick={() => setShowTickets(false)}>Закрыть ×</button></div>
        {tickets.length === 0 ? <p>Пока здесь пусто. Выберите место и оформите первый билет.</p> : tickets.map(item => {
          const ticketSession = listSessions().find(s => s.id === item.sessionId)
          return <article key={item.id} className="saved-ticket"><strong>{ticketSession?.movieTitle ?? 'Киносеанс'}</strong><span>{ticketSession ? dateLabel(ticketSession.startsAt) + ' · ' + timeLabel(ticketSession.startsAt) : ''}</span><span>{item.seatId.replace('R', 'Ряд ').replace('-S', ' · место ')} · {item.price} ₽</span></article>
        })}
      </section>}
      <main id="main">
        <section className="booking-intro">
          <div><p className="eyebrow"><span /> КИНО НА ВАШИХ УСЛОВИЯХ</p><h1>Ваше место.<br /><em>Ваш вид на кино.</em></h1><p className="intro-copy">Займите кресло в 3D, оцените экран и выберите<br className="desktop-break" /> тот самый ракурс. Без сюрпризов в зале.</p></div>
          <div className="intro-ticket"><span>БИЛЕТ С ВИДОМ НА ЭКРАН</span><strong>Сначала<br />посмотрите.</strong><div className="ticket-perforation" /><p>01 — Выберите место<br />02 — Оцените вид в 3D<br />03 — Заберите билет</p><span className="ticket-arrow">↘</span></div>
        </section>
        <section className="session-bar" aria-label="Выбор сеанса">
          <label className="cinema-select"><span>КИНОТЕАТР</span><select value={cinemaId} onChange={event => { const id = event.target.value; setCinemaId(id); changeSession(listSessions(id)[0]?.id ?? '') }}>{cinemas.map(cinema => <option key={cinema.id} value={cinema.id}>{cinema.name}</option>)}</select></label>
          <div className="film-info"><span>СЕГОДНЯ В КИНО</span><strong>{session?.movieTitle}</strong><small>{session && dateLabel(session.startsAt)} · 2D · 12+</small></div>
          <div className="session-times" role="group" aria-label="Время сеанса">{sessions.map(item => <button key={item.id} className={item.id === sessionId ? 'time-button active' : 'time-button'} aria-pressed={item.id === sessionId} onClick={() => changeSession(item.id)}>{timeLabel(item.startsAt)}</button>)}</div>
        </section>
        <div className="booking-layout">
          <section className="hall-panel" aria-label="Выбор места и вид из зала">
            <div className="hall-toolbar"><div><span className="eyebrow">ВЫБЕРИТЕ СВОЙ РАКУРС</span><h2>{mode === 'map' ? 'Схема зала' : 'Вы в кинозале'}</h2></div><div className="view-switch" role="group" aria-label="Режим просмотра"><button className={mode === 'map' ? 'active' : ''} aria-pressed={mode === 'map'} onClick={() => setMode('map')}>Схема</button><button className={mode === 'view' ? 'active' : ''} aria-pressed={mode === 'view'} onClick={() => setMode('view')}>3D-вид ↗</button></div></div>
            {mode === 'map' ? <>
              <p className="hall-help">Нажмите на кресло — цена и вид с места всегда под рукой.</p>
              <SeatMap seats={seats} selectedSeatId={seatId} onSelect={selectSeat} onSitAndWatch={(id) => { selectSeat(id); setMode('view') }} />
              <div className="map-footer"><ul className="legend"><li><i className="legend-seat free" />Свободно</li><li><i className="legend-seat sold" />Занято</li><li><i className="legend-seat chosen" />Ваше место</li></ul><button className="text-button recommendation" onClick={bestSeat} disabled={seats.every(seat => seat.status === 'sold')}>Подобрать лучший вид ↗</button></div>
            </> : <>
              {hall && <SeatView3D hall={hall} cameraView={cameraView} occupiedSeatIds={occupied} />}
              <div className="view-navigation"><button className="text-button" onClick={() => setMode('map')}>← Вернуться к схеме</button><div className="seat-navigation" role="group" aria-label="Пересесть"><button aria-label="Пересесть левее" disabled={!canMove(0, -1)} onClick={() => moveSeat(0, -1)}>←</button><button aria-label="Пересесть вперёд" disabled={!canMove(-1, 0)} onClick={() => moveSeat(-1, 0)}>↑</button><span>Пересесть</span><button aria-label="Пересесть назад" disabled={!canMove(1, 0)} onClick={() => moveSeat(1, 0)}>↓</button><button aria-label="Пересесть правее" disabled={!canMove(0, 1)} onClick={() => moveSeat(0, 1)}>→</button></div></div>
            </>}
          </section>
          <aside className="checkout" aria-label="Ваш билет">
            <span className="eyebrow">ВАШ БИЛЕТ</span><h2>{ticket ? 'Увидимся в кино.' : selected ? 'Хороший выбор.' : 'Кино начинается\nс места.'}</h2><p className="checkout-movie">{session?.movieTitle}</p>
            <div className="ticket-details"><div><span>Кинотеатр</span><strong>{cinemas.find(cinema => cinema.id === cinemaId)?.name}</strong></div><div><span>Сеанс</span><strong>{session && dateLabel(session.startsAt)} · {session && timeLabel(session.startsAt)}</strong></div><div><span>Зал</span><strong>{hall?.name}</strong></div></div>
            <div className="selected-seat" aria-live="polite">{selected ? <><div><span>РЯД</span><strong>{selected.row.toString().padStart(2, '0')}</strong></div><div><span>МЕСТО</span><strong>{selected.number.toString().padStart(2, '0')}</strong></div><small>{categoryNames[selected.category]}</small></> : <p>Выберите кресло на схеме.<br />Здесь появится ваш билет.</p>}</div>
            <div className="checkout-price"><span>Итого</span><strong>{selected ? selected.price + ' ₽' : '—'}</strong></div>
            {ticket ? <div className="purchase-success" role="status"><strong>✓ Билет сохранён</strong><span>Место ваше. Билет доступен в «Моих билетах» и после обновления страницы.</span><button className="secondary-button" onClick={() => { setSeatId(null); setTicket(null); setMode('map') }}>Выбрать ещё место</button></div> : <>
              <button className="primary-button" disabled={!selected || selected.status === 'sold'} onClick={purchase}>{selected?.status === 'sold' ? 'Место уже занято' : selected ? 'Купить билет · ' + selected.price + ' ₽' : 'Выберите место' }<span>↗</span></button>
              <button className="secondary-button" disabled={!selected} onClick={() => setMode(mode === 'view' ? 'map' : 'view')}>{mode === 'view' ? '← Вернуться к схеме' : 'Сесть и посмотреть →'}</button>
            </>}
            {error && <p className="error" role="alert">{error}</p>}<p className="checkout-note">Демонстрационная покупка. Деньги не списываются; билет сохраняется в этом браузере.</p>
          </aside>
        </div>
        <footer className="page-footer"><span>билет с видом <b>на экран.</b></span><span>Меньше сомнений. Больше кино.</span></footer>
      </main>
    </div>
  )
}
