export default function Card({ className = '', children, ...props }) {
  return (
    <section
      className={`rounded-2xl border border-border bg-surface p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${className}`}
      {...props}
    >
      {children}
    </section>
  )
}
