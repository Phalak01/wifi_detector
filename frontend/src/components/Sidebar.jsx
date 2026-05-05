// src/components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const NAV = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard'    },
  { to: '/analysis',  icon: 'wifi_find', label: 'Scan & Analyze'},
]

export default function Sidebar() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  return (
    <nav className="fixed left-0 top-0 h-full flex flex-col pt-20 pb-6 z-40 w-64
      border-r border-white/5 bg-[#141418]/80 backdrop-blur-2xl shadow-[10px_0_30px_rgba(0,0,0,0.5)]">

      {/* Brand chip */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10">
          <div className="w-8 h-8 bg-cyan-500/20 flex items-center justify-center border border-cyan-400/30">
            <span className="material-symbols-outlined text-primary-container" style={{fontSize:16}}>shield</span>
          </div>
          <div>
            <div className="text-primary-container font-bold text-[11px] font-['Space_Grotesk'] tracking-widest">CYBER_CORE_V1</div>
            <div className="text-[10px] text-secondary-container opacity-80 tracking-[0.2em]">STATUS: ONLINE</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex-1 flex flex-col gap-1 px-3">
        {NAV.map(link => (
          <NavLink key={link.to} to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 font-['Space_Grotesk'] font-medium text-xs uppercase tracking-widest transition-all duration-200
               ${isActive
                 ? 'bg-cyan-500/10 text-primary-container border-l-4 border-primary-container shadow-[inset_0_0_15px_rgba(0,242,255,0.1)]'
                 : 'text-slate-400 opacity-70 hover:bg-white/5 hover:text-white hover:opacity-100'}`}>
            <span className="material-symbols-outlined" style={{fontSize:20}}>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </div>

      {/* User info + logout */}
      <div className="px-6 mt-auto flex flex-col gap-4">
        {user && (
          <div className="p-3 bg-white/5 border border-white/10">
            <div className="text-primary-container text-[11px] font-bold font-['Space_Grotesk'] tracking-widest truncate">
              {user.name.toUpperCase()}
            </div>
            <div className="text-[10px] text-on-surface-variant truncate mt-0.5">{user.email}</div>
          </div>
        )}

        <button onClick={() => navigate('/analysis')}
          className="w-full py-3 bg-primary-container text-black font-['Space_Grotesk'] text-xs font-bold tracking-widest uppercase hover:shadow-[0_0_20px_rgba(0,242,255,0.3)] active:scale-95 transition-all">
          INITIATE SCAN
        </button>

        <div className="h-px bg-white/10" />

        <button onClick={() => { logout(); navigate('/login') }}
          className="flex items-center gap-3 text-xs uppercase tracking-widest text-error hover:opacity-80 transition font-['Space_Grotesk'] py-1 bg-transparent border-none cursor-pointer">
          <span className="material-symbols-outlined" style={{fontSize:16}}>logout</span>Logout
        </button>
      </div>
    </nav>
  )
}
