import type { Modo } from './AgeGate'

interface ModoIndisponivelProps {
  modo: Modo
  onVoltar: () => void
}

const INFO: Record<Exclude<Modo, 'reino'>, { titulo: string; descricao: string }> = {
  cidade: {
    titulo: 'A Cidade (15-17 anos)',
    descricao:
      'Este modo vai introduzir ações, ETFs, obrigações e inflação simulados, primeiro emprego e diversificação de carteira. Ainda está por construir — começámos pelo modo 8-14 para validar a mecânica principal.',
  },
  mercado: {
    titulo: 'O Mercado (18+ anos)',
    descricao:
      'Este modo vai trazer um painel financeiro mais sério, com padrões de mercado realistas (em ativos fictícios), comissões, impostos e eventos da vida adulta. Ainda está por construir.',
  },
}

export function ModoIndisponivel({ modo, onVoltar }: ModoIndisponivelProps) {
  if (modo === 'reino') return null
  const info = INFO[modo]

  return (
    <div className="pagina-pixel" style={{ ['--s' as string]: 2 }}>
      <div className="janela" style={{ maxWidth: 420, width: '100%', padding: 24, textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>{info.titulo}</h2>
        <p style={{ color: '#5a6280', marginBottom: 16 }}>{info.descricao}</p>
        <p style={{ color: '#7a8298', fontSize: 14, marginBottom: 20 }}>
          Por agora, experimenta a <strong>Vila Moeda (8-14 anos)</strong> — é onde o jogo já está pronto.
        </p>
        <button onClick={onVoltar} className="botao-pixel" style={{ width: '100%', fontSize: 18, padding: 10 }}>
          Voltar
        </button>
      </div>
    </div>
  )
}
