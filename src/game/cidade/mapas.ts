import { MENTOR } from '../mentor'
import { grelhaSala, novaGrelha, ret, texto } from '../world/mapas'
import type { MapaDef } from '../world/tipos'

export const AVATARES_CIDADE = {
  mae: { pele: '#f1c27d', cabelo: '#2d1b0e', roupa: '#0e7490', cabeloComprido: true },
  clara: { pele: '#e0ac69', cabelo: '#7a4a1e', roupa: '#7a4a24', cabeloComprido: true },
  rita: { pele: '#c68642', cabelo: '#2d1b0e', roupa: '#0ea5e9', cabeloComprido: true },
  prof: { pele: '#ffe0bd', cabelo: '#4a2c14', roupa: '#64748b' },
  rui: { pele: '#ffe0bd', cabelo: '#d4a017', roupa: '#0ea5e9' },
  ines: { pele: '#8d5524', cabelo: '#5b3a8e', roupa: '#ec4899', cabeloComprido: true },
  duarte: { pele: '#c68642', cabelo: '#2d1b0e', roupa: '#ef4444' },
  kiko: { pele: '#f1c27d', cabelo: '#a83232', roupa: '#8b5cf6' },
  amelia: { pele: '#ffe0bd', cabelo: '#e8e0d5', roupa: '#a83232', cabeloComprido: true },
  beatriz: { pele: '#e0ac69', cabelo: '#2d1b0e', roupa: '#10b981', cabeloComprido: true },
  tomas: { pele: '#8d5524', cabelo: '#2d1b0e', roupa: '#f97316' },
  cliente: { pele: '#e0ac69', cabelo: '#d4a017', roupa: '#10b981' },
  vendedor: { pele: '#f1c27d', cabelo: '#4a2c14', roupa: '#e0709a' },
}

const W = 36
const H = 30

export function grelhaCidade(): string[] {
  const g = novaGrelha(W, H, '.')
  ret(g, 0, 0, W - 1, 0, 'T')
  ret(g, 0, H - 1, W - 1, H - 1, 'T')
  ret(g, 0, 0, 0, H - 1, 'T')
  ret(g, W - 1, 0, W - 1, H - 1, 'T')
  // passeios
  for (const y of [9, 12, 19, 22]) ret(g, 1, y, W - 2, y, 'p')
  for (const x of [16, 19]) ret(g, x, 1, x, H - 2, 'p')
  // estradas
  ret(g, 1, 10, W - 2, 11, 'R')
  ret(g, 1, 20, W - 2, 21, 'R')
  ret(g, 17, 1, 18, H - 2, 'R')
  // passadeiras
  for (const x of [5, 26]) ret(g, x, 10, x, 11, 'Z')
  for (const x of [8, 26]) ret(g, x, 20, x, 21, 'Z')
  for (const y of [5, 15, 25]) ret(g, 17, y, 18, y, 'Z')
  // praça em calçada, parque com lago e campo de jogos
  ret(g, 9, 13, 15, 18, 'q')
  ret(g, 2, 24, 6, 27, 'w')
  ret(g, 21, 23, 31, 27, 'F')
  ret(g, 20, 28, 32, 28, '=')
  const arvores = [[1, 1], [2, 1], [7, 1], [8, 2], [14, 1], [15, 1], [31, 1], [33, 2], [34, 5], [32, 6], [33, 14], [34, 16], [1, 23], [9, 27], [12, 25], [14, 27], [15, 25], [33, 24], [34, 27]]
  for (const [x, y] of arvores) g[y][x] = 'T'
  const flores = [[4, 1], [12, 2], [20, 2], [30, 3], [32, 4], [1, 14], [32, 16], [8, 23], [11, 23], [13, 28], [7, 28], [33, 26]]
  for (const [x, y] of flores) g[y][x] = 'f'
  return texto(g)
}

export const CIDADE: MapaDef = {
  id: 'cidade',
  nome: 'A CIDADE',
  tipo: 'exterior',
  grelha: grelhaCidade(),
  edificios: [
    { x: 2, y: 3, w: 5, h: 6, cor: 'laranja', estilo: 'predio', porta: 2, janelas: [0, 2, 4], interior: 'casa' },
    { x: 9, y: 4, w: 6, h: 5, cor: 'castanho', estilo: 'predio', porta: 2, janelas: [0, 1, 3, 4, 5], letreiro: 'CAFE', toldo: '#2aa58c', interior: 'cafe' },
    { x: 21, y: 2, w: 9, h: 7, cor: 'verde', estilo: 'predio', porta: 4, janelas: [0, 1, 2, 3, 5, 6, 7, 8], letreiro: 'ESCOLA', interior: 'escola' },
    { x: 2, y: 13, w: 6, h: 6, cor: 'azul', estilo: 'predio', porta: 3, janelas: [0, 1, 2, 4, 5], letreiro: 'BANCO', interior: 'banco' },
    { x: 21, y: 13, w: 11, h: 6, cor: 'lilas', estilo: 'predio', porta: 5, janelas: [0, 1, 2, 3, 4, 6, 7, 8, 9, 10], letreiro: 'MEGASTORE', toldo: '#e0709a', interior: 'megastore' },
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
    { tipo: 'carro', x: 1, y: 11, w: 2, cor: '#4a7ad0' },
    { tipo: 'carro', x: 30, y: 21, w: 2, cor: '#f0c040' },
    { tipo: 'carro', x: 12, y: 10, w: 2, cor: '#e04848' },
    { tipo: 'caixa_multibanco', x: 8, y: 18, script: 'multibanco' },
    { tipo: 'fonte', x: 11, y: 15, w: 2, h: 2 },
    { tipo: 'banco_jardim', x: 13, y: 13, w: 2 },
    { tipo: 'banco_jardim', x: 9, y: 24, w: 2 },
    { tipo: 'bola', x: 27, y: 25, script: 'bola' },
  ],
  placas: [
    { x: 7, y: 8, texto: 'PRÉDIO DE {nome}. Lá em cima está o teu quarto, com a cama para passares a semana.' },
    { x: 15, y: 8, texto: 'CAFÉ GRÃO DOURADO. Procura-se jovem para part-time ao fim de semana!' },
    { x: 30, y: 8, texto: 'ESCOLA SECUNDÁRIA. Biblioteca aberta a todos os alunos (e é grátis!).' },
    { x: 8, y: 13, texto: 'BANCO PONTE. Contas para jovens. Fala com o consultor Mestre Moedas.' },
    { x: 32, y: 18, texto: 'MEGASTORE. Tudo o que queres... mas será que precisas?' },
    { x: 15, y: 23, texto: 'PARQUE DA CIDADE. Passear e conviver não custa nada.' },
    { x: 20, y: 23, texto: 'CAMPO DE JOGOS. Aberto a todos, gratuito.' },
  ],
  npcs: [
    { id: 'rui', nome: 'Rui', avatar: AVATARES_CIDADE.rui, x: 8, y: 26, dir: 'right', script: 'amigos' },
    { id: 'ines', nome: 'Inês', avatar: AVATARES_CIDADE.ines, x: 10, y: 26, dir: 'left', script: 'amigos' },
    { id: 'duarte', nome: 'Duarte', avatar: AVATARES_CIDADE.duarte, x: 23, y: 24, dir: 'right', script: 'duarte' },
    { id: 'kiko', nome: 'Kiko', avatar: AVATARES_CIDADE.kiko, x: 29, y: 19, dir: 'down', script: 'influencer' },
    { id: 'amelia', nome: 'D. Amélia', avatar: AVATARES_CIDADE.amelia, x: 13, y: 17, dir: 'down', script: 'amelia', vaguear: { x0: 9, y0: 17, x1: 15, y1: 18 } },
    { id: 'beatriz', nome: 'Beatriz', avatar: AVATARES_CIDADE.beatriz, x: 29, y: 9, dir: 'down', script: 'beatriz', vaguear: { x0: 27, y0: 9, x1: 33, y1: 9 } },
  ],
}

export const CASA_CIDADE: MapaDef = {
  id: 'casa',
  nome: 'O TEU APARTAMENTO',
  tipo: 'interior',
  grelha: grelhaSala(10, 8, 4),
  saida: { x: 4, y: 7 },
  chao: 'madeira',
  parede: '#e6eef6',
  props: [
    { tipo: 'estante', x: 2, y: 0, h: 2, script: 'livros' },
    { tipo: 'planta', x: 0, y: 2 },
    { tipo: 'computador', x: 1, y: 2, script: 'pc' },
    { tipo: 'tv', x: 5, y: 2, script: 'tv' },
    { tipo: 'cama', x: 8, y: 2, h: 2, script: 'cama' },
    { tipo: 'sofa', x: 5, y: 4, w: 2 },
    { tipo: 'tapete', x: 5, y: 5, w: 2, h: 1 },
  ],
  npcs: [{ id: 'mae', nome: 'Mãe', avatar: AVATARES_CIDADE.mae, x: 2, y: 5, dir: 'right', script: 'mae' }],
}

export const CAFE: MapaDef = {
  id: 'cafe',
  nome: 'CAFÉ GRÃO DOURADO',
  tipo: 'interior',
  grelha: grelhaSala(12, 9, 6),
  saida: { x: 6, y: 8 },
  chao: 'madeira',
  parede: '#f4e2c8',
  props: [
    { tipo: 'prateleira', x: 4, y: 0, h: 2 },
    { tipo: 'maquina_cafe', x: 1, y: 2, script: 'maquina' },
    { tipo: 'balcao', x: 1, y: 3, w: 5 },
    { tipo: 'mesa_cafe', x: 8, y: 3 },
    { tipo: 'mesa_cafe', x: 10, y: 3 },
    { tipo: 'mesa_cafe', x: 8, y: 6 },
    { tipo: 'mesa_cafe', x: 10, y: 6 },
    { tipo: 'planta', x: 11, y: 2 },
    { tipo: 'planta', x: 0, y: 7 },
  ],
  npcs: [
    { id: 'clara', nome: 'D. Clara', avatar: AVATARES_CIDADE.clara, x: 3, y: 2, dir: 'down', script: 'clara' },
    { id: 'cliente_cafe', nome: 'Cliente', avatar: AVATARES_CIDADE.cliente, x: 9, y: 6, dir: 'left', script: 'cliente_cafe' },
  ],
}

export const BANCO_PONTE: MapaDef = {
  id: 'banco',
  nome: 'BANCO PONTE',
  tipo: 'interior',
  grelha: grelhaSala(12, 9, 6),
  saida: { x: 6, y: 8 },
  chao: 'azulejo',
  parede: '#e2eaf6',
  props: [
    { tipo: 'cotacoes', x: 6, y: 0, w: 3, h: 2, script: 'cotacoes' },
    { tipo: 'cofre', x: 10, y: 0, w: 2, h: 2, script: 'cofre' },
    { tipo: 'balcao', x: 1, y: 3, w: 5 },
    { tipo: 'planta', x: 0, y: 2 },
    { tipo: 'planta', x: 11, y: 2 },
    { tipo: 'sofa', x: 1, y: 6, w: 2 },
    { tipo: 'tapete', x: 5, y: 5, w: 3, h: 2 },
  ],
  npcs: [
    { id: 'rita', nome: 'Rita', avatar: AVATARES_CIDADE.rita, x: 3, y: 2, dir: 'down', script: 'rita' },
    { id: 'mestre', nome: 'Mestre Moedas', avatar: MENTOR.avatar, x: 9, y: 5, dir: 'left', script: 'mestre' },
  ],
}

export const ESCOLA_SECUNDARIA: MapaDef = {
  id: 'escola',
  nome: 'ESCOLA SECUNDÁRIA',
  tipo: 'interior',
  grelha: grelhaSala(14, 10, 7),
  saida: { x: 7, y: 9 },
  chao: 'madeira',
  parede: '#e4f3ec',
  props: [
    { tipo: 'quadro', x: 1, y: 0, w: 3, h: 2, script: 'quadro' },
    { tipo: 'carteira', x: 1, y: 4 },
    { tipo: 'carteira', x: 2, y: 4 },
    { tipo: 'carteira', x: 4, y: 4 },
    { tipo: 'carteira', x: 1, y: 6 },
    { tipo: 'carteira', x: 2, y: 6 },
    { tipo: 'carteira', x: 4, y: 6 },
    { tipo: 'estante', x: 8, y: 0, h: 2, script: 'biblioteca' },
    { tipo: 'estante', x: 9, y: 0, h: 2, script: 'biblioteca' },
    { tipo: 'estante', x: 10, y: 0, h: 2, script: 'biblioteca' },
    { tipo: 'estante', x: 11, y: 0, h: 2, script: 'biblioteca' },
    { tipo: 'estante', x: 12, y: 0, h: 2, script: 'biblioteca' },
    { tipo: 'computador', x: 9, y: 4, script: 'biblioteca' },
    { tipo: 'computador', x: 11, y: 4, script: 'biblioteca' },
    { tipo: 'mesa', x: 9, y: 6, w: 3 },
    { tipo: 'planta', x: 13, y: 2 },
  ],
  npcs: [
    { id: 'prof', nome: 'Prof. Nuno', avatar: AVATARES_CIDADE.prof, x: 3, y: 2, dir: 'down', script: 'prof' },
    { id: 'tomas', nome: 'Tomás', avatar: AVATARES_CIDADE.tomas, x: 12, y: 7, dir: 'left', script: 'tomas' },
  ],
}

export const MEGASTORE: MapaDef = {
  id: 'megastore',
  nome: 'MEGASTORE',
  tipo: 'interior',
  grelha: grelhaSala(14, 9, 7),
  saida: { x: 7, y: 8 },
  chao: 'azulejo',
  parede: '#f4eafa',
  props: [
    { tipo: 'montra', x: 1, y: 0, w: 2, h: 2, script: 'loja_tenis' },
    { tipo: 'montra', x: 4, y: 0, w: 2, h: 2, script: 'loja_auscultadores' },
    { tipo: 'montra', x: 8, y: 0, w: 2, h: 2, script: 'loja_tshirt' },
    { tipo: 'montra', x: 11, y: 0, w: 2, h: 2, script: 'loja_telemovel' },
    { tipo: 'balcao', x: 1, y: 5, w: 3 },
    { tipo: 'planta', x: 0, y: 2 },
    { tipo: 'planta', x: 13, y: 2 },
    { tipo: 'tapete', x: 6, y: 5, w: 3, h: 2 },
  ],
  npcs: [
    { id: 'vendedor', nome: 'Vendedor', avatar: AVATARES_CIDADE.vendedor, x: 2, y: 4, dir: 'down', script: 'vendedor' },
    { id: 'cliente_loja', nome: 'Cliente', avatar: AVATARES_CIDADE.cliente, x: 10, y: 3, dir: 'up', script: 'cliente_loja' },
  ],
}

export const MAPAS_CIDADE: Record<string, MapaDef> = {
  cidade: CIDADE,
  casa: CASA_CIDADE,
  cafe: CAFE,
  banco: BANCO_PONTE,
  escola: ESCOLA_SECUNDARIA,
  megastore: MEGASTORE,
}
