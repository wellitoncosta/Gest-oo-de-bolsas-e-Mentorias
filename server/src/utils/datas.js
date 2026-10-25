const TIME_ZONE_DEFAULT = 'Africa/Luanda'

export function timezoneValido(value) {
  if (typeof value !== 'string' || !value) return false
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return true
  } catch {
    return false
  }
}

export function paraInstanteUTC(data, hora, fuso = TIME_ZONE_DEFAULT) {
  if (!timezoneValido(fuso)) throw new RangeError(`Fuso horário inválido: ${fuso}`)
  const dataLocal = data.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataLocal) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
    throw new RangeError('Data ou hora local inválida.')
  }
  const [ano, mes, dia] = dataLocal.split('-').map(Number)
  const calendario = new Date(Date.UTC(ano, mes - 1, dia))
  if (
    calendario.getUTCFullYear() !== ano ||
    calendario.getUTCMonth() + 1 !== mes ||
    calendario.getUTCDate() !== dia
  ) {
    throw new RangeError('Data local inválida.')
  }
  const [h, min] = hora.split(':').map(Number)
  let instante = Date.UTC(ano, mes - 1, dia, h, min)
  const formatador = new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
  for (let tentativa = 0; tentativa < 4; tentativa += 1) {
    const partes = Object.fromEntries(
      formatador.formatToParts(new Date(instante)).map(({ type, value }) => [type, value]),
    )
    const representado = Date.UTC(
      Number(partes.year),
      Number(partes.month) - 1,
      Number(partes.day),
      Number(partes.hour),
      Number(partes.minute),
      Number(partes.second),
    )
    const diferenca = Date.UTC(ano, mes - 1, dia, h, min) - representado
    instante += diferenca
    if (diferenca === 0) break
  }
  return new Date(instante)
}

export function camposLegados(instante) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE_DEFAULT,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instante)
      .map(({ type, value }) => [type, value]),
  )
  const data = `${partes.year}-${partes.month}-${partes.day}`
  return { data: new Date(`${data}T00:00:00.000Z`), hora: `${partes.hour}:${partes.minute}` }
}
