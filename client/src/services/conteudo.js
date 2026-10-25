export function conteudo(obj, campo, idioma) {
  if (!obj) return ''
  const valor = idioma?.startsWith('en') ? obj[`${campo}En`] : null
  return typeof valor === 'string' && valor.trim() ? valor : obj[campo] || ''
}

export function conteudoTemFallback(obj, campos, idioma) {
  return Boolean(
    idioma?.startsWith('en') &&
    campos.some((campo) => obj?.[campo] && !String(obj?.[`${campo}En`] || '').trim()),
  )
}

export function formatarValor(valor, idioma) {
  if (!valor) return ''
  const match = String(valor).match(/^(?:€\s*)?(\d+(?:[.,]\d{1,2})?)(\s*\/\s*(?:m[eê]s|month))?$/i)
  if (!match) return valor
  const amount = Number(match[1].replace(',', '.'))
  if (!Number.isFinite(amount)) return valor
  const moeda = new Intl.NumberFormat(idioma?.startsWith('en') ? 'en-GB' : 'pt-PT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(amount)
  return `${moeda}${match[2] ? (idioma?.startsWith('en') ? ' / month' : ' / mês') : ''}`
}
