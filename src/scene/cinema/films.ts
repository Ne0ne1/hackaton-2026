/**
 * Каталог фильмов кинозоны.
 * Трейлеры — материалы Blender Foundation (CC BY 3.0).
 * ffmpeg в среде недоступен: используем локальные webm/mp4 ≤720p с Wikimedia/Blender.
 */

export type FilmId = 'sintel' | 'big-buck-bunny'

export type FilmSource = {
  src: string
  type: string
}

export type Film = {
  id: FilmId
  title: string
  genre: string
  posterUrl: string
  sources: FilmSource[]
  attribution: string
  /** Исходный OGV (справочно). */
  sourceOgv: string
}

export const FILMS: Film[] = [
  {
    id: 'sintel',
    title: 'Sintel',
    genre: 'Фэнтези · приключения · анимация',
    posterUrl: '/assets/posters/sintel.jpg',
    sources: [
      { src: '/assets/trailers/sintel-480p.mp4', type: 'video/mp4' },
      { src: '/assets/trailers/sintel-480p.webm', type: 'video/webm' },
    ],
    attribution: '© Blender Foundation / sintel.org — CC BY 3.0',
    sourceOgv:
      'https://upload.wikimedia.org/wikipedia/commons/0/06/Sintel_trailer-1080p.ogv',
  },
  {
    id: 'big-buck-bunny',
    title: 'Big Buck Bunny',
    genre: 'Комедия · семейная 3D-анимация',
    posterUrl: '/assets/posters/big-buck-bunny.jpg',
    sources: [
      { src: '/assets/trailers/big-buck-bunny-480p.mp4', type: 'video/mp4' },
      { src: '/assets/trailers/big-buck-bunny-480p.webm', type: 'video/webm' },
    ],
    attribution: '© Blender Foundation / bigbuckbunny.org — CC BY 3.0',
    sourceOgv:
      'https://upload.wikimedia.org/wikipedia/commons/1/18/Big_Buck_Bunny_Trailer_1080p.ogv',
  },
]

export function getFilm(id: FilmId): Film {
  const film = FILMS.find((f) => f.id === id)
  if (!film) throw new Error(`Unknown film: ${id}`)
  return film
}
