/** Crédito à habitação (valores e regras simplificados para o jogo). */
export interface Hipoteca {
  casa: string
  valorCasa: number
  divida: number
  taxa: 'fixa' | 'variavel'
  prestacao: number
  /** Meses que faltam pagar. */
  meses: number
  jurosPagos: number
}

export interface CasaVenda {
  id: string
  nome: string
  preco: number
  nota: string
  /** Custo extra de transportes por mês (casas longe do centro). */
  transportes: number
}

export const CASAS_VENDA: CasaVenda[] = [
  { id: 't0', nome: 'T0 para remodelar', preco: 72000, nota: 'O mais barato, mas a casa é antiga e vai precisar de obras.', transportes: 0 },
  { id: 't2', nome: 'T2 nos arredores', preco: 98000, nota: 'Mais espaço, mas fica longe: gastas mais em transportes.', transportes: 25 },
  { id: 't1', nome: 'T1 no centro', preco: 130000, nota: 'Perto de tudo e pronto a habitar, mas é o mais caro.', transportes: 0 },
]

/** O banco empresta no máximo 90% do valor da casa. */
export const FINANCIAMENTO = 0.9
/** Escritura, registos e impostos (com os apoios para jovens a reduzir os impostos). */
export const CUSTOS_COMPRA = 0.03
export const PRAZO_MESES = 360
export const TAXA_FIXA = 0.04
export const SPREAD = 0.01
/** Este banco não aprova se as prestações passarem de 40% do rendimento líquido. */
export const LIMITE_ESFORCO = 0.4
export const CONDOMINIO = 35
export const SEGUROS_CASA = 30
export const META_PATRIMONIO_CASA = 30000

/** Euribor ao longo dos 24 meses do nível: sobe, chega aos 4% e depois desce. */
export function euribor(mes: number) {
  if (mes <= 6) return 0.025
  if (mes <= 12) return 0.035
  if (mes <= 18) return 0.04
  return 0.0275
}

export function taxaAnual(h: Hipoteca, mes: number) {
  return h.taxa === 'fixa' ? TAXA_FIXA : euribor(mes) + SPREAD
}

/** Prestação mensal de um empréstimo (sistema francês: prestação constante). */
export function calcularPrestacao(capital: number, taxa: number, meses: number) {
  const r = taxa / 12
  return Math.round(((capital * r) / (1 - Math.pow(1 + r, -meses))) * 100) / 100
}

export function custosEntrada(preco: number) {
  return { entrada: preco * (1 - FINANCIAMENTO), custos: preco * CUSTOS_COMPRA, emprestimo: preco * FINANCIAMENTO }
}

export function casaVenda(id: string | undefined) {
  return CASAS_VENDA.find((c) => c.id === id)
}

export function imi(h: Hipoteca) {
  return Math.round(h.valorCasa * 0.7 * 0.0035)
}
