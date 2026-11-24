import type { EstadoCidade } from './cidade/tipos'
import { escolheu, type Historia } from './historias'
import type { EstadoMercado } from './mercado/tipos'
import type { EstadoReforma } from './reforma/economia'
import type { PlayerState } from './types'

const round2 = (n: number) => Math.round(n * 100) / 100

// ---------------------------------------------------------------------------
// Vila Moeda: o Tomás e a consola

export const HISTORIA_TOMAS: Historia<PlayerState> = {
  id: 'tomas',
  npc: 'aluno',
  quem: 'Tomás',
  titulo: 'O Tomás e a consola',
  tempo: (s) => s.week,
  esperar: ['Ainda estou a pensar no que me disseste... Volta daqui a umas semanas, que eu conto-te as novidades!'],
  fim: () => ['Agora, antes de comprar alguma coisa, pergunto sempre: preciso mesmo? Quanto tempo demoro a juntar?'],
  capitulos: [
    {
      aPartirDe: 1,
      falas: () => [
        'Saiu a consola nova! Custa 120 moedas e eu só tenho 15...',
        'O meu primo diz que me empresta 100 moedas. Só tenho de lhe devolver 130, aos bocadinhos.',
      ],
      escolha: {
        pergunta: 'O que achas que o Tomás deve fazer?',
        opcoes: ['POUPAR PRIMEIRO', 'PEDIR EMPRESTADO'],
        efeito: (i) =>
          i === 0
            ? ['Tens razão... Se pedir emprestado, pago 130 por uma coisa de 100. Vou guardar 10 moedas por semana!']
            : ['Fixe! Vou falar com o meu primo. Assim tenho a consola já amanhã!'],
      },
    },
    {
      aPartirDe: 5,
      falas: (s) =>
        escolheu(s, 'tomas', 0) === 0
          ? ['Olha! Já tenho 55 moedas guardadas. Custa, mas ver o mealheiro a encher é bom.', 'O meu primo pediu emprestado para outra coisa e agora anda sempre sem dinheiro...']
          : ['Comprei a consola... mas agora todas as semanas dou 8 moedas ao meu primo. Já não tenho dinheiro para nada!', 'E ainda me faltam pagar 90. Afinal, pedir emprestado sai caro: chama-se JURO.'],
    },
    {
      aPartirDe: 10,
      falas: (s) => [
        escolheu(s, 'tomas', 0) === 0 ? 'Novidade: uma consola usada, como nova, por 70 moedas! Eu já tenho 95.' : 'O meu primo diz que me perdoa o resto se eu lhe der a consola usada... que confusão.',
        'Usada mais barata ou esperar pela nova?',
      ],
      escolha: {
        pergunta: 'O que aconselhas?',
        opcoes: ['A USADA CHEGA', 'ESPERA PELA NOVA'],
        efeito: (i) =>
          i === 0
            ? ['Pois é: joga igual e sobram moedas! Coisas em segunda mão podem ser ótimos negócios.']
            : ['Vou esperar. Às vezes vale a pena, desde que eu saiba porquê.'],
      },
    },
    {
      aPartirDe: 15,
      falas: (s) => {
        const poupou = escolheu(s, 'tomas', 0) === 0
        const usada = escolheu(s, 'tomas', 2) === 0
        if (poupou && usada) return ['Comprei a usada e ainda me sobraram 25 moedas! Comprei um jogo e guardei o resto.', 'E sabes que mais? Soube melhor por ter sido eu a juntar.']
        if (poupou) return ['Já juntei as 120 e comprei a nova! Demorou, mas não devo nada a ninguém.']
        return ['Finalmente acabei de pagar ao meu primo. Paguei 130 por uma consola de 100...', 'Para a próxima, junto primeiro.']
      },
    },
    {
      aPartirDe: 19,
      falas: () => [
        'Sabes o que aprendi este ano? Quando quero muito uma coisa, faço as contas: quanto custa e quantas semanas demoro a juntar.',
        'E agora estou a poupar para uma bicicleta, como a Marta. Obrigado pelos conselhos!',
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// A Cidade: a Beatriz e as apostas online

export const HISTORIA_BEATRIZ: Historia<EstadoCidade> = {
  id: 'beatriz',
  npc: 'beatriz',
  quem: 'Beatriz',
  titulo: 'A Beatriz e as apostas',
  tempo: (s) => s.semana,
  esperar: ['Depois falamos, tenho de ir para a biblioteca!'],
  fim: () => ['As apostas são feitas para a casa ganhar. Agora gasto o meu tempo noutras coisas... e o meu dinheiro também.'],
  capitulos: [
    {
      aPartirDe: 2,
      falas: () => [
        'Olha o que me aconteceu! Uma app de apostas deu-me 10€ "grátis" e eu ganhei 25€ numa aposta de futebol!',
        'Não pedem bem a idade... É dinheiro fácil, não achas?',
      ],
      escolha: {
        pergunta: 'O que lhe dizes?',
        opcoes: ['CUIDADO, É ARRISCADO', 'QUE SORTE!'],
        efeito: (i) =>
          i === 0
            ? ['Arriscado? Eu ganhei! ... Está bem, vou pensar nisso. Mas só mais uma vez.']
            : ['Pois foi! Vou apostar outra vez no sábado.'],
      },
    },
    {
      aPartirDe: 6,
      falas: () => [
        'Ganhei mais umas vezes e depois perdi... Agora estou a apostar a mesada toda para recuperar o que perdi.',
        'A app manda-me mensagens: "Volta! Tens um bónus à tua espera!"',
        'Já reparaste? Quando perco, quero logo recuperar. Quando ganho, quero ganhar mais.',
      ],
    },
    {
      aPartirDe: 10,
      falas: () => ['Perdi 80€. Pedi emprestado ao meu irmão e também perdi...', 'Não consigo parar. Penso nisso nas aulas.'],
      escolha: {
        pergunta: 'Ela pede-te 30€ "só para recuperar". O que fazes?',
        opcoes: ['EMPRESTO OS 30€', 'NÃO, MAS AJUDO-TE A CONTAR AOS PAIS'],
        efeito: (i, ctx) => {
          if (i === 0) {
            const s = ctx.estado()
            if (s.dinheiro < 30) return ['Não tens 30€? Ah... deixa estar.']
            ctx.definir({ ...s, dinheiro: round2(s.dinheiro - 30) })
            return ['Obrigada! Desta vez vai correr bem, tenho a certeza!']
          }
          return ['Tens razão... tenho vergonha, mas sozinha não consigo. Vens comigo falar com eles?']
        },
      },
    },
    {
      aPartirDe: 14,
      falas: (s) =>
        escolheu(s, 'beatriz', 2) === 0
          ? ['Perdi os teus 30€ também. Desculpa... Acabei por contar tudo aos meus pais.', 'Eles ajudaram-me: bloqueámos as apps e liguei para uma linha de apoio ao jogo. Vou devolver-te o dinheiro aos poucos.']
          : ['Contei aos meus pais. Ficaram preocupados, mas ajudaram: bloqueámos as apps e falei com uma psicóloga da escola.', 'As apostas online são proibidas a menores, e por uma razão: viciam.'],
    },
    {
      aPartirDe: 20,
      falas: (s) => {
        const devolve = escolheu(s, 'beatriz', 2) === 0
        return [
          'Já não aposto há semanas! Faço contas: em 2 meses, perdi mais de 150€. Era a viagem de finalistas!',
          'As apostas são desenhadas para a casa ganhar. Quem ganha a longo prazo é sempre a empresa.',
          devolve ? 'Ah, e toma: os teus 30€ de volta. Obrigada por não me teres deixado sozinha.' : 'Obrigada por me teres ajudado a falar com os meus pais.',
        ]
      },
      escolha: {
        pergunta: 'O que lhe dizes?',
        opcoes: ['TENHO ORGULHO EM TI', 'AGORA VAMOS POUPAR'],
        efeito: (_i, ctx) => {
          const s = ctx.estado()
          if (escolheu(s, 'beatriz', 2) === 0) ctx.definir({ ...s, dinheiro: round2(s.dinheiro + 30) })
          return ['Obrigada! Abri uma conta poupança. Ver o dinheiro a crescer devagar também dá gozo.']
        },
      },
    },
  ],
}

// ---------------------------------------------------------------------------
// O Mercado: a Joana e o cartão de crédito

export const HISTORIA_JOANA: Historia<EstadoMercado> = {
  id: 'joana',
  npc: 'cliente_cafe',
  quem: 'Joana',
  titulo: 'A Joana e o cartão de crédito',
  tempo: (s) => s.mes,
  esperar: ['Estou a tomar o meu café. Depois contamos novidades!'],
  fim: () => ['Hoje uso o cartão de débito e tenho um fundo de emergência. Dormir descansada não tem preço.'],
  capitulos: [
    {
      aPartirDe: 2,
      falas: () => [
        'Olá! Sou a Joana, trabalho aqui ao lado. Olha o meu telemóvel novo!',
        'O banco deu-me um cartão de crédito com 3.000€ de limite. Paguei com ele e só pago no mês que vem!',
      ],
      escolha: {
        pergunta: 'O que lhe dizes?',
        opcoes: ['PAGA TUDO NO MÊS SEGUINTE', 'QUE BOM NEGÓCIO'],
        efeito: (i) =>
          i === 0
            ? ['Tudo? Mas o banco diz que posso pagar só o mínimo... Hmm, vou ler as letras pequenas.']
            : ['Pois é! E ainda tenho limite para as férias.'],
      },
    },
    {
      aPartirDe: 5,
      falas: () => [
        'Ando a pagar só o mínimo: 60€ por mês. Parece pouco!',
        'Mas a dívida quase não desce... Comprei as férias e um sofá também com o cartão.',
      ],
    },
    {
      aPartirDe: 9,
      falas: () => [
        'Fiz as contas: devo 2.800€ e o cartão cobra uns 21% ao ano. Pago quase 50€ por mês só de juros!',
        'Recebi uma carta: "Junte todos os seus créditos num só, prestação baixinha!"',
      ],
      escolha: {
        pergunta: 'O que aconselhas?',
        opcoes: ['CORTAR O CARTÃO E PAGAR MAIS', 'JUNTAR OS CRÉDITOS NUM SÓ'],
        efeito: (i) =>
          i === 0
            ? ['Vou guardar o cartão na gaveta, fazer um orçamento e pagar 300€ por mês. Custa, mas acaba mais depressa.']
            : ['A prestação fica mais baixa... mas li melhor: são 7 anos a pagar! No total pago muito mais. Vou pensar duas vezes.'],
      },
    },
    {
      aPartirDe: 14,
      falas: (s) =>
        escolheu(s, 'joana', 2) === 0
          ? ['Já só devo 1.100€! Cortei nos jantares fora e vendi o sofá novo (comprei um usado).', 'É incrível: quanto menos devo, menos juros pago, e mais depressa desce.']
          : ['Juntei os créditos... a prestação baixou, mas ainda faltam anos. E voltei a usar o cartão. Agora tenho as duas coisas para pagar!', 'Afinal, o problema não era a prestação: era gastar mais do que ganho.'],
    },
    {
      aPartirDe: 20,
      falas: (s) =>
        escolheu(s, 'joana', 2) === 0
          ? ['Acabei de pagar o cartão! Zero dívidas!', 'Agora ponho esses 300€ por mês no depósito. Já tenho um fundo de emergência a crescer.']
          : ['Cancelei o cartão e fiz um plano com o banco. Vou demorar, mas desta vez não volto a cair.', 'Se pudesse voltar atrás, nunca pagava só o mínimo.'],
    },
  ],
}

// ---------------------------------------------------------------------------
// A Casa: os vizinhos Silva e a taxa variável

export const HISTORIA_SILVA: Historia<EstadoMercado> = {
  id: 'silva',
  npc: 'cliente_super',
  quem: 'Sr. Silva',
  titulo: 'Os Silva e a taxa variável',
  tempo: (s) => s.mes,
  esperar: ['Bom dia! Estou só a fazer as compras. Falamos depois!'],
  fim: () => ['Agora temos sempre 3 meses de prestações guardados. A casa é nossa... e o sossego também.'],
  capitulos: [
    {
      aPartirDe: 2,
      falas: () => [
        'Bom dia! Somos vizinhos! Eu e a minha mulher comprámos um T3 aqui perto.',
        'O banco aprovou à justinha: a prestação leva 40% do nosso salário. Taxa variável, porque estava mais barata!',
      ],
    },
    {
      aPartirDe: 7,
      falas: () => [
        'A Euribor subiu! A nossa prestação passou de 780€ para 960€ por mês.',
        'Não tínhamos folga nenhuma... Já cortámos no ginásio e nos jantares.',
      ],
      escolha: {
        pergunta: 'O que lhe dizes?',
        opcoes: ['FALEM COM O BANCO', 'PEÇAM UM CRÉDITO PESSOAL'],
        efeito: (i) =>
          i === 0
            ? ['Falar com o banco? Achei que eles não ajudavam... Vou marcar uma reunião.']
            : ['Um crédito para pagar outro crédito? Hmm... Parece arriscado, mas não vejo outra saída.'],
      },
    },
    {
      aPartirDe: 12,
      falas: (s) =>
        escolheu(s, 'silva', 1) === 0
          ? ['O banco renegociou: alargámos o prazo e a prestação baixou para 850€. Pagamos mais juros no total, mas respiramos.', 'E passámos a ter um orçamento a sério, num caderno.']
          : ['Pedimos o crédito pessoal... e agora temos duas prestações. Uma delas com uma TAEG de 14%!', 'A minha mulher diz que temos de falar com o banco antes que seja tarde.'],
    },
    {
      aPartirDe: 17,
      falas: () => [
        'Arranjei turnos extra e a minha mulher faz traduções ao fim de semana. Estamos a juntar um fundo de emergência.',
        'Aprendemos à força: a prestação tem de caber no orçamento mesmo que os juros subam.',
      ],
    },
    {
      aPartirDe: 21,
      falas: (s) => [
        'A Euribor desceu! A prestação voltou para perto dos 800€.',
        escolheu(s, 'silva', 1) === 0 ? 'E já temos 3 meses de prestações guardados.' : 'Já pagámos o crédito pessoal. Nunca mais!',
        'Se comprássemos hoje, escolhíamos uma casa um bocadinho mais barata, para ter folga.',
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// O Negócio: o Duarte e a hamburgueria

export const HISTORIA_DUARTE: Historia<EstadoMercado> = {
  id: 'duarte_neg',
  npc: 'duarte',
  quem: 'Duarte',
  titulo: 'O Duarte e a hamburgueria',
  tempo: (s) => s.mes,
  esperar: ['Estou cheio de trabalho na hamburgueria! Passa depois.'],
  fim: (s) =>
    escolheu(s, 'duarte_neg', 2) === 1
      ? ['A hamburgueria fez um ano! Agora sei: plano de negócio, fundo de maneio e o IVA à parte.']
      : ['Fechar custou muito, mas aprendi imenso. Um dia volto a tentar, com um plano a sério.'],
  capitulos: [
    {
      aPartirDe: 1,
      falas: () => [
        'Também abri um negócio: uma hamburgueria gourmet! Gastei tudo na decoração, ficou linda.',
        'Plano de negócio? Fundo de maneio? Isso é para empresas grandes. Eu vou na intuição!',
      ],
      escolha: {
        pergunta: 'O que lhe dizes?',
        opcoes: ['FAZ UM PLANO', 'BOA SORTE!'],
        efeito: (i) => (i === 0 ? ['Um plano... Está bem, vou tentar fazer umas contas. Mas o importante é o sabor!'] : ['Obrigado! Vai correr bem, tenho a certeza.']),
      },
    },
    {
      aPartirDe: 3,
      falas: () => [
        'Vendas ótimas! Mas chegou a conta do IVA do trimestre: 2.400€!',
        'Eu achava que aquele dinheiro na caixa era meu... Gastei-o numa máquina de batidos.',
      ],
    },
    {
      aPartirDe: 6,
      falas: () => ['Junho: subsídio de férias para os 4 empregados. Não tenho dinheiro para pagar!', 'Posso pedir-te emprestado da tua empresa? 2.000€, devolvo daqui a 3 meses.'],
      escolha: {
        pergunta: 'O que fazes?',
        opcoes: ['EMPRESTO 2.000€', 'NÃO, MAS AJUDO COM AS CONTAS'],
        efeito: (i, ctx) => {
          const s = ctx.estado()
          if (i === 0 && s.negocio) {
            ctx.definir({ ...s, negocio: { ...s.negocio, caixa: round2(s.negocio.caixa - 2000) } })
            return ['Obrigado! Salvaste-me. Prometo devolver.']
          }
          return ['Sentámo-nos com as contas: corto um empregado no inverno, baixo a renda com o senhorio e peço um plano às Finanças. Vai doer, mas faz sentido.']
        },
      },
    },
    {
      aPartirDe: 9,
      falas: (s) =>
        escolheu(s, 'duarte_neg', 2) === 1
          ? ['As contas que fizemos funcionaram! Agora separo todos os meses o IVA e um bocadinho para os subsídios.', 'Ainda não ganho muito, mas a hamburgueria está de pé.']
          : ['Usei o teu dinheiro para pagar os subsídios... mas em setembro as vendas caíram e não consigo devolver-te já.', 'Acho que vou ter de fechar. Faltou-me sempre caixa.'],
    },
    {
      aPartirDe: 12,
      falas: (s) => {
        if (escolheu(s, 'duarte_neg', 2) === 1) return ['Fiz um ano! E até contratei mais uma pessoa para o verão, a termo.', 'Obrigado por não me teres emprestado dinheiro: obrigaste-me a resolver o problema a sério.']
        return ['Fechei a hamburgueria. Vendi o equipamento e consegui devolver-te 1.500€ dos 2.000€.', 'Emprestar dinheiro a amigos é bonito, mas pode não voltar. E eu precisava de um plano, não de mais dinheiro.']
      },
      escolha: {
        pergunta: 'O que lhe dizes?',
        opcoes: ['TENTA OUTRA VEZ, COM PLANO', 'ESTÁ TUDO BEM'],
        efeito: (_i, ctx) => {
          const s = ctx.estado()
          if (escolheu(s, 'duarte_neg', 2) === 0 && s.negocio) ctx.definir({ ...s, negocio: { ...s.negocio, caixa: round2(s.negocio.caixa + 1500) } })
          return ['Obrigado, a sério. Para a próxima, começo pelo plano de negócio e pelo fundo de maneio.']
        },
      },
    },
  ],
}

// ---------------------------------------------------------------------------
// A Reforma: a D. Graça e as burlas

export const HISTORIA_GRACA: Historia<EstadoReforma> = {
  id: 'graca',
  npc: 'avo',
  quem: 'D. Graça',
  titulo: 'A D. Graça contra as burlas',
  tempo: (s) => s.ano,
  esperar: ['Ai, sente-se um bocadinho! Para a próxima conto-lhe as novidades.'],
  fim: () => ['Agora já ninguém me engana. E ainda ajudo as minhas amigas!'],
  capitulos: [
    {
      aPartirDe: 1,
      falas: () => [
        'Sabe o que me aconteceu? Recebi uma mensagem: "Olá mãe, mudei de número, preciso de dinheiro urgente".',
        'Quase transferi 900€! Liguei para o número antigo do meu filho e ele nem sabia de nada.',
      ],
    },
    {
      aPartirDe: 3,
      falas: () => [
        'Conheci um senhor muito simpático na internet. Engenheiro, a trabalhar numa plataforma de petróleo...',
        'Agora pede-me 2.000€ para pagar a viagem para me vir visitar. Coitado, não tem acesso às contas dele.',
      ],
      escolha: {
        pergunta: 'O que lhe dizes?',
        opcoes: ['É UMA BURLA ROMÂNTICA!', 'TENHA CUIDADO...'],
        efeito: (i) =>
          i === 0
            ? ['Uma burla?! ... Pois, nunca quis fazer videochamada. E pede sempre dinheiro. Vou bloqueá-lo.']
            : ['Cuidado? Ele é tão querido... Vou pensar.'],
      },
    },
    {
      aPartirDe: 6,
      falas: (s) =>
        escolheu(s, 'graca', 1) === 0
          ? ['Bloqueei o "engenheiro". Depois soube que enganou mais três senhoras da vila!', 'A junta de freguesia vai fazer uma formação sobre burlas. Vou inscrever-me.']
          : ['Mandei-lhe 2.000€... e ele desapareceu. Fui à polícia: era uma burla romântica, há muitas assim.', 'Que vergonha. Mas a polícia diz que o importante é contar, para avisar outros.'],
    },
    {
      aPartirDe: 10,
      falas: () => [
        'Fiz a formação da junta! Aprendi as regras de ouro:',
        'Nunca dar códigos nem dados do banco. Desconfiar de pressa e de segredos. Confirmar sempre por outro caminho. Na dúvida, perguntar a alguém de confiança.',
      ],
    },
    {
      aPartirDe: 15,
      falas: () => [
        'Agora sou eu que dou a formação às minhas amigas! Todas as semanas, no centro de dia.',
        'Ontem uma delas ia pagar uma "encomenda retida" por SMS e lembrou-se de mim a tempo. Que alegria!',
      ],
    },
  ],
}
