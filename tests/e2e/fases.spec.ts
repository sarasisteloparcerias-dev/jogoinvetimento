import { expect, test } from '@playwright/test'
import { avancarDialogos, comecar, dormir, estado, vigiarErros } from './ajuda'

test('ecrã de título: logótipo animado e escolha de fases para maiores de 18', async ({ page }) => {
  const erros = vigiarErros(page)
  await page.goto('/')
  await expect(page.locator('canvas[aria-label="Vila Moeda"]')).toBeVisible()
  await page.fill('input', '30')
  await page.click('button[type=submit]')
  const cartoes = page.locator('button.cartao-modo')
  await expect(cartoes).toHaveCount(6)
  await expect(cartoes.nth(4)).toBeDisabled()
  await expect(cartoes.nth(5)).toBeDisabled()
  expect(erros).toEqual([])
})

test('Vila Moeda: tutorial, uma semana e um mini-jogo', async ({ page }) => {
  const erros = vigiarErros(page)
  await comecar(page, 9)
  await avancarDialogos(page)
  await dormir(page)
  expect((await estado<{ week: number }>(page)).week).toBe(2)
  await page.evaluate(() => void (window as unknown as { __vilaMoeda: { ctx: { jogar(t: string): Promise<unknown> } } }).__vilaMoeda.ctx.jogar('orcamento'))
  await expect(page.locator('[data-testid=minijogo]')).toBeVisible()
  expect(erros).toEqual([])
})

test('A Cidade: tutorial e uma semana', async ({ page }) => {
  const erros = vigiarErros(page)
  await comecar(page, 15)
  await avancarDialogos(page)
  await dormir(page)
  expect((await estado<{ semana: number }>(page)).semana).toBe(2)
  expect(erros).toEqual([])
})

test('O Mercado: tutorial e um mês', async ({ page }) => {
  const erros = vigiarErros(page)
  await comecar(page, 25, 2)
  await avancarDialogos(page)
  await dormir(page)
  expect((await estado<{ mes: number }>(page)).mes).toBe(2)
  expect(erros).toEqual([])
})

test('A Casa: tutorial e um mês', async ({ page }) => {
  const erros = vigiarErros(page)
  await comecar(page, 25, 3)
  await avancarDialogos(page)
  await dormir(page)
  expect((await estado<{ mes: number; nivel: string }>(page)).mes).toBe(2)
  expect(erros).toEqual([])
})

test('O Negócio: abrir a empresa e fechar o primeiro mês', async ({ page }) => {
  const erros = vigiarErros(page)
  await comecar(page, 30, 4, ['negocio'])
  await avancarDialogos(page)
  const s = await estado<{ negocio?: { tipo: string } }>(page)
  expect(s.negocio?.tipo).toBeTruthy()
  await dormir(page)
  const d = await estado<{ mes: number; negocio: { historico: unknown[] } }>(page)
  expect(d.mes).toBe(2)
  expect(d.negocio.historico.length).toBe(1)
  expect(erros).toEqual([])
})

test('A Reforma: projeção, estilo de vida e um ano', async ({ page }) => {
  const erros = vigiarErros(page)
  await comecar(page, 70, 5, ['negocio', 'reforma'])
  await avancarDialogos(page)
  expect((await estado<{ crachas: string[] }>(page)).crachas).toContain('juro_composto')
  await dormir(page)
  expect((await estado<{ ano: number }>(page)).ano).toBe(2)
  expect(erros).toEqual([])
})

test('passar da Vila Moeda para A Cidade com a mesma personagem', async ({ page }) => {
  const erros = vigiarErros(page)
  await comecar(page, 9)
  await avancarDialogos(page)
  await page.evaluate(() => {
    const v = (window as unknown as { __vilaMoeda: { ctx: { estado(): { crachas: string[] }; definir(s: unknown): void; terminar(): void } } }).__vilaMoeda
    const s = v.ctx.estado()
    v.ctx.definir({ ...s, crachas: ['poupanca', 'juro', 'investidor', 'reserva', 'objetivo'] })
    v.ctx.terminar()
  })
  await page.click('text=Continuar para A Cidade')
  await avancarDialogos(page)
  const s = await estado<{ name: string; semana: number; flags: string[] }>(page)
  expect(s.name).toBe('Teste')
  expect(s.flags).toContain('veio_da_vila')
  expect(erros).toEqual([])
})

test('histórias: o Tomás tem novidades e conta o primeiro capítulo', async ({ page }) => {
  const erros = vigiarErros(page)
  await comecar(page, 9)
  await avancarDialogos(page)
  type V = { __vilaMoeda: { motor: { novidades: Set<string>; botaoA(): void }; ctx: { levar(m: string, x: number, y: number, d: string): void } } }
  expect(await page.evaluate(() => (window as unknown as V).__vilaMoeda.motor.novidades.has('aluno'))).toBe(true)
  await page.evaluate(() => (window as unknown as V).__vilaMoeda.ctx.levar('escola', 9, 7, 'right'))
  await page.waitForTimeout(300)
  await page.evaluate(() => (window as unknown as V).__vilaMoeda.motor.botaoA())
  await avancarDialogos(page)
  expect((await estado<{ flags: string[] }>(page)).flags).toContain('hist_tomas_1')
  expect(await page.evaluate(() => (window as unknown as V).__vilaMoeda.motor.novidades.has('aluno'))).toBe(false)
  expect(erros).toEqual([])
})

test('área para escolas: fichas, desafio antes e depois e certificado', async ({ page }) => {
  const erros = vigiarErros(page)
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/')
  await page.click('a[href="#escolas"]')
  await expect(page.getByText('PARA ESCOLAS E FAMÍLIAS')).toBeVisible()
  await expect(page.locator('table.tabela-referencial tbody tr')).toHaveCount(6)

  await page.click('nav a[href="#fichas"]')
  await page.click('button[role=tab] >> nth=5')
  await expect(page.locator('article.ficha')).toContainText('universidades seniores')

  // desafio: a primeira vez é o "antes" (tudo errado), a segunda o "depois" (tudo certo)
  await page.click('nav a[href="#desafio"]')
  for (const certas of [false, true]) {
    await page.click('button.cartao-modo >> nth=1')
    for (let i = 0; i < 10; i++) {
      await page.click(certas ? 'button[data-certa]' : 'button.opcao-desafio:not([data-certa]) >> nth=0')
      await page.click('text=/SEGUINTE|VER RESULTADO/')
    }
    if (!certas) await page.click('text=VOLTAR')
  }
  await expect(page.getByText('Melhoraste 100 pontos percentuais!')).toBeVisible()

  await page.click('text=VER CERTIFICADO')
  await page.fill('#nome-certificado', 'Sam')
  await expect(page.locator('.certificado')).toContainText('Sam')
  await expect(page.locator('.certificado')).toContainText('0/10 antes de jogar e 10/10 depois')

  await page.click('text=◀ JOGO')
  await expect(page.locator('#idade')).toBeVisible()
  expect(erros).toEqual([])
})
