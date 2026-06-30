import { createPortal } from 'react-dom'
import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useStore } from '../store'
import type { TreeNode } from '../types'

function flattenTree(node: TreeNode | null): string[] {
  if (!node) return []
  const results: string[] = []

  function walk(n: TreeNode) {
    
    if (!n.isDir) results.push(n.path)
    
    
    n.children?.forEach(walk)
  }

  node.children?.forEach(walk)
  return results
}

export function CommandPalette() {
  const paletteOpen  = useStore((s) => s.paletteOpen)
  const closePalette = useStore((s) => s.closePalette)
  const openFile     = useStore((s) => s.openFile)
  const tree         = useStore((s) => s.tree)

  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef  = useRef<HTMLDivElement>(null)

  
  useEffect(() => {
    if (paletteOpen) {
      setQuery('')
      setSelected(0)
      
      
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [paletteOpen])

  
  
  const allFiles = flattenTree(tree)
  const filtered = query
    ? allFiles.filter((p) =>
        p.toLowerCase().includes(query.toLowerCase())
      )
    : allFiles.slice(0, 30)   

  
  const safeSelected = Math.min(selected, Math.max(filtered.length - 1, 0))

  const pick = (path: string) => {
    openFile(path)
    closePalette()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { closePalette(); return }
    if (e.key === 'Enter' && filtered[safeSelected]) {
      pick(filtered[safeSelected])
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, filtered.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    }
  }

  
  useEffect(() => {
    const el = listRef.current?.children[safeSelected] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [safeSelected])

  const basename = (p: string) => p.replace(/\\/g, '/').split('/').pop() ?? p

  
  
  
  return createPortal(
    <AnimatePresence>
      {paletteOpen && (
        
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={closePalette}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '15vh',
          }}
        >
          {}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 540,
              background: 'var(--color-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            {}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0 14px',
              borderBottom: '1px solid var(--color-border)',
            }}>
              <Search size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0) }}
                onKeyDown={handleKeyDown}
                placeholder="Search files…"
                style={{
                  flex: 1,
                  padding: '13px 0',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--color-text)',
                  fontSize: 15,
                }}
              />
              <kbd style={{
                fontSize: 11,
                color: 'var(--color-text-disabled)',
                border: '1px solid var(--color-border)',
                borderRadius: 3,
                padding: '1px 5px',
              }}>
                esc
              </kbd>
            </div>

            {}
            <div ref={listRef} style={{ maxHeight: 360, overflowY: 'auto' }}>
              {filtered.map((path, i) => {
                const isSelected = i === safeSelected
                return (
                  <div
                    key={path}
                    onClick={() => pick(path)}
                    onMouseEnter={() => setSelected(i)}
                    style={{
                      padding: '8px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      background: isSelected ? 'var(--color-surface)' : 'transparent',
                      
                      
                      borderLeft: isSelected
                        ? '2px solid var(--color-accent)'
                        : '2px solid transparent',
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'var(--color-text)' }}>
                      {basename(path)}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {path.replace(/\\/g, '/')}
                    </span>
                  </div>
                )
              })}

              {filtered.length === 0 && (
                <div style={{
                  padding: '24px 14px',
                  textAlign: 'center',
                  color: 'var(--color-text-disabled)',
                  fontSize: 13,
                }}>
                  No files match "{query}"
                </div>
              )}
            </div>

            {}
            {filtered.length > 0 && (
              <div style={{
                padding: '6px 14px',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                gap: 12,
                fontSize: 11,
                color: 'var(--color-text-disabled)',
              }}>
                <span><kbd>↑↓</kbd> navigate</span>
                <span><kbd>↵</kbd> open</span>
                <span><kbd>esc</kbd> close</span>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
