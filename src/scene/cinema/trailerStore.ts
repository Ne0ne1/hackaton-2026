/**
 * Централизованное состояние активного трейлера.
 * Одновременно играет только один фильм; слушатели уведомляются синхронно.
 */
import type { FilmId } from './films'

export type TrailerStatus = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'error'

export type TrailerSnapshot = {
  activeFilmId: FilmId | null
  statuses: Record<FilmId, TrailerStatus>
  errorMessage: string | null
  muted: boolean
  volume: number
  spatialEnabled: boolean
  userUnlockedAudio: boolean
}

type Listener = (snap: TrailerSnapshot) => void

const statuses: Record<FilmId, TrailerStatus> = {
  sintel: 'idle',
  'big-buck-bunny': 'idle',
}

let activeFilmId: FilmId | null = null
let errorMessage: string | null = null
let muted = false
let volume = 0.85
let spatialEnabled = true
let userUnlockedAudio = false

const listeners = new Set<Listener>()

function snapshot(): TrailerSnapshot {
  return {
    activeFilmId,
    statuses: { ...statuses },
    errorMessage,
    muted,
    volume,
    spatialEnabled,
    userUnlockedAudio,
  }
}

function emit() {
  const snap = snapshot()
  listeners.forEach((l) => l(snap))
}

export const trailerStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    listener(snapshot())
    return () => listeners.delete(listener)
  },

  getSnapshot: snapshot,

  unlockAudio() {
    if (!userUnlockedAudio) {
      userUnlockedAudio = true
      emit()
    }
  },

  setStatus(id: FilmId, status: TrailerStatus, error?: string | null) {
    statuses[id] = status
    if (status === 'error') errorMessage = error ?? 'Не удалось загрузить трейлер'
    else if (activeFilmId === id || !activeFilmId) errorMessage = null
    emit()
  },

  /** Запрос воспроизведения: предыдущий активный должен остановиться. */
  requestPlay(id: FilmId) {
    userUnlockedAudio = true
    if (activeFilmId && activeFilmId !== id) {
      statuses[activeFilmId] = 'paused'
    }
    activeFilmId = id
    statuses[id] = 'playing'
    errorMessage = null
    emit()
  },

  requestPause(id: FilmId) {
    if (activeFilmId === id) {
      statuses[id] = 'paused'
      emit()
    }
  },

  requestStop(id: FilmId) {
    statuses[id] = 'ready'
    if (activeFilmId === id) activeFilmId = null
    emit()
  },

  /** Выход из кинозоны — пауза активного. */
  pauseActive() {
    if (activeFilmId && statuses[activeFilmId] === 'playing') {
      statuses[activeFilmId] = 'paused'
      emit()
    }
  },

  setMuted(next: boolean) {
    muted = next
    emit()
  },

  setVolume(next: number) {
    volume = Math.min(1, Math.max(0, next))
    emit()
  },

  setSpatialEnabled(next: boolean) {
    spatialEnabled = next
    emit()
  },
}
