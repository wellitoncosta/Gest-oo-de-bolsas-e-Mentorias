import { CheckCircle2, CircleAlert } from 'lucide-react'
export default function Toast({ type = 'success', children, href }) {
  const Icon = type === 'error' ? CircleAlert : CheckCircle2
  return (
    <div
      role="status"
      className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${type === 'error' ? 'border-danger/30 bg-danger/10 text-danger' : 'border-accent/30 bg-accent/10 text-text'}`}
    >
      <Icon size={18} />
      {href ? (
        <a className="flex-1 underline-offset-2 hover:underline" href={href}>
          {children}
        </a>
      ) : (
        children
      )}
    </div>
  )
}
