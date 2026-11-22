/**
 * Som ao estilo dos chips da Game Boy, todo gerado no próprio jogo com WebAudio:
 * duas ondas quadradas (pulso), uma onda triangular (o baixo) e ruído (a bateria).
 * Não há ficheiros de áudio.
 */

export interface Nota {
  /** Em que passo (semicolcheia) começa. */
  passo: number
  /** Duração em passos. */
  dur: number
  midi: number
}

export type Instrumento = 'pulso12' | 'pulso25' | 'pulso50' | 'tri'

export interface Voz {
  inst: Instrumento
  vol: number
  notas: Nota[]
  /** Notas presas (staccato) ou ligadas. */
  staccato?: boolean
  vibrato?: boolean
}

export interface Faixa {
  bpm: number
  /** Comprimento do ciclo em passos (semicolcheias). */
  passos: number
  vozes: Voz[]
  /** Uma letra por passo: k (bombo), s (tarola), h (prato), . (nada). Repete-se até ao fim do ciclo. */
  bateria?: string
  volBateria?: number
}

const CHAVE = 'vila-moeda:som'
const VOL_MUSICA = 0.22
const VOL_EFEITOS = 0.4

let ac: AudioContext | null = null
let mestre: GainNode
let barramentoMusica: GainNode
let barramentoEfeitos: GainNode
let ruido: AudioBuffer
const ondas = new Map<Instrumento, PeriodicWave>()

let ligado = lerLigado()
const ouvintes = new Set<() => void>()

function lerLigado() {
  try {
    return localStorage.getItem(CHAVE) !== '0'
  } catch {
    return true
  }
}

export const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

/** Onda de pulso com o ciclo de trabalho dado (12,5%, 25% ou 50%), como os canais 1 e 2 da Game Boy. */
function ondaPulso(c: AudioContext, duty: number) {
  const n = 48
  const real = new Float32Array(n)
  const imag = new Float32Array(n)
  for (let i = 1; i < n; i++) imag[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty)
  return c.createPeriodicWave(real, imag)
}

/** Onda triangular "aos degraus" (4 bits), como o canal de onda. */
function ondaTriangular(c: AudioContext) {
  const n = 32
  const real = new Float32Array(n)
  const imag = new Float32Array(n)
  for (let i = 1; i < n; i += 2) imag[i] = ((8 / (Math.PI * Math.PI)) * (i % 4 === 1 ? 1 : -1)) / (i * i)
  return c.createPeriodicWave(real, imag)
}

function criar() {
  const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!C) return null
  const c = new C()
  mestre = c.createGain()
  mestre.gain.value = ligado ? 1 : 0
  // um passa-baixo suave tira a aspereza das ondas sem perder o "chip"
  const filtro = c.createBiquadFilter()
  filtro.type = 'lowpass'
  filtro.frequency.value = 9000
  mestre.connect(filtro).connect(c.destination)
  barramentoMusica = c.createGain()
  barramentoMusica.gain.value = VOL_MUSICA
  barramentoMusica.connect(mestre)
  barramentoEfeitos = c.createGain()
  barramentoEfeitos.gain.value = VOL_EFEITOS
  barramentoEfeitos.connect(mestre)
  ondas.set('pulso12', ondaPulso(c, 0.125))
  ondas.set('pulso25', ondaPulso(c, 0.25))
  ondas.set('pulso50', ondaPulso(c, 0.5))
  ondas.set('tri', ondaTriangular(c))
  // ruído "de 7 bits" (LFSR), mais metálico do que o ruído branco
  ruido = c.createBuffer(1, c.sampleRate, c.sampleRate)
  const d = ruido.getChannelData(0)
  let lfsr = 0x7fff
  const passo = Math.max(1, Math.round(c.sampleRate / 32000))
  for (let i = 0; i < d.length; i++) {
    if (i % passo === 0) {
      const b = (lfsr ^ (lfsr >> 1)) & 1
      lfsr = (lfsr >> 1) | (b << 14)
    }
    d[i] = lfsr & 1 ? 0.8 : -0.8
  }
  return c
}

/** Liga o áudio (os browsers só deixam depois de um toque ou tecla). */
export function desbloquear() {
  try {
    ac ??= criar()
  } catch {
    ac = null
  }
  if (!ac) return
  if (ac.state === 'suspended' && !document.hidden) void ac.resume()
  if (pedida !== atual) iniciarMusica(pedida)
}

let instalado = false
export function instalarDesbloqueio() {
  if (instalado) return
  instalado = true
  const op = { capture: true }
  window.addEventListener('pointerdown', desbloquear, op)
  window.addEventListener('keydown', desbloquear, op)
  document.addEventListener('visibilitychange', () => {
    if (!ac) return
    if (document.hidden) void ac.suspend()
    else void ac.resume()
  })
}

export function somLigado() {
  return ligado
}

export function subscreverSom(fn: () => void) {
  ouvintes.add(fn)
  return () => {
    ouvintes.delete(fn)
  }
}

export function alternarSom() {
  ligado = !ligado
  try {
    localStorage.setItem(CHAVE, ligado ? '1' : '0')
  } catch {
    /* sem armazenamento: fica só nesta sessão */
  }
  if (ac) mestre.gain.setTargetAtTime(ligado ? 1 : 0, ac.currentTime, 0.02)
  ouvintes.forEach((f) => f())
}

// ---------------------------------------------------------------------------
// Instrumentos

export interface OpcoesNota {
  inst: Instrumento
  midi?: number
  hz?: number
  /** Frequência final (desliza até lá), em Hz. */
  ateHz?: number
  t: number
  dur: number
  vol: number
  destino?: AudioNode
  vibrato?: boolean
  /** Fim seco (sem cauda). */
  seco?: boolean
}

export function tocarNota(o: OpcoesNota) {
  if (!ac) return
  const osc = ac.createOscillator()
  osc.setPeriodicWave(ondas.get(o.inst)!)
  const f = o.hz ?? freq(o.midi ?? 60)
  osc.frequency.setValueAtTime(f, o.t)
  if (o.ateHz) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.ateHz), o.t + o.dur)
  if (o.vibrato && o.dur > 0.25) {
    const lfo = ac.createOscillator()
    const prof = ac.createGain()
    lfo.frequency.value = 5.5
    prof.gain.setValueAtTime(0, o.t)
    prof.gain.linearRampToValueAtTime(f * 0.012, o.t + Math.min(0.3, o.dur * 0.6))
    lfo.connect(prof).connect(osc.frequency)
    lfo.start(o.t)
    lfo.stop(o.t + o.dur + 0.05)
  }
  const g = ac.createGain()
  const pico = o.vol
  // envelope "aos degraus" como o da Game Boy: ataque instantâneo e decaimento até um patamar
  g.gain.setValueAtTime(0.0001, o.t)
  g.gain.linearRampToValueAtTime(pico, o.t + 0.004)
  if (o.inst !== 'tri') g.gain.setTargetAtTime(pico * 0.55, o.t + 0.01, Math.min(0.25, o.dur * 0.5))
  const fim = o.t + o.dur
  g.gain.setValueAtTime(o.inst === 'tri' ? pico : pico * 0.55, Math.max(o.t + 0.005, fim - 0.012))
  g.gain.linearRampToValueAtTime(0.0001, fim + (o.seco ? 0.004 : 0.03))
  osc.connect(g).connect(o.destino ?? barramentoEfeitos)
  osc.start(o.t)
  osc.stop(fim + 0.05)
}

export function tocarRuido(t: number, dur: number, vol: number, filtroHz: number, tipo: BiquadFilterType = 'highpass', destino?: AudioNode) {
  if (!ac) return
  const src = ac.createBufferSource()
  src.buffer = ruido
  src.loop = true
  const f = ac.createBiquadFilter()
  f.type = tipo
  f.frequency.value = filtroHz
  const g = ac.createGain()
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g).connect(destino ?? barramentoEfeitos)
  src.start(t, Math.random() * 0.5)
  src.stop(t + dur + 0.02)
}

function bombo(t: number, vol: number, destino: AudioNode) {
  tocarNota({ inst: 'pulso50', hz: 160, ateHz: 45, t, dur: 0.11, vol: vol * 0.9, destino, seco: true })
}

function tambor(letra: string, t: number, vol: number, destino: AudioNode) {
  if (letra === 'k') bombo(t, vol, destino)
  else if (letra === 's') tocarRuido(t, 0.13, vol * 0.7, 1800, 'highpass', destino)
  else if (letra === 'h') tocarRuido(t, 0.035, vol * 0.35, 7000, 'highpass', destino)
  else if (letra === 'o') tocarRuido(t, 0.18, vol * 0.3, 6000, 'highpass', destino)
}

// ---------------------------------------------------------------------------
// Música: um sequenciador que agenda as notas um pouco à frente do tempo real

const FAIXAS = new Map<string, Faixa>()

export function registarFaixas(f: Record<string, Faixa>) {
  for (const [k, v] of Object.entries(f)) FAIXAS.set(k, v)
}

let pedida: string | null = null
let atual: string | null = null
let tocador: { parar(): void } | null = null

function iniciarMusica(nome: string | null) {
  tocador?.parar()
  tocador = null
  atual = nome
  if (!ac || !nome) return
  const f = FAIXAS.get(nome)
  if (!f) return
  const c = ac
  const saida = c.createGain()
  saida.gain.setValueAtTime(0.0001, c.currentTime)
  saida.gain.linearRampToValueAtTime(1, c.currentTime + 0.15)
  saida.connect(barramentoMusica)
  const porPasso = 60 / f.bpm / 4
  const indice: { voz: Voz; nota: Nota }[][] = Array.from({ length: f.passos }, () => [])
  for (const voz of f.vozes) for (const nota of voz.notas) if (nota.passo < f.passos) indice[nota.passo].push({ voz, nota })
  let passo = 0
  let quando = c.currentTime + 0.08
  const agendar = () => {
    while (quando < c.currentTime + 0.2) {
      for (const { voz, nota } of indice[passo]) {
        const dur = nota.dur * porPasso * (voz.staccato ? 0.6 : 0.95)
        tocarNota({ inst: voz.inst, midi: nota.midi, t: quando, dur, vol: voz.vol, destino: saida, vibrato: voz.vibrato })
      }
      if (f.bateria) tambor(f.bateria[passo % f.bateria.length], quando, f.volBateria ?? 0.5, saida)
      passo = (passo + 1) % f.passos
      quando += porPasso
    }
  }
  agendar()
  const id = window.setInterval(agendar, 40)
  tocador = {
    parar() {
      window.clearInterval(id)
      const t = c.currentTime
      saida.gain.cancelScheduledValues(t)
      saida.gain.setValueAtTime(saida.gain.value, t)
      saida.gain.linearRampToValueAtTime(0.0001, t + 0.12)
      window.setTimeout(() => saida.disconnect(), 600)
    },
  }
}

/** Muda a música de fundo (null: silêncio). Pedir a mesma que já toca não a recomeça. */
export function musica(nome: string | null) {
  pedida = nome
  if (nome === atual) return
  if (ac) iniciarMusica(nome)
}

let jingleAte = 0

/** Toca uma pequena melodia uma vez, baixando a música enquanto isso. */
export function jingle(nome: string) {
  if (!ac || !ligado) return
  const f = FAIXAS.get(nome)
  if (!f) return
  const t0 = ac.currentTime + 0.03
  const porPasso = 60 / f.bpm / 4
  const dur = f.passos * porPasso
  for (const voz of f.vozes)
    for (const n of voz.notas)
      tocarNota({ inst: voz.inst, midi: n.midi, t: t0 + n.passo * porPasso, dur: n.dur * porPasso * (voz.staccato ? 0.6 : 0.95), vol: voz.vol * 1.6, vibrato: voz.vibrato })
  if (f.bateria)
    for (let p = 0; p < Math.min(f.passos, f.bateria.length); p++) tambor(f.bateria[p % f.bateria.length], t0 + p * porPasso, (f.volBateria ?? 0.5) * 1.4, barramentoEfeitos)
  const g = barramentoMusica.gain
  g.cancelScheduledValues(t0)
  g.setValueAtTime(g.value, t0)
  g.linearRampToValueAtTime(0.0001, t0 + 0.08)
  g.setValueAtTime(0.0001, t0 + dur)
  g.linearRampToValueAtTime(VOL_MUSICA, t0 + dur + 0.6)
  jingleAte = t0 + dur
}

/** Há uma melodia (conquista, dormir...) a tocar agora? */
export function aTocarJingle() {
  return !!ac && ac.currentTime < jingleAte
}

export function agora() {
  return ac && ligado ? ac.currentTime : null
}
