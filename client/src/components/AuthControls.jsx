import LangSwitch from './LangSwitch'
import ThemeToggle from './ThemeToggle'

export default function AuthControls() {
  return <div className="absolute right-4 top-4 z-10 flex items-center gap-2 sm:right-8 sm:top-6"><LangSwitch /><ThemeToggle /></div>
}
