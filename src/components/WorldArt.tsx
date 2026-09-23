export function Arvore() {
  return (
    <svg viewBox="0 0 40 50" className="w-full h-full drop-shadow-sm" aria-hidden="true">
      <ellipse cx="20" cy="46" rx="10" ry="2.5" fill="#000" opacity="0.12" />
      <rect x="17" y="28" width="6" height="16" rx="1.5" fill="#8a6238" />
      <ellipse cx="21" cy="21" rx="16" ry="15" fill="#4d9c4a" />
      <ellipse cx="13" cy="16" rx="10.5" ry="9.5" fill="#63b25f" />
      <ellipse cx="26" cy="14" rx="8" ry="7.5" fill="#5aab54" />
    </svg>
  )
}

export interface CoresEdificio {
  telhado: string
  telhadoSombra: string
  parede: string
}

export function Edificio({ telhado, telhadoSombra, parede }: CoresEdificio) {
  return (
    <svg viewBox="0 0 100 78" className="w-full h-full drop-shadow-md" aria-hidden="true">
      <ellipse cx="50" cy="74" rx="42" ry="4" fill="#000" opacity="0.14" />

      {/* telhado */}
      <polygon points="4,38 50,8 96,38" fill={telhado} />
      <polygon points="4,38 50,8 50,17 14,38" fill={telhadoSombra} opacity="0.35" />

      {/* parede */}
      <rect x="12" y="38" width="76" height="32" fill={parede} />
      <rect x="12" y="38" width="76" height="6" fill="#000" opacity="0.08" />

      {/* janelas */}
      <rect x="19" y="45" width="15" height="15" rx="2" fill="#cdeeff" stroke="#fff" strokeWidth="2.5" />
      <rect x="66" y="45" width="15" height="15" rx="2" fill="#cdeeff" stroke="#fff" strokeWidth="2.5" />

      {/* porta */}
      <rect x="42" y="49" width="16" height="21" rx="1.5" fill="#4b3621" />
      <circle cx="55" cy="60" r="1.4" fill="#e8d9b0" />

      {/* base */}
      <rect x="8" y="68" width="84" height="4" rx="1.5" fill="#000" opacity="0.12" />
    </svg>
  )
}

export const CORES_EDIFICIOS: Record<string, CoresEdificio> = {
  mealheiro: { telhado: '#f472b6', telhadoSombra: '#be185d', parede: '#fdf2f8' },
  loja: { telhado: '#ef4444', telhadoSombra: '#991b1b', parede: '#fff7ed' },
  banco: { telhado: '#64748b', telhadoSombra: '#334155', parede: '#e2e8f0' },
  escola: { telhado: '#14b8a6', telhadoSombra: '#0f766e', parede: '#f0fdfa' },
  amigos: { telhado: '#f59e0b', telhadoSombra: '#b45309', parede: '#fffbeb' },
}

/** Paletas para casas puramente decorativas espalhadas pelo mapa (sem ação associada). */
export const CORES_DECORATIVAS: CoresEdificio[] = [
  { telhado: '#8b5cf6', telhadoSombra: '#5b21b6', parede: '#f5f3ff' },
  { telhado: '#84cc16', telhadoSombra: '#4d7c0f', parede: '#f7fee7' },
  { telhado: '#92400e', telhadoSombra: '#451a03', parede: '#fef3c7' },
  { telhado: '#38bdf8', telhadoSombra: '#0369a1', parede: '#f0f9ff' },
  { telhado: '#fb7185', telhadoSombra: '#9f1239', parede: '#fff1f2' },
]
