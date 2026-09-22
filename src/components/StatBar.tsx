interface StatBarProps {
  label: string
  emoji: string
  value: number
  colorClass: string
}

export function StatBar({ label, emoji, value, colorClass }: StatBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-bold text-slate-700 mb-1">
        <span>
          {emoji} {label}
        </span>
        <span>{Math.round(value)}/100</span>
      </div>
      <div className="h-4 w-full rounded-full bg-white/70 border-2 border-slate-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  )
}
