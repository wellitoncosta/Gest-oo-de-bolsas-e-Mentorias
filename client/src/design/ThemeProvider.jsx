import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

function getInitialMode() {
  const saved = localStorage.getItem('theme')
  return ['dark', 'light', 'system'].includes(saved) ? saved : 'system'
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  )
  const dark = mode === 'system' ? systemDark : mode === 'dark'
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', mode)
  }, [dark, mode])
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return
    const update = (event) => setSystemDark(event.matches)
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])
  const toggle = useCallback(() => setMode((value) => (value === 'dark' ? 'light' : 'dark')), [])
  const value = useMemo(() => ({ dark, mode, setMode, toggle }), [dark, mode, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext)
