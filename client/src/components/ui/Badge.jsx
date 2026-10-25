export default function Badge({ children, tone = 'neutral', className = '' }) {
  const styles = {
    neutral: 'bg-bg text-muted',
    success: 'bg-accent/10 text-accent',
    danger: 'bg-danger/10 text-danger',
    brand: 'bg-brand/10 text-brand',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
