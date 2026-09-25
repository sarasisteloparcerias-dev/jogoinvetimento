import { MENTOR } from '../mentor'
import { MARTA, TIAGO } from '../npcs'
import type { MapaDef } from './tipos'

type Grelha = string[][]

function novaGrelha(w: number, h: number, c: string): Grelha {
  return Array.from({ length: h }, () => Array(w).fill(c))
}

function ret(g: Grelha, x0: number, y0: number, x1: number, y1: number, c: string) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = c
}

function texto(g: Grelha) {
  return g.map((l) => l.join(''))
}

function grelhaVila(): string[] {
  const W = 30
  const H = 24
  const g = novaGrelha(W, H, '.')
  ret(g, 0, 0, W - 1, 0, 'T')
  ret(g, 0, H - 1, W - 1, H - 1, 'T')
  ret(g, 0, 0, 0, H - 1, 'T')
  ret(g, W - 1, 0, W - 1, H - 1, 'T')
  ret(g, 1, 6, 28, 6, '#')
  ret(g, 1, 15, 28, 15, '#')
  ret(g, 13, 1, 14, 22, '#')
  ret(g, 2, 17, 7, 20, 'w')
  ret(g, 19, 17, 26, 20, 'F')
  ret(g, 18, 21, 27, 21, '=')
  for (const [x, y] of [[10, 20], [11, 21], [16, 21], [27, 19], [1, 11], [1, 12], [28, 11], [28, 12], [8, 1], [9, 1]]) g[y][x] = 'T'
  const flores = [[1, 7], [5, 9], [10, 8], [17, 9], [21, 9], [26, 8], [1, 16], [10, 19], [16, 18], [28, 17], [12, 22], [20, 22], [25, 22], [5, 22], [2, 1], [20, 1], [27, 1], [3, 9], [11, 16], [23, 9]]
  for (const [x, y] of flores) g[y][x] = 'f'
  return texto(g)
}

function grelhaSala(w: number, h: number, saidaX: number): string[] {
  const g = novaGrelha(w, h, '_')
  ret(g, 0, 0, w - 1, 1, 'W')
  g[h - 1][saidaX] = 'X'
  return texto(g)
}

export const AVATARES = {
  mae: { pele: '#f1c27d', cabelo: '#2d1b0e', roupa: '#0e7490', cabeloComprido: true },
  avo: { pele: '#f1c27d', cabelo: '#e8e0d5', roupa: '#a83232', cabeloComprido: true },
  srDoce: { pele: '#ffe0bd', cabelo: '#e8e0d5', roupa: '#ef4444' },
  cliente: { pele: '#e0ac69', cabelo: '#d4a017', roupa: '#10b981' },
  sofia: { pele: '#c68642', cabelo: '#2d1b0e', roupa: '#0ea5e9', cabeloComprido: true },
  prof: { pele: '#e0ac69', cabelo: '#a83232', roupa: '#14b8a6', cabeloComprido: true },
  aluno: { pele: '#8d5524', cabelo: '#2d1b0e', roupa: '#f97316' },
  treinador: { pele: '#c68642', cabelo: '#2d1b0e', roupa: '#ef4444' },
  leo: { pele: '#ffe0bd', cabelo: '#d4a017', roupa: '#0ea5e9' },
  bia: { pele: '#8d5524', cabelo: '#5b3a8e', roupa: '#ec4899', cabeloComprido: true },
}

export const VILA: MapaDef = {
  id: 'vila',
  nome: 'VILA MOEDA',
  tipo: 'exterior',
  grelha: grelhaVila(),
  edificios: [
    { x: 2, y: 2, w: 5, h: 4, cor: 'laranja', porta: 2, janelas: [1, 3], chamine: true, interior: 'casa' },
    { x: 8, y: 2, w: 4, h: 4, cor: 'lilas', porta: 1, janelas: [2], chamine: true, interior: 'avo' },
    { x: 17, y: 2, w: 5, h: 4, cor: 'vermelho', porta: 2, janelas: [1, 3], letreiro: 'LOJA', interior: 'loja' },
    { x: 23, y: 2, w: 4, h: 4, cor: 'castanho', porta: 1, janelas: [2], chamine: true, trancado: 'Está trancado. Os vizinhos foram passear.' },
    { x: 2, y: 10, w: 6, h: 5, cor: 'azul', porta: 3, janelas: [1, 4], letreiro: 'BANCO', interior: 'banco' },
    { x: 9, y: 11, w: 4, h: 4, cor: 'rosa', porta: 1, janelas: [2], trancado: 'Está trancado. Não está ninguém em casa.' },
    { x: 17, y: 10, w: 6, h: 5, cor: 'verde', porta: 3, janelas: [1, 4], letreiro: 'ESCOLA', interior: 'escola' },
    { x: 24, y: 11, w: 4, h: 4, cor: 'lilas', porta: 1, janelas: [2], chamine: true, trancado: 'Está trancado. Deve estar alguém de férias.' },
  ],
  props: [
    { tipo: 'correio', x: 7, y: 5, script: 'correio' },
    { tipo: 'candeeiro', x: 7, y: 7 },
    { tipo: 'candeeiro', x: 16, y: 7 },
    { tipo: 'candeeiro', x: 27, y: 7 },
    { tipo: 'candeeiro', x: 7, y: 16 },
    { tipo: 'candeeiro', x: 16, y: 16 },
    { tipo: 'banco_jardim', x: 9, y: 17, w: 2 },
    { tipo: 'bola', x: 22, y: 19, script: 'bola' },
  ],
  placas: [
    { x: 3, y: 7, texto: 'CASA DE {nome}. Lá dentro estão a tua cama e o teu mealheiro.' },
    { x: 12, y: 8, texto: 'VILA MOEDA — onde cada moeda conta! Carrega em START (tecla M) para abrir o menu.' },
    { x: 21, y: 7, texto: 'LOJA DO SR. DOCE. Antes de comprar, pergunta: preciso mesmo disto?' },
    { x: 4, y: 16, texto: 'BANCO DA VILA. Aqui o teu dinheiro pode trabalhar por ti. O Mestre Moedas está lá dentro!' },
    { x: 23, y: 16, texto: 'ESCOLA DA VILA. Quem sabe mais, ganha mais!' },
    { x: 18, y: 18, texto: 'PARQUE. Fazer exercício faz bem e brincar com amigos também!' },
    { x: 8, y: 18, texto: 'LAGO DA POUPANÇA. Gota a gota, o lago encheu. Moeda a moeda, o mealheiro também!' },
  ],
  npcs: [
    { id: 'marta', nome: 'Marta', avatar: { ...MARTA.avatar, cabeloComprido: true }, x: 5, y: 8, dir: 'down', script: 'marta', vaguear: { x0: 1, y0: 7, x1: 11, y1: 9 } },
    { id: 'tiago', nome: 'Tiago', avatar: TIAGO.avatar, x: 24, y: 8, dir: 'down', script: 'tiago', vaguear: { x0: 16, y0: 7, x1: 28, y1: 9 } },
    { id: 'treinador', nome: 'Treinador Zé', avatar: AVATARES.treinador, x: 20, y: 18, dir: 'down', script: 'treinador' },
    { id: 'leo', nome: 'Leo', avatar: AVATARES.leo, x: 24, y: 18, dir: 'right', script: 'amigos' },
    { id: 'bia', nome: 'Bia', avatar: AVATARES.bia, x: 25, y: 18, dir: 'left', script: 'amigos' },
  ],
}

export const CASA: MapaDef = {
  id: 'casa',
  nome: 'A TUA CASA',
  tipo: 'interior',
  grelha: grelhaSala(10, 8, 4),
  saida: { x: 4, y: 7 },
  chao: 'madeira',
  parede: '#f6e3c8',
  props: [
    { tipo: 'estante', x: 2, y: 0, h: 2, script: 'livros' },
    { tipo: 'planta', x: 0, y: 2 },
    { tipo: 'mealheiro', x: 1, y: 2, script: 'mealheiro' },
    { tipo: 'tv', x: 5, y: 2, script: 'tv' },
    { tipo: 'cama', x: 8, y: 2, h: 2, script: 'cama' },
    { tipo: 'mesa', x: 1, y: 4, w: 2 },
    { tipo: 'tapete', x: 5, y: 4, w: 2, h: 2 },
  ],
  npcs: [{ id: 'mae', nome: 'Mãe', avatar: AVATARES.mae, x: 3, y: 5, dir: 'right', script: 'mae' }],
}

export const AVO: MapaDef = {
  id: 'avo',
  nome: 'CASA DA AVÓ ROSA',
  tipo: 'interior',
  grelha: grelhaSala(10, 8, 4),
  saida: { x: 4, y: 7 },
  chao: 'madeira',
  parede: '#efe2f4',
  props: [
    { tipo: 'estante', x: 7, y: 0, h: 2, script: 'livros' },
    { tipo: 'planta', x: 0, y: 2 },
    { tipo: 'planta', x: 9, y: 2 },
    { tipo: 'mesa', x: 6, y: 3, w: 2 },
    { tipo: 'tapete', x: 2, y: 3, w: 3, h: 2 },
  ],
  npcs: [{ id: 'avo', nome: 'Avó Rosa', avatar: AVATARES.avo, x: 3, y: 3, dir: 'down', script: 'avo' }],
}

export const LOJA: MapaDef = {
  id: 'loja',
  nome: 'LOJA DO SR. DOCE',
  tipo: 'interior',
  grelha: grelhaSala(10, 8, 4),
  saida: { x: 4, y: 7 },
  chao: 'azulejo',
  parede: '#fde6d6',
  props: [
    { tipo: 'prateleira', x: 5, y: 0, h: 2 },
    { tipo: 'prateleira', x: 6, y: 0, h: 2 },
    { tipo: 'prateleira', x: 7, y: 0, h: 2 },
    { tipo: 'prateleira', x: 8, y: 0, h: 2 },
    { tipo: 'balcao', x: 1, y: 3, w: 3 },
    { tipo: 'planta', x: 9, y: 2 },
  ],
  npcs: [
    { id: 'sr_doce', nome: 'Sr. Doce', avatar: AVATARES.srDoce, x: 2, y: 2, dir: 'down', script: 'sr_doce' },
    { id: 'cliente', nome: 'Cliente', avatar: AVATARES.cliente, x: 7, y: 3, dir: 'up', script: 'cliente' },
  ],
}

export const BANCO: MapaDef = {
  id: 'banco',
  nome: 'BANCO DA VILA',
  tipo: 'interior',
  grelha: grelhaSala(12, 9, 6),
  saida: { x: 6, y: 8 },
  chao: 'azulejo',
  parede: '#e2eaf6',
  props: [
    { tipo: 'estante', x: 7, y: 0, h: 2, script: 'livros' },
    { tipo: 'cofre', x: 9, y: 0, w: 2, h: 2, script: 'cofre' },
    { tipo: 'balcao', x: 1, y: 3, w: 5 },
    { tipo: 'planta', x: 0, y: 2 },
    { tipo: 'planta', x: 11, y: 2 },
    { tipo: 'tapete', x: 5, y: 5, w: 3, h: 2 },
  ],
  npcs: [
    { id: 'sofia', nome: 'Sofia', avatar: AVATARES.sofia, x: 3, y: 2, dir: 'down', script: 'sofia' },
    { id: 'mestre', nome: 'Mestre Moedas', avatar: MENTOR.avatar, x: 9, y: 5, dir: 'left', script: 'mestre' },
  ],
}

export const ESCOLA: MapaDef = {
  id: 'escola',
  nome: 'ESCOLA DA VILA',
  tipo: 'interior',
  grelha: grelhaSala(12, 9, 6),
  saida: { x: 6, y: 8 },
  chao: 'madeira',
  parede: '#e4f3ec',
  props: [
    { tipo: 'estante', x: 0, y: 0, h: 2, script: 'livros' },
    { tipo: 'estante', x: 11, y: 0, h: 2, script: 'livros' },
    { tipo: 'quadro', x: 4, y: 0, w: 3, h: 2, script: 'quadro' },
    { tipo: 'carteira', x: 2, y: 4 },
    { tipo: 'carteira', x: 3, y: 4 },
    { tipo: 'carteira', x: 8, y: 4 },
    { tipo: 'carteira', x: 9, y: 4 },
    { tipo: 'carteira', x: 2, y: 6 },
    { tipo: 'carteira', x: 3, y: 6 },
    { tipo: 'carteira', x: 8, y: 6 },
    { tipo: 'carteira', x: 9, y: 6 },
  ],
  npcs: [
    { id: 'prof', nome: 'Prof. Luz', avatar: AVATARES.prof, x: 5, y: 2, dir: 'down', script: 'prof' },
    { id: 'aluno', nome: 'Tomás', avatar: AVATARES.aluno, x: 10, y: 7, dir: 'left', script: 'aluno' },
  ],
}

export const MAPAS: Record<string, MapaDef> = { vila: VILA, casa: CASA, avo: AVO, loja: LOJA, banco: BANCO, escola: ESCOLA }
