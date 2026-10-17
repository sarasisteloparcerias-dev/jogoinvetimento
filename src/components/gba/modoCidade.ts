import { CONQUISTAS_CIDADE } from '../../game/cidade/conquistas'
import { MAPAS_CIDADE } from '../../game/cidade/mapas'
import { executarInteracaoCidade, TRANSITO_CIDADE_SCRIPTS, tutorialCidade } from '../../game/cidade/scripts'
import type { EstadoCidade } from '../../game/cidade/tipos'
import { iconeCracha } from '../../game/pixel/cenario'
import { framesAdolescente } from '../../game/pixel/sprites'
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
  transito: TRANSITO_CIDADE_SCRIPTS,
}
