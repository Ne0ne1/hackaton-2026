/**
 * 3D-вид кинозала + интерактивная кинозона трейлеров.
 *
 * Сцена строится из `HallGeometry`. Кинозона — `CinemaLobby` + DOM-контролы.
 */
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { HallGeometry, SeatCameraView } from '@/types/hall'
import {
  ACTIVE_TONE,
  CinemaSeats,
  SOLD_TONE,
  SEAT_TONES,
  type SeatInstanceSpec,
} from '@/scene/CinemaSeat'
import { HALL_COLORS, HallArchitecture } from '@/scene/HallArchitecture'
import { ScreenPanel } from '@/scene/ScreenPanel'
import { SeatCameraRig, type OverviewCamera } from '@/scene/SeatCameraRig'
import { computeHallMetrics, computeSeatPlacements } from '@/scene/hallGeometry'
import { CinemaLobby } from '@/scene/cinema/CinemaLobby'
import { TrailerControls } from '@/scene/cinema/TrailerControls'
import { disposeAllSpatialAudio } from '@/scene/cinema/spatialAudio'
import { trailerStore } from '@/scene/cinema/trailerStore'
import './SeatView3D.css'

type Props = {
  hall: HallGeometry
  cameraView: SeatCameraView | null
  occupiedSeatIds: string[]
}

function computeOverview(
  hall: HallGeometry,
  metrics: ReturnType<typeof computeHallMetrics>,
): OverviewCamera {
  const back = metrics.backWallZ
  const screen = hall.screen
  return {
    position: {
      x: screen.position.x,
      y: metrics.floorY + 2.9,
      z: back - 0.6,
    },
    target: {
      x: screen.position.x,
      y: screen.position.y * 0.85,
      z: screen.position.z,
    },
    fov: 62,
  }
}

export function SeatView3D({ hall, cameraView, occupiedSeatIds }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [zoneActive, setZoneActive] = useState(true)
  const metrics = useMemo(() => computeHallMetrics(hall), [hall])
  const placements = useMemo(
    () => computeSeatPlacements(hall, metrics),
    [hall, metrics],
  )
  const overview = useMemo(() => computeOverview(hall, metrics), [hall, metrics])
  const occupied = useMemo(() => new Set(occupiedSeatIds), [occupiedSeatIds])

  const seatSpecs = useMemo<SeatInstanceSpec[]>(
    () =>
      placements.map((placement) => {
        const isActive = placement.seat.id === cameraView?.seatId
        const isSold = occupied.has(placement.seat.id)
        const tone = isActive
          ? ACTIVE_TONE
          : isSold
            ? SOLD_TONE
            : SEAT_TONES[placement.category]

        return {
          id: placement.seat.id,
          position: [placement.base.x, placement.base.y, placement.base.z],
          rotationY: placement.rotationY,
          tone,
        }
      }),
    [placements, occupied, cameraView?.seatId],
  )

  useEffect(() => {
    const node = rootRef.current
    if (!node) return

    const syncZone = (intersecting: boolean) => {
      const active =
        intersecting && document.visibilityState === 'visible'
      setZoneActive(active)
      if (!active) trailerStore.pauseActive()
    }

    const io = new IntersectionObserver(
      ([entry]) => syncZone(entry.isIntersecting),
      { threshold: 0.15 },
    )
    io.observe(node)

    const onVis = () => {
      const rect = node.getBoundingClientRect()
      const inView =
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        rect.right > 0 &&
        rect.left < window.innerWidth
      syncZone(inView)
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      disposeAllSpatialAudio()
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className="view-3d view-3d--cinema"
      aria-label="3D-вид с места и кинозона"
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ fov: 62, near: 0.1, far: 120 }}
        onPointerMissed={() => undefined}
      >
        <color attach="background" args={['#0b100e']} />
        <fog attach="fog" args={['#0b100e', 16, 42]} />

        <ambientLight intensity={0.62} color="#b8c9be" />
        <hemisphereLight args={['#6f8d7c', '#3a2f1f', 1.05]} />
        <directionalLight
          position={[4.5, 7.5, 3]}
          intensity={0.7}
          color="#cfe0d6"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-14}
          shadow-camera-right={14}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
          shadow-camera-near={0.5}
          shadow-camera-far={32}
          shadow-bias={-0.0006}
        />
        <directionalLight position={[0, 4.2, 6]} intensity={0.42} color="#b9cbc0" />
        <directionalLight position={[-6, 5.5, 6]} intensity={0.55} color="#e2c48a" />

        <SeatCameraRig view={cameraView} overview={overview} />
        <HallArchitecture metrics={metrics} placements={placements} />
        <ScreenPanel hall={hall} />
        <CinemaSeats seats={seatSpecs} />
        <Suspense fallback={null}>
          <CinemaLobby metrics={metrics} zoneActive={zoneActive} />
        </Suspense>

        {cameraView && (
          <mesh
            position={[
              cameraView.position.x,
              metrics.floorY + 0.02,
              cameraView.position.z,
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.34, 0.52, 32]} />
            <meshBasicMaterial
              color={HALL_COLORS.gold}
              transparent
              opacity={0.5}
              toneMapped={false}
            />
          </mesh>
        )}
      </Canvas>

      <p className="view-3d-caption">
        {cameraView
          ? `Вид с места: ряд ${seatRowLabel(hall, cameraView.seatId)}, место ${seatNumberLabel(hall, cameraView.seatId)} · клик по боковым экранам — трейлеры`
          : 'Обзор зала — боковые экраны: Sintel и Big Buck Bunny'}
      </p>

      <TrailerControls visible />
    </div>
  )
}

function seatRowLabel(hall: HallGeometry, seatId: string): number | string {
  return hall.seats.find((s) => s.id === seatId)?.row ?? '—'
}

function seatNumberLabel(hall: HallGeometry, seatId: string): number | string {
  return hall.seats.find((s) => s.id === seatId)?.number ?? '—'
}
