import { CONQUISTAS_CIDADE } from '../game/cidade/conquistas'
import { CRACHAS } from '../game/crachas'
import { FICHAS } from '../game/escola'
import type { Modo } from '../game/gravar'
import { CONQUISTAS_CASA, CONQUISTAS_MERCADO } from '../game/mercado/conquistas'
import { CONQUISTAS_NEGOCIO } from '../game/negocio/conquistas'
import { NOME_MODO, resumoPercurso } from '../game/niveis'
import { CONQUISTAS_REFORMA } from '../game/reforma/conquistas'

const LISTAS = { reino: CRACHAS, cidade: CONQUISTAS_CIDADE, mercado: CONQUISTAS_MERCADO, casa: CONQUISTAS_CASA, negocio: CONQUISTAS_NEGOCIO, reforma: CONQUISTAS_REFORMA }

/** No fim de cada fase: o que se aprendeu, o que ficou por fazer e perguntas para conversar em casa ou na aula. */
export function ResumoEducadores({ modo, estado }: { modo: Modo; estado: unknown }) {
  const t = FICHAS[modo]
  const crachas = (estado as { crachas: string[] }).crachas
  const nome = (estado as { name: string }).name
  const lista = LISTAS[modo]
  return (
    <details className="resumo-educadores" style={{ textAlign: 'left', border: '2px solid #c8cee0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, background: '#fbfcff', fontSize: 12, lineHeight: 1.6 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Para pais e professores</summary>
      <p style={{ margin: '8px 0' }}>
        <strong>{nome}</strong> jogou <strong>{NOME_MODO[modo]}</strong> ({t.idade}). Resultado: {resumoPercurso(modo, estado)}.
      </p>
      <p style={{ margin: '4px 0' }}>
        <strong>Temas desta fase:</strong> {t.temas.join(' · ')}.
      </p>
      <p style={{ margin: '8px 0 2px' }}>
        <strong>Conquistas ({lista.filter((c) => crachas.includes(c.id)).length} de {lista.length}):</strong>
      </p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {lista.map((c) => (
          <li key={c.id} style={{ color: crachas.includes(c.id) ? '#2a8a5a' : '#8890a8' }}>
            {crachas.includes(c.id) ? '✔' : '○'} {c.nome.replace('Crachá ', '')}
            {crachas.includes(c.id) ? '' : `: ${c.objetivo}`}
          </li>
        ))}
      </ul>
      <p style={{ margin: '8px 0 2px' }}>
        <strong>Para conversar:</strong>
      </p>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {t.conversa.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ul>
      <p style={{ margin: '8px 0 0' }}>
        <strong>Referencial de Educação Financeira:</strong> {t.referencial.join(' · ')}.
      </p>
      <div className="nao-imprimir" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8, fontSize: 11 }}>
        <button type="button" onClick={() => window.print()} style={{ color: '#4a7ad0', textDecoration: 'underline' }}>
          Imprimir este resumo
        </button>
        <a href="#desafio" style={{ color: '#4a7ad0' }}>
          Quanto aprendeu? Fazer o desafio
        </a>
        <a href="#certificado" style={{ color: '#4a7ad0' }}>
          Certificado
        </a>
        <a href="#fichas" style={{ color: '#4a7ad0' }}>
          Fichas para a aula
        </a>
      </div>
    </details>
  )
}
