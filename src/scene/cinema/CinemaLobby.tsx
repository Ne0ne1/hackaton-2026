/**
 * Кинозона: две интерактивные панели на боковых стенах зала.
 * Позиции считаются из HallMetrics — без магических координат вне геометрии.
 */
import type { HallMetrics } from '@/scene/hallGeometry'
import { FILMS } from './films'
import { TrailerPanel3D } from './TrailerPanel3D'

type Props = {
  metrics: HallMetrics
  /** Пользователь «в зоне» (панель видна / сцена смонтирована). */
  zoneActive: boolean
}

export function CinemaLobby({ metrics, zoneActive }: Props) {
  const midZ = (metrics.minZ + metrics.maxZ) * 0.45
  const panelY = metrics.floorY + 1.55
  // Чуть внутри боковых стен (HallArchitecture: minX - wallMarginX).
  const leftX = metrics.minX - metrics.wallMarginX + 0.12
  const rightX = metrics.maxX + metrics.wallMarginX - 0.12

  const left: [number, number, number] = [leftX, panelY, midZ]
  const right: [number, number, number] = [rightX, panelY, midZ]

  return (
    <group name="cinema-lobby">
      <TrailerPanel3D
        film={FILMS[0]}
        position={left}
        rotationY={Math.PI / 2}
        zoneActive={zoneActive}
      />
      <TrailerPanel3D
        film={FILMS[1]}
        position={right}
        rotationY={-Math.PI / 2}
        zoneActive={zoneActive}
      />
    </group>
  )
}
