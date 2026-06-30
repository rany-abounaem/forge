import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, AlertCircle, Info, CheckCircle } from 'lucide-react'
import { useStore, type Toast } from '../store'

const TYPE_COLOR: Record<Toast['type'], string> = {
  error:   'var(--color-status-red)',
  info:    'var(--color-accent)',
  success: 'var(--color-status-green)',
}

const TYPE_ICON: Record<Toast['type'], typeof Info> = {
  error:   AlertCircle,
  info:    Info,
  success: CheckCircle,
}

function ToastItem({ id, message, type }: Toast) {
  const removeToast = useStore((s) => s.removeToast)
  const color = TYPE_COLOR[type]
  const Icon  = TYPE_ICON[type]

  
  
  
  useEffect(() => {
    const t = setTimeout(() => removeToast(id), 3000)
    return () => clearTimeout(t)
  }, [id, removeToast])

  return (
    
    
    <motion.div
      layout                              
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        background: 'var(--color-elevated)',
        border: `1px solid ${color}44`,  
        borderLeft: `3px solid ${color}`,
        borderRadius: 6,
        minWidth: 240,
        maxWidth: 380,
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        color: 'var(--color-text)',
        fontSize: 13,
      }}
    >
      <Icon size={15} style={{ color, flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={() => removeToast(id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-disabled)', padding: 2,
          display: 'flex', flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-disabled)')}
      >
        <X size={13} />
      </button>
    </motion.div>
  )
}

export function Toaster() {
  const toasts = useStore((s) => s.toasts)

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        
        
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem {...t} />
          </div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}
