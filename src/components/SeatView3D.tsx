/**
 * 3D-вид кинозала + интерактивная кинозона трейлеров.
 * Сцена из HallGeometry. Осмотр — CameraControls (мышь/тач).
 */
import { AdaptiveDpr } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
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
      x: screen.position.x + 1.2,
      y: metrics.floorY + 3.8,
      z: back - 0.2,
    },
    target: {
      x: screen.position.x,
      y: screen.position.y * 0.75,
      z: screen.position.z + 2,
    },
    fov: 58,
  }
}

export function SeatView3D({ hall, cameraView, occupiedSeatIds }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [zoneActive, setZoneActive] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
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
          wide: placement.category === 'vip',
          occupied: isSold,
        }
      }),
    [placements, occupied, cameraView?.seatId],
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotion = () => setReducedMotion(media.matches)
    syncMotion()
    media.addEventListener('change', syncMotion)
    return () => media.removeEventListener('change', syncMotion)
  }, [])

  useEffect(() => {
    const node = rootRef.current
    if (!node) return

    const syncZone = (intersecting: boolean) => {
      const active = intersecting && document.visibilityState === 'visible'
      setZoneActive(active)
      if (!active) trailerStore.pauseActive()
    }

    const io = new IntersectionObserver(
      ([entry]) => syncZone(entry.isIntersecting),
      { threshold: 0.01 },
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
      trailerStore.pauseActive()
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
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
        }}
        camera={{ fov: 58, near: 0.08, far: 140 }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.28
          gl.shadowMap.type = THREE.PCFSoftShadowMap
        }}
      >
        <color attach="background" args={['#141510']} />
        <fog attach="fog" args={['#141510', 22, 52]} />

        <ambientLight intensity={0.72} color="#ebe9dc" />
        <hemisphereLight args={['#e8e9df', '#22241c', 1.15]} />
        <directionalLight
          position={[5.5, 8.2, 2]}
          intensity={1.45}
          color="#f7f2e4"
          castShadow
          shadow-mapSize={[1536, 1536]}
          shadow-camera-left={-16}
          shadow-camera-right={16}
          shadow-camera-top={16}
          shadow-camera-bottom={-16}
          shadow-camera-near={0.5}
          shadow-camera-far={36}
          shadow-bias={-0.0005}
        />
        <directionalLight position={[-3.5, 5.5, -7]} intensity={1.25} color="#ffe6d2" />
        <directionalLight position={[0, 4, 7]} intensity={0.55} color="#d5dece" />

        <SeatCameraRig view={cameraView} overview={overview} instant={reducedMotion} />
        <HallArchitecture metrics={metrics} placements={placements} />
        <ScreenPanel hall={hall} />
        <CinemaSeats seats={seatSpecs} activeSeatId={cameraView?.seatId} />
        <Suspense fallback={null}>
          <CinemaLobby metrics={metrics} zoneActive={zoneActive} />
        </Suspense>

        {cameraView && (
          <mesh
            position={[
              cameraView.position.x,
              metrics.floorY + 0.025,
              cameraView.position.z,
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.32, 0.5, 40]} />
            <meshBasicMaterial
              color={HALL_COLORS.gold}
              transparent
              opacity={0.55}
              toneMapped={false}
            />
          </mesh>
        )}
        <AdaptiveDpr />
      </Canvas>

      <div className="view-3d-status" aria-live="polite">
        <span className="view-3d-status__dot" />
        {cameraView
          ? `Ряд ${seatRowLabel(hall, cameraView.seatId)} · место ${seatNumberLabel(hall, cameraView.seatId)}`
          : 'Панорамный обзор'}
      </div>

      <div className="view-3d-orbit-hint" aria-hidden>
        <span>⟲</span>
        {cameraView
          ? 'Медленно тяните мышью — как будто поворачиваете голову'
          : 'Тяните мышью, чтобы крутить зал · колёсико — приблизить'}
      </div>

      <p className="view-3d-caption">
        {cameraView
          ? 'Так выглядит экран с вашего места. Осмотритесь мышью или пересестьте стрелками.'
          : 'Обзор зала. Выберите кресло на схеме — затем осмотритесь из него.'}
      </p>

      <details className="trailer-disclosure">
        <summary>
          Трейлеры и звук с места <span>＋</span>
        </summary>
        <TrailerControls visible />
      </details>
    </div>
  )
}

function seatRowLabel(hall: HallGeometry, seatId: string): number | string {
  return hall.seats.find((s) => s.id === seatId)?.row ?? '—'
}

function seatNumberLabel(hall: HallGeometry, seatId: string): number | string {
  return hall.seats.find((s) => s.id === seatId)?.number ?? '—'
}
