import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { SeatCategory } from '@/types/hall'

export type SeatTone = { fabric: string; frame: string; roughness: number }
export const SEAT_TONES: Record<SeatCategory, SeatTone> = {
  standard: { fabric: '#3c3d35', frame: '#1c1e18', roughness: 0.9 },
  comfort: { fabric: '#43443b', frame: '#202219', roughness: 0.86 },
  vip: { fabric: '#4a493f', frame: '#24261e', roughness: 0.8 },
}
export const ACTIVE_TONE: SeatTone = { fabric: '#e3482a', frame: '#9c3520', roughness: 0.7 }
export const SOLD_TONE: SeatTone = { fabric: '#20221b', frame: '#141610', roughness: 0.95 }

export type SeatInstanceSpec = {
  id: string
  position: [number, number, number]
  rotationY: number
  tone: SeatTone
  wide?: boolean
  occupied?: boolean
}

type Part = {
  name: string
  position: [number, number, number]
  scale: [number, number, number]
  fabric: boolean
  tilt?: number
  wideScaleX?: number
}

const parts: Part[] = [
  { name: 'base', position: [0, 0.16, 0.05], scale: [0.48, 0.18, 0.46], fabric: false, wideScaleX: 1.4 },
  { name: 'cushion', position: [0, 0.4, -0.03], scale: [0.52, 0.11, 0.5], fabric: true, wideScaleX: 1.48 },
  { name: 'cushion-lip', position: [0, 0.34, -0.24], scale: [0.5, 0.08, 0.1], fabric: true, wideScaleX: 1.45 },
  { name: 'back', position: [0, 0.76, 0.23], scale: [0.54, 0.7, 0.11], fabric: true, tilt: -0.14, wideScaleX: 1.42 },
  { name: 'back-pad', position: [0, 0.74, 0.16], scale: [0.42, 0.5, 0.05], fabric: true, tilt: -0.14, wideScaleX: 1.35 },
  { name: 'headrest', position: [0, 1.1, 0.17], scale: [0.44, 0.13, 0.1], fabric: true, wideScaleX: 1.32 },
  { name: 'left-arm', position: [-0.31, 0.52, -0.01], scale: [0.075, 0.13, 0.48], fabric: false, wideScaleX: 1.55 },
  { name: 'right-arm', position: [0.31, 0.52, -0.01], scale: [0.075, 0.13, 0.48], fabric: false, wideScaleX: 1.55 },
  { name: 'left-arm-top', position: [-0.31, 0.6, -0.01], scale: [0.09, 0.04, 0.46], fabric: false, wideScaleX: 1.55 },
  { name: 'right-arm-top', position: [0.31, 0.6, -0.01], scale: [0.09, 0.04, 0.46], fabric: false, wideScaleX: 1.55 },
]

const PERSON_TONES = ['#14160f', '#171912', '#1a1c14', '#12140e', '#1d1f16'] as const

function hashSeat(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

/** Детерминированно: занятые всегда, свободные — часть зала (~62%). */
function shouldHavePerson(seat: SeatInstanceSpec, activeSeatId?: string | null): boolean {
  if (seat.id === activeSeatId) return false
  if (seat.occupied) return true
  return hashSeat(seat.id) % 100 < 78
}

function SeatPart({ seats, part }: { seats: SeatInstanceSpec[]; part: Part }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const geometry = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 2, 0.07), [])

  useLayoutEffect(() => {
    if (!ref.current || seats.length === 0) return
    const parent = new THREE.Object3D()
    const child = new THREE.Object3D()
    const matrix = new THREE.Matrix4()

    seats.forEach((seat, index) => {
      const wide = seat.wide ? (part.wideScaleX ?? 1.35) : 1
      const armShift = part.name.includes('arm') ? (wide - 1) * 0.2 : 0
      const side = part.name.startsWith('left') ? -1 : part.name.startsWith('right') ? 1 : 0

      child.position.set(
        part.position[0] + side * armShift,
        part.position[1],
        part.position[2],
      )
      child.scale.set(part.scale[0] * wide, part.scale[1], part.scale[2])
      child.rotation.set(part.tilt ?? 0, 0, 0)
      child.updateMatrix()

      parent.position.set(...seat.position)
      parent.rotation.set(0, seat.rotationY, 0)
      parent.updateMatrix()

      matrix.multiplyMatrices(parent.matrix, child.matrix)
      ref.current!.setMatrixAt(index, matrix)
      ref.current!.setColorAt(
        index,
        new THREE.Color(part.fabric ? seat.tone.fabric : seat.tone.frame),
      )
    })

    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [seats, part])

  if (seats.length === 0) return null

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, seats.length]} castShadow receiveShadow>
      <meshStandardMaterial
        roughness={part.fabric ? 0.9 : 0.45}
        metalness={part.fabric ? 0.02 : 0.22}
      />
    </instancedMesh>
  )
}

type PersonPart = {
  name: string
  local: [number, number, number]
  scale: [number, number, number]
  kind: 'body' | 'head'
}

const personParts: PersonPart[] = [
  { name: 'torso', local: [0, 0.68, -0.02], scale: [0.36, 0.48, 0.24], kind: 'body' },
  { name: 'shoulders', local: [0, 0.92, -0.02], scale: [0.52, 0.14, 0.2], kind: 'body' },
  { name: 'head', local: [0, 1.18, -0.04], scale: [0.2, 0.24, 0.2], kind: 'head' },
]

function AudiencePeople({ seats }: { seats: SeatInstanceSpec[] }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null)
  const headRef = useRef<THREE.InstancedMesh>(null)
  const bodyGeo = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 2, 0.12), [])
  const headGeo = useMemo(() => new THREE.SphereGeometry(0.5, 14, 12), [])

  const bodySlots = useMemo(
    () => personParts.filter((part) => part.kind === 'body'),
    [],
  )

  useLayoutEffect(() => {
    if (seats.length === 0) return
    const parent = new THREE.Object3D()
    const child = new THREE.Object3D()
    const matrix = new THREE.Matrix4()

    const place = (
      mesh: THREE.InstancedMesh | null,
      partList: PersonPart[],
      geoScale: number,
    ) => {
      if (!mesh) return
      let index = 0
      seats.forEach((seat) => {
        const tone = PERSON_TONES[hashSeat(seat.id) % PERSON_TONES.length]
        const lean = ((hashSeat(seat.id + 'lean') % 17) - 8) * 0.004
        partList.forEach((part) => {
          child.position.set(part.local[0], part.local[1], part.local[2] + lean)
          child.scale.set(
            part.scale[0] * geoScale,
            part.scale[1] * geoScale,
            part.scale[2] * geoScale,
          )
          child.rotation.set(-0.08, 0, 0)
          child.updateMatrix()
          parent.position.set(...seat.position)
          parent.rotation.set(0, seat.rotationY, 0)
          parent.updateMatrix()
          matrix.multiplyMatrices(parent.matrix, child.matrix)
          mesh.setMatrixAt(index, matrix)
          mesh.setColorAt(index, new THREE.Color(tone))
          index += 1
        })
      })
      mesh.count = index
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      mesh.computeBoundingSphere()
    }

    place(bodyRef.current, bodySlots, 1)
    place(headRef.current, personParts.filter((p) => p.kind === 'head'), 1)
  }, [seats, bodySlots])

  if (seats.length === 0) return null

  const bodyCount = seats.length * bodySlots.length
  const headCount = seats.length

  return (
    <group name="audience-people">
      <instancedMesh ref={bodyRef} args={[bodyGeo, undefined, bodyCount]} castShadow>
        <meshStandardMaterial roughness={0.95} metalness={0} color="#15170f" />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[headGeo, undefined, headCount]} castShadow>
        <meshStandardMaterial roughness={0.97} metalness={0} color="#10120d" />
      </instancedMesh>
    </group>
  )
}

export function CinemaSeats({
  seats,
  activeSeatId,
}: {
  seats: SeatInstanceSpec[]
  activeSeatId?: string | null
}) {
  const occupiedByPeople = useMemo(
    () => seats.filter((seat) => shouldHavePerson(seat, activeSeatId)),
    [seats, activeSeatId],
  )

  return (
    <group name="cinema-seats">
      {parts.map((part) => (
        <SeatPart key={part.name} seats={seats} part={part} />
      ))}
      <AudiencePeople seats={occupiedByPeople} />
    </group>
  )
}
