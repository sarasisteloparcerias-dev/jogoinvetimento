import { CONQUISTAS_CASA } from '../../game/mercado/conquistas'
import { executarInteracaoCasa, tutorialCasa } from '../../game/mercado/scripts'
import type { EstadoMercado } from '../../game/mercado/tipos'
import type { ModoJogo } from './modo'
import { MODO_MERCADO } from './modoMercado'

/** "A Casa": a continuação d'O Mercado, com o mesmo mundo e o mesmo painel. */
export const MODO_CASA: ModoJogo<EstadoMercado> = {
  ...MODO_MERCADO,
  conquistas: CONQUISTAS_CASA,
  tutorial: tutorialCasa,
  interagir: executarInteracaoCasa,
}
