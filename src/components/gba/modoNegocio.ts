import type { EstadoMercado } from '../../game/mercado/tipos'
import { CONQUISTAS_NEGOCIO } from '../../game/negocio/conquistas'
import { MAPAS_NEGOCIO } from '../../game/negocio/mapas'
import { executarInteracaoNegocio, TRANSITO_NEGOCIO_SCRIPTS, tutorialNegocio } from '../../game/negocio/scripts'
import type { ModoJogo } from './modo'
import { MODO_MERCADO } from './modoMercado'

/** "O Negócio": a última fase, no mesmo mundo d'O Mercado, com a tua empresa no antigo prédio da Nexo. */
export const MODO_NEGOCIO: ModoJogo<EstadoMercado> = {
  ...MODO_MERCADO,
  mapas: MAPAS_NEGOCIO,
  conquistas: CONQUISTAS_NEGOCIO,
  tutorial: tutorialNegocio,
  interagir: executarInteracaoNegocio,
  transito: TRANSITO_NEGOCIO_SCRIPTS,
  musica: 'negocio',
  // o dinheiro da empresa também faz som (vendas a entrar, salários a sair)
  dinheiro: (s) => MODO_MERCADO.dinheiro!(s) + (s.negocio?.caixa ?? 0),
}
