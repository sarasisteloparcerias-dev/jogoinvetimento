import type { NPCDef } from './types'

export const MENTOR: NPCDef = {
  id: 'mentor',
  nome: 'Mestre Moedas',
  avatar: { pele: '#e0ac69', cabelo: '#e8e0d5', roupa: '#10b981' },
  gx: 7,
  gy: 3,
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
    {
      id: 'emergencia',
      titulo: '🚨 O que é uma reserva de emergência?',
      linhas: [
        'É como uma "rede de segurança": dinheiro guardado só para imprevistos, que não gastas em mais nada.',
        'Imagina que o teu brinquedo preferido se estraga de repente. Se já tiveres moedas guardadas para isso, resolves sem stress.',
        'Sem essa reserva, quando algo corre mal tens de pedir emprestado ou ficar sem solução — por isso vale a pena guardares um pouco antes de precisares.',
      ],
    },
    {
      id: 'inflacao',
      titulo: '📉 Porque é que as coisas ficam mais caras?',
      linhas: [
        'Já reparaste que um gelado que custava 2 moedas às vezes passa a custar 3? Isso chama-se inflação.',
        'É por isso que só guardar dinheiro parado nem sempre chega: se as coisas ficam mais caras mais depressa do que o teu dinheiro cresce, ele "encolhe" em poder de compra.',
        'É uma das razões porque investir (e não só poupar) pode ajudar o teu dinheiro a acompanhar o ritmo da vida.',
      ],
    },
  ],
}
