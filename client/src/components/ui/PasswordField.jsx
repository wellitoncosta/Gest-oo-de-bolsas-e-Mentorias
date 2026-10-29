import { forwardRef, useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const PasswordField = forwardRef(function PasswordField(
  {
    label,
    value,
    onChange,
    onBlur,
    error,
    hint,
    autoComplete,
    required,
    id,
    className = '',
    ...inputProps
  },
  ref,
) {
  const generatedId = useId()
  const inputId = id || generatedId
  const [visible, setVisible] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const { t } = useTranslation('common')
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const capsId = `${inputId}-caps-lock`
  const describedBy =
    [hint && hintId, error && errorId, capsLock && capsId].filter(Boolean).join(' ') || undefined
  const atualizarCapsLock = (event) => setCapsLock(event.getModifierState?.('CapsLock') || false)

  return (
    <div className="block space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-text">
        {label}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={(event) => {
            setCapsLock(false)
            onBlur?.(event)
          }}
          onKeyDown={(event) => {
            atualizarCapsLock(event)
            inputProps.onKeyDown?.(event)
          }}
          onKeyUp={(event) => {
            atualizarCapsLock(event)
            inputProps.onKeyUp?.(event)
          }}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`w-full rounded-xl border bg-surface-2 px-3.5 py-2.5 pr-14 text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${error ? 'border-danger' : 'border-border'} ${className}`}
        />
        <button
          type="button"
          aria-label={t(visible ? 'hidePassword' : 'showPassword')}
          aria-pressed={visible}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-1 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-bg hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
      {capsLock && (
        <p id={capsId} className="text-xs text-muted">
          {t('capsLockOn')}
        </p>
      )}
    </div>
  )
})

export default PasswordField
