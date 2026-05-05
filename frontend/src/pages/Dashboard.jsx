// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getScanHistory } from '../services/api.js'
import Sidebar from '../components/Sidebar.jsx'
import Navbar  from '../components/Navbar.jsx'

function StatCard({ label, value, icon, colorCls }) {
  return (
    <div className={`glass-panel p-6 border-b-2 ${colorCls.split(' ')[1]}`}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-['Space_Grotesk']">{label}</span>
        <span className={`material-symbols-outlined ${colorCls.split(' ')[0]}`}>{icon}</span>
      </div>
      <div className={`text-4xl font-black leading-none drop-shadow-[0_0_8px_currentColor] ${colorCls.split(' ')[0]}`}>
        {value}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getScanHistory()
      .then(r  => setHistory(r.data.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [])

  const allNets   = history.flatMap(h => h.networks || [])
  const threats   = allNets.filter(n => n.status === 'CRITICAL' || n.status === 'HIGH').length
  const safe      = allNets.filter(n => n.status === 'SAFE').length

  return (
    <div className="min-h-screen bg-background text-on-surface overflow-x-hidden">
      <div className="fixed inset-0 grid-bg z-0 pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-20 overflow-hidden"><div className="scan-line" /></div>
      <Sidebar />
      <div className="ml-64 relative z-10">
        <Navbar />
        <main className="p-8">
          {/* Heading */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-primary-container" />
              <span className="text-[11px] text-primary-container uppercase tracking-widest font-['Space_Grotesk']">SYSTEM / DASHBOARD / LIVE_MONITOR</span>
            </div>
            <h1 className="font-['Space_Grotesk'] text-5xl font-bold text-primary uppercase leading-tight">
              Welcome back,<br />{user?.name}
            </h1>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard label="Scan Sessions"   value={history.length}  icon="radar"         colorCls="text-primary-container border-primary-container" />
            <StatCard label="Threats Found"   value={threats}         icon="dangerous"     colorCls="text-error border-error" />
            <StatCard label="Safe Networks"   value={safe}            icon="verified_user" colorCls="text-secondary border-secondary" />
            <StatCard label="Networks Seen"   value={allNets.length}  icon="wifi"          colorCls="text-tertiary border-tertiary" />
          </div>

          {/* Quick action */}
          <div className="glass-panel p-8 mb-8 flex items-center justify-between border-l-4 border-primary-container">
            <div>
              <h2 className="font-['Space_Grotesk'] text-2xl font-semibold text-on-surface mb-2">Start a Real-Time WiFi Scan</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed max-w-lg">
                Scan all real WiFi networks around you using your WiFi adapter. Get live threat scores, see encryption
                types, and identify suspicious or dangerous networks instantly.
              </p>
            </div>
            <button onClick={() => navigate('/analysis')}
              className="flex-shrink-0 ml-8 px-8 py-4 bg-primary-container text-black font-['Space_Grotesk'] text-xs font-bold tracking-widest uppercase hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] active:scale-95 transition-all">
              SCAN NOW →
            </button>
          </div>

          {/* Recent scan history */}
          <div className="glass-panel p-6">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-['Space_Grotesk'] mb-4">
              RECENT SCAN HISTORY ({history.length} sessions)
            </p>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-white/20 border-t-primary-container rounded-full spinner" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant text-sm font-['Space_Grotesk']">
                No scans yet — go to Scan &amp; Analyze to start your first real scan.
              </div>
            ) : (
              <div className="space-y-1">
                {[...history].reverse().map((h, i) => {
                  const crit = h.networks?.filter(n => n.status === 'CRITICAL').length || 0
                  const safe = h.networks?.filter(n => n.status === 'SAFE').length || 0
                  return (
                    <div key={i} onClick={() => navigate('/analysis')}
                      className="flex justify-between items-center px-4 py-3 bg-white/[0.02] border border-white/5 hover:bg-white/5 transition cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary-container" style={{fontSize:18}}>wifi_find</span>
                        <div>
                          <div className="text-sm text-on-surface font-['Space_Grotesk']">{h.count} networks detected</div>
                          <div className="text-[10px] text-on-surface-variant font-mono">{new Date(h.timestamp).toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {crit > 0 && <span className="text-[10px] bg-error-container text-on-error-container px-2 py-0.5 font-['Space_Grotesk'] font-bold">{crit} CRITICAL</span>}
                        {safe > 0 && <span className="text-[10px] bg-secondary-container/30 text-secondary px-2 py-0.5 font-['Space_Grotesk'] font-bold">{safe} SAFE</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>

        <footer className="mx-8 mb-6 pt-6 border-t border-white/5 flex justify-between text-[10px] font-['Space_Grotesk'] text-slate-600 uppercase tracking-widest">
          <span>KERNEL: 5.15.0-76-GENERIC · BUILD: ALPHA_449</span>
          <span>SYSTEM_TIME: {new Date().toLocaleTimeString()} UTC</span>
        </footer>
      </div>

      {/* FAB */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className="flex items-center gap-4 bg-slate-950/90 border border-cyan-500/30 p-2 pl-4 rounded-full backdrop-blur-md">
          <span className="text-[10px] font-bold text-primary-container tracking-widest font-['Space_Grotesk']">SYSTEM_OPTIMIZED</span>
          <button className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-black hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,242,255,0.5)]">
            <span className="material-symbols-outlined">bolt</span>
          </button>
        </div>
      </div>
    </div>
  )
}
