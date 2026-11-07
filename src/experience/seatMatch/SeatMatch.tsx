/**
 * SeatMatch — UI подбора лучших свободных мест.
 *
 * Данные читаются только через утверждённое ядро (`@/core/hallApi`).
 * Модуль ничего не покупает и не мутирует статусы — только рекомендует.
 */
import { useMemo, useState } from 'react'
import {
  getHallGeometryForSession,
  getSeatCameraView,
  getSeatsWithStatus,
} from '@/core/hallApi'
import {
  DEFAULT_PROFILE,
  categoryLabel,
  formatReason,
  recommendSeats,
  type SeatMatchProfile,
} from './seatMatchEngine'
import './seatMatch.css'

export type SeatMatchProps = {
  sessionId: string
  /** Вызывается, когда пользователь выбрал рекомендованное место. */
  onPickSeat?: (seatId: string) => void
  /** Принудительное обновление после покупки билета (из ядра). */
  revision?: number
}

const PROFILES: { id: string; label: string; profile: SeatMatchProfile }[] = [
  {
    id: 'balanced',
    label: 'Баланс',
    profile: { priceWeight: 0.5, viewWeight: 1, centerWeight: 0.6 },
  },
  {
    id: 'best-view',
    label: 'Лучший обзор',
    profile: { priceWeight: 0.2, viewWeight: 1, centerWeight: 1 },
  },
  {
    id: 'budget',
    label: 'Дешевле',
    profile: { priceWeight: 1, viewWeight: 0.6, centerWeight: 0.5 },
  },
]

export function SeatMatch({ sessionId, onPickSeat, revision = 0 }: SeatMatchProps) {
  const [profileId, setProfileId] = useState(PROFILES[0].id)

  const seats = useMemo(
    () => getSeatsWithStatus(sessionId),
    [sessionId, revision],
  )
  const hall = useMemo(() => getHallGeometryForSession(sessionId), [sessionId])

  const result = useMemo(() => {
    if (!hall) return null
    return recommendSeats(seats, hall, {
      profile: PROFILES.find((p) => p.id === profileId)?.profile ?? DEFAULT_PROFILE,
      limit: 3,
    })
  }, [seats, hall, profileId])

  if (!hall) {
    return <p className="seat-match__empty">Зал не найден</p>
  }

  if (!result || result.recommendations.length === 0) {
    return (
      <p className="seat-match__empty">
        Свободных мест нет — посмотрите другой сеанс.
      </p>
    )
  }

  return (
    <div className="seat-match">
      <div className="seat-match__head">
        <div>
          <p className="seat-match__title">Подбор места</p>
          <p className="seat-match__meta">
            Свободно {result.freeCount} · лучшая цена около{' '}
            {result.medianPrice} ₽
          </p>
        </div>
        <div className="seat-match__profiles" role="group" aria-label="Приоритет подбора">
          {PROFILES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={[
                'seat-match__chip',
                p.id === profileId ? 'seat-match__chip--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setProfileId(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <ol className="seat-match__list">
        {result.recommendations.map((rec, index) => {
          const view = getSeatCameraView(sessionId, rec.seat.id)
          return (
            <li key={rec.seat.id} className="seat-match__item">
              <div className="seat-match__rank">{index + 1}</div>
              <div className="seat-match__body">
                <p className="seat-match__seat">
                  <strong>{rec.seat.id}</strong>
                  <span className="seat-match__price">{rec.seat.price} ₽</span>
                </p>
                <p className="seat-match__tags">
                  <span className={`seat-match__cat seat-match__cat--${rec.seat.category}`}>
                    {categoryLabel(rec.seat.category)}
                  </span>
                  {rec.reasons.map((reason) => (
                    <span key={reason} className="seat-match__tag">
                      {formatReason(reason)}
                    </span>
                  ))}
                </p>
                <p className="seat-match__stats">
                  обзор {Math.round(rec.viewScore * 100)}% · угол {rec.angleDeg}° ·
                  расстояние {rec.distance} м
                  {view ? ` · fov ${view.fov}°` : ''}
                </p>
              </div>
              <div className="seat-match__score">
                <span className="seat-match__scoreValue">{rec.score}</span>
                <span className="seat-match__scoreLabel">баллов</span>
              </div>
              {onPickSeat && (
                <button
                  type="button"
                  className="seat-match__pick"
                  onClick={() => onPickSeat(rec.seat.id)}
                >
                  Выбрать
                </button>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default SeatMatch
