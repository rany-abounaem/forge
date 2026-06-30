

export interface DirEntry {
  name: string
  path: string
  isDir: boolean
}

export interface TreeNode extends DirEntry {
  children?: TreeNode[]
}

export interface WatchEvent {
  op: 'create' | 'write' | 'delete' | 'rename'
  path: string
}
