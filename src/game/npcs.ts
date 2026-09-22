import type { NPCDef } from './types'

export const MARTA: NPCDef = {
  id: 'marta',
  nome: 'Marta',
  avatar: { pele: '#f1c27d', cabelo: '#a83232', roupa: '#ec4899' },
  gx: 7,
  gy: 11,
  estilo: 'historia',
  saudacao: '',
  topicos: [
    {
      id: 'bicicleta',
      titulo: 'A história da Marta',
      linhas: [
        'Olá! Sabes que eu queria muito uma bicicleta nova, mas custava 200 moedas e eu só tinha 20?',
        'Decidi guardar 10 moedas todas as semanas, mesmo quando os meus amigos me convidavam para gastar em doces.',
        'Ao fim de algumas semanas reparei que já tinha quase metade do dinheiro — e continuei, mesmo sendo difícil dizer "agora não" às tentações.',
        'Hoje ando na minha bicicleta nova! Se tivesse gasto tudo em doces, ainda estaria a pé.',
        'A dica é: define um objetivo claro (como uma bicicleta) — ajuda muito mais a resistir à tentação de gastar tudo.',
      ],
    },
  ],
}

export const TIAGO: NPCDef = {
  id: 'tiago',
  nome: 'Tiago',
  avatar: { pele: '#c68642', cabelo: '#2d1b0e', roupa: '#64748b' },
  gx: 9,
  gy: 9,
  estilo: 'historia',
  saudacao: '',
  topicos: [
    {
      id: 'pneu',
      titulo: 'A história do Tiago',
      linhas: [
        'Ena, tens sorte de teres o Mestre Moedas por perto! Eu costumava gastar todas as minhas moedas assim que as recebia.',
        'Um dia a minha bicicleta furou um pneu e precisei de 15 moedas para arranjar — mas eu não tinha nada guardado!',
        'Tive de pedir emprestado a um amigo, e ele ficou chateado porque isso já tinha acontecido antes.',
        'Agora percebo: guardar só um bocadinho todas as semanas é como ter um "escudo" para as surpresas da vida.',
        'Não precisas de guardar tudo — só um bocadinho de cada vez já faz a diferença quando precisares mesmo.',
      ],
    },
  ],
}
