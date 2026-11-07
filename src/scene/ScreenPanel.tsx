import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { HallGeometry } from '@/types/hall'

/** Яркий тестовый кадр на экране без кастомных шейдеров. */
function ScreenPicture({ width, height }: { width: number; height: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useMemo(() => {
    const w = 1280
    const h = Math.max(512, Math.round(1280 * (height / width)))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { alpha: false })!
    ctx.fillStyle = '#f1eee4'
    ctx.fillRect(0, 0, w, h)

    const cx = w / 2
    const cy = h / 2
    const r = Math.min(w, h) * 0.2

    ctx.fillStyle = '#ff4d2e'
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, -Math.PI / 2, 0)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = '#12140f'
    ctx.lineWidth = Math.max(3, w * 0.004)
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx - r * 1.4, cy)
    ctx.lineTo(cx + r * 1.4, cy)
    ctx.moveTo(cx, cy - r * 1.4)
    ctx.lineTo(cx, cy + r * 1.4)
    ctx.stroke()

    const map = new THREE.CanvasTexture(canvas)
    map.colorSpace = THREE.SRGBColorSpace
    map.needsUpdate = true
    return map
  }, [width, height])

  useLayoutEffect(() => {
    return () => {
      texture.dispose()
    }
  }, [texture])

  return (
    <mesh ref={meshRef} position={[0, 0, 0.01]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

export function ScreenPanel({ hall }: { hall: HallGeometry }) {
  const { width, height, position } = hall.screen

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh position={[0, 0, -0.16]}>
        <boxGeometry args={[width + 0.55, height + 0.55, 0.3]} />
        <meshStandardMaterial color="#080907" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[width + 0.24, height + 0.24, 0.1]} />
        <meshStandardMaterial color="#161812" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Запасной светлый фон, если текстура ещё грузится */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#f1eee4" toneMapped={false} />
      </mesh>
      <ScreenPicture width={width} height={height} />
      <pointLight position={[0, 0.4, 2.8]} color="#f7eed9" intensity={40} distance={24} decay={1.5} />
      <spotLight
        position={[0, 1.2, 4]}
        angle={0.55}
        penumbra={0.5}
        intensity={18}
        color="#fff1d8"
        distance={28}
      />
    </group>
  )
}
