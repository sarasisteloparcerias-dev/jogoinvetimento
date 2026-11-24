import { registarFaixas, type Faixa, type Instrumento, type Nota, type Voz } from './audio'

/**
 * Músicas originais do jogo, escritas numa notação curta:
 * "C5" é uma colcheia (2 passos), "C5:4" uma semínima, "C5:1" uma semicolcheia, "r" uma pausa.
 */

const NOMES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

function midi(nota: string) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(nota)
  if (!m) throw new Error(`Nota inválida: ${nota}`)
  return NOMES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12
}

/** Notas e, para as melodias, o fim do último tempo (as pausas finais também contam). */
type Notas = Nota[] & { fim?: number }

function melodia(texto: string, inicio = 0): Notas {
  const notas: Notas = []
  let passo = inicio
  for (const tok of texto.trim().split(/\s+/)) {
    const [n, d] = tok.split(':')
    const dur = d ? Number(d) : 2
    if (n !== 'r') notas.push({ passo, dur, midi: midi(n) })
    passo += dur
  }
  notas.fim = passo
  return notas
}

const comprimento = (notas: Notas) => notas.fim ?? notas.reduce((m, n) => Math.max(m, n.passo + n.dur), 0)

/** Acordes "C Am F:8 G:8": cada um dura um compasso (16 passos) se não se disser. */
function acordes(texto: string) {
  let passo = 0
  return texto
    .trim()
    .split(/\s+/)
    .map((tok) => {
      const [nome, d] = tok.split(':')
      const m = /^([A-G][#b]?)(m?)(7?)$/.exec(nome)!
      const raiz = midi(`${m[1]}2`)
      const intervalos = m[2] ? [0, 3, 7] : [0, 4, 7]
      if (m[3]) intervalos.push(10)
      const dur = d ? Number(d) : 16
      const a = { passo, dur, raiz, intervalos }
      passo += dur
      return a
    })
}

type Acorde = ReturnType<typeof acordes>[number]

/** Linha de baixo a partir dos acordes. */
function baixo(acs: Acorde[], estilo: 'oitavas' | 'quintas' | 'longo' | 'andante', oitava = 1): Nota[] {
  const notas: Nota[] = []
  for (const a of acs) {
    const r = a.raiz + oitava * 12
    if (estilo === 'longo') {
      notas.push({ passo: a.passo, dur: a.dur, midi: r })
      continue
    }
    const passo = estilo === 'quintas' ? 4 : 2
    for (let p = 0; p < a.dur; p += passo) {
      const i = p / passo
      let n = r
      if (estilo === 'oitavas') n = i % 2 ? r + 12 : r
      else if (estilo === 'quintas') n = i % 2 ? r + 7 : r
      else n = r + [0, a.intervalos[1], 7, a.intervalos[1]][i % 4]
      notas.push({ passo: a.passo + p, dur: passo, midi: n })
    }
  }
  return notas
}

/** Arpejo rápido (semicolcheias) com as notas do acorde, o som mais "Game Boy" que há. */
function arpejo(acs: Acorde[], oitava = 4, padrao = [0, 1, 2, 1], cada = 1): Nota[] {
  const notas: Nota[] = []
  for (const a of acs) {
    const tons = [...a.intervalos.slice(0, 3), 12].map((i) => a.raiz + (oitava - 2) * 12 + i)
    for (let p = 0; p < a.dur; p += cada) notas.push({ passo: a.passo + p, dur: cada, midi: tons[padrao[(p / cada) % padrao.length]] })
  }
  return notas
}

const voz = (inst: Instrumento, vol: number, notas: Nota[], extra: Partial<Voz> = {}): Voz => ({ inst, vol, notas, ...extra })

function faixa(bpm: number, vozes: Voz[], bateria?: string, volBateria?: number): Faixa {
  const passos = Math.max(...vozes.map((v) => comprimento(v.notas)))
  if (import.meta.env.DEV)
    for (const v of vozes) if (comprimento(v.notas) !== passos) console.warn('Faixa com vozes desiguais', bpm, comprimento(v.notas), passos)
  return { bpm, passos, vozes, bateria, volBateria }
}

// ---------------------------------------------------------------------------
// Músicas de fundo

/** Vila Moeda: alegre e saltitante, em dó maior. */
const VILA_AC = acordes('C Am F G C Am F:8 G:8 C')
const vila = faixa(
  132,
  [
    voz(
      'pulso25',
      0.5,
      melodia(`
        E5 G5 C6:4 G5 E5 G5:4
        A5:4 G5 E5 C5:4 E5 r
        F5 A5 C6:4 A5 F5 A5 C6
        B5:4 A5 G5 D5:8
        E5 G5 C6:4 D6 C6 B5 G5
        A5 C6 E6:4 D6 C6 A5:4
        F5 A5 C6 A5 G5 B5 D6 B5
        C6:4 G5 E5 C5:4 r:4`),
      { vibrato: true },
    ),
    voz('pulso12', 0.22, arpejo(VILA_AC, 4, [0, 1, 2, 1], 2), { staccato: true }),
    voz('tri', 0.75, baixo(VILA_AC, 'oitavas')),
  ],
  'k.h.s.h.k.h.s.hh',
  0.45,
)

/** Interiores: calma e acolhedora, sem bateria. */
const INT_AC = acordes('F Dm Bb C F Dm Bb:8 C:8 F')
const interior = faixa(96, [
  voz(
    'pulso50',
    0.32,
    melodia(`
      A4:4 C5 A4 G4:4 F4:4
      F4 A4 D5:4 C5:8
      D5:4 C5 Bb4 A4:4 G4:4
      E4 G4 C5:4 Bb4:4 G4:4
      A4:4 C5 F5 E5:4 C5:4
      D5 F5 A5:4 G5 F5 D5:4
      Bb4 D5 F5 D5 C5 E5 G5 E5
      F5:12 r:4`),
    { vibrato: true },
  ),
  voz('pulso12', 0.18, arpejo(INT_AC, 4, [0, 1, 2, 3, 2, 1], 2), { staccato: true }),
  voz('tri', 0.6, baixo(INT_AC, 'quintas')),
])

/** A Cidade: lá menor, com mais energia e arpejos rápidos. */
const CID_AC = acordes('Am F C G Am F G:8 E:8 Am')
const cidade = faixa(
  140,
  [
    voz(
      'pulso25',
      0.48,
      melodia(`
        A5:3 A5:1 C6 E6:4 D6 C6 B5
        C6:3 C6:1 A5 F5:8 r:2
        E5 G5 C6:4 B5 C6 D6 E6:2
        D6:4 B5 G5:6 r:4
        A5:3 A5:1 C6 E6:4 G6 F6 E6
        F6:4 E6 C6 A5:6 r:2
        D6 C6 B5 D6 E6:4 G#5:4
        A5:12 r:4`),
      { vibrato: true },
    ),
    voz('pulso12', 0.2, arpejo(CID_AC, 4, [0, 1, 2, 3])),
    voz('tri', 0.8, baixo(CID_AC, 'oitavas')),
  ],
  'k.h.s.hkk.h.s.ho',
  0.5,
)

/** O Mercado: ré dórico, descontraído e com baixo a andar. */
const MER_AC = acordes('Dm7 G7 Dm7 G7 Fm7:8 Bb7:8 Cm7:8 F7:8 Dm7 G7')
const mercado = faixa(
  112,
  [
    voz(
      'pulso50',
      0.34,
      melodia(`
        D5 F5 A5 C6:4 A5 B5:4
        G5:6 F5 D5:8
        A5 C6 D6:4 C6 A5 B5 G5
        A5:12 r:4
        Ab5 C6 Eb6:4 D6 C6 Bb5:4
        G5 Bb5 C6:4 A5:4 F5:4
        D5 F5 A5 C6 B5:4 G5:4
        D6:12 r:4`),
      { vibrato: true },
    ),
    voz('pulso12', 0.16, arpejo(MER_AC, 4, [0, 2, 3, 1], 2), { staccato: true }),
    voz('tri', 0.75, baixo(MER_AC, 'andante')),
  ],
  'k...h.k.s...h...',
  0.4,
)

/** A Casa: fá maior, quente e pausada, como chegar a casa ao fim do dia. */
const CASA_AC = acordes('F C Dm Bb F C Bb:8 C:8 F')
const casa = faixa(
  100,
  [
    voz(
      'pulso25',
      0.42,
      melodia(`
        C5 F5 A5:6 G5 F5:4
        E5 G5 C6:6 Bb5 A5:4
        A5 D6 C6:4 A5 F5 D5:4
        D5 F5 Bb5:4 A5 G5:6
        C5 F5 A5:6 G5 F5:4
        E5 G5 C6:6 D6 E6:4
        F6 D6 Bb5 D6 E6 C6 G5 E5
        F5:12 r:4`),
      { vibrato: true },
    ),
    voz('pulso12', 0.18, arpejo(CASA_AC, 4, [0, 1, 2, 3, 2, 1, 0, 1])),
    voz('tri', 0.7, baixo(CASA_AC, 'quintas')),
  ],
  'k.......s.....h.',
  0.4,
)

/** Mini-jogos: mi menor, rápida, para dar adrenalina. */
const MINI_AC = acordes('Em C D B Em C D:8 B:8 Em')
const minijogo = faixa(
  168,
  [
    voz(
      'pulso25',
      0.42,
      melodia(`
        E5 E5 G5 B5 E6:4 D6 B5
        C6:4 B5 G5 E5:8
        D5 F#5 A5 D6 C6 B5 A5 F#5
        D#5:4 F#5 B5 D#6:8
        E6 D6 B5 G5 E5 G5 B5 E6
        G6:4 E6 C6 G5:4 C6:4
        A5 D6 F#6 D6 B5 D#6 F#6 B6
        E6:8 B5 G5 E5:4`),
    ),
    voz('pulso12', 0.18, arpejo(MINI_AC, 4, [0, 2, 1, 3])),
    voz('tri', 0.8, baixo(MINI_AC, 'oitavas')),
  ],
  'k.hhs.hhk.hks.hh',
  0.55,
)

/** Ecrã de título e introdução: sol maior, de aventura. */
const TIT_AC = acordes('G Em C D G Em C:8 D:8 G')
const titulo = faixa(
  120,
  [
    voz(
      'pulso25',
      0.45,
      melodia(`
        D5 G5 B5:6 A5 G5:4
        E5 G5 B5:6 C6 B5:4
        C6:4 E6 C6 G5:4 E5:4
        F#5 A5 D6:6 C6 A5:4
        D5 G5 B5:6 D6 G6:4
        E6 D6 B5 G5 E6:4 B5:4
        C6 E6 G6 E6 D6 F#6 A6 F#6
        G6:12 r:4`),
      { vibrato: true },
    ),
    voz('pulso12', 0.2, arpejo(TIT_AC, 4, [0, 1, 2, 3, 2, 1], 2), { staccato: true }),
    voz('tri', 0.75, baixo(TIT_AC, 'quintas')),
  ],
  'k...s...k.k.s...',
  0.45,
)

/** O Negócio: mi bemol maior, confiante e com ritmo de quem vai trabalhar. */
const NEG_AC = acordes('Eb Cm Ab Bb Eb Cm Ab:8 Bb:8 Eb')
const negocio = faixa(
  116,
  [
    voz(
      'pulso25',
      0.44,
      melodia(`
        G5 Bb5 Eb6:4 D6 Bb5 G5:4
        C6:4 Bb5 G5 Eb5:6 r:2
        Ab5 C6 Eb6:4 C6 Ab5 C6 Eb6
        D6:4 C6 Bb5 F5:8
        G5 Bb5 Eb6:4 F6 Eb6 D6 Bb5
        C6 Eb6 G6:4 F6 Eb6 C6:4
        Ab5 C6 Eb6 C6 Bb5 D6 F6 D6
        Eb6:12 r:4`),
      { vibrato: true },
    ),
    voz('pulso12', 0.17, arpejo(NEG_AC, 4, [0, 1, 2, 3, 2, 1], 2), { staccato: true }),
    voz('tri', 0.75, baixo(NEG_AC, 'andante')),
  ],
  'k.h.s.h.k.hks.h.',
  0.42,
)

/** A Reforma: uma valsa calma e nostálgica, em sol maior (compassos de 3 tempos). */
const REF_AC = acordes('G:12 Em:12 C:12 D:12 G:12 Em:12 Am:6 D:6 G:12')
const reforma = faixa(
  92,
  [
    voz(
      'pulso50',
      0.36,
      melodia(`
        D5:4 G5:4 B5:4
        A5:6 G5:2 E5:4
        C5:4 E5:4 G5:4
        F#5:8 r:4
        D5:4 G5:4 B5:4
        D6:6 B5:2 G5:4
        E5:4 G5:2 F#5:4 A5:2
        G5:8 r:4`),
      { vibrato: true },
    ),
    voz('pulso12', 0.15, arpejo(REF_AC, 4, [0, 1, 2, 1, 2, 1], 2), { staccato: true }),
    voz('tri', 0.6, baixo(REF_AC, 'quintas')),
  ],
  'k...h...h...',
  0.28,
)

/** Banco: elegante e pausada, com baixo a andar (si bemol maior). */
const BAN_AC = acordes('Bb Gm Eb F Bb Gm Cm:8 F:8 Bb')
const banco = faixa(
  104,
  [
    voz(
      'pulso50',
      0.32,
      melodia(`
        F5:4 D5 Bb4 D5:4 F5:4
        G5:6 F5 D5:8
        Eb5 G5 Bb5:4 G5 Eb5 G5:4
        A5:4 C6:4 F5:8
        F5:4 D5 F5 Bb5:4 A5:4
        G5:6 A5 Bb5:8
        G5 Eb5 C5 Eb5 F5 A5 C6 A5
        Bb5:12 r:4`),
      { vibrato: true },
    ),
    voz('pulso12', 0.14, arpejo(BAN_AC, 4, [0, 2, 1, 2], 2), { staccato: true }),
    voz('tri', 0.65, baixo(BAN_AC, 'andante')),
  ],
  '....h.......h...',
  0.25,
)

/** Hospital: calma e lenta, para descansar (dó maior com lá menor). */
const HOS_AC = acordes('C Am F G C Am Dm:8 G:8 C')
const hospital = faixa(
  76,
  [
    voz(
      'pulso50',
      0.28,
      melodia(`
        E5:8 G5:8
        A5:8 E5:8
        F5:6 E5:2 C5:8
        D5:12 r:4
        E5:8 G5:8
        C6:6 B5:2 A5:8
        A5:4 F5:4 D5:4 B4:4
        C5:12 r:4`),
      { vibrato: true },
    ),
    voz('tri', 0.5, baixo(HOS_AC, 'longo')),
  ],
)

/** Lojas e supermercados: saltitante, como música de loja (fá maior). */
const LOJ_AC = acordes('F Dm Gm C F Dm Gm:8 C:8 F')
const loja = faixa(
  150,
  [
    voz(
      'pulso25',
      0.38,
      melodia(`
        C5 F5 A5 C6 A5:4 F5:4
        D5 F5 A5 D6 C6:4 A5:4
        Bb5 A5 G5 Bb5 D6:4 Bb5:4
        C6:4 E5 G5 C6:8
        C5 F5 A5 C6 F6:4 C6:4
        A5 D6 F6 D6 C6:4 A5:4
        G5 Bb5 D6 Bb5 C6 E5 G5 Bb5
        A5:4 F5:4 F5:4 r:4`),
    ),
    voz('pulso12', 0.16, arpejo(LOJ_AC, 4, [0, 1, 2, 1], 2), { staccato: true }),
    voz('tri', 0.7, baixo(LOJ_AC, 'oitavas')),
  ],
  'k.h.s.h.k.h.s.h.',
  0.38,
)

// ---------------------------------------------------------------------------
// Um tema para cada mini-jogo: gerado a partir do nome, sempre igual para o mesmo jogo

function aleatorioDe(texto: string) {
  let h = 2166136261
  for (const c of texto) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

const TONS = ['C', 'D', 'E', 'F', 'G', 'A', 'Bb']
const PROGRESSOES_MAIOR = [
  [0, 7, 9, 5],
  [0, 5, 7, 5],
  [9, 5, 0, 7],
  [0, 9, 5, 7],
]
const PROGRESSOES_MENOR = [
  [0, 8, 3, 10],
  [0, 5, 10, 3],
  [0, 10, 8, 7],
]
const RITMOS = [
  [2, 2, 2, 2, 2, 2, 2, 2],
  [3, 1, 2, 2, 4, 2, 2],
  [4, 2, 2, 4, 4],
  [2, 2, 4, 2, 2, 4],
  [1, 1, 2, 2, 2, 4, 2, 2],
]
const BATERIAS = ['k.hhs.hhk.hks.hh', 'k.h.s.hkk.h.s.ho', 'k...s.k.k...s...', 'khhhskhhkhhhskhs']

export function temaMiniJogo(tipo: string): Faixa {
  const r = aleatorioDe(tipo)
  const escolher = <T,>(l: T[]) => l[Math.floor(r() * l.length)]
  const menor = r() < 0.45
  const raiz = midi(`${escolher(TONS)}3`)
  const prog = escolher(menor ? PROGRESSOES_MENOR : PROGRESSOES_MAIOR)
  const escala = menor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11]
  const ritmos = [escolher(RITMOS), escolher(RITMOS)]
  const acs: Acorde[] = []
  const lead: Nota[] = []
  let grau = 7
  for (let compasso = 0; compasso < 8; compasso++) {
    const intervalo = prog[compasso % 4]
    // o acorde: maior ou menor conforme a nota cai na escala
    const terca = escala.includes((intervalo + 4) % 12) ? 4 : 3
    acs.push({ passo: compasso * 16, dur: 16, raiz: raiz - 12 + intervalo, intervalos: [0, terca, 7] })
    const ritmo = compasso === 7 ? [4, 4, 8] : ritmos[compasso % 2]
    let passo = compasso * 16
    for (const dur of ritmo) {
      // passeio pela escala, com tendência para as notas do acorde
      grau += Math.floor(r() * 5) - 2
      grau = Math.max(3, Math.min(13, grau))
      if (compasso === 7 && passo >= compasso * 16 + 8) grau = 7
      const oit = Math.floor(grau / 7)
      lead.push({ passo, dur, midi: raiz + 24 + oit * 12 + escala[grau % 7] })
      passo += dur
    }
  }
  const tempo = 136 + Math.floor(r() * 40)
  return faixa(
    tempo,
    [
      voz(escolher<Instrumento>(['pulso25', 'pulso50', 'pulso25']), 0.4, lead, { vibrato: r() < 0.5 }),
      voz('pulso12', 0.17, arpejo(acs, 4, escolher([[0, 1, 2, 1], [0, 2, 1, 2], [0, 1, 2, 3]]))),
      voz('tri', 0.75, baixo(acs, escolher(['oitavas', 'quintas', 'andante'] as const))),
    ],
    escolher(BATERIAS),
    0.5,
  )
}

// ---------------------------------------------------------------------------
// Melodias curtas (tocam uma vez)

const cracha = faixa(
  150,
  [
    voz('pulso25', 0.5, melodia('C5:1 E5:1 G5:1 C6:1 r:2 G5:2 C6:8 r:4')),
    voz('pulso12', 0.3, melodia('E4:1 G4:1 C5:1 E5:1 r:2 E5:2 E5:8 r:4')),
    voz('tri', 0.7, melodia('C3:4 r:2 G3:2 C4:8 r:4')),
  ],
  'k',
  0.5,
)

const dormir = faixa(130, [
  voz('pulso50', 0.4, melodia('G5:4 E5:4 C5:8 F5:4 D5:4 B4:8 C5:16'), { vibrato: true }),
  voz('tri', 0.55, melodia('C4:16 G3:16 C3:16')),
])

const fanfarra = faixa(
  140,
  [
    voz('pulso25', 0.5, melodia('G4 C5 E5 G5:4 E5 F5 A5 C6:4 B5 D6 C6:16 r:4'), { vibrato: true }),
    voz('pulso12', 0.3, melodia('E4 G4 C5 E5:4 C5 C5 F5 A5:4 G5 G5 E5:16 r:4')),
    voz('tri', 0.7, melodia('C3:10 F3:10 G3:4 C3:16 r:4')),
  ],
  'k.....k...s...k...s.s.k',
  0.5,
)

const triste = faixa(76, [
  voz('pulso50', 0.42, melodia('E5:4 D#5:4 D5:4 C#5:12'), { vibrato: true }),
  voz('tri', 0.6, melodia('A3:4 G#3:4 G3:4 F#3:12')),
])

const vitoria = faixa(
  170,
  [
    voz('pulso25', 0.5, melodia('C5:1 E5:1 G5:1 C6:1 E6:1 G6:1 C7:6 r:4')),
    voz('tri', 0.7, melodia('C3:2 G3:2 C4:8 r:4')),
  ],
  'k.h.h.k',
  0.45,
)

registarFaixas({ vila, interior, cidade, mercado, casa, negocio, reforma, banco, hospital, loja, minijogo, titulo, cracha, dormir, fanfarra, triste, vitoria })

export type NomeMusica = 'vila' | 'interior' | 'banco' | 'hospital' | 'loja' | 'cidade' | 'mercado' | 'casa' | 'negocio' | 'reforma' | 'minijogo' | 'titulo'
export type NomeJingle = 'cracha' | 'dormir' | 'fanfarra' | 'triste' | 'vitoria'
