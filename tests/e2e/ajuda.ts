import { expect, type Page } from '@playwright/test'

/** Erros da página (falham o teste no fim). */
export function vigiarErros(p: Page) {
  const erros: string[] = []
  p.on('pageerror', (e) => erros.push(e.message))
  p.on('console', (m) => {
    if (m.type() === 'error') erros.push(m.text())
  })
  return erros
}

/** Vai carregando em A (e escolhe a 1.ª opção) até não haver diálogo nem mini-jogo durante um bocado. */
export async function avancarDialogos(p: Page, opcoes: number[] = []) {
  let livre = 0
  for (let i = 0; i < 3000 && livre < 10; i++) {
    if (await p.locator('.pagina-pixel').count()) return
    if (await p.locator('[data-testid=minijogo]').count()) {
      livre = 0
      await p.keyboard.press(['z', 'ArrowLeft', 'ArrowRight', 'ArrowUp'][i % 4])
      await p.waitForTimeout(80)
      continue
    }
    if (await p.locator('[data-testid=opcoes]').count()) {
      livre = 0
      const k = opcoes.length ? opcoes.shift()! : 0
      for (let j = 0; j < k; j++) await p.keyboard.press('ArrowDown')
      await p.keyboard.press('z')
      await p.waitForTimeout(60)
      continue
    }
    if (await p.locator('[data-testid=dialogo]').count()) {
      livre = 0
      await p.keyboard.press('z')
      await p.waitForTimeout(50)
    } else {
      livre++
      await p.waitForTimeout(100)
    }
  }
}

/** Começa um jogo novo: idade, cartão da fase (se houver escolha), nome e aspeto. */
export async function comecar(p: Page, idade: number, cartao?: number, desbloquear: string[] = []) {
  await p.goto('/')
  await p.evaluate((d) => {
    localStorage.clear()
    for (const f of d) localStorage.setItem(`vila-moeda:${f}`, '1')
  }, desbloquear)
  await p.goto('/')
  await p.fill('input', String(idade))
  await p.click('button[type=submit]')
  if (cartao !== undefined) await p.click(`button.cartao-modo >> nth=${cartao}`)
  for (let i = 0; i < 40 && !(await p.locator('input').count()); i++) {
    await p.keyboard.press('z')
    await p.waitForTimeout(80)
  }
  await p.fill('input', 'Teste')
  await p.keyboard.press('Enter')
  await p.waitForTimeout(500)
  for (let i = 0; i < 15 && (await p.locator('[data-testid=dialogo]').count()); i++) await p.keyboard.press('z')
  // aspeto: ir a "PRONTO!" e confirmar
  await p.keyboard.press('ArrowUp')
  await p.keyboard.press('z')
  // as últimas falas da introdução, até o jogo aparecer
  for (let i = 0; i < 80 && !(await p.locator('canvas.ecra-canvas').count()); i++) {
    await p.keyboard.press('z')
    await p.waitForTimeout(100)
  }
  await expect(p.locator('canvas.ecra-canvas')).toBeVisible()
  await p.waitForFunction(() => !!(window as unknown as { __vilaMoeda?: unknown }).__vilaMoeda)
}

/** O estado do jogo (pelo gancho de testes). */
export function estado<T = Record<string, unknown>>(p: Page): Promise<T> {
  return p.evaluate(() => (window as unknown as { __vilaMoeda: { ctx: { estado(): unknown } } }).__vilaMoeda.ctx.estado()) as Promise<T>
}

/** Vai até à cama do quarto e dorme (passa uma semana, um mês ou um ano). */
export async function dormir(p: Page, opcoes: number[] = []) {
  await p.evaluate(() => {
    const v = (window as unknown as { __vilaMoeda: { ctx: { levar(m: string, x: number, y: number, d: string): void }; motor: { botaoA(): void } } }).__vilaMoeda
    v.ctx.levar('casa', 7, 3, 'right')
  })
  await p.waitForTimeout(300)
  await p.evaluate(() => (window as unknown as { __vilaMoeda: { motor: { botaoA(): void } } }).__vilaMoeda.motor.botaoA())
  await avancarDialogos(p, [0, ...opcoes])
}
