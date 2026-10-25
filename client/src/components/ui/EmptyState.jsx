import { Inbox } from 'lucide-react'
export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <Inbox className="mb-3 text-muted" size={28} />
      <h3 className="font-semibold text-text">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
