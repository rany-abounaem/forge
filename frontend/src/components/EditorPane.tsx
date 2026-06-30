import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import MonacoEditor, { type OnMount } from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'
import { X } from 'lucide-react'
import { useStore } from '../store'

const { addToast } = useStore.getState()

const EXT_TO_LANG: Record<string, string> = {
  '.go':    'go',
  '.ts':    'typescript',
  '.tsx':   'typescript',
  '.js':    'javascript',
  '.jsx':   'javascript',
  '.py':    'python',
  '.rs':    'rust',
  '.json':  'json',
  '.md':    'markdown',
  '.css':   'css',
  '.html':  'html',
  '.yaml':  'yaml',
  '.yml':   'yaml',
  '.sh':    'shell',
  '.bash':  'shell',
  '.sql':   'sql',
}

function getLanguage(filePath: string | null): string {
  if (!filePath) return 'plaintext'
  
  const dot = filePath.lastIndexOf('.')
  if (dot === -1) return 'plaintext'
  const ext = filePath.slice(dot).toLowerCase()
  return EXT_TO_LANG[ext] ?? 'plaintext'
}

interface FileData {
  saved:   string
  current: string
}

interface TabBarProps {
  openFiles:  string[]
  activeFile: string | null
  fileData:   Record<string, FileData>
  onSelect:   (path: string) => void
  onClose:    (path: string) => void
}

function TabBar({ openFiles, activeFile, fileData, onSelect, onClose }: TabBarProps) {
  return (
    <div
      style={{
        height: 36,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'stretch',
        overflowX: 'auto',
        flexShrink: 0,
      }}
    >
      {openFiles.map((path) => {
        const isActive = path === activeFile
        const data = fileData[path]
        const isDirty = data ? data.current !== data.saved : false

        
        const name = path.replace(/\\/g, '/').split('/').pop() ?? path

        return (
          <div
            key={path}
            onClick={() => onSelect(path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 12px',
              cursor: 'pointer',
              fontSize: 13,
              whiteSpace: 'nowrap',
              borderRight: '1px solid var(--color-border)',
              
              borderBottom: isActive
                ? '2px solid var(--color-accent)'
                : '2px solid transparent',
              background: isActive ? 'var(--color-bg)' : 'transparent',
              color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
              position: 'relative',
              top: 1, 
            }}
          >
            {}
            {isDirty && (
              <span style={{ color: 'var(--color-accent)', fontSize: 16, lineHeight: 1 }}>
                •
              </span>
            )}
            <span>{name}</span>
            <button
              onClick={(e) => {
                
                e.stopPropagation()
                onClose(path)
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 2,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                color: 'var(--color-text-disabled)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-disabled)')}
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function EditorPane() {
  const openFiles   = useStore((s) => s.openFiles)
  const activeFile  = useStore((s) => s.activeFile)
  const closeFile   = useStore((s) => s.closeFile)
  const setActive   = useStore((s) => s.setActiveFile)

  
  
  const [fileData, setFileData] = useState<Record<string, FileData>>({})

  
  
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)

  
  
  const language = useMemo(() => getLanguage(activeFile), [activeFile])

  
  useEffect(() => {
    if (!activeFile || fileData[activeFile]) return

    fetch(`/api/files/read?path=${encodeURIComponent(activeFile)}`)
      .then((r) => r.json())
      .then((data: { content: string }) => {
        
        
        
        setFileData((prev) => ({
          ...prev,
          [activeFile]: { saved: data.content, current: data.content },
        }))
      })
  }, [activeFile, fileData])

  
  
  
  
  const save = useCallback(async () => {
    if (!activeFile) return
    const current = fileData[activeFile]?.current
    if (current === undefined) return

    const res = await fetch('/api/files/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: activeFile, content: current }),
    })

    if (!res.ok) {
      
      
      addToast(`Failed to save ${activeFile.split('/').pop()}`, 'error')
      return
    }

    
    setFileData((prev) => ({
      ...prev,
      [activeFile]: { saved: current, current },
    }))
  }, [activeFile, fileData])

  
  useEffect(() => {
    if (!editorRef.current) return
    
    
    
    
  }, [save])

  
  
  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      () => save()
    )

    
    
    monaco.editor.defineTheme('forge', {
      base: 'vs-dark',   
      inherit: true,
      rules: [],
      colors: {
        'editor.background':          '#0A0A0F',
        'editor.lineHighlightBackground': '#111118',
        'editorLineNumber.foreground': '#475569',
        'editorCursor.foreground':    '#A78BFA',
        'editor.selectionBackground': '#7C3AED44',
      },
    })
    monaco.editor.setTheme('forge')
  }

  const currentContent = activeFile ? (fileData[activeFile]?.current ?? '') : ''

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <TabBar
        openFiles={openFiles}
        activeFile={activeFile}
        fileData={fileData}
        onSelect={setActive}
        onClose={closeFile}
      />

      {activeFile ? (
        <div className="flex-1">
          <MonacoEditor
            
            
            
            key={activeFile}
            value={currentContent}
            language={language}
            onMount={onMount}
            onChange={(value) => {
              if (!activeFile) return
              setFileData((prev) => ({
                ...prev,
                [activeFile]: {
                  saved: prev[activeFile]?.saved ?? '',
                  current: value ?? '',
                },
              }))
            }}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true,
              minimap:            { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers:        'on',
              renderLineHighlight: 'line',
              padding:            { top: 8 },
              smoothScrolling:    true,
              cursorBlinking:     'smooth',
              cursorSmoothCaretAnimation: 'on',
            }}
            height="100%"
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span style={{ color: 'var(--color-text-disabled)' }}>No file open</span>
        </div>
      )}
    </div>
  )
}
