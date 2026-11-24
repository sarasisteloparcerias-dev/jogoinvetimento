import type { ConquistaCidade } from '../cidade/conquistas'

export const CONQUISTAS_NEGOCIO: ConquistaCidade[] = [
  {
    id: 'empresa',
    nome: 'Empresa Criada',
    objetivo: 'Abre a tua empresa: escolhe o negócio e como o vais pagar.',
    licao: [
      'Parabéns, tens uma empresa! A empresa tem uma conta só dela, separada da tua.',
      'Regra de ouro: nunca misturar o dinheiro da empresa com o teu. Tu recebes um ordenado, como toda a gente.',
    ],
  },
  {
    id: 'emprego',
    nome: 'Criar Emprego',
    objetivo: 'Tem pelo menos 2 pessoas contratadas ao mesmo tempo.',
    licao: [
      'Criaste emprego! Cada salário custa à empresa mais 23,75% de TSU, a Segurança Social paga pela empresa.',
      'E em Portugal há 14 salários por ano: os subsídios de férias (junho) e de Natal (novembro) têm de estar no orçamento.',
    ],
  },
  {
    id: 'lucro',
    nome: 'Primeiro Lucro',
    objetivo: 'Fecha um mês com lucro (vendas maiores do que todos os custos).',
    licao: ['Lucro é o que sobra depois de pagar TUDO: produtos, salários, TSU, renda, luz, contabilista, juros...', 'Vender muito não chega: o que conta é a margem.'],
  },
  {
    id: 'iva',
    nome: 'IVA em Dia',
    objetivo: 'Entrega o IVA do trimestre ao Estado sem a conta da empresa ficar a descoberto.',
    licao: ['O IVA que os clientes pagam não é teu: a empresa só o guarda e entrega ao Estado de 3 em 3 meses.', 'Quem gasta o dinheiro do IVA fica aflito no fim do trimestre.'],
  },
  {
    id: 'subsidios',
    nome: '14 Salários',
    objetivo: 'Paga os subsídios de férias (junho) ou de Natal (novembro) a toda a equipa e a ti.',
    licao: ['Subsídios pagos! Em junho e novembro, os salários contam a dobrar.', 'Uma empresa bem gerida guarda um bocadinho todos os meses para estes dois meses.'],
  },
  {
    id: 'maneio',
    nome: 'Fundo de Maneio',
    objetivo: 'Tem na caixa da empresa o suficiente para 2 meses de custos fixos.',
    licao: ['O fundo de maneio é o fundo de emergência da empresa.', 'Com ele, um mês mau, uma avaria ou um cliente que paga tarde não te obrigam a pedir crédito caro.'],
  },
  {
    id: 'fatura',
    nome: 'Fatura Falsa',
    objetivo: 'Não caias na burla da fatura falsa.',
    licao: ['As burlas com faturas e IBAN falsos são das mais comuns nas empresas.', 'Mudanças de IBAN confirmam-se sempre por telefone, para o número que já conheces.'],
  },
  {
    id: 'ano',
    nome: 'Ano Positivo',
    objetivo: 'Fecha o ano com lucro, já depois do IRC, e sem salários em atraso.',
    licao: ['Um ano inteiro com lucro e salários em dia: tens uma empresa saudável!', 'Sobre o lucro, a empresa paga IRC. O que sobra pode ficar na empresa para crescer ou ser distribuído aos sócios.'],
  },
]

export function objetivoNegocio(crachas: string[]) {
  return CONQUISTAS_NEGOCIO.find((c) => !crachas.includes(c.id)) ?? null
}
