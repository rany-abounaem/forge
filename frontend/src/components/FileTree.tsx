import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, File, Folder, FolderOpen } from 'lucide-react'
import { useFileTree, fetchChildren } from '../hooks/useFileTree'
import { useStore } from '../store'
import type { TreeNode } from '../types'

const ROOT = '.'   

interface ContextMenuState {
  x: number
  y: number
  node: TreeNode
}

function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState | null>(null)

  const open = useCallback((e: React.MouseEvent, node: TreeNode) => {
    e.preventDefault()
    setMenu({ x: e.clientX, y: e.clientY, node })
  }, [])

  const close = useCallback(() => setMenu(null), [])

  
  useEffect(() => {
    if (!menu) return
    const handler = () => close()
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [menu, close])

  return { menu, open, close }
}

async function apiDelete(path: string) {
  await fetch(`/api/files?path=${encodeURIComponent(path)}`, { method: 'DELETE' })
}

async function apiRename(oldPath: string, newName: string) {
  const parts = oldPath.replace(/\\/g, '/').split('/')
  parts[parts.length - 1] = newName
  const newPath = parts.join('/')
  await fetch('/api/files/rename', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPath, newPath }),
  })
}

async function apiCreate(parentPath: string, name: string, isDir: boolean) {
  const sep = parentPath.endsWith('/') ? '' : '/'
  await fetch('/api/files/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: `${parentPath}${sep}${name}`, isDir }),
  })
}

function ContextMenuPanel({ menu, close }: { menu: ContextMenuState; close: () => void }) {
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(menu.node.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renaming) inputRef.current?.select()
  }, [renaming])

  const handleRename = async () => {
    if (newName && newName !== menu.node.name) {
      await apiRename(menu.node.path, newName)
    }
    setRenaming(false)
    close()
  }

  const items = [
    {
      label: 'Rename',
      onClick: (e: React.MouseEvent) => { e.stopPropagation(); setRenaming(true) },
    },
    {
      label: 'Delete',
      danger: true,
      onClick: async (e: React.MouseEvent) => {
        e.stopPropagation()
        await apiDelete(menu.node.path)
        close()
      },
    },
    ...(menu.node.isDir
      ? [
          {
            label: 'New file',
            onClick: async (e: React.MouseEvent) => {
              e.stopPropagation()
              const name = window.prompt('File name:')
              if (name) await apiCreate(menu.node.path, name, false)
              close()
            },
          },
          {
            label: 'New folder',
            onClick: async (e: React.MouseEvent) => {
              e.stopPropagation()
              const name = window.prompt('Folder name:')
              if (name) await apiCreate(menu.node.path, name, true)
              close()
            },
          },
        ]
      : []),
  ]

  return (
    
    
    
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.08 }}
      style={{
        position: 'fixed',
        top: menu.y,
        left: menu.x,
        transformOrigin: 'top left',
        background: 'var(--color-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 6,
        padding: '4px 0',
        zIndex: 1000,
        minWidth: 140,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {renaming ? (
        <div style={{ padding: '4px 8px' }}>
          <input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') close() }}
            onBlur={handleRename}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-accent)',
              borderRadius: 4,
              color: 'var(--color-text)',
              padding: '2px 6px',
              fontSize: 13,
              width: '100%',
              outline: 'none',
            }}
          />
        </div>
      ) : (
        items.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '5px 12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              color: item.danger ? 'var(--color-status-red)' : 'var(--color-text)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            {item.label}
          </button>
        ))
      )}
    </motion.div>
  )
}

function TreeRow({ node, depth }: { node: TreeNode; depth: number }) {
  const openFile = useStore((s) => s.openFile)
  const expandedDirs = useStore((s) => s.expandedDirs)
  const toggleDir = useStore((s) => s.toggleDir)
  const patchTree = useStore((s) => s.patchTree)
  const activeFile = useStore((s) => s.activeFile)
  const { menu, open: openMenu, close: closeMenu } = useContextMenu()

  const isExpanded = expandedDirs.has(node.path)
  const isActive = activeFile === node.path

  const handleClick = async () => {
    if (!node.isDir) {
      openFile(node.path)
      return
    }
    
    if (!isExpanded && node.children === undefined) {
      const children = await fetchChildren(node.path)
      
      patchTree(node.path, () => children)
    }
    toggleDir(node.path)
  }

  return (
    <>
      <div
        onClick={handleClick}
        onContextMenu={(e) => openMenu(e, node)}
        style={{
          
          paddingLeft: 12 + depth * 12,
          paddingRight: 8,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          cursor: 'pointer',
          fontSize: 13,
          color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
          background: isActive ? 'rgba(167,139,250,0.08)' : 'transparent',
          borderLeft: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = 'transparent'
        }}
      >
        {node.isDir && (
          
          
          <ChevronRight
            size={12}
            style={{
              color: 'var(--color-text-muted)',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 120ms ease',
              flexShrink: 0,
            }}
          />
        )}

        {node.isDir
          ? isExpanded
            ? <FolderOpen size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
            : <Folder size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          : <File size={14} style={{ color: 'var(--color-text-disabled)', flexShrink: 0 }} />
        }

        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>
      </div>

      {}
      {}
      <AnimatePresence initial={false}>
        {node.isDir && isExpanded && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {node.children.length === 0 && (
              <div style={{ paddingLeft: 12 + (depth + 1) * 12, fontSize: 12, color: 'var(--color-text-disabled)', height: 24, display: 'flex', alignItems: 'center' }}>
                empty
              </div>
            )}
            {}
            {node.children.map((child) => (
              <TreeRow key={child.path} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {menu && <ContextMenuPanel key="ctx" menu={menu} close={closeMenu} />}
      </AnimatePresence>
    </>
  )
}

export function FileTree() {
  
  
  useFileTree(ROOT)

  const tree = useStore((s) => s.tree)

  if (!tree) {
    return (
      <div style={{ padding: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      {}
      {(tree.children ?? []).map((node) => (
        <TreeRow key={node.path} node={node} depth={0} />
      ))}
    </div>
  )
}
