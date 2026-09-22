import type { NPCDef } from './types'

export const MENTOR: NPCDef = {
  id: 'mentor',
  nome: 'Mestre Moedas',
  avatar: { pele: '#e0ac69', cabelo: '#e8e0d5', roupa: '#10b981' },
  gx: 3,
  gy: 1,
  saudacao: 'Olá! Sou o Mestre Moedas. Sobre o que queres aprender hoje?',
  topicos: [
    {
      id: 'poupar',
      titulo: '💰 O que é poupar?',
      linhas: [
        'Poupar é guardar uma parte do teu dinheiro em vez de gastares tudo logo.',
        'Imagina que ganhas 10 moedas e gastas só 7. As 3 que sobram podes guardar no mealheiro!',
        'Parece pouco, mas se fizeres isso toda a semana, ao fim de um mês já tens 12 moedas guardadas — sem teres feito mais nada.',
      ],
    },
    {
      id: 'investir',
      titulo: '📈 O que é investir?',
      linhas: [
        'Investir é diferente de poupar: em vez de guardares o dinheiro parado, "põe-lo a trabalhar" para crescer sozinho.',
        'É como plantar uma semente: não a comes logo — plantas, regas, e esperas que cresça numa árvore com muitos frutos.',
        'No jogo, quando investes moedas no Banco, elas podem crescer mais depressa do que no mealheiro — mas às vezes também podem descer um bocadinho.',
      ],
    },
    {
      id: 'risco',
      titulo: '🎢 Porque existe risco?',
      linhas: [
        'Risco baixo é como andar de bicicleta devagar: quase nunca cais, mas também não vais muito depressa.',
        'Risco alto é como andar de skate numa rampa: podes ir muito mais rápido, mas também podes cair mais vezes.',
        'Ninguém sabe sempre o que vai subir ou descer — por isso é sensato não pores todas as moedas no mesmo sítio!',
      ],
    },
    {
      id: 'juros',
      titulo: '🌱 Porque o dinheiro cresce sozinho?',
      linhas: [
        'Quando guardas moedas na poupança do jogo, todas as semanas ganhas um bocadinho a mais — de graça!',
        'Chama-se "juro": é como um agradecimento por teres deixado o teu dinheiro lá guardado.',
        'Quanto mais cedo começares a guardar, mais tempo o teu dinheiro tem para crescer sozinho. Por isso vale a pena começar já, mesmo com pouco!',
      ],
    },
  ],
}
