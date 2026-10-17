import { AVATARES_CIDADE, BANCO_PONTE, CAFE, CASA_CIDADE, grelhaCidade, HOSPITAL, TRANSITO_CIDADE } from '../cidade/mapas'
import { grelhaSala } from '../world/mapas'
import type { MapaDef } from '../world/tipos'

const AVATARES = {
  ...AVATARES_CIDADE,
  pai: { pele: '#f1c27d', cabelo: '#4a2c14', roupa: '#64748b' },
  chefe: { pele: '#c68642', cabelo: '#2d1b0e', roupa: '#283040', cabeloComprido: true },
  tiago: { pele: '#ffe0bd', cabelo: '#7a4a1e', roupa: '#0ea5e9' },
  vasco: { pele: '#e0ac69', cabelo: '#e8e0d5', roupa: '#7a4a24' },
  carla: { pele: '#f1c27d', cabelo: '#d4a017', roupa: '#e0709a', cabeloComprido: true },
  lurdes: { pele: '#e0ac69', cabelo: '#a83232', roupa: '#10b981', cabeloComprido: true },
  nuno: { pele: '#8d5524', cabelo: '#2d1b0e', roupa: '#f97316' },
  vera: { pele: '#f1c27d', cabelo: '#a83232', roupa: '#e04848', cabeloComprido: true },
}

export const RUA: MapaDef = {
  id: 'rua',
  nome: 'A CIDADE',
  tipo: 'exterior',
  grelha: grelhaCidade(),
  transito: TRANSITO_CIDADE,
  edificios: [
    { x: 2, y: 3, w: 5, h: 6, cor: 'laranja', estilo: 'predio', porta: 2, janelas: [0, 2, 4], interior: 'casa' },
    { x: 9, y: 4, w: 6, h: 5, cor: 'castanho', estilo: 'predio', porta: 2, janelas: [0, 1, 3, 4, 5], letreiro: 'CAFE', toldo: '#2aa58c', interior: 'cafe' },
    { x: 21, y: 2, w: 6, h: 7, cor: 'cinza', estilo: 'predio', porta: 2, janelas: [0, 1, 3, 4, 5], letreiro: 'NEXO', interior: 'escritorio' },
    { x: 28, y: 3, w: 6, h: 6, cor: 'amarelo', estilo: 'predio', porta: 2, janelas: [0, 1, 3, 4, 5], letreiro: 'FINANÇAS', interior: 'financas' },
    { x: 2, y: 13, w: 6, h: 6, cor: 'azul', estilo: 'predio', porta: 3, janelas: [0, 1, 2, 4, 5], letreiro: 'BANCO', interior: 'banco' },
    { x: 21, y: 13, w: 6, h: 6, cor: 'verde', estilo: 'predio', porta: 3, janelas: [0, 1, 2, 4, 5], letreiro: 'SUPER', toldo: '#48b048', interior: 'supermercado' },
    { x: 28, y: 13, w: 6, h: 6, cor: 'rosa', estilo: 'predio', porta: 2, janelas: [0, 1, 3, 4, 5], letreiro: 'CASAS', toldo: '#e8743a', interior: 'imobiliaria' },
    { x: 11, y: 23, w: 4, h: 4, cor: 'laranja', porta: 1, janelas: [3], chamine: true, interior: 'casa_pais' },
    { x: 21, y: 23, w: 5, h: 4, cor: 'lilas', estilo: 'predio', porta: 2, janelas: [0, 1, 3, 4], letreiro: 'GYM', interior: 'ginasio' },
    { x: 32, y: 23, w: 3, h: 4, cor: 'vermelho', estilo: 'predio', porta: 1, janelas: [0, 2], letreiro: 'CARTA', interior: 'escola_conducao' },
  ],
  props: [
    { tipo: 'candeeiro', x: 1, y: 8 },
    { tipo: 'candeeiro', x: 15, y: 6 },
    { tipo: 'candeeiro', x: 20, y: 6 },
    { tipo: 'candeeiro', x: 1, y: 18 },
    { tipo: 'candeeiro', x: 20, y: 18 },
    { tipo: 'candeeiro', x: 34, y: 18 },
    { tipo: 'semaforo', x: 16, y: 9 },
    { tipo: 'semaforo', x: 19, y: 22 },
    { tipo: 'caixa_multibanco', x: 8, y: 18, script: 'multibanco' },
    { tipo: 'fonte', x: 11, y: 15, w: 2, h: 2 },
    { tipo: 'banco_jardim', x: 13, y: 13, w: 2 },
    { tipo: 'banco_jardim', x: 8, y: 24, w: 2 },
    { tipo: 'bola', x: 29, y: 25, script: 'bola' },
  ],
  placas: [
    { x: 7, y: 8, texto: 'PRÉDIO ONDE VIVES. O teu quarto e a tua cama (para passar o mês) estão lá dentro.' },
    { x: 15, y: 8, texto: 'CAFÉ GRÃO DOURADO. Precisa-se de reforço aos fins de semana.' },
    { x: 27, y: 8, texto: 'À esquerda: NEXO DIGITAL, onde trabalhas. À direita: FINANÇAS (o IRS entrega-se entre abril e junho).' },
    { x: 8, y: 13, texto: 'BANCO PONTE. O Mestre Moedas é agora planeador financeiro.' },
    { x: 27, y: 18, texto: 'À esquerda: SUPERMERCADO. À direita: IMOBILIÁRIA (mudar de casa).' },
    { x: 15, y: 23, texto: 'PARQUE DA CIDADE. A casa dos teus pais é ali ao lado.' },
    { x: 20, y: 23, texto: 'GINÁSIO E CAMPO DE JOGOS. Ao fundo, a ESCOLA DE CONDUÇÃO.' },
  ],
  npcs: [
    { id: 'rui', nome: 'Rui', avatar: AVATARES.rui, x: 8, y: 26, dir: 'right', script: 'amigos' },
    { id: 'ines', nome: 'Inês', avatar: AVATARES.ines, x: 10, y: 26, dir: 'left', script: 'amigos' },
    { id: 'duarte', nome: 'Duarte', avatar: AVATARES.duarte, x: 28, y: 24, dir: 'right', script: 'duarte' },
    { id: 'marco', nome: 'Marco', avatar: AVATARES.marco, x: 19, y: 14, dir: 'left', script: 'marco' },
    { id: 'kiko', nome: 'Kiko', avatar: AVATARES.kiko, x: 33, y: 19, dir: 'down', script: 'finfluencer' },
    { id: 'amelia', nome: 'D. Amélia', avatar: AVATARES.amelia, x: 13, y: 17, dir: 'down', script: 'amelia', vaguear: { x0: 9, y0: 17, x1: 15, y1: 18 } },
  ],
}

const sala = (w: number, h: number) => grelhaSala(w, h, Math.floor(w / 2))

export const QUARTO: MapaDef = { ...CASA_CIDADE, nome: 'O TEU QUARTO', npcs: [] }

export const ESCRITORIO: MapaDef = {
  id: 'escritorio',
  nome: 'NEXO DIGITAL',
  tipo: 'interior',
  grelha: sala(14, 9),
  saida: { x: 7, y: 8 },
  chao: 'azulejo',
  parede: '#e8ebf0',
  props: [
    { tipo: 'quadro', x: 4, y: 0, w: 3, h: 2, script: 'quadro_nexo' },
    { tipo: 'estante', x: 9, y: 0, h: 2, script: 'livros' },
    { tipo: 'computador', x: 2, y: 4, script: 'trabalhar' },
    { tipo: 'computador', x: 4, y: 4, script: 'trabalhar' },
    { tipo: 'computador', x: 9, y: 4, script: 'trabalhar' },
    { tipo: 'computador', x: 11, y: 4, script: 'trabalhar' },
    { tipo: 'planta', x: 0, y: 2 },
    { tipo: 'planta', x: 13, y: 2 },
    { tipo: 'sofa', x: 1, y: 7, w: 2 },
  ],
  npcs: [
    { id: 'chefe', nome: 'Eng.ª Sofia', avatar: AVATARES.chefe, x: 12, y: 3, dir: 'left', script: 'chefe' },
    { id: 'tiago', nome: 'Tiago', avatar: AVATARES.tiago, x: 3, y: 4, dir: 'down', script: 'tiago' },
  ],
}

export const FINANCAS: MapaDef = {
  id: 'financas',
  nome: 'FINANÇAS',
  tipo: 'interior',
  grelha: sala(12, 9),
  saida: { x: 6, y: 8 },
  chao: 'azulejo',
  parede: '#f4efd8',
  props: [
    { tipo: 'quadro', x: 6, y: 0, w: 3, h: 2, script: 'cartaz_irs' },
    { tipo: 'estante', x: 10, y: 0, h: 2, script: 'livros_fisco' },
    { tipo: 'balcao', x: 1, y: 3, w: 5 },
    { tipo: 'sofa', x: 8, y: 6, w: 2 },
    { tipo: 'planta', x: 11, y: 2 },
  ],
  npcs: [{ id: 'vasco', nome: 'Sr. Vasco', avatar: AVATARES.vasco, x: 3, y: 2, dir: 'down', script: 'vasco' }],
}

export const IMOBILIARIA: MapaDef = {
  id: 'imobiliaria',
  nome: 'IMOBILIÁRIA',
  tipo: 'interior',
  grelha: sala(12, 9),
  saida: { x: 6, y: 8 },
  chao: 'madeira',
  parede: '#fbeee6',
  props: [
    { tipo: 'montra', x: 7, y: 0, w: 2, h: 2, script: 'montra_casas' },
    { tipo: 'montra', x: 9, y: 0, w: 2, h: 2, script: 'montra_casas' },
    { tipo: 'balcao', x: 1, y: 3, w: 4 },
    { tipo: 'planta', x: 0, y: 2 },
    { tipo: 'sofa', x: 8, y: 6, w: 2 },
  ],
  npcs: [{ id: 'carla', nome: 'Carla', avatar: AVATARES.carla, x: 2, y: 2, dir: 'down', script: 'carla' }],
}

export const SUPERMERCADO: MapaDef = {
  id: 'supermercado',
  nome: 'SUPERMERCADO',
  tipo: 'interior',
  grelha: sala(14, 9),
  saida: { x: 7, y: 8 },
  chao: 'azulejo',
  parede: '#eaf6ea',
  props: [
    ...[1, 2, 3, 5, 6, 8, 9, 11, 12].map((x) => ({ tipo: 'prateleira' as const, x, y: 0, h: 2, script: 'prateleira' })),
    { tipo: 'balcao', x: 1, y: 5, w: 3 },
    { tipo: 'planta', x: 13, y: 2 },
  ],
  npcs: [
    { id: 'lurdes', nome: 'D. Lurdes', avatar: AVATARES.lurdes, x: 2, y: 4, dir: 'down', script: 'lurdes' },
    { id: 'cliente_super', nome: 'Cliente', avatar: AVATARES.cliente, x: 10, y: 3, dir: 'up', script: 'cliente_super' },
  ],
}

export const GINASIO: MapaDef = {
  id: 'ginasio',
  nome: 'GINÁSIO',
  tipo: 'interior',
  grelha: sala(12, 9),
  saida: { x: 6, y: 8 },
  chao: 'azulejo',
  parede: '#efe8fa',
  props: [
    { tipo: 'banco_jardim', x: 1, y: 3, w: 2, script: 'treinar' },
    { tipo: 'banco_jardim', x: 4, y: 3, w: 2, script: 'treinar' },
    { tipo: 'banco_jardim', x: 1, y: 6, w: 2, script: 'treinar' },
    { tipo: 'balcao', x: 8, y: 4, w: 3 },
    { tipo: 'planta', x: 11, y: 2 },
    { tipo: 'tapete', x: 4, y: 5, w: 2, h: 2 },
  ],
  npcs: [{ id: 'nuno', nome: 'Nuno', avatar: AVATARES.nuno, x: 9, y: 3, dir: 'down', script: 'nuno' }],
}

export const CASA_PAIS: MapaDef = {
  id: 'casa_pais',
  nome: 'CASA DOS PAIS',
  tipo: 'interior',
  grelha: sala(10, 8),
  saida: { x: 5, y: 7 },
  chao: 'madeira',
  parede: '#f6e3c8',
  props: [
    { tipo: 'estante', x: 1, y: 0, h: 2, script: 'livros' },
    { tipo: 'tv', x: 7, y: 2 },
    { tipo: 'mesa', x: 3, y: 3, w: 2 },
    { tipo: 'planta', x: 9, y: 2 },
    { tipo: 'tapete', x: 6, y: 4, w: 3, h: 2 },
  ],
  npcs: [
    { id: 'mae', nome: 'Mãe', avatar: AVATARES.mae, x: 2, y: 3, dir: 'right', script: 'mae' },
    { id: 'pai', nome: 'Pai', avatar: AVATARES.pai, x: 5, y: 3, dir: 'left', script: 'pai' },
  ],
}

export const ESCOLA_CONDUCAO: MapaDef = {
  id: 'escola_conducao',
  nome: 'ESCOLA DE CONDUÇÃO',
  tipo: 'interior',
  grelha: sala(12, 9),
  saida: { x: 6, y: 8 },
  chao: 'azulejo',
  parede: '#fbe8e8',
  props: [
    { tipo: 'quadro', x: 1, y: 0, w: 3, h: 2, script: 'sinais' },
    { tipo: 'carteira', x: 1, y: 4 },
    { tipo: 'carteira', x: 2, y: 4 },
    { tipo: 'carteira', x: 1, y: 6 },
    { tipo: 'carteira', x: 2, y: 6 },
    { tipo: 'computador', x: 9, y: 2, script: 'simulador' },
    { tipo: 'planta', x: 11, y: 2 },
  ],
  npcs: [{ id: 'vera', nome: 'Instrutora Vera', avatar: AVATARES.vera, x: 7, y: 3, dir: 'down', script: 'vera' }],
}

export const MAPAS_MERCADO: Record<string, MapaDef> = {
  rua: RUA,
  casa: QUARTO,
  cafe: CAFE,
  banco: BANCO_PONTE,
  escritorio: ESCRITORIO,
  financas: FINANCAS,
  imobiliaria: IMOBILIARIA,
  supermercado: SUPERMERCADO,
  ginasio: GINASIO,
  casa_pais: CASA_PAIS,
  hospital: HOSPITAL,
  escola_conducao: ESCOLA_CONDUCAO,
}
