import type { Modo } from './AgeGate'

interface ModoIndisponivelProps {
  modo: Modo
  onVoltar: () => void
}

const INFO: Record<Exclude<Modo, 'reino'>, { titulo: string; descricao: string }> = {
  cidade: {
    titulo: 'A Cidade (15-17 anos)',
    descricao:
      'Este modo vai introduzir ações, ETFs, obrigações e inflação simulados, primeiro emprego e diversificação de carteira. Ainda está por construir neste protótipo — que começou pelo modo 8-14 para validar a mecânica principal primeiro.',
  },
  mercado: {
    titulo: 'O Mercado (18+ anos)',
    descricao:
      'Este modo vai trazer um dashboard financeiro mais sério, com padrões de mercado realistas (em ativos fictícios), comissões, impostos e eventos de vida adulta. Ainda está por construir neste protótipo.',
  },
}

export function ModoIndisponivel({ modo, onVoltar }: ModoIndisponivelProps) {
  if (modo === 'reino') return null
  const info = INFO[modo]

  return (
    <div className="max-w-md mx-auto bg-white/90 rounded-3xl shadow-xl p-6 border-4 border-white text-center">
      <p className="text-5xl mb-3">🚧</p>
      <h2 className="font-heading text-xl font-bold text-slate-800 mb-2">{info.titulo}</h2>
      <p className="text-slate-500 mb-6">{info.descricao}</p>
      <p className="text-sm text-slate-400 mb-6">
        Por agora, experimenta o modo <strong>O Reino (8-14 anos)</strong> — é onde a mecânica principal do jogo já está
        pronta para jogar.
      </p>
      <button
        onClick={onVoltar}
        className="w-full rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-heading font-bold py-3 transition-colors"
      >
        Voltar
      </button>
    </div>
  )
}
