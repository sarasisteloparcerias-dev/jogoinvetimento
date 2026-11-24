import { MAPAS_MERCADO, RUA } from '../mercado/mapas'
import { grelhaSala } from '../world/mapas'
import type { MapaDef } from '../world/tipos'

/** A rua d'O Mercado, mas o prédio onde trabalhavas é agora a tua empresa. */
export const RUA_NEGOCIO: MapaDef = {
  ...RUA,
  edificios: RUA.edificios!.map((e) => (e.interior === 'escritorio' ? { ...e, cor: 'verde', letreiro: 'EMPRESA', toldo: '#e8743a', interior: 'empresa' } : e)),
  placas: RUA.placas!.map((p) =>
    p.x === 27 && p.y === 8 ? { ...p, texto: 'À esquerda: A TUA EMPRESA (balcão, computador de gestão e a contabilista). À direita: FINANÇAS (IVA, IRC e IRS).' } : p,
  ),
}

export const EMPRESA: MapaDef = {
  id: 'empresa',
  nome: 'A TUA EMPRESA',
  tipo: 'interior',
  grelha: grelhaSala(14, 9, 7),
  saida: { x: 7, y: 8 },
  chao: 'madeira',
  parede: '#e8f4ec',
  props: [
    { tipo: 'quadro', x: 5, y: 0, w: 3, h: 2, script: 'quadro_empresa' },
    { tipo: 'prateleira', x: 2, y: 0, h: 2 },
    { tipo: 'maquina_cafe', x: 1, y: 2, script: 'maquina_empresa' },
    { tipo: 'balcao', x: 1, y: 3, w: 5, script: 'balcao_empresa' },
    { tipo: 'mesa_cafe', x: 8, y: 5 },
    { tipo: 'mesa_cafe', x: 10, y: 5 },
    { tipo: 'mesa_cafe', x: 8, y: 7 },
    { tipo: 'computador', x: 11, y: 2, script: 'gestao' },
    { tipo: 'cofre', x: 13, y: 2, script: 'caixa_empresa' },
    { tipo: 'planta', x: 0, y: 7 },
    { tipo: 'planta', x: 13, y: 7 },
  ],
  npcs: [{ id: 'joana', nome: 'Dra. Joana', avatar: { pele: '#e0ac69', cabelo: '#2d1b0e', roupa: '#4a7ad0', cabeloComprido: true }, x: 10, y: 2, dir: 'down', script: 'contabilista' }],
}

export const MAPAS_NEGOCIO: Record<string, MapaDef> = { ...MAPAS_MERCADO, rua: RUA_NEGOCIO, empresa: EMPRESA }
