// src/components/Navbar.jsx
import { useLocation } from 'react-router-dom'
const LABELS = { '/dashboard': 'DASHBOARD_V4.0', '/analysis': 'SCAN_ANALYZE_V4.0' }

export default function Navbar() {
  const { pathname } = useLocation()
  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-6 h-16 w-full
      bg-slate-950/70 backdrop-blur-xl border-b border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
      <div className="flex items-center gap-4">
        <span className="text-xl font-black text-primary-container text-glow font-['Space_Grotesk'] tracking-wider uppercase">
          WIFI THREAT ANALYZER
        </span>
        <div className="h-4 w-px bg-white/20" />
        <span className="font-['Space_Grotesk'] tracking-wider uppercase text-sm text-primary-container">
          {LABELS[pathname] || ''}
        </span>
      </div>
      <div className="flex items-center gap-4 text-slate-500">
        {['notifications','security','account_circle'].map(ic => (
          <span key={ic} className="material-symbols-outlined hover:text-primary-container transition cursor-pointer">{ic}</span>
        ))}
      </div>
    </header>
  )
}
