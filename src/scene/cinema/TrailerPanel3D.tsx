import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Film } from './films'
import { attachMediaElement, bypassPanner, detachMediaElement, resumeAudioContext, setGraphGain, setListenerFromCamera, setSourcePosition } from './spatialAudio'
import { trailerStore } from './trailerStore'

type Props = { film: Film; position: [number,number,number]; rotationY: number; width?: number; height?: number; zoneActive: boolean }

export function TrailerPanel3D({ film, position, rotationY, width=2.4, height=1.35, zoneActive }: Props) {
  const videoRef=useRef<HTMLVideoElement | null>(null)
  const textureRef=useRef<THREE.VideoTexture | null>(null)
  const material=useRef<THREE.MeshBasicMaterial>(null)
  const mesh=useRef<THREE.Mesh>(null)
  const sourcePosition=useRef(new THREE.Vector3())
  const direction=useRef(new THREE.Vector3())
  const quaternion=useRef(new THREE.Quaternion())
  const [hover,setHover]=useState(false)
  const poster=useTexture(film.posterUrl)

  const ensureVideo=useCallback(()=>{
    if(videoRef.current)return videoRef.current
    const video=document.createElement('video')
    video.crossOrigin='anonymous'
    video.playsInline=true
    video.preload='none'
    const source=film.sources.find(item=>video.canPlayType(item.type)) ?? film.sources[0]
    video.src=source.src
    video.onended=()=>trailerStore.requestStop(film.id)
    video.onerror=()=>trailerStore.setStatus(film.id,'error','Не удалось загрузить видео. Попробуйте ещё раз.')
    videoRef.current=video
    const texture=new THREE.VideoTexture(video)
    texture.colorSpace=THREE.SRGBColorSpace
    textureRef.current=texture
    return video
  },[film])

  const play=useCallback(()=>{
    const video=ensureVideo()
    const before=trailerStore.getSnapshot()
    video.muted=before.muted
    video.volume=1
    // Both browser activation requests occur synchronously in the click handler.
    void resumeAudioContext().catch(()=>undefined)
    try{
      attachMediaElement(film.id,video)
      bypassPanner(film.id,!before.spatialEnabled)
      setGraphGain(film.id,before.muted?0:before.volume)
    }catch{
      video.volume=before.volume
    }
    trailerStore.requestPlay(film.id)
    const pending=video.play()
    void pending.catch(error=>{
      if(error?.name==='AbortError')return
      if(trailerStore.getSnapshot().activeFilmId===film.id)
        trailerStore.setStatus(film.id,'error','Не удалось запустить видео. Нажмите «Смотреть трейлер» ещё раз.')
    })
  },[ensureVideo,film.id])

  useEffect(()=>{
    const unsubscribe=trailerStore.subscribe(snap=>{
      const video=videoRef.current
      if(!video)return
      if(snap.activeFilmId!==film.id || snap.statuses[film.id]!=='playing')video.pause()
      video.muted=snap.muted
      bypassPanner(film.id,!snap.spatialEnabled)
      setGraphGain(film.id,snap.muted?0:snap.volume)
    })
    const onPlay=(event:Event)=>{
      if((event as CustomEvent<{id:string}>).detail?.id===film.id)play()
    }
    const onRestart=(event:Event)=>{
      if((event as CustomEvent<{id:string}>).detail?.id===film.id && videoRef.current)videoRef.current.currentTime=0
    }
    window.addEventListener('cinema:ensure-video',onPlay)
    window.addEventListener('cinema:restart-video',onRestart)
    return ()=>{
      unsubscribe()
      window.removeEventListener('cinema:ensure-video',onPlay)
      window.removeEventListener('cinema:restart-video',onRestart)
      trailerStore.requestPause(film.id)
      const video=videoRef.current
      if(video){video.pause();video.onerror=null;video.onended=null;video.removeAttribute('src');video.load()}
      detachMediaElement(film.id)
      textureRef.current?.dispose()
      videoRef.current=null
      textureRef.current=null
    }
  },[film.id,play])

  useEffect(()=>{if(!zoneActive){videoRef.current?.pause();trailerStore.requestPause(film.id)}},[zoneActive,film.id])
  useFrame(({camera})=>{
    if(material.current){
      const map=videoRef.current && videoRef.current.readyState>=2 ? textureRef.current : poster
      if(material.current.map!==map){material.current.map=map;material.current.needsUpdate=true}
    }
    if(mesh.current && trailerStore.getSnapshot().activeFilmId===film.id && videoRef.current){
      mesh.current.getWorldPosition(sourcePosition.current)
      mesh.current.getWorldQuaternion(quaternion.current)
      direction.current.set(0,0,1).applyQuaternion(quaternion.current)
      setSourcePosition(film.id,sourcePosition.current,direction.current)
      setListenerFromCamera(camera)
    }
  })
  return <group position={position} rotation={[0,rotationY,0]}>
    <mesh position={[0,0,-.06]}><boxGeometry args={[width+.12,height+.12,.1]}/><meshStandardMaterial color={hover?'#ff4d2e':'#24261f'} roughness={.8}/></mesh>
    <mesh ref={mesh} onPointerOver={event=>{event.stopPropagation();setHover(true)}} onPointerOut={()=>setHover(false)} onClick={event=>{event.stopPropagation();play()}}>
      <planeGeometry args={[width,height]}/><meshBasicMaterial ref={material} map={poster} toneMapped={false}/>
    </mesh>
  </group>
}
