// src/pages/Analysis.jsx
// Real WiFi scanner page.
// Click INITIATE REAL SCAN → backend calls OS wifi scanner → shows real networks.
// Click any network → backend calculates threat score → shows full analysis.

import { useState } from 'react'
import { scanNetworks, analyzeNetwork } from '../services/api.js'
import Sidebar from '../components/Sidebar.jsx'
import Navbar  from '../components/Navbar.jsx'

// ── Reusable micro-components ─────────────────────────────────────────────────

function ThreatBadge({ level }) {
  const map = {
    CRITICAL: 'bg-error-container text-on-error-container',
    HIGH:     'bg-[#003b66] text-tertiary',
    MEDIUM:   'bg-[#004145] text-primary-container',
    LOW:      'border border-white/20 text-white/60',
    SAFE:     'bg-secondary-container/30 text-secondary',
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 tracking-widest font-bold font-['Space_Grotesk'] whitespace-nowrap ${map[level] || map.LOW}`}>
      {level}
    </span>
  )
}

function SignalBars({ pct }) {
  const filled = Math.ceil(((pct || 0) / 100) * 4)
  return (
    <div className="flex items-end gap-0.5">
      {[0,1,2,3].map(i => (
        <div key={i} style={{ height: 6 + i * 4 }}
          className={`w-1 ${i < filled ? 'bg-primary-container' : 'bg-white/15'}`} />
      ))}
    </div>
  )
}

function ScoreMeter({ score }) {
  const color  = score >= 76 ? '#ff716c' : score >= 51 ? '#69b2ff' : score >= 26 ? '#00f1fe' : '#00e0fe'
  const label  = score >= 76 ? 'CRITICAL' : score >= 51 ? 'HIGH' : score >= 26 ? 'MEDIUM' : 'SAFE'
  return (
    <div className="text-center">
      <div className="text-6xl font-black font-['Space_Grotesk'] leading-none mb-2"
        style={{ color, filter: `drop-shadow(0 0 12px ${color}80)` }}>
        {score}
      </div>
      <div className="text-xs text-on-surface-variant mb-3 font-['Space_Grotesk'] tracking-widest">THREAT SCORE / 100</div>
      <div className="w-full h-2 bg-white/10 overflow-hidden mb-3">
        <div className="h-full transition-all duration-700"
          style={{ width:`${score}%`, background: color, boxShadow:`0 0 8px ${color}` }} />
      </div>
      <div className="inline-block px-4 py-1 text-sm font-bold font-['Space_Grotesk'] tracking-widest"
        style={{ background:`${color}20`, border:`1px solid ${color}50`, color }}>
        {label}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Analysis() {
  const [networks,  setNetworks]  = useState([])
  const [scanning,  setScanning]  = useState(false)
  const [scanPct,   setScanPct]   = useState(0)
  const [scanError, setScanError] = useState('')
  const [selected,  setSelected]  = useState(null)
  const [analysis,  setAnalysis]  = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  // ── Real WiFi scan ──────────────────────────────────────────────────────────
  async function handleScan() {
    setScanning(true); setScanPct(0); setScanError(''); setNetworks([]); setSelected(null); setAnalysis(null)

    let p = 0
    const tick = setInterval(() => {
      p += Math.random() * 5 + 2
      if (p >= 90) clearInterval(tick)
      setScanPct(Math.min(Math.floor(p), 90))
    }, 200)

    try {
      const res = await scanNetworks()     // JWT auto-attached by axios interceptor
      clearInterval(tick); setScanPct(100)
      setNetworks(res.data.networks || [])
    } catch (err) {
      clearInterval(tick)
      setScanError(
        err.response?.data?.error ||
        'Scan failed. Check: 1) Backend running (python app.py), 2) WiFi ON, 3) Run terminal as Admin (Windows)'
      )
    } finally {
      setTimeout(() => setScanning(false), 400)
    }
  }

  // ── Analyze one network ─────────────────────────────────────────────────────
  async function handleSelectNetwork(net) {
    setSelected(net); setAnalysis(null); setAnalyzing(true)
    try {
      const res = await analyzeNetwork(net.ssid, net.encryption, net.signal, net.hidden)
      setAnalysis(res.data)
    } catch (err) {
      setAnalysis({ error: err.response?.data?.error || 'Analysis failed' })
    } finally {
      setAnalyzing(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-on-surface overflow-x-hidden">
      <div className="fixed inset-0 grid-bg z-0 pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-20 overflow-hidden"><div className="scan-line" /></div>

      <Sidebar />

      <div className="ml-64 relative z-10">
        <Navbar />
        <main className="p-8">

          {/* Page heading */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-primary-container" />
              <span className="text-[11px] text-primary-container uppercase tracking-widest font-['Space_Grotesk']">SYSTEM / SCAN & ANALYZE</span>
            </div>
            <h1 className="font-['Space_Grotesk'] text-5xl font-bold text-primary uppercase leading-tight">Real-Time Scanner</h1>
            <p className="text-on-surface-variant mt-2 text-sm">Scans real WiFi networks using your WiFi adapter. Click any network for full AI threat analysis.</p>
          </div>

          {/* Top row: scanner + analysis panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Scanner */}
            <div className="glass-panel p-6">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-['Space_Grotesk'] mb-4">LIVE WIFI SCANNER</p>

              {/* Radar */}
              <div className="relative h-44 bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden mb-4">
                {[1,2,3].map(r => (
                  <div key={r}
                    className={`absolute rounded-full border border-primary-container/20 ${scanning ? 'radarring' : ''}`}
                    style={{ width: r*70, height: r*70, animationDelay:`${r*0.4}s` }} />
                ))}
                <div className="z-10 text-center">
                  <span className={`font-['Space_Grotesk'] text-xs tracking-[0.3em] block ${scanning ? 'text-primary-container animate-pulse' : 'text-on-surface-variant'}`}>
                    {scanning
                      ? `SCANNING... ${scanPct}%`
                      : networks.length > 0
                        ? `${networks.length} NETWORKS FOUND — CLICK ANY TO ANALYZE`
                        : 'READY TO SCAN'}
                  </span>
                </div>
              </div>

              {scanning && (
                <div className="h-0.5 bg-white/10 mb-4 overflow-hidden">
                  <div className="h-full bg-primary-container shadow-[0_0_10px_#00f1fe] transition-all" style={{ width:`${scanPct}%` }} />
                </div>
              )}

              {scanError && (
                <div className="mb-4 px-3 py-3 bg-error-container/20 border border-error/40 text-error text-xs font-['Space_Grotesk'] leading-relaxed">
                  ⚠ {scanError}
                </div>
              )}

              <button onClick={handleScan} disabled={scanning}
                className={`w-full py-3 font-['Space_Grotesk'] text-xs tracking-widest uppercase font-bold transition-all
                  ${scanning
                    ? 'border border-primary-container text-primary-container cursor-not-allowed'
                    : 'bg-primary-container text-black hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] active:scale-95'}`}>
                {scanning ? 'SCANNING REAL NETWORKS...' : networks.length > 0 ? '↻ SCAN AGAIN' : 'INITIATE REAL SCAN'}
              </button>
              <p className="text-[10px] text-on-surface-variant mt-2 text-center font-['Space_Grotesk']">
                Uses your OS WiFi adapter — no extra hardware needed
              </p>
            </div>

            {/* Analysis panel */}
            <div className="glass-panel p-6">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-['Space_Grotesk'] mb-4">AI THREAT ANALYSIS</p>

              {!selected && !analyzing && (
                <div className="h-64 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
                  <span className="material-symbols-outlined opacity-20" style={{fontSize:64}}>radar</span>
                  <p className="text-xs font-['Space_Grotesk'] tracking-widest text-center opacity-60">
                    SCAN NETWORKS FIRST<br />THEN CLICK ANY ROW
                  </p>
                </div>
              )}

              {analyzing && (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-2 border-white/20 border-t-primary-container rounded-full spinner" />
                  <p className="text-xs text-primary-container font-['Space_Grotesk'] tracking-widest animate-pulse">
                    ANALYZING "{selected?.ssid}"...
                  </p>
                </div>
              )}

              {analysis && !analyzing && (
                <div className="space-y-5">
                  {analysis.error ? (
                    <p className="text-error text-sm">{analysis.error}</p>
                  ) : (
                    <>
                      {/* Network info */}
                      <div className="pb-4 border-b border-white/10">
                        <p className="text-[10px] text-on-surface-variant font-['Space_Grotesk'] tracking-widest mb-1">TARGET NETWORK</p>
                        <div className="font-['Space_Grotesk'] text-xl font-bold text-primary truncate">{analysis.ssid}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">
                          {analysis.encryption} · {selected?.band} · CH {selected?.channel} · {selected?.signal}dBm
                        </div>
                      </div>

                      {/* Score */}
                      <ScoreMeter score={analysis.risk} />

                      {/* Reasons */}
                      <div>
                        <p className="text-[10px] text-on-surface-variant font-['Space_Grotesk'] tracking-widest mb-2">WHY THIS SCORE</p>
                        <div className="space-y-1.5">
                          {analysis.reasons?.map((r,i) => (
                            <div key={i} className="flex gap-2 text-xs text-on-surface leading-relaxed">
                              <span className="text-error flex-shrink-0 mt-0.5">▸</span>{r}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div>
                        <p className="text-[10px] text-on-surface-variant font-['Space_Grotesk'] tracking-widest mb-2">RECOMMENDATIONS</p>
                        <div className="space-y-1.5">
                          {analysis.recommendations?.map((r,i) => (
                            <div key={i} className="flex gap-2 text-xs text-secondary leading-relaxed">
                              <span className="flex-shrink-0">✓</span>{r}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Network list */}
          {networks.length > 0 && (
            <div className="glass-panel p-6">
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-['Space_Grotesk'] mb-4">
                NEARBY NETWORKS — LIVE ({networks.length} found) · Click any row to analyze
              </p>

              {/* Header row */}
              <div className="hidden lg:grid gap-4 px-4 py-2 text-[10px] text-on-surface-variant font-['Space_Grotesk'] tracking-widest border-b border-white/10 mb-1"
                style={{ gridTemplateColumns:'1fr 90px 60px 70px 80px 100px' }}>
                <span>NETWORK NAME</span><span>ENCRYPTION</span><span>CH</span><span>BAND</span><span>SIGNAL</span><span>THREAT</span>
              </div>

              <div className="space-y-0.5 max-h-[420px] overflow-y-auto pr-1">
                {networks.map(net => (
                  <div key={net.id} onClick={() => handleSelectNetwork(net)}
                    className={`grid gap-4 px-4 py-3 border cursor-pointer transition-all items-center
                      ${selected?.id === net.id
                        ? 'bg-primary-container/10 border-primary-container/40'
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/5'}`}
                    style={{ gridTemplateColumns:'1fr 90px 60px 70px 80px 100px' }}>

                    {/* Name + MAC */}
                    <div>
                      <div className={`font-['Space_Grotesk'] text-sm font-medium ${net.status === 'CRITICAL' ? 'text-error' : 'text-on-surface'}`}>
                        {net.hidden ? '[ HIDDEN NETWORK ]' : net.ssid}
                      </div>
                      <div className="text-[10px] text-on-surface-variant mt-0.5 font-mono">{net.mac}</div>
                    </div>

                    {/* Encryption */}
                    <span className={`text-xs font-bold font-['Space_Grotesk']
                      ${net.encryption === 'OPEN' ? 'text-error' :
                        net.encryption === 'WEP'  ? 'text-tertiary' :
                        net.encryption === 'WPA3' ? 'text-secondary' : 'text-primary-container'}`}>
                      {net.encryption}
                    </span>

                    {/* Channel */}
                    <span className="text-xs text-on-surface-variant font-mono">{net.channel}</span>

                    {/* Band */}
                    <span className="text-xs text-on-surface-variant font-['Space_Grotesk']">{net.band}</span>

                    {/* Signal */}
                    <div className="flex items-center gap-2">
                      <SignalBars pct={net.signal_pct} />
                      <span className="text-[10px] text-on-surface-variant font-mono hidden xl:block">{net.signal}dBm</span>
                    </div>

                    {/* Threat score + badge */}
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-lg font-black font-['Space_Grotesk']
                        ${net.threat >= 76 ? 'text-error' :
                          net.threat >= 51 ? 'text-tertiary' :
                          net.threat >= 26 ? 'text-primary-container' : 'text-secondary'}`}>
                        {net.threat}%
                      </span>
                      <ThreatBadge level={net.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>

        <footer className="mx-8 mb-6 pt-6 border-t border-white/5 flex justify-between text-[10px] font-['Space_Grotesk'] text-slate-600 uppercase tracking-widest">
          <span>KERNEL: 5.15.0-76-GENERIC · BUILD: ALPHA_449</span>
          <span>SYSTEM_TIME: {new Date().toLocaleTimeString()} UTC</span>
        </footer>
      </div>
    </div>
  )
}
