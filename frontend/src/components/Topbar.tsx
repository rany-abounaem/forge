

export function Topbar() {
  return (
    <div
      style={{ height: 48, background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}
      className="flex items-center px-4 gap-4 shrink-0"
    >
      {}
      <span style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: 16, letterSpacing: 2 }}>
        FORGE
      </span>

      {}
      <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
        ~/projects
      </span>
    </div>
  )
}
