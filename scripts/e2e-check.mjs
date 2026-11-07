/**
 * Playwright-проверка основного сценария и вьюпортов.
 * Запуск: node scripts/e2e-check.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.E2E_BASE || 'http://127.0.0.1:5174/'
const OUT = '/tmp/hackaton-e2e'
mkdirSync(OUT, { recursive: true })

const failures = []
function check(name, ok, detail = '') {
  if (!ok) failures.push(name + (detail ? ': ' + detail : ''))
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail ? ' — ' + detail : ''))
}

async function shot(page, name) {
  await page.screenshot({ path: join(OUT, name + '.png'), fullPage: true })
}

async function runViewport(browser, width, height, label) {
  const context = await browser.newContext({
    viewport: { width, height },
    locale: 'ru-RU',
  })
  await context.addInitScript(() => localStorage.clear())
  const page = await context.newPage()
  page.setDefaultTimeout(12000)

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('.booking-app')
  await shot(page, label + '-home')

  check(label + ' wordmark', await page.locator('.wordmark').isVisible())
  check(label + ' session buttons', (await page.locator('.time-button').count()) >= 2)

  const times = page.locator('.time-button')
  await times.nth(1).click()
  check(label + ' second session active', await times.nth(1).getAttribute('aria-pressed') === 'true')
  await times.nth(0).click()

  const freeSeat = page.locator('.seat:not(.seat--sold)').first()
  await freeSeat.click()
  check(label + ' seat selected', await page.locator('.seat--selected').count() === 1)
  check(label + ' tip visible', await page.locator('.seat-tip').isVisible())
  check(label + ' price shown', /₽/.test(await page.locator('.checkout-price strong').innerText()))

  await page.getByRole('button', { name: /Подобрать лучший вид/ }).click()
  check(label + ' best seat', await page.locator('.seat--selected').count() === 1)

  await page.getByRole('button', { name: /Сесть и посмотреть/ }).first().click()
  await page.waitForSelector('.view-3d canvas', { timeout: 15000 })
  await page.waitForTimeout(900)
  await shot(page, label + '-3d-center')
  check(label + ' 3D canvas', await page.locator('.view-3d canvas').count() === 1)

  const move = page.locator('.seat-navigation button')
  const before = await page.locator('.view-3d-status').innerText()
  if (await move.nth(3).isEnabled()) {
    await move.nth(3).click()
    await page.waitForTimeout(700)
    const after = await page.locator('.view-3d-status').innerText()
    check(label + ' reseat changes view', before !== after, before + ' → ' + after)
  } else {
    check(label + ' reseat changes view', true, 'edge seat — skip')
  }

  await page.locator('.trailer-disclosure summary').click()
  check(label + ' trailer dock', await page.locator('.trailer-dock').isVisible())
  const watchButtons = page.locator('.trailer-card .trailer-btn--primary')
  await watchButtons.first().click()
  await page.waitForTimeout(800)
  await watchButtons.nth(1).click()
  await page.waitForTimeout(600)
  const activeCards = await page.locator('.trailer-card--active').count()
  check(label + ' one active trailer card', activeCards === 1, String(activeCards))

  await page.getByRole('button', { name: 'Пауза' }).click().catch(() => {})
  await page.getByRole('button', { name: /Без звука|Включить звук/ }).click()
  await page.getByRole('button', { name: 'Сначала' }).click().catch(() => {})

  await page.getByRole('button', { name: /Вернуться к схеме/ }).first().click()
  await page.waitForSelector('.seat-map')
  check(label + ' back to map', await page.locator('.seat-map').isVisible())
  check(label + ' 3D unmounted', (await page.locator('.view-3d').count()) === 0)

  await page.getByRole('button', { name: /Сесть и посмотреть/ }).first().click()
  await page.waitForSelector('.view-3d canvas')
  await page.getByRole('button', { name: /Купить билет/ }).click()
  await page.waitForSelector('.purchase-success')
  check(label + ' purchase success', await page.locator('.purchase-success').isVisible())

  await page.getByRole('button', { name: /Мои билеты/ }).click()
  check(label + ' tickets drawer', await page.locator('.saved-ticket').count() >= 1)
  await shot(page, label + '-ticket')

  const ticketsBefore = await page.locator('.saved-ticket').count()
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /Мои билеты/ }).click()
  const ticketsAfter = await page.locator('.saved-ticket').count()
  check(label + ' ticket persists reload', ticketsAfter >= ticketsBefore, String(ticketsAfter))

  // независимость сеансов: купленное место занято на текущем, свободно на другом
  const soldOnCurrent = await page.locator('.seat--sold').count()
  check(label + ' sold seats after buy', soldOnCurrent >= 1, String(soldOnCurrent))
  await page.locator('.time-button').nth(1).click()
  await page.waitForTimeout(200)
  const soldOnOther = await page.locator('.seat--sold').count()
  check(label + ' other session independent', soldOnOther < soldOnCurrent || soldOnOther === 0, soldOnOther + ' vs ' + soldOnCurrent)

  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await runViewport(browser, 1440, 900, 'desktop1440')
  await runViewport(browser, 390, 844, 'mobile390')
} finally {
  await browser.close()
}

if (failures.length) {
  console.error('\nFAILED:\n' + failures.map((f) => ' - ' + f).join('\n'))
  process.exit(1)
}
console.log('\nAll e2e checks passed. Screenshots in ' + OUT)
