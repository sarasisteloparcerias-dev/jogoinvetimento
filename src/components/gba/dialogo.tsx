import { useCallback, useEffect, useRef, useState } from 'react'
import { Cursor, SetaBaixo, u } from './ui'

export type Tecla = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'A' | 'B' | 'START'

export const FONTE_PIXEL = "'Press Start 2P', monospace"
const LARGURA_TEXTO = 204
const LINHAS_POR_PAGINA = 3

let medidor: CanvasRenderingContext2D | null = null
function largura(t: string) {
  medidor ??= document.createElement('canvas').getContext('2d')
  medidor!.font = `10px ${FONTE_PIXEL}`
  return medidor!.measureText(t).width
}

/** Parte um texto em páginas de 3 linhas que cabem na caixa de diálogo (medindo com a própria fonte). */
export function paginar(texto: string): string[] {
  const linhas: string[] = []
  let atual = ''
  for (const palavra of texto.split(/\s+/).filter(Boolean)) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra
    if (!atual || largura(tentativa) <= LARGURA_TEXTO) atual = tentativa
    else {
      linhas.push(atual)
      atual = palavra
    }
  }
  if (atual) linhas.push(atual)
  const paginas: string[] = []
  for (let i = 0; i < linhas.length; i += LINHAS_POR_PAGINA) paginas.push(linhas.slice(i, i + LINHAS_POR_PAGINA).join('\n'))
  return paginas.length ? paginas : ['']
}

export interface EstadoDialogo {
  quem?: string
  paginas: string[]
  pagina: number
  mostrado: number
  opcoes?: string[]
  indice: number
  cancelar?: number
}

export function useDialogo() {
  const [d, setD] = useState<EstadoDialogo | null>(null)
  const ref = useRef<EstadoDialogo | null>(null)
  const resolver = useRef<((v: number) => void) | null>(null)

  const atualizar = useCallback((n: EstadoDialogo | null) => {
    ref.current = n
    setD(n)
  }, [])

  useEffect(() => {
    if (!d || d.mostrado >= d.paginas[d.pagina].length) return
    const t = setTimeout(() => {
      const cur = ref.current
      if (cur) atualizar({ ...cur, mostrado: cur.mostrado + 1 })
    }, 24)
    return () => clearTimeout(t)
  }, [d, atualizar])

  const fechar = useCallback(
    (v: number) => {
      const r = resolver.current
      resolver.current = null
      atualizar(null)
      r?.(v)
    },
    [atualizar],
  )

  const abrir = useCallback(
    (texto: string | string[], quem?: string, opcoes?: string[], cancelar?: number) =>
      new Promise<number>((res) => {
        resolver.current = res
        const paginas = (Array.isArray(texto) ? texto : [texto]).flatMap(paginar)
        atualizar({ quem, paginas, pagina: 0, mostrado: 0, opcoes, indice: 0, cancelar })
      }),
    [atualizar],
  )

  const say = useCallback(async (texto: string | string[], quem?: string) => {
    await abrir(texto, quem)
  }, [abrir])

  const ask = useCallback(
    (texto: string, opcoes: string[], quem?: string, cancelar?: number) => abrir(texto, quem, opcoes, cancelar),
    [abrir],
  )

  const tecla = useCallback(
    (t: Tecla) => {
      const cur = ref.current
      if (!cur) return
      const pag = cur.paginas[cur.pagina]
      const completo = cur.mostrado >= pag.length
      const ultima = cur.pagina === cur.paginas.length - 1
      if (t === 'A' || t === 'B') {
        if (!completo) return atualizar({ ...cur, mostrado: pag.length })
        if (!ultima) return atualizar({ ...cur, pagina: cur.pagina + 1, mostrado: 0 })
        if (cur.opcoes) {
          if (t === 'B') {
            if (cur.cancelar !== undefined) fechar(cur.cancelar)
            return
          }
          return fechar(cur.indice)
        }
        return fechar(0)
      }
      if ((t === 'UP' || t === 'DOWN') && cur.opcoes && completo && ultima) {
        const n = cur.opcoes.length
        atualizar({ ...cur, indice: (cur.indice + (t === 'UP' ? -1 : 1) + n) % n })
      }
    },
    [atualizar, fechar],
  )

  const escolher = useCallback(
    (i: number) => {
      const cur = ref.current
      if (cur?.opcoes && cur.pagina === cur.paginas.length - 1 && cur.mostrado >= cur.paginas[cur.pagina].length) fechar(i)
    },
    [fechar],
  )

  const aberto = useCallback(() => ref.current !== null, [])

  return { dialogo: d, say, ask, tecla, escolher, aberto }
}

export function CaixaDialogo({ d, onA, onEscolher }: { d: EstadoDialogo; onA: () => void; onEscolher: (i: number) => void }) {
  const pag = d.paginas[d.pagina]
  const completo = d.mostrado >= pag.length
  const mostrarOpcoes = !!d.opcoes && completo && d.pagina === d.paginas.length - 1

  return (
    <>
      {mostrarOpcoes && (
        <div
          className="janela"
          data-testid="opcoes"
          style={{ position: 'absolute', right: u(3), bottom: u(57), maxWidth: u(234), padding: `${u(4)} ${u(9)} ${u(4)} ${u(6)}` }}
        >
          {d.opcoes!.map((o, i) => (
            <div
              key={o + i}
              onClick={() => onEscolher(i)}
              style={{ display: 'flex', alignItems: 'center', fontSize: u(10), lineHeight: u(12.5), cursor: 'pointer' }}
            >
              <Cursor visivel={i === d.indice} />
              <span>{o}</span>
            </div>
          ))}
        </div>
      )}
      <div
        className="janela"
        data-testid="dialogo"
        onClick={onA}
        style={{ position: 'absolute', left: u(3), right: u(3), bottom: u(3), height: u(52), padding: `${u(5)} ${u(9)}`, cursor: 'pointer' }}
      >
        {d.quem && (
          <div className="etiqueta" style={{ position: 'absolute', left: u(7), top: u(-9), fontSize: u(8), padding: `${u(0.5)} ${u(5)}` }}>
            {d.quem}
          </div>
        )}
        <p style={{ whiteSpace: 'pre-line', fontSize: u(10), lineHeight: u(13), margin: 0 }}>{pag.slice(0, d.mostrado)}</p>
        {completo && !mostrarOpcoes && <SetaBaixo style={{ right: u(9), bottom: u(5) }} />}
      </div>
    </>
  )
}
