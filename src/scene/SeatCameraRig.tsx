/**
 * Камера с места зрителя.
 *
 * КРИТИЧНО: в R3F активная камера — та, что помечена `makeDefault`.
 * Раньше позиция выставлялась на `useThree().camera`, а рендерилась отдельная
 * `<PerspectiveCamera makeDefault>` — это разные объекты, из-за чего камера
 * «отъезжала» от выбранного места. Здесь камера ровно одна и ею же управляем.
 *
 * Плавный переезд: позиция и цель интерполируются в `useFrame` (реальное время,
 * независимо от частоты рендера), а `fov` подтягивается к целевому.
 */
import { PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SeatCameraView, Vec3 } from '@/types/hall'

/** Длительность переезда камеры, мс. */
const TRANSITION_MS = 900

/** Настройки общего обзора зала, когда место не выбрано. */
export type OverviewCamera = {
  position: Vec3
  target: Vec3
  fov: number
}

type Props = {
  view: SeatCameraView | null
  overview: OverviewCamera
  /** Отключить анимацию (например, при уважении к prefers-reduced-motion). */
  instant?: boolean
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function SeatCameraRig({ view, overview, instant = false }: Props) {
  // Камера, которой мы управляем: та же, что активна в R3F.
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera

  const targetPos = useMemo<THREE.Vector3>(
    () =>
      new THREE.Vector3(
        view?.position.x ?? overview.position.x,
        view?.position.y ?? overview.position.y,
        view?.position.z ?? overview.position.z,
      ),
    [view, overview],
  )
  const targetLook = useMemo<THREE.Vector3>(
    () =>
      new THREE.Vector3(
        view?.target.x ?? overview.target.x,
        view?.target.y ?? overview.target.y,
        view?.target.z ?? overview.target.z,
      ),
    [view, overview],
  )
  const targetFov = view?.fov ?? overview.fov

  // Текущее состояние камеры (анимируется).
  const currentPos = useRef(new THREE.Vector3())
  const currentLook = useRef(new THREE.Vector3())
  const currentFov = useRef(targetFov)
  const progress = useRef(1)

  // Инициализация: сразу ставим камеру в целевую точку, чтобы первый кадр
  // не показывал «прыжок» из предыдущего места.
  useEffect(() => {
    camera.position.copy(targetPos)
    camera.lookAt(targetLook)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = targetFov
      camera.updateProjectionMatrix()
    }
    currentPos.current.copy(targetPos)
    currentLook.current.copy(targetLook)
    currentFov.current = targetFov
    progress.current = 1
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera])

  // Смена цели — запускаем переход.
  useEffect(() => {
    progress.current = instant ? 1 : 0
    if (instant) {
      currentPos.current.copy(targetPos)
      currentLook.current.copy(targetLook)
      currentFov.current = targetFov
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPos, targetLook, targetFov, instant])

  useFrame((_, delta) => {
    if (progress.current < 1) {
      const step = Math.min(1, (delta * 1000) / TRANSITION_MS)
      progress.current = Math.min(1, progress.current + step)
      const t = easeInOutCubic(progress.current)

      currentPos.current.lerp(targetPos, t)
      currentLook.current.lerp(targetLook, t)
      currentFov.current += (targetFov - currentFov.current) * t
    } else {
      // После анимации камера точно соответствует выбранному месту.
      currentPos.current.copy(targetPos)
      currentLook.current.copy(targetLook)
      currentFov.current = targetFov
    }

    camera.position.copy(currentPos.current)
    camera.lookAt(currentLook.current)

    if (camera instanceof THREE.PerspectiveCamera) {
      if (Math.abs(camera.fov - currentFov.current) > 0.01) {
        camera.fov = currentFov.current
        camera.updateProjectionMatrix()
      }
    }
  })

  return (
    <PerspectiveCamera
      makeDefault
      fov={targetFov}
      near={0.1}
      far={120}
      position={[targetPos.x, targetPos.y, targetPos.z]}
    />
  )
}
