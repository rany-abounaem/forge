import { FileTree } from './FileTree'

export function Sidebar() {
  return (
    <div
      style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}
      className="h-full flex flex-col overflow-hidden"
    >
      <div className="px-3 py-2 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
          Files
        </span>
      </div>

      {}
      <div className="flex-1 overflow-hidden flex flex-col">
        <FileTree />
      </div>

      <div className="px-3 py-2 shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
          Sessions
        </span>
      </div>
    </div>
  )
}
