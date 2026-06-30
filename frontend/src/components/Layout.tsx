import { useEffect, useRef } from 'react'
import {
  Group,
  Panel,
  Separator,
  type PanelImperativeHandle,
} from 'react-resizable-panels'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { EditorPane } from './EditorPane'
import { TerminalPane } from './TerminalPane'
import { CommandPalette } from './CommandPalette'
import { Toaster } from './Toast'
import { useStore } from '../store'

export function Layout() {
  
  
  
  
  
  const sidebarRef = useRef<PanelImperativeHandle | null>(null)

  const sidebarCollapsed    = useStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useStore((s) => s.setSidebarCollapsed)
  const toggleSidebar       = useStore((s) => s.toggleSidebar)
  const openPalette         = useStore((s) => s.openPalette)
  const requestNewTerminal  = useStore((s) => s.requestNewTerminal)

  
  
  
  
  useEffect(() => {
    if (sidebarCollapsed) {
      sidebarRef.current?.collapse()
    } else {
      sidebarRef.current?.expand()
    }
  }, [sidebarCollapsed])

  
  
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey   

      if (mod && e.key === 'b') {
        e.preventDefault()   
        toggleSidebar()
      }
      if (mod && e.key === 'p') {
        e.preventDefault()   
        openPalette()
      }
      if (mod && e.key === '`') {
        e.preventDefault()
        requestNewTerminal()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleSidebar, openPalette, requestNewTerminal])

  return (
    <div className="flex flex-col h-full">
      <Topbar />

      <div className="flex-1 overflow-hidden">
        {}
        <Group orientation="horizontal" className="h-full">

          {}
          <Panel
            panelRef={sidebarRef}
            defaultSize={20}
            minSize={12}
            collapsible
            collapsedSize={0}
            onResize={() => {
              const collapsed = sidebarRef.current?.isCollapsed() ?? false
              setSidebarCollapsed(collapsed)
            }}
          >
            <Sidebar />
          </Panel>

          {}
          <Separator>
            <div style={{ width: 1, height: '100%', background: 'var(--color-border)' }} />
          </Separator>

          <Panel defaultSize={80}>
            <Group orientation="vertical" className="h-full">

              <Panel defaultSize={65} minSize={20}>
                <EditorPane />
              </Panel>

              <Separator>
                <div style={{ height: 1, width: '100%', background: 'var(--color-border)' }} />
              </Separator>

              <Panel defaultSize={35} minSize={10}>
                <TerminalPane />
              </Panel>

            </Group>
          </Panel>

        </Group>
      </div>

      {}
      <CommandPalette />
      <Toaster />
    </div>
  )
}
