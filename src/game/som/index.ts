import { agora, aTocarJingle, tocarNota, tocarRuido } from './audio'
import { registarFaixas } from './audio'
import { temaMiniJogo } from './musicas'

export { alternarSom, desbloquear, instalarDesbloqueio, jingle, musica, somLigado, subscreverSom } from './audio'
export type { NomeJingle, NomeMusica } from './musicas'

const temas = new Set<string>()

/** O nome da música de um mini-jogo (cada um tem o seu tema, criado na primeira vez). */
export function musicaMiniJogo(tipo: string) {
  const nome = `mj_${tipo}`
  if (!temas.has(nome)) {
    temas.add(nome)
    registarFaixas({ [nome]: temaMiniJogo(tipo) })
  }
  return nome
}

/** Interiores com música própria; os outros usam a música calma de interior. */
const MUSICA_SITIO: Record<string, string> = { banco: 'banco', hospital: 'hospital', loja: 'loja', supermercado: 'loja', megastore: 'loja', imobiliaria: 'banco', financas: 'banco' }

export function musicaInterior(mapa: string) {
  return MUSICA_SITIO[mapa] ?? 'interior'
}

export type Efeito =
  | 'texto'
  | 'cursor'
  | 'confirmar'
  | 'cancelar'
  | 'moeda'
  | 'gastar'
  | 'porta'
  | 'erro'
  | 'ponto'
  | 'apanhar'
  | 'golo'
  | 'salto'
  | 'travagem'
  | 'apito'
  | 'buzina'
  | 'pinos'
  | 'tic'

const ultimo = new Map<Efeito, number>()
/** Intervalo mínimo entre dois sons iguais (evita "metralhadoras" de som). */
const INTERVALO: Partial<Record<Efeito, number>> = { texto: 0.045, moeda: 0.12, gastar: 0.12, cursor: 0.03, tic: 0.05 }

/** Efeitos sonoros curtos, todos sintetizados. */
export function sfx(nome: Efeito) {
  const t = agora()
  if (t === null) return
  const min = INTERVALO[nome] ?? 0.02
  if (t - (ultimo.get(nome) ?? -1) < min) return
  ultimo.set(nome, t)
  const n = (o: Omit<Parameters<typeof tocarNota>[0], 't'> & { em?: number }) => tocarNota({ ...o, t: t + (o.em ?? 0) })

  switch (nome) {
    case 'texto':
      n({ inst: 'pulso50', hz: 620 + Math.random() * 60, dur: 0.028, vol: 0.12, seco: true })
      break
    case 'cursor':
      n({ inst: 'pulso25', hz: 1320, dur: 0.035, vol: 0.2, seco: true })
      break
    case 'confirmar':
      n({ inst: 'pulso25', hz: 988, dur: 0.045, vol: 0.25, seco: true })
      n({ inst: 'pulso25', hz: 1480, dur: 0.07, vol: 0.25, em: 0.05 })
      break
    case 'cancelar':
      n({ inst: 'pulso25', hz: 740, dur: 0.045, vol: 0.22, seco: true })
      n({ inst: 'pulso25', hz: 494, dur: 0.07, vol: 0.22, em: 0.05 })
      break
    case 'moeda':
      if (aTocarJingle()) return
      n({ inst: 'pulso50', hz: 988, dur: 0.06, vol: 0.28, seco: true })
      n({ inst: 'pulso50', hz: 1319, dur: 0.28, vol: 0.28, em: 0.06 })
      break
    case 'gastar':
      if (aTocarJingle()) return
      n({ inst: 'pulso12', hz: 784, dur: 0.05, vol: 0.26, seco: true })
      n({ inst: 'pulso12', hz: 659, dur: 0.05, vol: 0.26, em: 0.055, seco: true })
      n({ inst: 'pulso12', hz: 523, dur: 0.1, vol: 0.26, em: 0.11 })
      break
    case 'porta':
      if (aTocarJingle()) return
      tocarRuido(t, 0.09, 0.35, 900, 'lowpass')
      n({ inst: 'pulso50', hz: 220, ateHz: 90, dur: 0.12, vol: 0.25, seco: true })
      n({ inst: 'pulso25', hz: 660, ateHz: 990, dur: 0.12, vol: 0.12, em: 0.1 })
      break
    case 'erro':
      n({ inst: 'pulso50', hz: 140, dur: 0.09, vol: 0.28, seco: true })
      n({ inst: 'pulso50', hz: 110, dur: 0.16, vol: 0.28, em: 0.11 })
      break
    case 'ponto':
      n({ inst: 'pulso25', hz: 1047, dur: 0.05, vol: 0.25, seco: true })
      n({ inst: 'pulso25', hz: 1568, dur: 0.12, vol: 0.25, em: 0.05 })
      break
    case 'apanhar':
      n({ inst: 'pulso50', hz: 1319, dur: 0.04, vol: 0.22, seco: true })
      n({ inst: 'pulso50', hz: 1760, dur: 0.08, vol: 0.22, em: 0.04 })
      break
    case 'golo':
      ;[523, 659, 784, 1047, 1319, 1568].forEach((hz, i) => n({ inst: 'pulso25', hz, dur: i === 5 ? 0.3 : 0.05, vol: 0.25, em: i * 0.05 }))
      tocarRuido(t, 0.4, 0.15, 5000)
      break
    case 'salto':
      n({ inst: 'pulso25', hz: 300, ateHz: 900, dur: 0.13, vol: 0.22 })
      break
    case 'travagem':
      n({ inst: 'pulso12', hz: 1400, ateHz: 700, dur: 0.35, vol: 0.18 })
      n({ inst: 'pulso12', hz: 1460, ateHz: 720, dur: 0.35, vol: 0.12 })
      tocarRuido(t, 0.35, 0.12, 3000)
      tocarRuido(t + 0.32, 0.35, 0.5, 700, 'lowpass')
      n({ inst: 'pulso50', hz: 120, ateHz: 40, dur: 0.25, vol: 0.3, em: 0.32 })
      break
    case 'apito':
      for (const em of [0, 0.32]) {
        n({ inst: 'pulso50', hz: 2100, dur: 0.22, vol: 0.14, em, vibrato: false, seco: true })
        n({ inst: 'pulso50', hz: 2180, dur: 0.22, vol: 0.1, em, seco: true })
      }
      break
    case 'buzina':
      n({ inst: 'pulso50', hz: 392, dur: 0.18, vol: 0.18, seco: true })
      n({ inst: 'pulso50', hz: 494, dur: 0.18, vol: 0.14, seco: true })
      break
    case 'pinos':
      tocarRuido(t, 0.25, 0.4, 2500, 'bandpass')
      tocarRuido(t + 0.06, 0.2, 0.3, 4000, 'bandpass')
      break
    case 'tic':
      n({ inst: 'pulso12', hz: 2000, dur: 0.02, vol: 0.12, seco: true })
      break
  }
}
