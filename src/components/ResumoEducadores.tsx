import { CONQUISTAS_CIDADE } from '../game/cidade/conquistas'
import { CRACHAS } from '../game/crachas'
import type { Modo } from '../game/gravar'
import { CONQUISTAS_CASA, CONQUISTAS_MERCADO } from '../game/mercado/conquistas'
import { CONQUISTAS_NEGOCIO } from '../game/negocio/conquistas'
import { NOME_MODO, resumoPercurso } from '../game/niveis'

const TEMAS: Record<Modo, { idade: string; temas: string[]; conversa: string[] }> = {
  reino: {
    idade: '8-11 anos',
    temas: ['Gastar, poupar e investir', 'Juro e juro composto', 'Risco e paciência', 'Reserva para imprevistos', 'Objetivos de poupança', 'Comparar preços e dar o troco', 'Solidariedade'],
    conversa: ['Para que estás a poupar? Quanto falta?', 'Quando é que vale a pena esperar antes de comprar?', 'Porque é que o pacote grande nem sempre é o mais barato?'],
  },
  cidade: {
    idade: '12-17 anos',
    temas: ['Conta bancária e comissões', 'Primeiro trabalho e rendimento', 'Ações, ETFs, obrigações e cripto', 'Diversificação e crises', 'Inflação', 'Burlas e publicidade escondida', 'Negociar a mesada, bicicleta contra passe'],
    conversa: ['Como reconheces publicidade nas redes sociais?', 'O que farias se um investimento descesse 20%?', 'Porque é que guardar dinheiro parado perde valor com a inflação?'],
  },
  mercado: {
    idade: '18+',
    temas: ['Salário bruto e líquido, IRS e Segurança Social', 'Orçamento mensal e fundo de emergência', 'Cartão de crédito, TAEG e crédito pessoal', 'Investir todos os meses (custo médio)', 'Contratos de arrendamento', 'Recibos verdes', 'Carta de condução e custo de um carro'],
    conversa: ['Quanto do salário vai para despesas fixas?', 'Como se compara o custo de dois créditos?', 'Que cláusulas de um contrato merecem atenção?'],
  },
  casa: {
    idade: '18+',
    temas: ['Entrada, escritura e crédito à habitação', 'Taxa fixa e variável (Euribor)', 'Taxa de esforço', 'IMI, condomínio e seguros', 'Amortizar e vender casa (mais-valias)', 'Obras e reparações', 'Família e orçamento'],
    conversa: ['Quanto pode subir a prestação se os juros subirem?', 'Porque é que comprar e vender casa custa tanto?', 'Que despesas aparecem quando nasce um filho?'],
  },
  negocio: {
    idade: '18+',
    temas: ['Investimento inicial e empréstimo', 'Preço, procura e capacidade', 'Salários, TSU e subsídios', 'IVA e IRC', 'Lucro contra caixa', 'Fundo de maneio', 'Burlas com faturas falsas'],
    conversa: ['Porque é que o dono é o último a receber?', 'Qual é a diferença entre lucro e dinheiro na caixa?', 'Porque é que o IVA cobrado não é da empresa?'],
  },
}

const LISTAS = { reino: CRACHAS, cidade: CONQUISTAS_CIDADE, mercado: CONQUISTAS_MERCADO, casa: CONQUISTAS_CASA, negocio: CONQUISTAS_NEGOCIO }

/** No fim de cada fase: o que se aprendeu, o que ficou por fazer e perguntas para conversar em casa ou na aula. */
export function ResumoEducadores({ modo, estado }: { modo: Modo; estado: unknown }) {
  const t = TEMAS[modo]
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
      <button type="button" onClick={() => window.print()} style={{ marginTop: 8, fontSize: 11, color: '#4a7ad0', textDecoration: 'underline' }}>
        Imprimir este resumo
      </button>
    </details>
  )
}
