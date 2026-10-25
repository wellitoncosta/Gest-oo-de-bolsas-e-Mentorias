import i18n from '../i18n'

export function traduzirErro(err, fallback = '') {
  const data = err?.response?.data
  if (data?.codigo) {
    const key = `errors:${data.codigo}`
    const translated = i18n.t(key)
    if (translated !== key) return translated
  }
  return data?.mensagem || err?.message || fallback || i18n.t('common:error')
}

export function traduzirEstado(status) {
  if (!status) return ''
  const key = `status:${status}`
  const translated = i18n.t(key)
  return translated === key ? status : translated
}
