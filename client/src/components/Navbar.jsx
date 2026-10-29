import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Menu, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import LangSwitch from './LangSwitch'
import ThemeToggle from './ThemeToggle'
import { useRealtimeStatus } from '../context/RealtimeContext'

const EVENTOS_NOTIFICAVEIS = [
  'candidatura:nova',
  'candidatura:estado',
  'mentoria:nova',
  'mentoria:estado',
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const { t } = useTranslation('nav')
  const { t: tc } = useTranslation('common')
  const { online } = useRealtimeStatus()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [notifications, setNotifications] = useState(0)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const signOut = async () => {
    await logout()
    navigate('/')
    setOpen(false)
    setAvatarOpen(false)
  }

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  useEffect(() => {
    const receive = (event) => {
      if (EVENTOS_NOTIFICAVEIS.includes(event.detail?.evento)) {
        setNotifications((count) => Math.min(count + 1, 99))
      }
    }
    window.addEventListener('realtime:event', receive)
    return () => window.removeEventListener('realtime:event', receive)
  }, [])

  useEffect(() => {
    setOpen(false)
    setAvatarOpen(false)
  }, [location.pathname])

  const links = [
    ...(!user ? [['/', t('home')]] : []),
    ['/dashboard', t('dashboard')],
    ['/bolsas', t('scholarships')],
    ['/mentoria', t('mentoring')],
    ...(user?.role === 'ESTUDANTE' ? [['/candidaturas', t('applications')]] : []),
    ...(user ? [['/minha-conta', t('account')]] : []),
    ...(user?.role === 'ADMIN' ? [['/admin', t('admin')]] : []),
  ]
  const activeClass = ({ isActive }) =>
    `relative whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${isActive ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'}`

  return (
    <header
      className={`sticky top-3 z-50 mx-auto mb-3 w-[calc(100%-24px)] max-w-[1200px] rounded-2xl transition-all duration-200 ${scrolled ? 'bg-surface/90 shadow-lg shadow-brand/10 backdrop-blur-xl' : 'bg-transparent'}`}
    >
      <div className="relative flex min-h-16 items-center justify-between gap-3 px-3 sm:px-4">
        <Link
          to={user ? '/dashboard' : '/'}
          aria-label="B&M – Bolsas e Mentoria"
          className="z-10 shrink-0 px-1"
        >
          <img
            src="/logos/logo-light.png"
            alt="B&M – Bolsas e Mentoria"
            className="h-9 w-auto dark:hidden"
          />
          <img
            src="/logos/logo-dark.png"
            alt="B&M – Bolsas e Mentoria"
            className="hidden h-9 w-auto dark:block"
          />
        </Link>

        <nav
          aria-label={t('mainNavigation')}
          className="absolute left-1/2 hidden max-w-[calc(100%-430px)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-full bg-surface-2/85 p-1.5 backdrop-blur-md lg:flex"
        >
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={activeClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="z-10 hidden shrink-0 items-center gap-2 lg:flex">
          <LangSwitch />
          <ThemeToggle />
          {!user ? (
            <>
              <Link
                to="/login"
                className="rounded-full px-3 py-2 text-sm font-medium text-text hover:bg-surface-2"
              >
                {t('login')}
              </Link>
              <Link
                to="/registo"
                className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-bg shadow-sm hover:brightness-95"
              >
                {t('register')}
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setNotifications(0)}
                aria-label={tc('notifications', { count: notifications })}
                title={
                  notifications
                    ? tc('notifications', { count: notifications })
                    : tc(online ? 'liveOnline' : 'liveOffline')
                }
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-text hover:bg-surface-2"
              >
                <Bell size={18} />
                {notifications > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-bg">
                    {notifications}
                  </span>
                )}
              </button>
              <div className="relative">
                <button
                  type="button"
                  aria-label={tc('profile')}
                  aria-expanded={avatarOpen}
                  onClick={() => setAvatarOpen((value) => !value)}
                  className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-sm font-semibold text-brand hover:bg-brand/20 dark:text-accent"
                >
                  {user.nome
                    ?.split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()}
                </button>
                {avatarOpen && (
                  <div className="absolute right-0 top-12 z-20 min-w-48 rounded-2xl border border-border bg-surface p-2 shadow-xl">
                    <p className="truncate px-3 py-2 text-sm font-medium text-text">{user.nome}</p>
                    <Link
                      to="/minha-conta"
                      className="block rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-text"
                    >
                      {t('account')}
                    </Link>
                    <button
                      onClick={signOut}
                      className="w-full rounded-xl px-3 py-2 text-left text-sm text-muted hover:bg-surface-2 hover:text-text"
                    >
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="z-10 flex shrink-0 items-center gap-1.5 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={t(open ? 'closeMenu' : 'menu')}
            aria-expanded={open}
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface/80 text-text"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex min-h-screen flex-col overflow-y-auto bg-bg/95 px-6 pb-10 pt-24 backdrop-blur-xl lg:hidden">
          <nav
            aria-label={t('mainNavigation')}
            className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-2"
          >
            {links.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `rounded-2xl px-5 py-4 text-xl font-medium ${isActive ? 'bg-surface text-brand dark:text-accent' : 'text-text hover:bg-surface'}`
                }
              >
                {label}
              </NavLink>
            ))}
            {user ? (
              <button
                onClick={signOut}
                className="rounded-2xl px-5 py-4 text-left text-xl text-muted hover:bg-surface"
              >
                {t('logout')} · {user.nome}
              </button>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-5">
                <Link
                  to="/login"
                  className="rounded-full border border-border px-4 py-3 text-center font-medium text-text"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/registo"
                  className="rounded-full bg-accent px-4 py-3 text-center font-semibold text-bg"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </nav>
          <div className="mx-auto mt-8 flex w-full max-w-lg items-center justify-between rounded-2xl bg-surface p-4">
            <div className="flex items-center gap-3">
              <LangSwitch />
              <ThemeToggle />
            </div>
            {user && (
              <button
                type="button"
                onClick={() => setNotifications(0)}
                aria-label={tc('notifications', { count: notifications })}
                className="relative grid h-10 w-10 place-items-center rounded-full border border-border text-text"
              >
                <Bell size={18} />
                {notifications > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-bg">
                    {notifications}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
