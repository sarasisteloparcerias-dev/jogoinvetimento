import type { Modo } from './AgeGate'

interface ModoIndisponivelProps {
  modo: Modo
  onVoltar: () => void
}

const INFO: Record<'mercado', { titulo: string; descricao: string }> = {
  mercado: {
    titulo: 'O Mercado (18+ anos)',
    descricao:
      'Este modo vai trazer um painel financeiro mais sério, com padrões de mercado realistas (em ativos fictícios), comissões, impostos e eventos da vida adulta. Ainda está por construir.',
  },
}

export function ModoIndisponivel({ modo, onVoltar }: ModoIndisponivelProps) {
  if (modo !== 'mercado') return null
  const info = INFO[modo]

  return (
    <div className="pagina-pixel" style={{ ['--s' as string]: 2 }}>
      <div className="janela" style={{ maxWidth: 420, width: '100%', padding: 24, textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>{info.titulo}</h2>
        <p style={{ color: '#5a6280', marginBottom: 16 }}>{info.descricao}</p>
        <p style={{ color: '#7a8298', fontSize: 14, marginBottom: 20 }}>
          Por agora, experimenta <strong>A Cidade</strong> (o modo dos 12 aos 17 anos): primeiro emprego, conta no banco, ações, ETFs e cripto.
        </p>
        <button onClick={onVoltar} className="botao-pixel" style={{ width: '100%', fontSize: 18, padding: 10 }}>
          Voltar
        </button>
      </div>
    </div>
  )
}
