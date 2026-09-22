import { clamp } from './data'
import type { GameEvent, PlayerState } from './types'

function ajustar(state: PlayerState, delta: Partial<PlayerState['stats']> & { saldo?: number; relacoes?: number; saude?: number; educacao?: number }): PlayerState {
  return {
    ...state,
    saldo: Math.max(0, state.saldo + (delta.saldo ?? 0)),
    stats: {
      relacoes: clamp(state.stats.relacoes + (delta.relacoes ?? 0)),
      saude: clamp(state.stats.saude + (delta.saude ?? 0)),
      educacao: clamp(state.stats.educacao + (delta.educacao ?? 0)),
    },
  }
}

export const EVENTOS: GameEvent[] = [
  // --- DINHEIRO ---
  {
    id: 'moedas-no-chao',
    area: 'dinheiro',
    title: 'Encontraste moedas no chão!',
    description: () => 'Que sorte! Encontraste 8 moedas na rua. O que vais fazer com elas?',
    weight: () => 3,
    choices: [
      {
        id: 'guardar',
        label: 'Guardar no mealheiro',
        apply: (s) => ({ ...ajustar(s, {}), poupanca: s.poupanca + 8 }),
        resultText: () => 'Guardaste as moedas no mealheiro. A tua poupança vai crescer sozinha com o tempo!',
      },
      {
        id: 'doces',
        label: 'Comprar doces com os amigos',
        apply: (s) => ajustar(s, { saldo: 8, relacoes: 4 }),
        resultText: () => 'Partilhaste doces com os amigos. Foi divertido, mas as moedas já foram!',
      },
    ],
  },
  {
    id: 'brinquedo-partido',
    area: 'dinheiro',
    title: 'O teu brinquedo favorito partiu-se!',
    description: (s) =>
      s.poupanca >= 12
        ? 'Que pena! Mas como já tens poupanças, podes resolver isto sem grande aperto.'
        : 'Que pena! E ainda não tens poupanças suficientes para um imprevisto destes...',
    weight: () => 3,
    choices: [
      {
        id: 'usar-poupanca',
        label: 'Usar a poupança para reparar (-12)',
        apply: (s) => ({ ...ajustar(s, { saude: 2 }), poupanca: Math.max(0, s.poupanca - 12) }),
        resultText: (s) =>
          s.poupanca >= 0
            ? 'Reparaste o brinquedo sem stress. É para isto que serve uma reserva de emergência!'
            : 'Reparaste o brinquedo, mas ficaste sem quase nada guardado.',
      },
      {
        id: 'pedir-emprestado',
        label: 'Pedir dinheiro emprestado a um amigo',
        apply: (s) => ajustar(s, { saldo: 12, relacoes: -6 }),
        resultText: () => 'O teu amigo emprestou-te o dinheiro, mas ficou um bocadinho chateado por teres pedido outra vez.',
      },
    ],
  },
  {
    id: 'aniversario-amigo',
    area: 'dinheiro',
    title: 'É o aniversário de um amigo!',
    description: () => 'Queres levar um presente à festa.',
    weight: () => 2.5,
    choices: [
      {
        id: 'comprar-presente',
        label: 'Comprar um presente (-10)',
        apply: (s) => ajustar(s, { saldo: -10, relacoes: 8 }),
        resultText: () => 'O teu amigo adorou o presente! A festa foi um sucesso.',
      },
      {
        id: 'cartao-mao',
        label: 'Fazer um cartão à mão (grátis)',
        apply: (s) => ajustar(s, { relacoes: 5, educacao: 2 }),
        resultText: () => 'O cartão feito à mão foi um sucesso — nem tudo o que vale a pena custa dinheiro!',
      },
    ],
  },
  {
    id: 'feira-escola',
    area: 'dinheiro',
    title: 'Feira da escola cheia de brindes!',
    description: () => 'Há barraquinhas com jogos e prémios por todo o lado. É fácil gastar tudo de uma vez.',
    weight: () => 2.5,
    choices: [
      {
        id: 'gastar-tudo',
        label: 'Gastar todas as moedas disponíveis',
        apply: (s) => ajustar(s, { saldo: -s.saldo, relacoes: 5, saude: 3 }),
        resultText: () => 'Divertiste-te muito, mas ficaste sem nada guardado para depois.',
      },
      {
        id: 'gastar-parte',
        label: 'Gastar só uma parte e guardar o resto',
        apply: (s) => {
          const gasto = Math.min(s.saldo, 6)
          return { ...ajustar(s, { saldo: -gasto, relacoes: 3 }), poupanca: s.poupanca + Math.min(s.saldo - gasto, 4) }
        },
        resultText: () => 'Divertiste-te e ainda guardaste algumas moedas. Equilíbrio é a chave!',
      },
    ],
  },
  {
    id: 'trabalho-extra',
    area: 'dinheiro',
    title: 'Vizinho precisa de ajuda',
    description: () => 'O teu vizinho oferece-te 10 moedas para regares as plantas dele esta semana.',
    weight: () => 2,
    choices: [
      {
        id: 'aceitar',
        label: 'Aceitar o trabalhinho (+10, -saúde 2)',
        apply: (s) => ajustar(s, { saldo: 10, saude: -2 }),
        resultText: () => 'Ganhaste as tuas próprias moedas por trabalhares! Sentes-te orgulhoso/a.',
      },
      {
        id: 'recusar',
        label: 'Recusar e ir brincar',
        apply: (s) => ajustar(s, { saude: 3 }),
        resultText: () => 'Preferiste descansar e brincar. Também está bem, mas ficaste sem as moedas extra.',
      },
    ],
  },

  // --- RELAÇÕES ---
  {
    id: 'convite-jogar',
    area: 'relacoes',
    title: 'Um amigo convida-te para jogar',
    description: () => 'Podes ir até ao parque com os amigos ou ficar em casa a poupar tempo e moedas.',
    weight: () => 3,
    choices: [
      {
        id: 'ir-jogar',
        label: 'Ir brincar (-4 moedas em lanche)',
        apply: (s) => ajustar(s, { saldo: -4, relacoes: 7, saude: 4 }),
        resultText: () => 'Foi uma tarde divertida com os amigos!',
      },
      {
        id: 'ficar',
        label: 'Ficar em casa a poupar',
        apply: (s) => ({ ...ajustar(s, { relacoes: -3 }), poupanca: s.poupanca + 4 }),
        resultText: () => 'Guardaste mais umas moedas, mas o teu amigo ficou um pouco triste.',
      },
    ],
  },
  {
    id: 'noite-familia',
    area: 'relacoes',
    title: 'Noite de jogos em família',
    description: () => 'A tua família quer jogar um jogo de tabuleiro contigo esta noite.',
    weight: () => 2.5,
    choices: [
      {
        id: 'participar',
        label: 'Participar com todos',
        apply: (s) => ajustar(s, { relacoes: 6, saude: 3 }),
        resultText: () => 'Adoraste a noite em família — momentos assim não têm preço.',
      },
      {
        id: 'sozinho',
        label: 'Preferir ficar sozinho/a a jogar no telemóvel',
        apply: (s) => ajustar(s, { relacoes: -4, saude: -2 }),
        resultText: () => 'Divertiste-te sozinho/a, mas sentes que perdeste um momento especial.',
      },
    ],
  },
  {
    id: 'discussao-amigo',
    area: 'relacoes',
    title: 'Tiveste uma discussão com um amigo',
    description: () => 'As coisas ficaram um pouco tensas depois de um mal-entendido.',
    weight: () => 2,
    choices: [
      {
        id: 'pedir-desculpa',
        label: 'Conversar e pedir desculpa',
        apply: (s) => ajustar(s, { relacoes: 8, saude: 2 }),
        resultText: () => 'Fizeram as pazes e a amizade ficou ainda mais forte.',
      },
      {
        id: 'ignorar',
        label: 'Ignorar o assunto',
        apply: (s) => ajustar(s, { relacoes: -6 }),
        resultText: () => 'O assunto ficou por resolver e a amizade esfriou um pouco.',
      },
    ],
  },
  {
    id: 'copiar-trabalho',
    area: 'relacoes',
    title: 'Um colega pede para copiar o teu trabalho de casa',
    description: () => 'Ele não teve tempo de o fazer e está aflito.',
    weight: () => 2,
    choices: [
      {
        id: 'ajudar-estudar',
        label: 'Recusar copiar, mas ajudar a estudar juntos',
        apply: (s) => ajustar(s, { relacoes: 5, educacao: 4 }),
        resultText: () => 'Ajudaste o teu colega a aprender de verdade, e a amizade ficou mais forte.',
      },
      {
        id: 'deixar-copiar',
        label: 'Deixar copiar',
        apply: (s) => ajustar(s, { relacoes: 3, educacao: -3 }),
        resultText: () => 'O teu colega ficou contente, mas isso não o ajudou a aprender.',
      },
    ],
  },
  {
    id: 'amigo-triste',
    area: 'relacoes',
    title: 'O teu amigo está triste',
    description: () => 'O animal de estimação dele desapareceu e ele está muito em baixo.',
    weight: () => 2,
    choices: [
      {
        id: 'consolar',
        label: 'Passar a tarde a apoiá-lo',
        apply: (s) => ajustar(s, { relacoes: 7, saude: -2 }),
        resultText: () => 'O teu amigo sentiu-se muito melhor por teres estado presente.',
      },
      {
        id: 'nada',
        label: 'Não fazer nada de especial',
        apply: (s) => ajustar(s, { relacoes: -5 }),
        resultText: () => 'O teu amigo sentiu a tua falta de apoio.',
      },
    ],
  },

  // --- SAÚDE ---
  {
    id: 'constipado',
    area: 'saude',
    title: 'Ficaste constipado!',
    description: (s) => (s.stats.saude < 40 ? 'Como já andavas cansado/a, a constipação apanhou-te em cheio.' : 'Nada de grave, mas precisas de cuidar de ti.'),
    weight: (s) => (s.stats.saude < 50 ? 4 : 2),
    choices: [
      {
        id: 'descansar',
        label: 'Descansar e tomar sopa (-5 moedas)',
        apply: (s) => ajustar(s, { saldo: -5, saude: 8 }),
        resultText: () => 'Descansaste bem e recuperaste rapidamente.',
      },
      {
        id: 'continuar',
        label: 'Continuar a brincar sem descansar',
        apply: (s) => ajustar(s, { saude: -10, saldo: -10 }),
        resultText: () => 'A constipação piorou e ainda tiveste de gastar mais dinheiro em remédios depois.',
      },
    ],
  },
  {
    id: 'dia-desporto',
    area: 'saude',
    title: 'Dia de desporto na escola',
    description: () => 'Há várias atividades divertidas para participar.',
    weight: () => 2.5,
    choices: [
      {
        id: 'participar',
        label: 'Participar nas atividades',
        apply: (s) => ajustar(s, { saude: 7, relacoes: 4 }),
        resultText: () => 'Foi um dia cheio de energia e boa disposição!',
      },
      {
        id: 'ver',
        label: 'Ficar a ver os outros jogarem',
        apply: (s) => ajustar(s, { saude: 1 }),
        resultText: () => 'Foi um dia tranquilo, mas sem grande efeito.',
      },
    ],
  },
  {
    id: 'noite-mal-dormida',
    area: 'saude',
    title: 'Vontade de jogar até tarde',
    description: () => 'Há um jogo novo muito tentador e amanhã tens escola.',
    weight: () => 2.5,
    choices: [
      {
        id: 'dormir-cedo',
        label: 'Dormir cedo hoje',
        apply: (s) => ajustar(s, { saude: 5, educacao: 2 }),
        resultText: () => 'Acordaste descansado/a e com a mente fresca para aprender.',
      },
      {
        id: 'ficar-acordado',
        label: 'Continuar a jogar até tarde',
        apply: (s) => ajustar(s, { saude: -6, educacao: -4 }),
        resultText: () => 'Acordaste cansado/a e custou a acompanhar as aulas.',
      },
    ],
  },
  {
    id: 'refeicao',
    area: 'saude',
    title: 'Hora do lanche!',
    description: () => 'Podes escolher entre fruta ou um pacote de bolachas.',
    weight: () => 2,
    choices: [
      {
        id: 'fruta',
        label: 'Comer fruta (grátis, da lancheira)',
        apply: (s) => ajustar(s, { saude: 5 }),
        resultText: () => 'Sentes-te com mais energia para o resto do dia.',
      },
      {
        id: 'bolachas',
        label: 'Comprar bolachas (-3 moedas)',
        apply: (s) => ajustar(s, { saldo: -3, saude: -1, relacoes: 2 }),
        resultText: () => 'Estavam deliciosas, mas não fizeram muito bem à tua energia.',
      },
    ],
  },
  {
    id: 'aventura-ar-livre',
    area: 'saude',
    title: 'Passeio em família ao ar livre',
    description: () => 'É fim de semana e o tempo está ótimo para uma caminhada.',
    weight: () => 2,
    choices: [
      {
        id: 'ir',
        label: 'Ir com a família',
        apply: (s) => ajustar(s, { saude: 6, relacoes: 4 }),
        resultText: () => 'Foi revigorante apanhar ar fresco e passar tempo em família.',
      },
      {
        id: 'ficar-em-casa',
        label: 'Ficar em casa a descansar',
        apply: (s) => ajustar(s, { saude: 2 }),
        resultText: () => 'Descansaste, mas perdeste um bom momento em família.',
      },
    ],
  },

  // --- EDUCAÇÃO ---
  {
    id: 'trabalho-dificil',
    area: 'educacao',
    title: 'Trabalho de casa difícil',
    description: () => 'É um exercício complicado e vais precisar de te esforçar.',
    weight: () => 3,
    choices: [
      {
        id: 'esforcar',
        label: 'Pedir ajuda e estudar com calma',
        apply: (s) => ajustar(s, { educacao: 8, saude: -2 }),
        resultText: () => 'Percebeste a matéria e sentes-te mais confiante!',
      },
      {
        id: 'deixar',
        label: 'Deixar por fazer',
        apply: (s) => ajustar(s, { educacao: -6 }),
        resultText: () => 'A matéria ficou por perceber e vai custar mais da próxima vez.',
      },
    ],
  },
  {
    id: 'biblioteca',
    area: 'educacao',
    title: 'Livro grátis na biblioteca',
    description: () => 'A biblioteca da escola está a oferecer um livro à tua escolha.',
    weight: () => 2.5,
    choices: [
      {
        id: 'ler',
        label: 'Escolher um livro e lê-lo',
        apply: (s) => ajustar(s, { educacao: 6, saude: 1 }),
        resultText: () => 'Aprendeste coisas novas e ainda relaxaste um pouco.',
      },
      {
        id: 'ignorar',
        label: 'Não estás com paciência para ler',
        apply: (s) => ajustar(s, {}),
        resultText: () => 'Talvez para a próxima.',
      },
    ],
  },
  {
    id: 'teste-surpresa',
    area: 'educacao',
    title: 'Teste surpresa!',
    description: (s) => (s.stats.educacao >= 60 ? 'Como tens estudado, sentes-te preparado/a.' : 'Não estavas à espera disto e sentes-te inseguro/a.'),
    weight: () => 2.5,
    choices: [
      {
        id: 'tentar',
        label: 'Fazer o teste com calma',
        apply: (s) => ajustar(s, { educacao: s.stats.educacao >= 60 ? 6 : -2, saude: -1 }),
        resultText: (s) => (s.stats.educacao >= 60 ? 'Foste muito bem! O estudo valeu a pena.' : 'Foi difícil, mas aprendeste que estudar regularmente ajuda nestas alturas.'),
      },
    ],
  },
  {
    id: 'curso-poupar',
    area: 'educacao',
    title: 'Curso online grátis sobre poupar',
    description: () => 'Um vídeo curto explica como o dinheiro guardado cresce sozinho com o tempo.',
    weight: () => 2,
    choices: [
      {
        id: 'fazer-curso',
        label: 'Ver o curso',
        apply: (s) => ajustar(s, { educacao: 7 }),
        resultText: () => 'Agora percebes melhor porque vale a pena guardar moedas cedo — elas crescem sozinhas!',
      },
      {
        id: 'saltar',
        label: 'Saltar o curso',
        apply: (s) => ajustar(s, {}),
        resultText: () => 'Talvez noutra altura.',
      },
    ],
  },
  {
    id: 'feira-ciencias',
    area: 'educacao',
    title: 'Feira de ciências na escola',
    description: () => 'Podes construir um projeto para apresentar.',
    weight: () => 2,
    choices: [
      {
        id: 'participar',
        label: 'Participar (-6 moedas em materiais)',
        apply: (s) => ajustar(s, { saldo: -6, educacao: 9, relacoes: 2 }),
        resultText: () => 'O teu projeto foi um sucesso e aprendeste imenso!',
      },
      {
        id: 'nao-participar',
        label: 'Não participar desta vez',
        apply: (s) => ajustar(s, {}),
        resultText: () => 'Talvez na próxima feira de ciências.',
      },
    ],
  },
]

export function sortearEvento(state: PlayerState): GameEvent {
  const pesos = EVENTOS.map((e) => Math.max(0.01, e.weight(state)))
  const total = pesos.reduce((a, b) => a + b, 0)
  let alvo = Math.random() * total
  for (let i = 0; i < EVENTOS.length; i++) {
    alvo -= pesos[i]
    if (alvo <= 0) return EVENTOS[i]
  }
  return EVENTOS[EVENTOS.length - 1]
}
