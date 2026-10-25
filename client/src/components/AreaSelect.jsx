import { useTranslation } from 'react-i18next'

const AREA_KEYS = [
  'tecnologia',
  'engenharia',
  'saude',
  'educacao',
  'gestao',
  'ciencias',
  'artes',
  'outra',
]

export default function AreaSelect({
  value = '',
  onChange,
  includeEmpty = false,
  emptyLabel,
  ...props
}) {
  const { t } = useTranslation('areas')
  return (
    <select value={value || ''} onChange={(event) => onChange?.(event.target.value)} {...props}>
      {includeEmpty && <option value="">{emptyLabel || t('all')}</option>}
      {AREA_KEYS.map((area) => (
        <option key={area} value={area}>
          {t(area)}
        </option>
      ))}
    </select>
  )
}
