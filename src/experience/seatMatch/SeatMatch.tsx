/**
 * SeatMatch — UI подбора лучших свободных мест.
 *
 * Данные читаются только через утверждённое ядро (`@/core/hallApi`).
 * Модуль ничего не покупает и не мутирует статусы — только рекомендует.
 */
import { useCallback, useMemo, useRef, useState } from 'react'
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

type ProfileId = 'balanced' | 'best-view' | 'budget'

const PROFILES: {
  id: ProfileId
  label: string
  hint: string
  profile: SeatMatchProfile
}[] = [
  {
    id: 'balanced',
    label: 'Баланс',
    hint: 'Хороший обзор и разумная цена',
    profile: { priceWeight: 0.5, viewWeight: 1, centerWeight: 0.6 },
  },
  {
    id: 'best-view',
    label: 'Лучший обзор',
    hint: 'Максимум качества изображения',
    profile: { priceWeight: 0.2, viewWeight: 1, centerWeight: 1 },
  },
  {
    id: 'budget',
    label: 'Дешевле',
    hint: 'Самые доступные свободные места',
    profile: { priceWeight: 1, viewWeight: 0.6, centerWeight: 0.5 },
  },
]

/** Понятное человеку название категории места. */
const CATEGORY_HINT: Record<string, string> = {
  vip: 'VIP',
  comfort: 'Комфорт',
  standard: 'Стандарт',
}

/**
 * Человекочитаемая оценка качества обзора.
 * Подаётся как полезная метрика для зрителя, а не как «угол 12°».
 */
function viewVerdict(viewScore: number): string {
  if (viewScore >= 0.86) return 'Отличный'
  if (viewScore >= 0.7) return 'Хороший'
  if (viewScore >= 0.5) return 'Средний'
  return 'Базовый'
}

/** Целое число с разделителем разрядов: 12000 → «12 000». */
function formatPrice(value: number): string {
  return value.toLocaleString('ru-RU').replace(/\u00a0/g, ' ')
}

export function SeatMatch({ sessionId, onPickSeat, revision = 0 }: SeatMatchProps) {
  const [profileId, setProfileId] = useState<ProfileId>(PROFILES[0].id)
  const profileRefs = useRef<Record<string, HTMLButtonElement | null>>({})

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

  /** Переключение профиля стрелками — как в нативном segmented control. */
  const onProfileKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
      if (!keys.includes(event.key)) return
      event.preventDefault()
      const index = PROFILES.findIndex((p) => p.id === profileId)
      let next = index
      if (event.key === 'ArrowLeft') next = (index - 1 + PROFILES.length) % PROFILES.length
      if (event.key === 'ArrowRight') next = (index + 1) % PROFILES.length
      if (event.key === 'Home') next = 0
      if (event.key === 'End') next = PROFILES.length - 1
      const target = PROFILES[next]
      setProfileId(target.id)
      profileRefs.current[target.id]?.focus()
    },
    [profileId],
  )

  if (!hall) {
    return (
      <section className="seat-match seat-match--empty" aria-live="polite">
        <h2 className="seat-match__title">Подбор места</h2>
        <p className="seat-match__emptyText">Зал не найден</p>
      </section>
    )
  }

  if (!result || result.recommendations.length === 0) {
    return (
      <section className="seat-match seat-match--empty" aria-live="polite">
        <h2 className="seat-match__title">Подбор места</h2>
        <p className="seat-match__emptyText">
          Свободных мест нет — посмотрите другой сеанс.
        </p>
      </section>
    )
  }

  const activeProfile = PROFILES.find((p) => p.id === profileId) ?? PROFILES[0]

  return (
    <section className="seat-match" aria-labelledby="seat-match-heading">
      <header className="seat-match__head">
        <p className="seat-match__eyebrow">Персональная рекомендация</p>
        <h2 className="seat-match__title" id="seat-match-heading">
          Подберём место, с которого видно всё
        </h2>
        <p className="seat-match__lead">
          Мы оценили свободные кресла по углу обзора, расстоянию до экрана и
          цене. Выберите, что для вас важнее — и мы покажем лучшие варианты.
        </p>

        <dl className="seat-match__stats">
          <div className="seat-match__stat">
            <dt className="seat-match__statLabel">Свободно мест</dt>
            <dd className="seat-match__statValue">{result.freeCount}</dd>
          </div>
          <div className="seat-match__stat">
            <dt className="seat-match__statLabel">Цена от</dt>
            <dd className="seat-match__statValue">
              {formatPrice(result.medianPrice)}
              <span className="seat-match__statUnit">₽</span>
            </dd>
          </div>
          <div className="seat-match__stat">
            <dt className="seat-match__statLabel">Зал</dt>
            <dd className="seat-match__statValue seat-match__statValue--hall">
              {hall.name}
            </dd>
          </div>
        </dl>
      </header>

      <div className="seat-match__profilesWrap">
        <div
          className="seat-match__profiles"
          role="radiogroup"
          aria-label="Приоритет подбора места"
        >
          {PROFILES.map((p) => {
            const active = p.id === profileId
            return (
              <button
                key={p.id}
                ref={(el) => {
                  profileRefs.current[p.id] = el
                }}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                className={[
                  'seat-match__chip',
                  active ? 'seat-match__chip--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setProfileId(p.id)}
                onKeyDown={onProfileKeyDown}
              >
                {p.label}
              </button>
            )
          })}
        </div>
        <p className="seat-match__profileHint">{activeProfile.hint}</p>
      </div>

      <ol className="seat-match__list" key={profileId}>
        {result.recommendations.map((rec, index) => {
          const view = getSeatCameraView(sessionId, rec.seat.id)
          const isTop = index === 0
          const viewPercent = Math.round(rec.viewScore * 100)
          return (
            <li
              key={rec.seat.id}
              className={[
                'seat-match__item',
                isTop ? 'seat-match__item--top' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {isTop && <span className="seat-match__badge">Лучший выбор</span>}

              <div className="seat-match__main">
                <div className="seat-match__place">
                  <span className="seat-match__row">Ряд {rec.seat.row}</span>
                  <span className="seat-match__sep" aria-hidden="true" />
                  <span className="seat-match__seatNumber">
                    место {rec.seat.number}
                  </span>
                </div>

                <div className="seat-match__metaRow">
                  <span
                    className={`seat-match__cat seat-match__cat--${rec.seat.category}`}
                  >
                    {CATEGORY_HINT[rec.seat.category] ?? categoryLabel(rec.seat.category)}
                  </span>
                  <span className="seat-match__price">
                    {formatPrice(rec.seat.price)}
                    <span className="seat-match__priceUnit">₽</span>
                  </span>
                </div>

                <div className="seat-match__quality">
                  <div className="seat-match__qualityTop">
                    <span className="seat-match__qualityLabel">
                      Качество обзора
                    </span>
                    <span className="seat-match__qualityValue">
                      {viewVerdict(rec.viewScore)}
                    </span>
                  </div>
                  <div
                    className="seat-match__meter"
                    role="img"
                    aria-label={`Качество обзора: ${viewVerdict(rec.viewScore)}, ${viewPercent} из 100`}
                  >
                    <span
                      className="seat-match__meterFill"
                      style={{ width: `${viewPercent}%` }}
                    />
                  </div>
                </div>

                <ul className="seat-match__reasons">
                  {rec.reasons.map((reason) => (
                    <li key={reason} className="seat-match__reason">
                      {formatReason(reason)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="seat-match__side">
                {onPickSeat && (
                  <button
                    type="button"
                    className="seat-match__pick"
                    onClick={() => onPickSeat(rec.seat.id)}
                  >
                    Выбрать место
                  </button>
                )}
                <p className="seat-match__tech" title={view ? `fov ${view.fov}°` : undefined}>
                  <span className="seat-match__techValue">{rec.score}</span>
                  <span className="seat-match__techLabel">баллов</span>
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default SeatMatch
