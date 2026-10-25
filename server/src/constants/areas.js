export const areas = [
  'tecnologia',
  'engenharia',
  'saude',
  'educacao',
  'gestao',
  'ciencias',
  'artes',
  'outra',
]

export function mapearArea(valor) {
  const normalizado = String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  if (
    /tecnolog|informat|software|ciberseg|comput|\bia\b|dados|technology|computer|artificial intelligence|machine learning/.test(
      normalizado,
    )
  )
    return 'tecnologia'
  if (/engenhar|engineering/.test(normalizado)) return 'engenharia'
  if (/saude|medicin|enferm|biolog|farmac|health|nurs/.test(normalizado)) return 'saude'
  if (/educac|ensino|academ|pedagog|formac|education|teaching/.test(normalizado)) return 'educacao'
  if (/gestao|administr|empreend|negocio|econom|management|business/.test(normalizado))
    return 'gestao'
  if (/cienc|investig|matemat|fisic|quimic|ambiente|science|research|environment/.test(normalizado))
    return 'ciencias'
  if (/art|design|musica|teatro|cultura/.test(normalizado)) return 'artes'
  return 'outra'
}
