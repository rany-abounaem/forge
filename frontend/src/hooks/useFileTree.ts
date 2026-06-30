import { useEffect } from 'react'
import { useStore } from '../store'
import type { DirEntry, TreeNode, WatchEvent } from '../types'

function dirname(p: string) {
  const parts = p.replace(/\\/g, '/').split('/')
  return parts.slice(0, -1).join('/') || '/'
}
function basename(p: string) {
  return p.replace(/\\/g, '/').split('/').pop() ?? p
}

async function fetchChildren(dirPath: string): Promise<TreeNode[]> {
  const res = await fetch(`/api/files?path=${encodeURIComponent(dirPath)}`)
  if (!res.ok) return []
  const entries: DirEntry[] = await res.json()
  
  
  return entries.map((e) => ({ ...e, children: e.isDir ? undefined : undefined }))
}

export function useFileTree(root: string) {
  const setTree = useStore((s) => s.setTree)
  const patchTree = useStore((s) => s.patchTree)

  
  
  
  useEffect(() => {
    fetchChildren(root).then((children) => {
      
      setTree({ name: root, path: root, isDir: true, children })
    })
  }, [root, setTree])

  
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws/filetree`)

    ws.onmessage = (event) => {
      const msg: WatchEvent = JSON.parse(event.data)
      
      const parentPath = dirname(msg.path)
      const fileName = basename(msg.path)

      if (msg.op === 'create') {
        patchTree(parentPath, (children) => {
          
          if (children.some((c) => c.path === msg.path)) return children
          const newNode: TreeNode = { name: fileName, path: msg.path, isDir: false }
          
          return [...children, newNode].sort((a, b) => {
            if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
            return a.name.localeCompare(b.name)
          })
        })
      }

      if (msg.op === 'delete' || msg.op === 'rename') {
        patchTree(parentPath, (children) =>
          children.filter((c) => c.path !== msg.path)
        )
      }
      
    }

    
    
    return () => ws.close()
  }, [patchTree])
}

export { fetchChildren }
