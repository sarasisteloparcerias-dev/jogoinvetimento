import type { Modo } from '../../game/gravar'
import type { EstadoBase, ModoJogo } from './modo'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QualquerModo = ModoJogo<any>

/** Cada fase é carregada só quando é precisa (o browser não descarrega o jogo inteiro de uma vez). */
export function carregarModo(modo: Modo): Promise<QualquerModo> {
  switch (modo) {
    case 'reino':
      return import('./modoVila').then((m) => m.MODO_VILA as ModoJogo<EstadoBase>)
    case 'cidade':
      return import('./modoCidade').then((m) => m.MODO_CIDADE as unknown as QualquerModo)
    case 'mercado':
      return import('./modoMercado').then((m) => m.MODO_MERCADO as unknown as QualquerModo)
    case 'casa':
      return import('./modoCasa').then((m) => m.MODO_CASA as unknown as QualquerModo)
    case 'negocio':
      return import('./modoNegocio').then((m) => m.MODO_NEGOCIO as unknown as QualquerModo)
    case 'reforma':
      return import('./modoReforma').then((m) => m.MODO_REFORMA as unknown as QualquerModo)
  }
}
