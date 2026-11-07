/**
 * Экран кинозала.
 *
 * Размеры и положение берутся строго из `hall.screen` — экран не искажается
 * и не растягивается: плоскость имеет ровно `width × height`.
 * Вокруг — мягкое свечение, отражающееся на стенах и креслах.
 */
import { useMemo } from 'react'
import type { HallGeometry } from '@/types/hall'

type Props = {
  hall: HallGeometry
}

export function ScreenPanel({ hall }: Props) {
  const { width, height, position } = hall.screen

  // Тёплый оттенок свечения, чтобы свет экрана не выглядел дешёвым синим.
  const glowColor = '#ffe9bd'

  // Позиция источника света — чуть перед экраном, чтобы подсвечивать зал.
  const lightPosition = useMemo<[number, number, number]>(
    () => [position.x, position.y, position.z + 1.6],
    [position.x, position.y, position.z],
  )

  return (
    <group>
      {/* ---------- Излучающая поверхность экрана ----------
          Экран светится мягко, без пересвета: тёплое белое полотно
          с затемнением по краям, как настоящее киношное полотно. */}
      <mesh position={[position.x, position.y, position.z]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color="#d8d2c2"
          emissive={glowColor}
          emissiveIntensity={0.42}
          roughness={0.42}
          metalness={0}
        />
      </mesh>


      {/* Верхняя и нижняя «шторки» — придают экрану вид настоящего полотна. */}
      <mesh position={[position.x, position.y + height / 2 + 0.3, position.z - 0.02]}>
        <planeGeometry args={[width + 0.5, 0.6]} />
        <meshStandardMaterial color="#0f1512" roughness={0.88} />
      </mesh>
      <mesh position={[position.x, position.y - height / 2 - 0.16, position.z - 0.02]}>
        <planeGeometry args={[width + 0.5, 0.32]} />
        <meshStandardMaterial color="#0f1512" roughness={0.88} />
      </mesh>


      {/* ---------- Мягкое свечение от экрана ---------- */}
      <pointLight
        ref={(node) => {
          if (node) node.position.set(...lightPosition)
        }}
        color={glowColor}
        intensity={6.5}
        distance={24}
        decay={1.6}
      />
      {/* Широкий слабый свет, чтобы экран оставался читаемым с последнего ряда. */}
      <pointLight
        ref={(node) => {
          if (node) node.position.set(position.x, position.y, position.z + 2.4)
        }}
        color="#ffeccc"
        intensity={3.2}
        distance={28}
        decay={1.15}
      />
    </group>
  )
}
