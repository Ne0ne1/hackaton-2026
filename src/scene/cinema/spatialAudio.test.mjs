import test from 'node:test'
import assert from 'node:assert/strict'

/**
 * Программная проверка контракта spatialAudio без реального AudioContext.
 * HRTF / направление звука требует ручной проверки в браузере.
 */
test('spatialAudio exports API для HRTF-графа', async () => {
  const mod = await import('./spatialAudio.ts')
  for (const name of [
    'resumeAudioContext',
    'attachMediaElement',
    'detachMediaElement',
    'setSourcePosition',
    'setListenerFromCamera',
    'setGraphGain',
    'bypassPanner',
    'disposeAllSpatialAudio',
  ]) {
    assert.equal(typeof mod[name], 'function', name)
  }
})
