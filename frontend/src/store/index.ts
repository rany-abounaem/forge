import { create } from 'zustand'
import type { TreeNode } from '../types'

export interface Toast {
  id:      string
  message: string
  type:    'error' | 'info' | 'success'
}

interface AppState {
  
  tree:      TreeNode | null
  setTree:   (tree: TreeNode) => void
  patchTree: (parentPath: string, updater: (children: TreeNode[]) => TreeNode[]) => void

  
  expandedDirs: Set<string>
  toggleDir:    (path: string) => void

  
  openFiles:     string[]
  activeFile:    string | null
  openFile:      (path: string) => void
  closeFile:     (path: string) => void
  setActiveFile: (path: string) => void

  
  
  sidebarCollapsed:    boolean
  toggleSidebar:       () => void
  setSidebarCollapsed: (v: boolean) => void

  
  
  
  toasts:      Toast[]
  addToast:    (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void

  
  paletteOpen:  boolean
  openPalette:  () => void
  closePalette: () => void

  
  
  
  
  newTerminalSignal:  number
  requestNewTerminal: () => void
}

export const useStore = create<AppState>((set, get) => ({
  
  tree: null,
  expandedDirs: new Set(),

  setTree: (tree) => set({ tree }),

  patchTree: (parentPath, updater) => {
    const { tree } = get()
    if (!tree) return

    function patch(node: TreeNode): TreeNode {
      if (node.path === parentPath) {
        return { ...node, children: updater(node.children ?? []) }
      }
      if (!node.children) return node
      return { ...node, children: node.children.map(patch) }
    }

    set({ tree: patch(tree) })
  },

  toggleDir: (path) =>
    set((state) => {
      const next = new Set(state.expandedDirs)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return { expandedDirs: next }
    }),

  
  openFiles:  [],
  activeFile: null,

  openFile: (path) =>
    set((state) => ({
      openFiles: state.openFiles.includes(path)
        ? state.openFiles
        : [...state.openFiles, path],
      activeFile: path,
    })),

  closeFile: (path) =>
    set((state) => {
      const remaining = state.openFiles.filter((f) => f !== path)
      return {
        openFiles: remaining,
        activeFile:
          state.activeFile === path
            ? (remaining[remaining.length - 1] ?? null)
            : state.activeFile,
      }
    }),

  setActiveFile: (path) => set({ activeFile: path }),

  
  sidebarCollapsed: false,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  
  toasts: [],

  addToast: (message, type = 'info') =>
    set((state) => ({
      
      
      toasts: [...state.toasts, { id: crypto.randomUUID(), message, type }],
    })),

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  
  paletteOpen: false,
  openPalette:  () => set({ paletteOpen: true }),
  closePalette: () => set({ paletteOpen: false }),

  
  newTerminalSignal:  0,
  requestNewTerminal: () => set((s) => ({ newTerminalSignal: s.newTerminalSignal + 1 })),
}))
