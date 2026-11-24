import { CONQUISTAS_CIDADE } from '../../game/cidade/conquistas'
import { MAPAS_CIDADE } from '../../game/cidade/mapas'
import { executarInteracaoCidade, TRANSITO_CIDADE_SCRIPTS, tutorialCidade } from '../../game/cidade/scripts'
import type { EstadoCidade } from '../../game/cidade/tipos'
import { iconeCracha } from '../../game/pixel/cenario'
import { framesAdolescente } from '../../game/pixel/sprites'
import { ambienteDe } from '../../game/world/ambiente'
import { HISTORIA_BEATRIZ } from '../../game/historiasFases'
import type { ModoJogo } from './modo'
import { Telemovel } from './Telemovel'

export const MODO_CIDADE: ModoJogo<EstadoCidade> = {
  mapas: MAPAS_CIDADE,
  inicio: { mapa: 'casa', x: 7, y: 3, dir: 'down' },
  sprites: framesAdolescente,
  conquistas: CONQUISTAS_CIDADE,
  iconeConquista: iconeCracha,
  mentor: 'Mestre Moedas',
  tutorial: tutorialCidade,
  interagir: executarInteracaoCidade,
  Menu: Telemovel,
  musica: 'cidade',
  historias: [HISTORIA_BEATRIZ],
  // o ano letivo começa no outono
  ambiente: (s) => ambienteDe((Math.floor((Math.min(s.semana, 24) - 1) / 6) + 2) % 4, s.semana),
  // investir não é gastar: conta-se o que se pagou pelos investimentos
  dinheiro: (s) => s.dinheiro + s.poupanca + Object.values(s.custo).reduce((a, b) => a + b, 0),
  transito: TRANSITO_CIDADE_SCRIPTS,
}
