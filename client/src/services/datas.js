export function fusoDoNavegador() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Luanda'
  } catch {
    return 'Africa/Luanda'
  }
}

export function fusosHorarios() {
  const supported = Intl.supportedValuesOf?.('timeZone') || []
  return [...new Set(['Africa/Luanda', ...supported])].sort((a, b) => a.localeCompare(b))
}

function partesHora(iso, fuso) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]))
}

export function aUTC(dataLocal, hora, fuso = fusoDoNavegador()) {
  if (!dataLocal || !hora) throw new TypeError('Data e hora locais são obrigatórias.')
  const [ano, mes, dia] = dataLocal.slice(0, 10).split('-').map(Number)
  const [h, min] = hora.split(':').map(Number)
  const desejado = Date.UTC(ano, mes - 1, dia, h, min)
  let instante = desejado
  for (let tentativa = 0; tentativa < 4; tentativa += 1) {
    const part = partesHora(instante, fuso)
    const representado = Date.UTC(
      Number(part.year),
      Number(part.month) - 1,
      Number(part.day),
      Number(part.hour),
      Number(part.minute),
      Number(part.second),
    )
    const diferenca = desejado - representado
    instante += diferenca
    if (diferenca === 0) break
  }
  return new Date(instante).toISOString()
}

function nomeFuso(iso, fuso, idioma) {
  const short =
    new Intl.DateTimeFormat(idioma, { timeZone: fuso, timeZoneName: 'short' })
      .formatToParts(new Date(iso))
      .find((part) => part.type === 'timeZoneName')?.value || fuso
  const zone = fuso === 'Africa/Luanda' ? 'WAT' : short
  const city = fuso.split('/').at(-1)?.replaceAll('_', ' ') || fuso
  return `${zone}, ${city}`
}

export function formatarDataHora(iso, idioma = 'pt', fuso = fusoDoNavegador()) {
  if (!iso) return ''
  const locale = idioma.startsWith('en') ? 'en-GB' : 'pt-PT'
  const value = new Intl.DateTimeFormat(locale, {
    timeZone: fuso,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
  return `${value} (${nomeFuso(iso, fuso, locale)})`
}

export function formatarHora(iso, idioma = 'pt', fuso = fusoDoNavegador()) {
  if (!iso) return ''
  const locale = idioma.startsWith('en') ? 'en-GB' : 'pt-PT'
  const value = new Intl.DateTimeFormat(locale, {
    timeZone: fuso,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
  return `${value} (${nomeFuso(iso, fuso, locale)})`
}
