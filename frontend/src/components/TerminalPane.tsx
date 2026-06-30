import { useEffect, useRef, useState, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { Plus, X } from 'lucide-react'
import '@xterm/xterm/css/xterm.css'
import { useStore } from '../store'

interface Session {
  id:   string
  name: string
}

interface TerminalViewProps {
  sessionId: string
  isActive:  boolean
  onDead:    (id: string) => void
}

function TerminalView({ sessionId, isActive, onDead }: TerminalViewProps) {
  
  
  const containerRef = useRef<HTMLDivElement>(null)

  
  
  
  const termRef    = useRef<Terminal | null>(null)
  const fitRef     = useRef<FitAddon | null>(null)

  
  
  
  useEffect(() => {
    if (!containerRef.current) return

    
    const term = new Terminal({
      theme: {
        background:  '#0A0A0F',
        foreground:  '#E2E8F0',
        cursor:      '#A78BFA',
        
      },
      fontFamily:   "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontSize:     14,
      lineHeight:   1.2,
      cursorBlink:  true,
      cursorStyle:  'block',
      
      allowProposedApi: true,
    })

    const fitAddon = new FitAddon()
    
    const webLinksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)

    
    
    
    term.open(containerRef.current)
    fitAddon.fit()

    termRef.current = term
    fitRef.current  = fitAddon

    
    const ws = new WebSocket(`ws://${window.location.host}/ws/terminal/${sessionId}`)

    
    
    ws.binaryType = 'arraybuffer'

    
    
    let receivedData = false

    ws.onopen = () => {
      
      
      ws.send(JSON.stringify({ cols: term.cols, rows: term.rows }))
    }

    ws.onmessage = (event) => {
      
      
      if (event.data instanceof ArrayBuffer) {
        receivedData = true
        term.write(new Uint8Array(event.data))
      }
    }

    
    
    
    let intentionalClose = false

    ws.onclose = () => {
      if (!intentionalClose && !receivedData) {
        
        
        onDead(sessionId)
      }
    }

    
    
    
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data)
      }
    })

    
    
    const observer = new ResizeObserver(() => {
      
      const el = containerRef.current
      if (!el || el.offsetWidth === 0 || el.offsetHeight === 0) return

      fitAddon.fit()

      if (ws.readyState === WebSocket.OPEN) {
        
        
        ws.send(JSON.stringify({ cols: term.cols, rows: term.rows }))
      }
    })
    observer.observe(containerRef.current)

    
    
    
    
    return () => {
      intentionalClose = true
      observer.disconnect()
      ws.close()
      term.dispose()    
    }
  }, [sessionId]) 

  
  
  
  useEffect(() => {
    if (!isActive || !fitRef.current || !containerRef.current) return
    
    
    
    const id = setTimeout(() => fitRef.current?.fit(), 10)
    return () => clearTimeout(id)
  }, [isActive])

  return (
    
    
    <div style={{ height: '100%', display: isActive ? 'block' : 'none', padding: 4 }}>
      <div ref={containerRef} style={{ height: '100%' }} />
    </div>
  )
}

interface TabBarProps {
  sessions:  Session[]
  activeId:  string | null
  onSelect:  (id: string) => void
  onClose:   (id: string) => void
  onCreate:  () => void
  onRename:  (id: string, name: string) => void
}

function TerminalTabBar({ sessions, activeId, onSelect, onClose, onCreate, onRename }: TabBarProps) {
  
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName]   = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  
  useEffect(() => {
    if (editingId) inputRef.current?.select()
  }, [editingId])

  const startEdit = (s: Session) => {
    setEditingId(s.id)
    setEditName(s.name)
  }

  const commitEdit = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim())
    }
    setEditingId(null)
  }

  return (
    <div style={{
      height: 36,
      background: 'var(--color-surface)',
      borderTop: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'stretch',
      flexShrink: 0,
    }}>
      {sessions.map((s) => {
        const isActive = s.id === activeId
        return (
          <div
            key={s.id}
            onClick={() => onSelect(s.id)}
            
            
            onDoubleClick={() => isActive && startEdit(s)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 12px',
              cursor: 'pointer',
              fontSize: 13,
              whiteSpace: 'nowrap',
              borderRight: '1px solid var(--color-border)',
              borderTop: isActive
                ? '2px solid var(--color-accent)'
                : '2px solid transparent',
              background: isActive ? 'var(--color-bg)' : 'transparent',
              color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
            }}
          >
            {editingId === s.id ? (
              
              
              
              <input
                ref={inputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit()
                  if (e.key === 'Escape') setEditingId(null)
                  
                  e.stopPropagation()
                }}
                onBlur={commitEdit}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'var(--color-elevated)',
                  border: '1px solid var(--color-accent)',
                  borderRadius: 3,
                  color: 'var(--color-text)',
                  padding: '1px 4px',
                  fontSize: 13,
                  width: `${Math.max(editName.length, 4)}ch`,
                  outline: 'none',
                }}
              />
            ) : (
              <span>{s.name}</span>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); onClose(s.id) }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 2, borderRadius: 3, display: 'flex', alignItems: 'center',
                color: 'var(--color-text-disabled)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-status-red)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-disabled)')}
            >
              <X size={12} />
            </button>
          </div>
        )
      })}

      <button
        onClick={onCreate}
        title="New terminal"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '0 10px', display: 'flex', alignItems: 'center',
          color: 'var(--color-text-muted)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

export function TerminalPane() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  const createSession = useCallback(async () => {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'terminal', cwd: '.' }),
    })
    if (!res.ok) return
    const data: { id: string; name: string } = await res.json()
    setSessions((prev) => [...prev, { id: data.id, name: data.name }])
    setActiveId(data.id)
  }, [])

  const closeSession = useCallback(async (id: string) => {
    await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id)
      if (activeId === id) {
        setActiveId(remaining[remaining.length - 1]?.id ?? null)
      }
      return remaining
    })
  }, [activeId])

  
  const renameSession = useCallback(async (id: string, name: string) => {
    
    
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    )
    
    await fetch(`/api/sessions/${id}/name`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
  }, [])

  
  
  
  
  
  
  
  
  
  const newTerminalSignal  = useStore((s) => s.newTerminalSignal)
  const createSessionRef   = useRef(createSession)
  useEffect(() => { createSessionRef.current = createSession }, [createSession])

  useEffect(() => {
    
    if (newTerminalSignal > 0) createSessionRef.current()
  }, [newTerminalSignal])

  
  
  
  
  
  
  
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    const init = async () => {
      let res: Response
      try {
        res = await fetch('/api/sessions', { signal })
      } catch {
        return 
      }
      if (!res.ok || signal.aborted) { await createSession(); return }

      const existing: Array<{ id: string; name: string }> = await res.json()
      if (signal.aborted) return

      if (existing.length === 0) {
        await createSession()
      } else {
        setSessions(existing)
        
        setActiveId(existing[existing.length - 1].id)
      }
    }
    init()

    return () => controller.abort()
  }, []) 

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <TerminalTabBar
        sessions={sessions}
        activeId={activeId}
        onSelect={setActiveId}
        onClose={closeSession}
        onCreate={createSession}
        onRename={renameSession}
      />

      {}
      <div className="flex-1 overflow-hidden">
        {sessions.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <span style={{ color: 'var(--color-text-disabled)' }}>No terminal session</span>
          </div>
        ) : (
          sessions.map((s) => (
            <TerminalView
              key={s.id}
              sessionId={s.id}
              isActive={s.id === activeId}
              onDead={closeSession}
            />
          ))
        )}
      </div>
    </div>
  )
}
