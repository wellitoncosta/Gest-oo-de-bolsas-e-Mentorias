import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import LangSwitch from './LangSwitch'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { t } = useTranslation('nav')
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const signOut = async () => { await logout(); navigate('/'); setOpen(false) }
  const links = [
    ['/', t('home')], ['/dashboard', t('dashboard')], ['/bolsas', t('scholarships')], ['/mentores', t('mentors')],
    ...(user && user.role !== 'ADMIN' ? [['/mentorias', t('mentoring')]] : []),
    ...(user?.role === 'ESTUDANTE' ? [['/candidaturas', t('applications')]] : []),
    ...(user ? [['/minha-conta', t('account')]] : []), ...(user?.role === 'ADMIN' ? [['/admin', t('admin')]] : []),
  ]
  const navLinks = <>{links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => `whitespace-nowrap border-b-2 px-1 py-5 text-sm font-medium transition ${isActive || (to !== '/' && location.pathname.startsWith(to)) ? 'border-accent text-text' : 'border-transparent text-muted hover:text-text'}`}>{label}</NavLink>)}</>
  return <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-surface/85 shadow-sm backdrop-blur-xl">
    <div className="mx-auto flex h-[72px] max-w-content items-center justify-between gap-4 px-5">
      <div className="flex min-w-0 items-center gap-6"><Link to="/" aria-label="B&M – Bolsas e Mentoria" className="shrink-0"><img src="/logos/logo-light.png" alt="B&M – Bolsas e Mentoria" className="h-9 w-auto dark:hidden" /><img src="/logos/logo-dark.png" alt="B&M – Bolsas e Mentoria" className="hidden h-9 w-auto dark:block" /></Link><nav className="hidden items-center gap-4 xl:flex">{navLinks}</nav></div>
      <div className="hidden shrink-0 items-center gap-2 xl:flex"><LangSwitch /><ThemeToggle />{!user ? <><Link to="/login" className="rounded-xl px-3 py-2 text-sm font-medium text-text hover:bg-bg">{t('login')}</Link><Link to="/registo" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-bg shadow-sm hover:bg-brand/90">{t('register')}</Link></> : <div className="ml-1 flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-full bg-brand/10 text-sm font-semibold text-brand">{user.nome?.split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase()}</div><div className="hidden max-w-32 lg:block"><p className="truncate text-sm font-medium text-text">{user.nome}</p><p className="text-xs text-muted">{t(user.role === 'ADMIN' ? 'common:admin' : user.role === 'MENTOR' ? 'common:mentor' : 'common:student')}</p></div><button onClick={signOut} className="rounded-xl px-3 py-2 text-sm text-muted hover:bg-bg hover:text-text">{t('logout')}</button></div>}</div>
      <div className="flex items-center gap-2 xl:hidden"><LangSwitch /><ThemeToggle /><button onClick={() => setOpen(v => !v)} aria-label={t('menu')} className="grid h-10 w-10 place-items-center rounded-xl border border-border text-text">{open ? <X size={19} /> : <Menu size={19} />}</button></div>
    </div>
    {open && <div className="max-h-[calc(100vh-72px)] overflow-y-auto border-t border-border bg-surface px-5 py-3 shadow-xl xl:hidden"><nav className="flex flex-col">{links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => `rounded-lg px-3 py-3 text-sm ${isActive || (to !== '/' && location.pathname.startsWith(to)) ? 'bg-brand/10 font-semibold text-brand' : 'text-text hover:bg-bg'}`}>{label}</NavLink>)}{user ? <button onClick={signOut} className="rounded-lg px-3 py-3 text-left text-sm text-text hover:bg-bg">{t('logout')} ({user.nome})</button> : <div className="mt-2 flex gap-2 border-t border-border pt-3"><Link className="flex-1 rounded-xl px-3 py-2 text-center text-sm text-text hover:bg-bg" to="/login" onClick={() => setOpen(false)}>{t('login')}</Link><Link className="flex-1 rounded-xl bg-brand px-3 py-2 text-center text-sm text-bg" to="/registo" onClick={() => setOpen(false)}>{t('register')}</Link></div>}</nav></div>}
  </header>
}
