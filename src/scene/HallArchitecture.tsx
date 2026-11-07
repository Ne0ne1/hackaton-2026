import { useMemo } from 'react'
import { CEILING_HEIGHT, type HallMetrics, type SeatPlacement } from './hallGeometry'

export const HALL_COLORS = { gold: '#ff4d2e' }

export function HallArchitecture({
  metrics: m,
  placements = [],
}: {
  metrics: HallMetrics
  placements?: SeatPlacement[]
}) {
  const centerZ = (m.frontWallZ + m.backWallZ) / 2
  const centerX = (m.minX + m.maxX) / 2

  const rows = useMemo(() => {
    const result = new Map<number, { z: number; height: number; depth: number }>()
    for (const p of placements) {
      const existing = result.get(p.seat.row)
      if (!existing) {
        result.set(p.seat.row, {
          z: p.base.z,
          height: p.riserHeight,
          depth: 1.05,
        })
      } else {
        existing.z = Math.min(existing.z, p.base.z)
        existing.height = Math.max(existing.height, p.riserHeight)
      }
    }
    return [...result.entries()]
      .sort((a, b) => a[1].z - b[1].z)
      .map(([row, data]) => ({ row, ...data }))
  }, [placements])

  return (
    <group name="hall-architecture">
      {/* Пол-ковёр */}
      <mesh position={[centerX, m.floorY - 0.08, centerZ]} receiveShadow>
        <boxGeometry args={[m.width, 0.16, m.depth]} />
        <meshStandardMaterial color="#1f201a" roughness={0.98} />
      </mesh>
      <mesh position={[centerX, m.floorY + 0.005, centerZ]} receiveShadow>
        <boxGeometry args={[m.width - 0.8, 0.01, m.depth - 0.6]} />
        <meshStandardMaterial color="#26271f" roughness={1} />
      </mesh>

      {/* Ступени рядов */}
      {rows
        .filter((row) => row.height > 0.02)
        .map((row) => (
          <group key={row.row}>
            <mesh
              position={[centerX, m.floorY + row.height / 2, row.z + 0.28]}
              receiveShadow
              castShadow
            >
              <boxGeometry args={[m.width - 0.7, row.height, 1.08]} />
              <meshStandardMaterial color="#23241e" roughness={0.96} />
            </mesh>
            <mesh position={[centerX, m.floorY + row.height + 0.01, row.z - 0.22]}>
              <boxGeometry args={[m.width - 1.1, 0.02, 0.04]} />
              <meshStandardMaterial color="#303128" roughness={0.8} />
            </mesh>
            {[-1, 1].map((side) => (
              <mesh
                key={side}
                position={[
                  centerX + side * (m.width / 2 - 0.7),
                  m.floorY + row.height + 0.03,
                  row.z - 0.15,
                ]}
              >
                <boxGeometry args={[0.28, 0.03, 0.04]} />
                <meshBasicMaterial color="#ff6240" toneMapped={false} />
              </mesh>
            ))}
          </group>
        ))}

      {/* Боковые стены + акустика */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            position={[centerX + side * (m.width / 2), m.floorY + CEILING_HEIGHT / 2, centerZ]}
            receiveShadow
          >
            <boxGeometry args={[0.22, CEILING_HEIGHT, m.depth]} />
            <meshStandardMaterial color="#2c2d26" roughness={0.94} />
          </mesh>
          {Array.from({ length: 12 }, (_, i) => (
            <mesh
              key={i}
              position={[
                centerX + side * (m.width / 2 - 0.14),
                m.floorY + CEILING_HEIGHT / 2,
                m.frontWallZ + ((i + 0.5) * m.depth) / 12,
              ]}
            >
              <boxGeometry args={[0.06, CEILING_HEIGHT - 0.55, m.depth / 12 - 0.08]} />
              <meshStandardMaterial
                color={i % 2 ? '#38392f' : '#2f3028'}
                roughness={0.92}
              />
            </mesh>
          ))}
          {/* Оранжевая линия прохода */}
          <mesh
            position={[
              centerX + side * (m.width / 2 - 0.18),
              m.floorY + 0.11,
              centerZ,
            ]}
          >
            <boxGeometry args={[0.045, 0.04, m.depth - 0.5]} />
            <meshBasicMaterial color="#ff4d2e" toneMapped={false} />
          </mesh>
          {/* Мягкая подсветка прохода */}
          <pointLight
            position={[
              centerX + side * (m.width / 2 - 0.55),
              m.floorY + 0.45,
              centerZ,
            ]}
            color="#ff7a55"
            intensity={3.4}
            distance={10}
            decay={2}
          />
        </group>
      ))}

      {/* Потолок + полосы света */}
      <mesh position={[centerX, m.floorY + CEILING_HEIGHT, centerZ]}>
        <boxGeometry args={[m.width, 0.18, m.depth]} />
        <meshStandardMaterial color="#181912" roughness={1} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const z = m.frontWallZ + ((i + 1) * m.depth) / 6
        return (
          <group key={i}>
            <mesh position={[centerX, m.floorY + CEILING_HEIGHT - 0.08, z]}>
              <boxGeometry args={[m.width * 0.72, 0.04, 0.12]} />
              <meshStandardMaterial
                color="#f2efe2"
                emissive="#f0ecdc"
                emissiveIntensity={0.35}
                roughness={0.4}
              />
            </mesh>
            <pointLight
              position={[centerX, m.floorY + CEILING_HEIGHT - 0.55, z]}
              intensity={4.2}
              distance={14}
              decay={2}
              color="#fff4df"
            />
          </group>
        )
      })}

      {/* Передняя / задняя стены */}
      {[m.frontWallZ, m.backWallZ].map((z) => (
        <mesh
          key={z}
          position={[centerX, m.floorY + CEILING_HEIGHT / 2, z]}
          receiveShadow
        >
          <boxGeometry args={[m.width, CEILING_HEIGHT, 0.14]} />
          <meshStandardMaterial color="#141510" roughness={1} />
        </mesh>
      ))}

      {/* Колонны у экрана */}
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[
            centerX + side * (m.width / 2 - 0.45),
            m.floorY + 2.7,
            m.frontWallZ + 1.4,
          ]}
        >
          <mesh castShadow>
            <boxGeometry args={[0.38, 4.2, 0.38]} />
            <meshStandardMaterial color="#1a1b16" roughness={0.88} />
          </mesh>
          <mesh position={[0, 1.6, 0.2]}>
            <boxGeometry args={[0.42, 0.08, 0.08]} />
            <meshBasicMaterial color="#ff4d2e" toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
