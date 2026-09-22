import type { AvatarConfig } from '../game/types'

interface CharacterSVGProps {
  avatar: AvatarConfig
  height?: number
  className?: string
}

export function CharacterSVG({ avatar, height = 96, className }: CharacterSVGProps) {
  return (
    <svg
      viewBox="0 0 100 140"
      height={height}
      width={(height * 100) / 140}
      className={className}
      role="img"
      aria-label="Avatar do jogador"
    >
      {/* sombra */}
      <ellipse cx="50" cy="133" rx="22" ry="5" fill="#000" opacity="0.12" />

      {/* pernas */}
      <rect x="34" y="98" width="13" height="30" rx="6" fill={avatar.roupa} />
      <rect x="53" y="98" width="13" height="30" rx="6" fill={avatar.roupa} />
      {/* sapatos */}
      <rect x="32" y="123" width="17" height="9" rx="4" fill="#3f3f46" />
      <rect x="51" y="123" width="17" height="9" rx="4" fill="#3f3f46" />

      {/* braço esquerdo */}
      <rect x="16" y="66" width="14" height="34" rx="7" fill={avatar.pele} />
      {/* braço direito */}
      <rect x="70" y="66" width="14" height="34" rx="7" fill={avatar.pele} />

      {/* corpo */}
      <rect x="28" y="60" width="44" height="46" rx="16" fill={avatar.roupa} />

      {/* pescoço */}
      <rect x="43" y="46" width="14" height="12" fill={avatar.pele} />

      {/* cabeça */}
      <circle cx="50" cy="34" r="24" fill={avatar.pele} />

      {/* cabelo */}
      <path
        d="M 26 30 A 24 24 0 0 1 74 30 C 74 18 64 8 50 8 C 36 8 26 18 26 30 Z"
        fill={avatar.cabelo}
      />
      <rect x="24" y="24" width="7" height="14" rx="3.5" fill={avatar.cabelo} />
      <rect x="69" y="24" width="7" height="14" rx="3.5" fill={avatar.cabelo} />

      {/* olhos */}
      <circle cx="42" cy="35" r="2.6" fill="#1f2937" />
      <circle cx="58" cy="35" r="2.6" fill="#1f2937" />

      {/* bochechas */}
      <circle cx="36" cy="41" r="3.2" fill="#f87171" opacity="0.35" />
      <circle cx="64" cy="41" r="3.2" fill="#f87171" opacity="0.35" />

      {/* sorriso */}
      <path d="M 43 43 Q 50 49 57 43" stroke="#1f2937" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  )
}
