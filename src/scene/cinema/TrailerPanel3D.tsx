/**
 * 3D-панель фильма: постер / video texture + hover-подсветка.
 * Видео создаётся лениво (preload=metadata) только после первого «Смотреть».
 */
import { useFrame } from '@react-three/fiber'
import { Html, useTexture } from '@react-three/drei'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Film } from './films'
import {
  attachMediaElement,
  bypassPanner,
  detachMediaElement,
  resumeAudioContext,
  setGraphGain,
  setListenerFromCamera,
  setSourcePosition,
} from './spatialAudio'
import { trailerStore, type TrailerSnapshot } from './trailerStore'

type Props = {
  film: Film
  position: [number, number, number]
  rotationY: number
  width?: number
  height?: number
  zoneActive: boolean
}

export function TrailerPanel3D({
  film,
  position,
  rotationY,
  width = 2.4,
  height = 1.35,
  zoneActive,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const textureRef = useRef<THREE.VideoTexture | null>(null)
  const worldPos = useMemo(() => new THREE.Vector3(), [])
  const worldQuat = useMemo(() => new THREE.Quaternion(), [])
  const forward = useMemo(() => new THREE.Vector3(), [])
  const [hover, setHover] = useState(false)
  const [snap, setSnap] = useState<TrailerSnapshot>(() => trailerStore.getSnapshot())
  const poster = useTexture(film.posterUrl)
  poster.colorSpace = THREE.SRGBColorSpace

  const isActive = snap.activeFilmId === film.id
  const status = snap.statuses[film.id]
  const playing = isActive && status === 'playing'

  useEffect(() => trailerStore.subscribe(setSnap), [])

  const ensureVideo = useCallback(() => {
    if (videoRef.current) return videoRef.current
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.playsInline = true
    video.preload = 'metadata'
    video.loop = false
    for (const source of film.sources) {
      const el = document.createElement('source')
      el.src = source.src
      el.type = source.type
      video.appendChild(el)
    }
    video.addEventListener('error', () => {
      trailerStore.setStatus(film.id, 'error', 'Видео недоступно')
    })
    video.addEventListener('loadeddata', () => {
      if (trailerStore.getSnapshot().statuses[film.id] === 'loading') {
        trailerStore.setStatus(film.id, 'ready')
      }
    })
    video.addEventListener('ended', () => {
      trailerStore.requestStop(film.id)
    })
    videoRef.current = video
    return video
  }, [film.id, film.sources])

  useEffect(() => {
    const onEnsure = (ev: Event) => {
      const detail = (ev as CustomEvent<{ id: string; play?: boolean }>).detail
      if (detail?.id !== film.id) return
      void (async () => {
        trailerStore.unlockAudio()
        await resumeAudioContext()
        const video = ensureVideo()
        const alreadyReady =
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
        if (!alreadyReady) trailerStore.setStatus(film.id, 'loading')
        try {
          if (!alreadyReady) video.load()
          attachMediaElement(film.id, video)
          bypassPanner(film.id, !trailerStore.getSnapshot().spatialEnabled)
          if (detail.play) trailerStore.requestPlay(film.id)
        } catch {
          trailerStore.setStatus(film.id, 'error', 'Не удалось подготовить трейлер')
        }
      })()
    }
    const onRestart = (ev: Event) => {
      const id = (ev as CustomEvent<{ id: string }>).detail?.id
      if (id !== film.id) return
      const video = ensureVideo()
      video.currentTime = 0
    }
    window.addEventListener('cinema:ensure-video', onEnsure)
    window.addEventListener('cinema:restart-video', onRestart)
    return () => {
      window.removeEventListener('cinema:ensure-video', onEnsure)
      window.removeEventListener('cinema:restart-video', onRestart)
    }
  }, [film.id, ensureVideo])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const run = async () => {
      video.muted = snap.muted
      // При spatial gain управляет Web Audio; element.volume оставляем 1.
      video.volume = snap.spatialEnabled ? 1 : snap.volume

      if (isActive && status === 'playing' && zoneActive) {
        await resumeAudioContext()
        try {
          attachMediaElement(film.id, video)
          bypassPanner(film.id, !snap.spatialEnabled)
          setGraphGain(film.id, snap.muted ? 0 : snap.volume, snap.spatialEnabled)
          await video.play()
        } catch {
          trailerStore.setStatus(
            film.id,
            'error',
            'Автозапуск заблокирован — нажмите «Смотреть» ещё раз',
          )
        }
      } else if (status === 'paused' || !zoneActive) {
        video.pause()
      } else if (!isActive) {
        video.pause()
      }
    }
    void run()
  }, [isActive, status, zoneActive, snap.muted, snap.volume, snap.spatialEnabled, film.id])

  useEffect(() => {
    return () => {
      const video = videoRef.current
      if (video) {
        video.pause()
        while (video.firstChild) video.removeChild(video.firstChild)
        video.removeAttribute('src')
        video.load()
      }
      textureRef.current?.dispose()
      detachMediaElement(film.id)
      videoRef.current = null
      textureRef.current = null
    }
  }, [film.id])

  const screenMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: poster,
      emissiveMap: poster,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.35,
      roughness: 0.55,
      metalness: 0.05,
      toneMapped: false,
    })
  }, [poster])

  useEffect(() => {
    return () => {
      screenMaterial.dispose()
    }
  }, [screenMaterial])

  useFrame(({ camera }) => {
    if (playing && videoRef.current && !videoRef.current.paused) {
      if (!textureRef.current) {
        const tex = new THREE.VideoTexture(videoRef.current)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        textureRef.current = tex
        screenMaterial.map = tex
        screenMaterial.emissiveMap = tex
        screenMaterial.needsUpdate = true
      } else {
        textureRef.current.needsUpdate = true
      }
    } else if (!playing && screenMaterial.map !== poster) {
      if (textureRef.current) {
        textureRef.current.dispose()
        textureRef.current = null
      }
      screenMaterial.map = poster
      screenMaterial.emissiveMap = poster
      screenMaterial.needsUpdate = true
    }

    const targetIntensity = hover || playing ? 0.72 : 0.35
    screenMaterial.emissiveIntensity +=
      (targetIntensity - screenMaterial.emissiveIntensity) * 0.12
    if (lightRef.current) {
      lightRef.current.intensity +=
        ((hover || playing ? 4.5 : 1.2) - lightRef.current.intensity) * 0.1
    }

    if (meshRef.current && isActive) {
      meshRef.current.getWorldPosition(worldPos)
      meshRef.current.getWorldQuaternion(worldQuat)
      forward.set(0, 0, 1).applyQuaternion(worldQuat).normalize()
      setSourcePosition(film.id, worldPos, forward)
      setListenerFromCamera(camera)
      setGraphGain(film.id, snap.muted ? 0 : snap.volume, snap.spatialEnabled)
    }
  })

  const onWatch = async (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    trailerStore.unlockAudio()
    await resumeAudioContext()
    const video = ensureVideo()
    trailerStore.setStatus(film.id, 'loading')
    try {
      video.load()
      attachMediaElement(film.id, video)
      bypassPanner(film.id, !trailerStore.getSnapshot().spatialEnabled)
      trailerStore.requestPlay(film.id)
    } catch {
      trailerStore.setStatus(film.id, 'error', 'Не удалось подготовить трейлер')
    }
  }

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[width + 0.16, height + 0.16, 0.08]} />
        <meshStandardMaterial color="#1a1510" roughness={0.7} metalness={0.2} />
      </mesh>

      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = 'auto'
        }}
        onClick={onWatch}
      >
        <planeGeometry args={[width, height]} />
        <primitive object={screenMaterial} attach="material" />
      </mesh>

      <pointLight
        ref={lightRef}
        position={[0, 0, 0.9]}
        color="#ffe2b0"
        intensity={1.2}
        distance={8}
        decay={2}
      />

      <Html
        position={[0, -height * 0.5 - 0.18, 0.05]}
        center
        distanceFactor={8}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          style={{
            minWidth: '11rem',
            textAlign: 'center',
            color: '#f3e7d2',
            textShadow: '0 1px 8px rgba(0,0,0,0.85)',
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        >
          <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{film.title}</div>
          <div style={{ fontSize: '0.68rem', opacity: 0.82, marginTop: 2 }}>
            {film.genre}
          </div>
          {(status === 'loading' || status === 'error') && (
            <div
              style={{
                fontSize: '0.65rem',
                marginTop: 4,
                color: status === 'error' ? '#ff8f8f' : '#e0b66a',
              }}
            >
              {status === 'loading'
                ? 'Загрузка…'
                : (snap.errorMessage ?? 'Ошибка')}
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}
