import { MENTOR } from '../mentor'
import { AVATARES, MAPAS } from '../world/mapas'
import type { MapaDef, NpcDef } from '../world/tipos'

const GRISALHO = '#d8d8d8'
const velho = (a: NpcDef['avatar']) => ({ ...a, cabelo: GRISALHO })

/** Quem está em cada sítio, 55 anos depois: as mesmas casas, outras pessoas (e as mesmas, mais velhas). */
const NPCS: Record<string, (n: NpcDef) => NpcDef | null> = {
  marta: (n) => ({ ...n, avatar: velho(n.avatar), script: 'marta_r' }),
  tiago: (n) => ({ ...n, avatar: velho(n.avatar), script: 'tiago_r' }),
  treinador: (n) => ({ ...n, nome: 'Prof. Zé (ginástica)', avatar: velho(n.avatar), script: 'ginastica' }),
  leo: (n) => ({ ...n, avatar: velho(n.avatar), script: 'amigos_r' }),
  bia: (n) => ({ ...n, avatar: velho(n.avatar), script: 'amigos_r' }),
  mae: (n) => ({ ...n, nome: 'Neta Leonor', avatar: { pele: '#f1c27d', cabelo: '#7a4a1e', roupa: '#e8743a', cabeloComprido: true }, script: 'neta' }),
  avo: (n) => ({ ...n, nome: 'D. Graça', avatar: { pele: '#e0ac69', cabelo: GRISALHO, roupa: '#9468cc', cabeloComprido: true }, script: 'vizinha' }),
  sr_doce: (n) => ({ ...n, nome: 'Sr. Doce Júnior', avatar: { ...AVATARES.srDoce, cabelo: '#7a4a1e' }, script: 'loja_r' }),
  cliente: (n) => ({ ...n, script: 'cliente_r' }),
  sofia: (n) => ({ ...n, nome: 'Gestora Sofia', avatar: velho(AVATARES.sofia), script: 'sofia_r' }),
  mestre: (n) => ({ ...n, nome: 'Mestre Moedas', avatar: { ...MENTOR.avatar, cabelo: '#ffffff' }, script: 'mestre_r' }),
  prof: (n) => ({ ...n, nome: 'Diretora Inês', avatar: { ...AVATARES.prof, cabelo: '#2d1b0e' }, script: 'voluntariado' }),
  aluno: (n) => ({ ...n, nome: 'Aluno', script: 'aluno_r' }),
}

function reformar(def: MapaDef): MapaDef {
  return { ...def, npcs: (def.npcs ?? []).map((n) => (NPCS[n.id] ? NPCS[n.id](n) : n)).filter((n): n is NpcDef => !!n) }
}

const VILA_R = reformar(MAPAS.vila)

export const MAPAS_REFORMA: Record<string, MapaDef> = {
  ...Object.fromEntries(Object.entries(MAPAS).map(([id, def]) => [id, reformar(def)])),
  vila: {
    ...VILA_R,
    npcs: [...(VILA_R.npcs ?? []), { id: 'pescador', nome: 'Sr. Alberto', avatar: { pele: '#c68642', cabelo: GRISALHO, roupa: '#3a6a4a' }, x: 8, y: 18, dir: 'left', script: 'pescar' }],
  },
  casa: { ...reformar(MAPAS.casa), nome: 'A TUA CASA (DE SEMPRE)' },
  avo: { ...reformar(MAPAS.avo), nome: 'CASA DA D. GRAÇA' },
  loja: { ...reformar(MAPAS.loja), nome: 'LOJA DO SR. DOCE JÚNIOR' },
}
