import { Inbox } from 'lucide-react'
export default function EmptyState({ title, description, action, compact = false }) {
  return (
    <div
      className={`flex ${compact ? 'flex-row items-center justify-between gap-3 px-3 py-3 text-left' : 'flex-col items-center px-6 py-12 text-center'} rounded-2xl border border-dashed border-border bg-surface`}
    >
      {!compact && <Inbox className="mb-3 text-muted" size={28} />}
      <h3 className="font-semibold text-text">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {action && <div className={compact ? 'shrink-0' : 'mt-4'}>{action}</div>}
    </div>
  )
}
