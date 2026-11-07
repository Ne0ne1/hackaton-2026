import { Canvas, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import type { HallGeometry, SeatCameraView } from '@/types/hall'

type Props = {
  hall: HallGeometry
  cameraView: SeatCameraView | null
  occupiedSeatIds: string[]
}

function ScreenMesh({ hall }: { hall: HallGeometry }) {
  const { width, height, position } = hall.screen
  return (
    <mesh position={[position.x, position.y, position.z]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial color="#d8e4ff" emissive="#6b8cff" emissiveIntensity={0.35} />
    </mesh>
  )
}

function SeatMarkers({
  hall,
  occupiedSeatIds,
  activeSeatId,
}: {
  hall: HallGeometry
  occupiedSeatIds: string[]
  activeSeatId?: string
}) {
  const occupied = useMemo(() => new Set(occupiedSeatIds), [occupiedSeatIds])
  return (
    <group>
      {hall.seats.map((seat) => {
        const isActive = seat.id === activeSeatId
        const isSold = occupied.has(seat.id)
        const color = isActive ? '#f0c14a' : isSold ? '#6b7280' : '#3d6b5a'
        return (
          <mesh key={seat.id} position={[seat.position.x, 0.2, seat.position.z]}>
            <boxGeometry args={[0.55, 0.4, 0.55]} />
            <meshStandardMaterial color={color} />
          </mesh>
        )
      })}
    </group>
  )
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]}>
      <planeGeometry args={[18, 20]} />
      <meshStandardMaterial color="#1c2420" />
    </mesh>
  )
}

function CameraRig({ view, fallbackTarget }: { view: SeatCameraView | null; fallbackTarget: { x: number; y: number; z: number } }) {
  const { camera } = useThree()
  const pos = view?.position ?? { x: 0, y: 3.5, z: 6 }
  const target = view?.target ?? fallbackTarget

  useEffect(() => {
    camera.position.set(pos.x, pos.y, pos.z)
    camera.lookAt(target.x, target.y, target.z)
    camera.updateProjectionMatrix()
  }, [camera, pos.x, pos.y, pos.z, target.x, target.y, target.z])

  return (
    <PerspectiveCamera makeDefault position={[pos.x, pos.y, pos.z]} fov={view?.fov ?? 55} />
  )
}

export function SeatView3D({ hall, cameraView, occupiedSeatIds }: Props) {
  return (
    <div className="view-3d" aria-label="3D-вид с места">
      <Canvas shadows>
        <color attach="background" args={['#0d1210']} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[4, 8, 2]} intensity={1.1} />
        <CameraRig view={cameraView} fallbackTarget={hall.screen.position} />
        <Floor />
        <ScreenMesh hall={hall} />
        <SeatMarkers
          hall={hall}
          occupiedSeatIds={occupiedSeatIds}
          activeSeatId={cameraView?.seatId}
        />
      </Canvas>
      <p className="view-3d-caption">
        {cameraView
          ? `Вид с места ${cameraView.seatId}`
          : 'Выберите место, чтобы увидеть экран'}
      </p>
    </div>
  )
}
