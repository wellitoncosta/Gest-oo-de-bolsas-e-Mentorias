import LangSwitch from './LangSwitch'
import ThemeToggle from './ThemeToggle'

export default function AuthControls() {
  return (
    <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-end gap-2 sm:right-8 sm:top-6">
      <LangSwitch />
      <ThemeToggle />
    </div>
  )
}
