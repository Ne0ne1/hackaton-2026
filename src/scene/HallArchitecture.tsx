/**
 * Архитектура кинозала: пол, боковые и задняя стены, потолок, передняя стена
 * с акустическими панелями и мягкой подсветкой проходов.
 *
 * Все размеры берутся из `HallMetrics`, который вычислен из `HallGeometry`.
 */
import { useMemo } from 'react'
import { CEILING_HEIGHT, type HallMetrics, type SeatPlacement } from './hallGeometry'

/** Цветовая палитра зала — глубокие зелёные и графитовые тона. */
export const HALL_COLORS = {
  floor: '#141b18',
  floorCarpet: '#1b2620',
  wall: '#1a2320',
  wallLower: '#131a17',
  ceiling: '#0f1512',
  panel: '#243029',
  trim: '#3c4a41',
  gold: '#c4a35a',
  aisleLight: '#d8b978',
}

type Props = {
  metrics: HallMetrics
  /** Расстановка кресел — нужна для построения ступеней рядов. */
  placements?: SeatPlacement[]
}

export function HallArchitecture({ metrics, placements = [] }: Props) {
  // Подиумы рядов: если места в ряду стоят выше базового пола,
  // под ним делается ступень. Полностью выводится из данных зала.
  const risers = useMemo(() => {
    const byRow = new Map<
      number,
      { row: number; height: number; z: number; minX: number; maxX: number }
    >()
    for (const placement of placements) {
      const height = placement.riserHeight
      if (height <= 0.001) continue
      const row = placement.seat.row
      const existing = byRow.get(row)
      if (existing) {
        existing.height = Math.max(existing.height, height)
        existing.minX = Math.min(existing.minX, placement.base.x)
        existing.maxX = Math.max(existing.maxX, placement.base.x)
      } else {
        byRow.set(row, {
          row,
          height,
          z: placement.base.z,
          minX: placement.base.x,
          maxX: placement.base.x,
        })
      }
    }
    return [...byRow.values()]
      .sort((a, b) => a.z - b.z)
      .map((riser) => ({
        row: riser.row,
        height: riser.height,
        z: riser.z,
        depth: 1.0,
      }))
  }, [placements])
  const {
    floorY,
    minX,
    maxX,
    frontWallZ,
    backWallZ,
    wallMarginX,
    width,
    depth,
    aisleXs,
    aisleRadius,
  } = metrics

  const wallHeight = CEILING_HEIGHT
  const leftWallX = minX - wallMarginX
  const rightWallX = maxX + wallMarginX
  const centerX = (leftWallX + rightWallX) / 2
  const centerZ = (frontWallZ + backWallZ) / 2

  // Акустические панели на боковых стенах — вертикальные полосы.
  const panels = useMemo(() => {
    const count = 14
    const result: { z: number }[] = []
    const usableDepth = backWallZ - frontWallZ - 1.2
    for (let i = 0; i < count; i += 1) {
      const t = (i + 0.5) / count
      result.push({ z: frontWallZ + 0.6 + t * usableDepth })
    }
    return result
  }, [frontWallZ, backWallZ])

  return (
    <group>
      {/* ---------- Пол ---------- */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, floorY, centerZ]}
        receiveShadow
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={HALL_COLORS.floor} roughness={0.95} metalness={0.02} />
      </mesh>

      {/* Ковровое покрытие зоны seating. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, floorY + 0.005, centerZ]}
        receiveShadow
      >
        <planeGeometry args={[width - 2 * wallMarginX * 0.6, depth * 0.86]} />
        <meshStandardMaterial
          color={HALL_COLORS.floorCarpet}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* ---------- Боковые стены ---------- */}
      {[
        { x: leftWallX, ry: Math.PI / 2 },
        { x: rightWallX, ry: -Math.PI / 2 },
      ].map((wall) => (
        <group key={wall.x} position={[wall.x, floorY, centerZ]} rotation={[0, wall.ry, 0]}>
          <mesh position={[0, wallHeight / 2, 0]} receiveShadow>
            <planeGeometry args={[depth, wallHeight]} />
            <meshStandardMaterial color={HALL_COLORS.wall} roughness={0.9} metalness={0.03} />
          </mesh>
          {/* Нижняя панель — более тёмная, как в дорогих залах. */}
          <mesh position={[0, 0.45, 0.03]} receiveShadow>
            <planeGeometry args={[depth, 0.9]} />
            <meshStandardMaterial color={HALL_COLORS.wallLower} roughness={0.85} />
          </mesh>
          {/* Декоративная полоса с золотым отливом. */}
          <mesh position={[0, 0.92, 0.04]}>
            <planeGeometry args={[depth, 0.05]} />
            <meshStandardMaterial
              color={HALL_COLORS.trim}
              roughness={0.5}
              metalness={0.35}
              emissive={HALL_COLORS.gold}
              emissiveIntensity={0.06}
            />
          </mesh>
        </group>
      ))}

      {/* ---------- Задняя стена ---------- */}
      <mesh
        position={[centerX, floorY + wallHeight / 2, backWallZ]}
        rotation={[0, Math.PI, 0]}
        receiveShadow
      >
        <planeGeometry args={[width, wallHeight]} />
        <meshStandardMaterial color={HALL_COLORS.wall} roughness={0.92} />
      </mesh>

      {/* ---------- Передняя стена (за экраном) ---------- */}
      <mesh
        position={[centerX, floorY + wallHeight / 2, frontWallZ]}
        receiveShadow
      >
        <planeGeometry args={[width, wallHeight]} />
        <meshStandardMaterial color={HALL_COLORS.wallLower} roughness={0.94} />
      </mesh>

      {/* ---------- Потолок ---------- */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[centerX, floorY + wallHeight, centerZ]}
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={HALL_COLORS.ceiling} roughness={0.95} />
      </mesh>

      {/* ---------- Акустические панели на боковых стенах ---------- */}
      {panels.map((panel, i) => (
        <group key={panel.z}>
          {[
            { x: leftWallX + 0.06, ry: Math.PI / 2 },
            { x: rightWallX - 0.06, ry: -Math.PI / 2 },
          ].map((wall) => (
            <mesh
              key={`${wall.x}-${i}`}
              position={[wall.x, floorY + wallHeight * 0.52, panel.z]}
              rotation={[0, wall.ry, 0]}
              receiveShadow
            >
              <boxGeometry args={[0.14, wallHeight * 0.52, 0.12]} />
              <meshStandardMaterial color={HALL_COLORS.panel} roughness={0.94} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ---------- Ступени (подиум рядов) ---------- */}
      {risers.map((riser) => (
        <mesh
          key={`riser-${riser.row}`}
          position={[centerX, floorY + riser.height / 2, riser.z]}
          receiveShadow
        >
          <boxGeometry args={[width - 2 * wallMarginX * 0.5, riser.height, riser.depth]} />
          <meshStandardMaterial color={HALL_COLORS.floorCarpet} roughness={0.98} />
        </mesh>
      ))}

      {/* ---------- Подсветка проходов ---------- */}
      {aisleXs.map((x) => (
        <group key={x}>
          {/* Светящаяся полоса вдоль прохода. */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[x, floorY + 0.012, centerZ]}
          >
            <planeGeometry args={[aisleRadius * 0.5, depth * 0.8]} />
            <meshStandardMaterial
              color={HALL_COLORS.aisleLight}
              emissive={HALL_COLORS.aisleLight}
              emissiveIntensity={0.35}
              roughness={0.6}
              transparent
              opacity={0.5}
            />
          </mesh>
          {/* Точечные «лампочки» по длине прохода — мягкий тёплый свет. */}
          {Array.from({ length: 5 }).map((_, i) => {
            const t = (i + 0.5) / 5
            const z = frontWallZ + 0.8 + t * (backWallZ - frontWallZ - 1.6)
            return (
              <pointLight
                key={i}
                ref={(node) => {
                  if (node) node.position.set(x, floorY + 0.35, z)
                }}
                color={HALL_COLORS.aisleLight}
                intensity={0.5}
                distance={2.6}
                decay={2}
              />
            )
          })}
        </group>
      ))}
    </group>
  )
}

