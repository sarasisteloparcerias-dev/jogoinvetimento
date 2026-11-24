import { useEffect, useRef } from 'react'
import { AVATAR_PADRAO } from '../game/data'
import { circulo } from '../game/pixel/cenario'
import { framesAdolescente, framesAdulto, framesPersonagem, framesSenior } from '../game/pixel/sprites'

const W = 240
const H = 100

interface Moeda {
  x: number
  y: number
  vy: number
  fase: number
}

/** Ecrã de título: o logótipo da Vila Moeda com moedas a cair e a vida inteira a passear (criança, adolescente, adulto, sénior). */
export function LogoAnimado() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const ctx = ref.current!.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    const pessoas = [
      framesPersonagem(AVATAR_PADRAO),
      framesAdolescente({ ...AVATAR_PADRAO, roupa: '#0ea5e9' }),
      framesAdulto({ ...AVATAR_PADRAO, roupa: '#283040' }),
      framesSenior({ ...AVATAR_PADRAO, cabelo: '#d8d8d8', roupa: '#8a6ad0' }),
    ]
    const moedas: Moeda[] = []
    let raf = 0
    let ultimo = performance.now()
    let t = 0
    const ciclo = (agora: number) => {
      const dt = Math.min(50, agora - ultimo)
      ultimo = agora
      t += dt
      // céu e colinas
      const ceu = ctx.createLinearGradient(0, 0, 0, H)
      ceu.addColorStop(0, '#7ec8f0')
      ceu.addColorStop(1, '#d8f0fb')
      ctx.fillStyle = ceu
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#ffffff'
      for (let i = 0; i < 3; i++) {
        const x = ((i * 97 + t * 0.008) % (W + 60)) - 40
        ctx.fillRect(x, 12 + i * 9, 26, 5)
        ctx.fillRect(x + 5, 9 + i * 9, 14, 4)
      }
      ctx.fillStyle = '#7cc860'
      ctx.beginPath()
      ctx.moveTo(0, 76)
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, 74 - Math.sin(x / 28) * 5)
      ctx.lineTo(W, H)
      ctx.lineTo(0, H)
      ctx.fill()
      ctx.fillStyle = '#d8c08a'
      ctx.fillRect(0, 88, W, 12)

      // moedas a cair e a saltar
      if (moedas.length < 9 && Math.random() < dt * 0.004) moedas.push({ x: 10 + Math.random() * (W - 20), y: -8, vy: 0, fase: Math.random() * 6 })
      for (const m of moedas) {
        m.vy += dt * 0.0006
        m.y += m.vy * dt
        if (m.y > 84) {
          m.y = 84
          m.vy = -m.vy * 0.45
          if (Math.abs(m.vy) < 0.03) m.y = 200
        }
        const largura = Math.max(1, Math.round(Math.abs(Math.cos(t / 150 + m.fase)) * 4))
        circulo(ctx, Math.round(m.x), Math.round(m.y), 4, '#f0c838', '#8a6a10')
        ctx.fillStyle = '#fff4b0'
        ctx.fillRect(Math.round(m.x) - Math.floor(largura / 2), Math.round(m.y) - 2, largura, 2)
      }
      for (let i = moedas.length - 1; i >= 0; i--) if (moedas[i].y > 150) moedas.splice(i, 1)

      // a vida inteira a passear
      pessoas.forEach((frames, i) => {
        const x = ((t * 0.025 + i * 38) % (W + 40)) - 30
        const passo = Math.floor(t / 180) % 2
        const img = frames.right[passo ? 1 : 0]
        ctx.drawImage(img, Math.round(x), 90 - img.height)
      })

      // logótipo com contorno e brilho a passar
      ctx.font = "18px 'Press Start 2P'"
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      const salto = Math.round(Math.sin(t / 400) * 2)
      ctx.fillStyle = '#283040'
      for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [2, 2], [-2, 2], [2, -2], [-2, -2]]) ctx.fillText('VILA MOEDA', W / 2 + dx, 30 + salto + dy)
      ctx.fillStyle = '#e8743a'
      ctx.fillText('VILA MOEDA', W / 2, 30 + salto + 2)
      ctx.fillStyle = '#f8c838'
      ctx.fillText('VILA MOEDA', W / 2, 30 + salto)
      const brilho = ((t / 6) % (W + 120)) - 60
      ctx.save()
      ctx.beginPath()
      ctx.rect(brilho, 0, 10, H)
      ctx.clip()
      ctx.fillStyle = '#ffffff'
      ctx.fillText('VILA MOEDA', W / 2, 30 + salto)
      ctx.restore()

      raf = requestAnimationFrame(ciclo)
    }
    raf = requestAnimationFrame(ciclo)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={ref} width={W} height={H} aria-label="Vila Moeda" style={{ width: '100%', imageRendering: 'pixelated', borderRadius: 6, border: '2px solid #283040', marginBottom: 8 }} />
}
