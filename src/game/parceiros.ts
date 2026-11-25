/**
 * Quem apoia o Vila Moeda. Aparece só como "Com o apoio de" no ecrã inicial e na área das escolas:
 * nunca dentro do jogo, sem links e sem publicidade (regras da categoria Kids e do Plano Nacional de Formação Financeira).
 *
 * Para acrescentar um apoio: { nome: 'Fundação Exemplo', logo: 'parceiros/exemplo.png' } (o logo fica em public/parceiros/).
 */
export interface Parceiro {
  nome: string
  /** Caminho relativo a public/, opcional. */
  logo?: string
}

export const PARCEIROS: Parceiro[] = []
