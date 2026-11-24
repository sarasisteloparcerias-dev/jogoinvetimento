import { CRACHAS } from '../../game/crachas'
import { iconeCracha } from '../../game/pixel/cenario'
import { framesPersonagem } from '../../game/pixel/sprites'
import type { PlayerState } from '../../game/types'
import { MAPAS } from '../../game/world/mapas'
import { executarInteracao, tutorial } from '../../game/world/scripts'
import { ambienteDe } from '../../game/world/ambiente'
import { HISTORIA_TOMAS } from '../../game/historiasFases'
import type { ModoJogo } from './modo'
import { StartMenu } from './StartMenu'

export const MODO_VILA: ModoJogo<PlayerState> = {
  mapas: MAPAS,
  inicio: { mapa: 'casa', x: 7, y: 3, dir: 'down' },
  sprites: framesPersonagem,
  conquistas: CRACHAS,
  iconeConquista: iconeCracha,
  mentor: 'Mestre Moedas',
  tutorial,
  interagir: executarInteracao,
  Menu: StartMenu,
  musica: 'vila',
  historias: [HISTORIA_TOMAS],
  // 20 semanas: primavera, verão, outono e inverno
  ambiente: (s) => ambienteDe(Math.min(3, Math.floor((Math.min(s.week, 20) - 1) / 5)), s.week),
  dinheiro: (s) => s.saldo + s.poupanca + s.investimento.amount,
}
