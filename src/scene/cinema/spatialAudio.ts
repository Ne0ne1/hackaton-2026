/**
 * Позиционный звук через Web Audio API (HRTF).
 * Один AudioContext на приложение; на каждый трейлер — source → panner → gain → destination.
 */
import * as THREE from 'three'

type Graph = {
  source: MediaElementAudioSourceNode
  panner: PannerNode
  gain: GainNode
  element: HTMLMediaElement
}

let sharedCtx: AudioContext | null = null
const graphs = new Map<string, Graph>()

function getCtx(): AudioContext {
  if (!sharedCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    sharedCtx = new Ctx()
  }
  return sharedCtx
}

export async function resumeAudioContext(): Promise<void> {
  const ctx = getCtx()
  if (ctx.state === 'suspended') await ctx.resume()
}

export function attachMediaElement(
  id: string,
  element: HTMLMediaElement,
): Graph {
  const existing = graphs.get(id)
  if (existing && existing.element === element) return existing
  if (existing) detachMediaElement(id)

  const ctx = getCtx()
  const source = ctx.createMediaElementSource(element)
  const panner = ctx.createPanner()
  panner.panningModel = 'HRTF'
  panner.distanceModel = 'inverse'
  panner.refDistance = 2
  panner.maxDistance = 25
  panner.rolloffFactor = 1.2
  panner.coneInnerAngle = 90
  panner.coneOuterAngle = 180
  panner.coneOuterGain = 0.25

  const gain = ctx.createGain()
  gain.gain.value = 0.85

  source.connect(panner)
  panner.connect(gain)
  gain.connect(ctx.destination)

  const graph = { source, panner, gain, element }
  graphs.set(id, graph)
  return graph
}

export function detachMediaElement(id: string) {
  const graph = graphs.get(id)
  if (!graph) return
  try {
    graph.source.disconnect()
    graph.panner.disconnect()
    graph.gain.disconnect()
  } catch {
    /* already disconnected */
  }
  graphs.delete(id)
}

export function setSourcePosition(
  id: string,
  position: THREE.Vector3,
  forward: THREE.Vector3,
) {
  const graph = graphs.get(id)
  if (!graph) return
  const ctx = getCtx()
  const now = ctx.currentTime
  const p = graph.panner
  p.positionX.setTargetAtTime(position.x, now, 0.03)
  p.positionY.setTargetAtTime(position.y, now, 0.03)
  p.positionZ.setTargetAtTime(position.z, now, 0.03)
  p.orientationX.setTargetAtTime(forward.x, now, 0.03)
  p.orientationY.setTargetAtTime(forward.y, now, 0.03)
  p.orientationZ.setTargetAtTime(forward.z, now, 0.03)
}

export function setListenerFromCamera(camera: THREE.Camera) {
  const ctx = getCtx()
  const listener = ctx.listener
  const pos = camera.position
  const forward = new THREE.Vector3()
  const up = new THREE.Vector3()
  camera.getWorldDirection(forward)
  up.copy(camera.up).applyQuaternion(camera.quaternion).normalize()
  const now = ctx.currentTime

  listener.positionX.setTargetAtTime(pos.x, now, 0.02)
  listener.positionY.setTargetAtTime(pos.y, now, 0.02)
  listener.positionZ.setTargetAtTime(pos.z, now, 0.02)
  listener.forwardX.setTargetAtTime(forward.x, now, 0.02)
  listener.forwardY.setTargetAtTime(forward.y, now, 0.02)
  listener.forwardZ.setTargetAtTime(forward.z, now, 0.02)
  listener.upX.setTargetAtTime(up.x, now, 0.02)
  listener.upY.setTargetAtTime(up.y, now, 0.02)
  listener.upZ.setTargetAtTime(up.z, now, 0.02)
}

export function setGraphGain(id: string, value: number, _spatialEnabled = true) {
  const graph = graphs.get(id)
  if (!graph) return
  const ctx = getCtx()
  graph.gain.gain.cancelScheduledValues(ctx.currentTime)
  graph.gain.gain.setTargetAtTime(value, ctx.currentTime, 0.04)
}

export function bypassPanner(id: string, bypass: boolean) {
  const graph = graphs.get(id)
  if (!graph) return
  try {
    graph.source.disconnect()
    graph.panner.disconnect()
  } catch {
    /* ignore */
  }
  if (bypass) {
    graph.source.connect(graph.gain)
  } else {
    graph.source.connect(graph.panner)
    graph.panner.connect(graph.gain)
  }
}

export function disposeAllSpatialAudio() {
  for (const id of [...graphs.keys()]) detachMediaElement(id)
  if (sharedCtx) {
    void sharedCtx.close()
    sharedCtx = null
  }
}
