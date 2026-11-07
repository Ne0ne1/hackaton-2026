/**
 * DOM-слой управления трейлерами и 3D-звуком.
 * Доступные кнопки; видео не стартует со звуком без жеста пользователя.
 */
import { useEffect, useState } from 'react'
import { FILMS, type FilmId } from './films'
import { trailerStore, type TrailerSnapshot } from './trailerStore'
import './trailerControls.css'

type Props = {
  visible: boolean
}

export function TrailerControls({ visible }: Props) {
  const [snap, setSnap] = useState<TrailerSnapshot>(() => trailerStore.getSnapshot())

  useEffect(() => trailerStore.subscribe(setSnap), [])

  if (!visible) return null

  const active = snap.activeFilmId
    ? FILMS.find((f) => f.id === snap.activeFilmId)
    : null
  const status = active ? snap.statuses[active.id] : 'idle'

  const unlockAnd = (fn: () => void) => {
    trailerStore.unlockAudio()
    fn()
  }

  return (
    <div className="trailer-dock" role="region" aria-label="Кинозона трейлеров">
      <div className="trailer-dock__head">
        <div>
          <span className="trailer-dock__eyebrow">AURORA TRAILER LOUNGE</span>
          <strong>Премьеры в объёмном звуке</strong>
        </div>
        <span className="trailer-dock__signal">
          <i aria-hidden /> HRTF READY
        </span>
      </div>
      <div className="trailer-dock__films">
        {FILMS.map((film) => {
          const st = snap.statuses[film.id]
          const isActive = snap.activeFilmId === film.id
          return (
            <article
              key={film.id}
              className={[
                'trailer-card',
                isActive ? 'trailer-card--active' : '',
                st === 'error' ? 'trailer-card--error' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <img
                className="trailer-card__poster"
                src={film.posterUrl}
                alt={`Обложка «${film.title}»`}
                loading="lazy"
                width={72}
                height={102}
              />
              <div className="trailer-card__body">
                <h3 className="trailer-card__title">{film.title}</h3>
                <p className="trailer-card__genre">{film.genre}</p>
                <p className="trailer-card__attr">{film.attribution}</p>
                <div className="trailer-card__actions">
                  <button
                    type="button"
                    className="trailer-btn trailer-btn--primary"
                    onClick={() => void unlockAnd(() => playFilm(film.id))}
                  >
                    {st === 'loading'
                      ? 'Загрузка…'
                      : isActive && st === 'playing'
                        ? 'Сейчас на экране'
                        : 'Смотреть трейлер'}
                  </button>
                </div>
                {st === 'error' && (
                  <p className="trailer-card__error" role="alert">
                    {snap.errorMessage ?? 'Ошибка загрузки'}
                  </p>
                )}
                {st === 'loading' && (
                  <p className="trailer-card__loading" aria-live="polite">
                    Готовим видео…
                  </p>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <div className="trailer-dock__transport">
        <button
          type="button"
          className="trailer-btn"
          disabled={!active}
          onClick={() =>
            active &&
            void unlockAnd(() => {
              if (status === 'playing') trailerStore.requestPause(active.id)
              else playFilm(active.id)
            })
          }
        >
          {status === 'playing' ? 'Пауза' : 'Воспроизвести'}
        </button>
        <button
          type="button"
          className="trailer-btn"
          disabled={!active}
          onClick={() =>
            active &&
            void unlockAnd(() => {
              restartFilm(active.id)
            })
          }
        >
          Сначала
        </button>
        <button
          type="button"
          className="trailer-btn"
          aria-pressed={snap.muted}
          onClick={() => trailerStore.setMuted(!snap.muted)}
        >
          {snap.muted ? 'Включить звук' : 'Без звука'}
        </button>
        <label className="trailer-volume">
          <span>Громкость</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={snap.volume}
            onChange={(e) => trailerStore.setVolume(Number(e.target.value))}
          />
        </label>
        <label className="trailer-spatial">
          <input
            type="checkbox"
            checked={snap.spatialEnabled}
            onChange={(e) => trailerStore.setSpatialEnabled(e.target.checked)}
          />
          <span>3D-звук</span>
        </label>
      </div>
    </div>
  )
}

function playFilm(id: FilmId) {
  // Панель готовит video + attach, затем сама вызывает requestPlay.
  window.dispatchEvent(
    new CustomEvent('cinema:ensure-video', { detail: { id, play: true } }),
  )
}

function restartFilm(id: FilmId) {
  window.dispatchEvent(
    new CustomEvent('cinema:restart-video', { detail: { id } }),
  )
  playFilm(id)
}
