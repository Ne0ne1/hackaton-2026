/**
 * Тесты модуля SeatMatch.
 *
 * Запуск без дополнительных зависимостей (встроенный node:test):
 *   node --experimental-strip-types --test src/experience/seatMatch/seatMatch.test.mjs
 *
 * Node 22.18+ и новее умеют type-stripping без флага.
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  centrality,
  recommendSeats,
  seatAngleDeg,
  viewQuality,
} from './seatMatchEngine.ts'

/** Мини-геометрия зала для тестов: 3 ряда по 5 мест, экран спереди. */
const HALL = {
  id: 'test-hall',
  name: 'Тестовый зал',
  rows: 3,
  seatsPerRow: 5,
  screen: { width: 10, height: 4.2, position: { x: 0, y: 2.4, z: -11 } },
  speakers: [],
  seats: [],
}

function makeSeat(id, row, number, category, price, x, z, status = 'free') {
  return {
    id,
    row,
    number,
    category,
    price,
    position: { x, y: 1.15, z },
    lookAt: { x: 0, y: 1.6, z: -11 },
    status,
  }
}

/** Расстояние до экрана — тот же расчёт, что в движке. */
function distanceToScreen(seat, hall) {
  const dx = seat.position.x - hall.screen.position.x
  const dz = seat.position.z - hall.screen.position.z
  return Math.round(Math.hypot(dx, dz) * 10) / 10
}

const SEATS = [
  // Ряд 1 (близко, VIP, дорого).
  makeSeat('R1-S1', 1, 1, 'vip', 650, -1.8, -4.2),
  makeSeat('R1-S3', 1, 3, 'vip', 650, 0, -4.2),
  // Ряд 2 — центральное место, комфорт.
  makeSeat('R2-S3', 2, 3, 'comfort', 480, 0, -3.15),
  makeSeat('R2-S1', 2, 1, 'comfort', 480, -1.8, -3.15),
  // Ряд 3 — крайнее место, стандарт, дешёвое.
  makeSeat('R3-S5', 3, 5, 'standard', 350, 1.8, -2.1),
  makeSeat('R3-S3', 3, 3, 'standard', 350, 0, -2.1),
  // Занятые места — не должны попасть в рекомендации.
  makeSeat('R2-S2', 2, 2, 'comfort', 480, -0.9, -3.15, 'sold'),
  makeSeat('R1-S2', 1, 2, 'vip', 650, -0.9, -4.2, 'sold'),
]

test('занятые места исключаются из рекомендаций', () => {
  const result = recommendSeats(SEATS, HALL, { limit: 10 })

  assert.equal(result.freeCount, 6)
  const ids = result.recommendations.map((r) => r.seat.id)
  assert.ok(!ids.includes('R2-S2'), 'занятое R2-S2 не должно рекомендоваться')
  assert.ok(!ids.includes('R1-S2'), 'занятое R1-S2 не должно рекомендоваться')
  assert.equal(result.recommendations.length, 6)
  assert.ok(
    result.recommendations.every((r) => r.seat.status === 'free'),
    'в рекомендациях только свободные места',
  )
})

test('если свободных мест нет — пустой результат', () => {
  const allSold = SEATS.map((s) => ({ ...s, status: 'sold' }))
  const result = recommendSeats(allSold, HALL)

  assert.deepEqual(result.recommendations, [])
  assert.equal(result.freeCount, 0)
  assert.equal(result.medianPrice, 0)
})

test('угол обзора: центральное место — 0°, крайнее — больше', () => {
  const center = SEATS.find((s) => s.id === 'R2-S3')
  const edge = SEATS.find((s) => s.id === 'R3-S5')

  assert.equal(seatAngleDeg(center, HALL), 0)
  assert.ok(seatAngleDeg(edge, HALL) > 0, 'крайнее место должно иметь ненулевой угол')
  assert.ok(seatAngleDeg(edge, HALL) < 90, 'угол не должен превышать 90°')
})

test('качество обзора: центр лучше края', () => {
  const center = SEATS.find((s) => s.id === 'R2-S3')
  const edge = SEATS.find((s) => s.id === 'R3-S5')

  const centerView = viewQuality(center, HALL)
  const edgeView = viewQuality(edge, HALL)

  assert.ok(centerView > edgeView, 'центральное место должно иметь лучший обзор')
  assert.ok(centerView <= 1 && centerView >= 0, 'обзор в диапазоне 0…1')
  assert.ok(edgeView <= 1 && edgeView >= 0, 'обзор в диапазоне 0…1')
})

test('центральность: центральное место ближе к оси зала', () => {
  const center = SEATS.find((s) => s.id === 'R2-S3')
  const edge = SEATS.find((s) => s.id === 'R3-S5')

  assert.equal(centrality(center, HALL), 1)
  assert.ok(centrality(edge, HALL) < 1)
  assert.ok(centrality(edge, HALL) >= 0)
})

test('расстояние до экрана считается по геометрии', () => {
  const row1 = SEATS.find((s) => s.id === 'R1-S3')
  const row3 = SEATS.find((s) => s.id === 'R3-S3')

  // z = -4.2 → расстояние 6.8 м, z = -2.1 → 8.9 м.
  assert.equal(distanceToScreen(row1, HALL), 6.8)
  assert.equal(distanceToScreen(row3, HALL), 8.9)

  const result = recommendSeats(SEATS, HALL, { limit: 10 })
  const rec1 = result.recommendations.find((r) => r.seat.id === 'R1-S3')
  const rec3 = result.recommendations.find((r) => r.seat.id === 'R3-S3')
  assert.equal(rec1.distance, 6.8)
  assert.equal(rec3.distance, 8.9)
})

test('оценка учитывает цену: профиль «дешевле» не даёт более дорогое место', () => {
  const balanced = recommendSeats(SEATS, HALL, {
    profile: { priceWeight: 0.5, viewWeight: 1, centerWeight: 0.6 },
    limit: 3,
  })
  const budget = recommendSeats(SEATS, HALL, {
    profile: { priceWeight: 1, viewWeight: 0.6, centerWeight: 0.5 },
    limit: 3,
  })

  const balancedTop = balanced.recommendations[0]
  const budgetTop = budget.recommendations[0]

  assert.ok(
    budgetTop.seat.price <= balancedTop.seat.price,
    `цена в budget (${budgetTop.seat.price}) не выше, чем в balanced (${balancedTop.seat.price})`,
  )
  assert.ok(budget.medianPrice <= balanced.medianPrice)
})

test('оценка в диапазоне 0…100 и идёт по убыванию', () => {
  const result = recommendSeats(SEATS, HALL, { limit: 6 })

  for (const rec of result.recommendations) {
    assert.ok(rec.score >= 0 && rec.score <= 100, `score вне диапазона: ${rec.score}`)
    assert.ok(rec.viewScore >= 0 && rec.viewScore <= 1)
    assert.ok(rec.centerScore >= 0 && rec.centerScore <= 1)
  }

  const scores = result.recommendations.map((r) => r.score)
  const sorted = [...scores].sort((a, b) => b - a)
  assert.deepEqual(scores, sorted, 'рекомендации должны идти по убыванию оценки')
})

test('лимит ограничивает число рекомендаций', () => {
  const result = recommendSeats(SEATS, HALL, { limit: 2 })
  assert.equal(result.recommendations.length, 2)
})

test('медиана цены считается по рекомендованным местам', () => {
  const result = recommendSeats(SEATS, HALL, { limit: 3 })
  const prices = result.recommendations.map((r) => r.seat.price).sort((a, b) => a - b)
  const expected = prices[Math.floor(prices.length / 2)]
  assert.equal(result.medianPrice, expected)
})

test('причины рекомендации заполнены и содержат известные метки', () => {
  const result = recommendSeats(SEATS, HALL, { limit: 3 })
  const known = new Set([
    'center',
    'wide-screen',
    'close',
    'row',
    'price',
    'category',
  ])

  for (const rec of result.recommendations) {
    assert.ok(Array.isArray(rec.reasons))
    for (const reason of rec.reasons) {
      assert.ok(known.has(reason), `неизвестная причина: ${reason}`)
    }
  }
})

test('сортировка детерминирована', () => {
  const first = recommendSeats(SEATS, HALL, { limit: 6 })
  const second = recommendSeats(SEATS, HALL, { limit: 6 })
  assert.deepEqual(
    first.recommendations.map((r) => r.seat.id),
    second.recommendations.map((r) => r.seat.id),
  )
})
