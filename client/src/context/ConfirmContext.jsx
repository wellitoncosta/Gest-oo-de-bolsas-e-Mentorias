import { createContext, useCallback, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const { t } = useTranslation('common')
  const [pending, setPending] = useState(null)
  const confirm = useCallback(
    (options) =>
      new Promise((resolve) =>
        setPending({
          title: options?.title || t('confirmTitle'),
          message: options?.message || '',
          confirmLabel: options?.confirmLabel || t('continue'),
          cancelLabel: options?.cancelLabel || t('cancel'),
          choices: options?.choices || null,
          resolve,
        }),
      ),
    [t],
  )
  const finish = (result) => {
    pending?.resolve(result)
    setPending(null)
  }
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.title}
        onClose={() => finish(pending?.choices ? null : false)}
      >
        <p className="leading-7 text-muted">{pending?.message}</p>
        <div className="mt-6 flex justify-end gap-3">
          {pending?.choices ? (
            <>
              <Button variant="secondary" onClick={() => finish(null)}>
                {pending?.cancelLabel}
              </Button>
              {pending.choices.map((choice) => (
                <Button
                  key={choice.value}
                  variant={choice.variant}
                  onClick={() => finish(choice.value)}
                >
                  {choice.label}
                </Button>
              ))}
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => finish(false)}>
                {pending?.cancelLabel}
              </Button>
              <Button onClick={() => finish(true)}>{pending?.confirmLabel}</Button>
            </>
          )}
        </div>
      </ConfirmDialog>
    </ConfirmContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm deve ser utilizado dentro de ConfirmProvider')
  return context
}
