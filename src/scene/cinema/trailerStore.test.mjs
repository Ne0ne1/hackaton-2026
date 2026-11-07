import test from 'node:test'
import assert from 'node:assert/strict'

/**
 * Лёгкий тест store без DOM: динамический импорт TS через strip-types.
 * Запуск: node --experimental-strip-types --test src/scene/cinema/trailerStore.test.mjs
 */
test('trailerStore: одновременно активен только один фильм', async () => {
  const { trailerStore } = await import('./trailerStore.ts')

  trailerStore.requestPlay('sintel')
  let snap = trailerStore.getSnapshot()
  assert.equal(snap.activeFilmId, 'sintel')
  assert.equal(snap.statuses.sintel, 'playing')

  trailerStore.requestPlay('big-buck-bunny')
  snap = trailerStore.getSnapshot()
  assert.equal(snap.activeFilmId, 'big-buck-bunny')
  assert.equal(snap.statuses['big-buck-bunny'], 'playing')
  assert.equal(snap.statuses.sintel, 'paused')

  trailerStore.pauseActive()
  snap = trailerStore.getSnapshot()
  assert.equal(snap.statuses['big-buck-bunny'], 'paused')
})
