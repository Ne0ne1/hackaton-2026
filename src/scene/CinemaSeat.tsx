/**
 * Процедурное кресло кинотеатра.
 *
 * Кресло состоит из нескольких частей (основание, сиденье, спинка, подлокотники),
 * каждая часть — инстанс общего объекта. Поэтому 96 кресел дают единицы draw call,
 * а не сотни.
 */
import { Instance, Instances } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { SeatCategory } from '@/types/hall'
import { SEAT_DEPTH, SEAT_WIDTH } from './hallGeometry'

export type SeatTone = {
  /** Цвет обивки. */
  fabric: string
  /** Цвет подлокотников и каркаса. */
  frame: string
  /** Насколько материал блестящий (0 — матовый, 1 — глянец). */
  roughness: number
}

export const SEAT_TONES: Record<SeatCategory, SeatTone> = {
  vip: { fabric: '#48695a', frame: '#9c7a35', roughness: 0.72 },
  comfort: { fabric: '#3c5c4d', frame: '#5c7a67', roughness: 0.8 },
  standard: { fabric: '#314c40', frame: '#4a5c52', roughness: 0.85 },
}

/** Занятое место — приглушённый графит. */
export const SOLD_TONE: SeatTone = {
  fabric: '#2b3138',
  frame: '#232a30',
  roughness: 0.92,
}

/** Выбранное место — акцентная золотая подсветка. */
export const ACTIVE_TONE: SeatTone = {
  fabric: '#3c4a2e',
  frame: '#c4a35a',
  roughness: 0.7,
}

type SeatPart = {
  key: 'base' | 'cushion' | 'back' | 'armL' | 'armR' | 'legL' | 'legR'
  position: [number, number, number]
  scale: [number, number, number]
  radius: number
  /** Часть использует цвет обивки, остальное — цвет каркаса. */
  upholstered: boolean
}

/**
 * Локальные части кресла (в системе координат кресла, основание в точке 0).
 * Сиденье на высоте 0.45, спинка уходит вверх и слегка назад.
 */
const SEAT_PARTS: SeatPart[] = [
  // Основание (подушка под ногами / корпус кресла).
  { key: 'base', position: [0, 0.2, 0.02], scale: [SEAT_WIDTH, 0.2, SEAT_DEPTH * 0.92], radius: 0.05, upholstered: true },
  // Мягкое сиденье.
  { key: 'cushion', position: [0, 0.42, -0.02], scale: [SEAT_WIDTH * 0.94, 0.14, SEAT_DEPTH * 0.78], radius: 0.07, upholstered: true },
  // Спинка с закруглённой формой, наклонена назад.
  { key: 'back', position: [0, 0.78, 0.34], scale: [SEAT_WIDTH * 0.98, 0.86, 0.16], radius: 0.08, upholstered: true },
  // Подлокотники.
  { key: 'armL', position: [-SEAT_WIDTH / 2 - 0.02, 0.56, -0.04], scale: [0.09, 0.1, SEAT_DEPTH * 0.72], radius: 0.045, upholstered: false },
  { key: 'armR', position: [SEAT_WIDTH / 2 + 0.02, 0.56, -0.04], scale: [0.09, 0.1, SEAT_DEPTH * 0.72], radius: 0.045, upholstered: false },
  // Опоры.
  { key: 'legL', position: [-SEAT_WIDTH / 2 + 0.04, 0.05, 0.06], scale: [0.06, 0.1, 0.06], radius: 0.02, upholstered: false },
  { key: 'legR', position: [SEAT_WIDTH / 2 - 0.04, 0.05, 0.06], scale: [0.06, 0.1, 0.06], radius: 0.02, upholstered: false },
]

export type SeatInstanceSpec = {
  id: string
  position: [number, number, number]
  rotationY: number
  tone: SeatTone
}

type PartGroup = {
  key: string
  parts: SeatPart[]
  upholstered: boolean
}

const PART_GROUPS: PartGroup[] = (() => {
  const groups = new Map<string, PartGroup>()
  for (const part of SEAT_PARTS) {
    const groupKey = part.upholstered ? 'upholstered' : 'frame'
    const existing = groups.get(groupKey)
    if (existing) existing.parts.push(part)
    else groups.set(groupKey, { key: groupKey, parts: [part], upholstered: part.upholstered })
  }
  return [...groups.values()]
})()

/**
 * Набор кресел.
 *
 * Каждая группа частей (обивка / каркас) рендерится через `Instances` — один
 * draw call на группу независимо от количества мест. Цвет задаётся per-instance
 * через `instanceColor`, поэтому категории и статусы не ломают инстансинг.
 */
export function CinemaSeats({ seats }: { seats: SeatInstanceSpec[] }) {
  const geometries = useMemo(() => {
    // Скруглённая «подушка»: сдвигаем вершины куба к центру.
    const geo = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2)
    const pos = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)
      const len = Math.hypot(x, y, z)
      const t = 1 - 0.3 * (1 / Math.max(len, 0.001))
      pos.setXYZ(i, x * t, y * t, z * t)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  const color = useMemo(() => new THREE.Color(), [])

  return (
    <group>
      {PART_GROUPS.map((group) => {
        const parts = group.parts
        return (
          <group key={group.key}>
            {parts.map((part) => (
              <Instances
                key={part.key}
                geometry={geometries}
                limit={seats.length}
                range={seats.length}
                castShadow={part.key !== 'legL' && part.key !== 'legR'}
                receiveShadow
              >
                {seats.map((seat) => (
                  <Instance
                    key={seat.id}
                    position={seat.position}
                    rotation={[0, seat.rotationY, 0]}
                    scale={part.scale}
                    color={color.set(
                      group.upholstered ? seat.tone.fabric : seat.tone.frame,
                    )}
                  />
                ))}
                <meshStandardMaterial
                  roughness={0.85}
                  metalness={group.upholstered ? 0.04 : 0.22}
                />
              </Instances>
            ))}
          </group>
        )
      })}
    </group>
  )
}
