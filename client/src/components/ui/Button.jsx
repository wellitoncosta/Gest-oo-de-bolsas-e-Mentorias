import { LoaderCircle } from 'lucide-react'

const variants = {
  primary: 'bg-brand text-bg hover:bg-brand/90', secondary: 'border border-border bg-surface text-text hover:bg-bg',
  ghost: 'text-text hover:bg-bg', danger: 'bg-danger text-bg hover:opacity-90',
}
export default function Button({ variant = 'primary', loading = false, disabled = false, className = '', children, ...props }) {
  return <button disabled={disabled || loading} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium shadow-sm transition duration-200 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>{loading && <LoaderCircle size={17} className="animate-spin" />}{children}</button>
}
