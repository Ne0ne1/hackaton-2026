/**
 * Камера зала.
 * - Обзор: медленное вращение зала.
 * - С места: лёгкий поворот головы (камера на месте, узкий yaw/pitch).
 */
import { CameraControls, PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import CameraControlsImpl from 'camera-controls'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SeatCameraView, Vec3 } from '@/types/hall'

export type OverviewCamera = {
  position: Vec3
  target: Vec3
  fov: number
}

type Props = {
  view: SeatCameraView | null
  overview: OverviewCamera
  instant?: boolean
}

const ACTION = CameraControlsImpl.ACTION
const TRANSITION_MS = 900

/** Поворот головы: ~±32° влево/вправо, ~±15° вверх/вниз. */
const HEAD_YAW_MAX = 0.56
const HEAD_PITCH_MAX = 0.26
const LOOK_SENS_X = 0.00115
const LOOK_SENS_Y = 0.0009
const LOOK_SMOOTH = 10

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function SeatCameraRig({ view, overview, instant = false }: Props) {
  if (view) {
    return <SeatLookRig view={view} instant={instant} />
  }
  return <OverviewOrbitRig overview={overview} instant={instant} />
}

function OverviewOrbitRig({
  overview,
  instant,
}: {
  overview: OverviewCamera
  instant: boolean
}) {
  const controlsRef = useRef<CameraControlsImpl | null>(null)
  const { gl } = useThree()

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    void controls.setLookAt(
      overview.position.x,
      overview.position.y,
      overview.position.z,
      overview.target.x,
      overview.target.y,
      overview.target.z,
      !instant,
    )
  }, [overview, instant])

  useEffect(() => {
    const el = gl.domElement
    el.style.cursor = 'grab'
    const down = () => {
      el.style.cursor = 'grabbing'
    }
    const up = () => {
      el.style.cursor = 'grab'
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      el.style.cursor = ''
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [gl])

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minDistance={5}
      maxDistance={22}
      minPolarAngle={0.22}
      maxPolarAngle={Math.PI * 0.46}
      azimuthRotateSpeed={0.28}
      polarRotateSpeed={0.22}
      dollySpeed={0.35}
      truckSpeed={0.25}
      mouseButtons={{
        left: ACTION.ROTATE,
        middle: ACTION.DOLLY,
        right: ACTION.TRUCK,
        wheel: ACTION.DOLLY,
      }}
      touches={{
        one: ACTION.TOUCH_ROTATE,
        two: ACTION.TOUCH_DOLLY_TRUCK,
        three: ACTION.TOUCH_TRUCK,
      }}
      smoothTime={0.45}
      draggingSmoothTime={0.2}
    />
  )
}

function SeatLookRig({ view, instant }: { view: SeatCameraView; instant: boolean }) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const { gl } = useThree()
  const lookTarget = useRef(new THREE.Vector3())

  const basePos = useMemo(
    () => new THREE.Vector3(view.position.x, view.position.y, view.position.z),
    [view.position.x, view.position.y, view.position.z],
  )
  const baseTarget = useMemo(
    () => new THREE.Vector3(view.target.x, view.target.y, view.target.z),
    [view.target.x, view.target.y, view.target.z],
  )

  const currentPos = useRef(basePos.clone())
  const lookDir = useRef(new THREE.Vector3())
  const yaw = useRef(0)
  const pitch = useRef(0)
  const yawGoal = useRef(0)
  const pitchGoal = useRef(0)
  const startPos = useRef(basePos.clone())
  const progress = useRef(1)
  const dragging = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })

  const baseSpherical = useMemo(() => {
    const dir = baseTarget.clone().sub(basePos).normalize()
    return new THREE.Spherical().setFromVector3(dir)
  }, [basePos, baseTarget])

  useEffect(() => {
    startPos.current.copy(currentPos.current)
    progress.current = instant ? 1 : 0
    yaw.current = 0
    pitch.current = 0
    yawGoal.current = 0
    pitchGoal.current = 0
    if (instant) currentPos.current.copy(basePos)
  }, [basePos, baseTarget, view.seatId, view.fov, instant])

  useEffect(() => {
    const el = gl.domElement
    el.style.cursor = 'grab'

    const onDown = (event: PointerEvent) => {
      dragging.current = true
      lastPointer.current = { x: event.clientX, y: event.clientY }
      el.style.cursor = 'grabbing'
      el.setPointerCapture(event.pointerId)
    }
    const onMove = (event: PointerEvent) => {
      if (!dragging.current) return
      const dx = event.clientX - lastPointer.current.x
      const dy = event.clientY - lastPointer.current.y
      lastPointer.current = { x: event.clientX, y: event.clientY }
      yawGoal.current = THREE.MathUtils.clamp(
        yawGoal.current - dx * LOOK_SENS_X,
        -HEAD_YAW_MAX,
        HEAD_YAW_MAX,
      )
      pitchGoal.current = THREE.MathUtils.clamp(
        pitchGoal.current - dy * LOOK_SENS_Y,
        -HEAD_PITCH_MAX,
        HEAD_PITCH_MAX,
      )
    }
    const onUp = (event: PointerEvent) => {
      dragging.current = false
      el.style.cursor = 'grab'
      try {
        el.releasePointerCapture(event.pointerId)
      } catch {
        /* already released */
      }
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      el.style.cursor = ''
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [gl, view.seatId])

  useFrame((_, delta) => {
    const camera = cameraRef.current
    if (!camera) return

    if (progress.current < 1) {
      progress.current = Math.min(1, progress.current + (delta * 1000) / TRANSITION_MS)
      const t = easeInOutCubic(progress.current)
      currentPos.current.lerpVectors(startPos.current, basePos, t)
    } else {
      currentPos.current.copy(basePos)
    }

    const blend = 1 - Math.exp(-LOOK_SMOOTH * delta)
    yaw.current += (yawGoal.current - yaw.current) * blend
    pitch.current += (pitchGoal.current - pitch.current) * blend

    const sph = baseSpherical.clone()
    sph.theta += yaw.current
    sph.phi = THREE.MathUtils.clamp(
      sph.phi + pitch.current,
      baseSpherical.phi - HEAD_PITCH_MAX - 0.02,
      baseSpherical.phi + HEAD_PITCH_MAX + 0.02,
    )
    lookDir.current.setFromSpherical(sph)

    camera.position.copy(currentPos.current)
    lookTarget.current.copy(currentPos.current).add(lookDir.current)
    camera.lookAt(lookTarget.current)
    if (Math.abs(camera.fov - view.fov) > 0.05) {
      camera.fov = view.fov
      camera.updateProjectionMatrix()
    }
  })

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={view.fov}
      near={0.08}
      far={140}
      position={[basePos.x, basePos.y, basePos.z]}
    />
  )
}
