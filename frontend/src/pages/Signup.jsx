// src/pages/Signup.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { registerUser, loginUser } from '../services/api.js'

export default function Signup() {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPass, setShowPass] = useState(false)
  const [agreed,   setAgreed]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const { login } = useAuth()
  const navigate  = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name || !email || !password || !confirm) { setError('All fields are required'); return }
    if (password !== confirm)  { setError('Passwords do not match'); return }
    if (password.length < 6)   { setError('Password must be at least 6 characters'); return }
    if (!agreed)               { setError('You must accept the Neural Core Protocols'); return }
    setLoading(true)
    try {
      await registerUser(name, email, password)
      const res = await loginUser(email, password)
      login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed — is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center px-8 py-12 relative overflow-hidden">
      <div className="fixed inset-0 grid-bg z-0 pointer-events-none" />
      <div className="fixed -top-20 -left-20 w-96 h-96 bg-primary-container/10 blur-[120px] rounded-full z-0" />
      <div className="fixed -bottom-20 -right-20 w-96 h-96 bg-tertiary-container/10 blur-[120px] rounded-full z-0" />
      <div className="fixed left-6 top-1/2 -translate-y-1/2 h-48 w-px bg-gradient-to-b from-transparent via-primary-container/40 to-transparent" />
      <div className="fixed right-6 top-1/2 -translate-y-1/2 h-48 w-px bg-gradient-to-b from-transparent via-primary-container/40 to-transparent" />

      <div className="relative z-10 mb-8 text-center">
        <h1 className="font-['Space_Grotesk'] text-3xl font-black text-primary-container tracking-[0.2em] uppercase text-glow">
          WIFI THREAT ANALYZER
        </h1>
        <div className="mt-1 h-px w-32 bg-gradient-to-r from-transparent via-primary-container to-transparent mx-auto" />
      </div>

      <div className="relative z-10 w-full max-w-md glass-panel p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="mb-8">
          <h2 className="font-['Space_Grotesk'] text-2xl font-semibold text-on-surface mb-1">Create Secure Account</h2>
          <p className="text-[11px] text-on-surface-variant uppercase tracking-widest font-['Space_Grotesk']">Initialize Identity Verification Protocol</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { label:'Full Name',      icon:'person',          val:name,     set:setName,     type:'text',                          ph:'OPERATOR NAME',    upper:true },
            { label:'Email Address',  icon:'alternate_email', val:email,    set:setEmail,    type:'email',                         ph:'MAIL@CYBER.SEC',   upper:true },
            { label:'Security Key',   icon:'lock',            val:password, set:setPassword, type:showPass?'text':'password',      ph:'••••••••••••',     upper:false, toggle:true },
            { label:'Confirm Key',    icon:'verified_user',   val:confirm,  set:setConfirm,  type:'password',                      ph:'••••••••••••',     upper:false },
          ].map(f => (
            <div key={f.label} className="space-y-1 group">
              <label className="text-[11px] text-on-surface-variant uppercase tracking-widest font-['Space_Grotesk']">{f.label}</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-0 bottom-3 text-outline text-lg group-focus-within:text-primary-container transition-colors">{f.icon}</span>
                <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                  className={`w-full bg-transparent border-0 border-b border-outline/50 pl-8 pb-2 pr-8 text-on-surface font-['Space_Grotesk'] text-sm focus:border-primary-container placeholder:text-outline/40 outline-none transition-all ${f.upper ? 'uppercase tracking-widest' : ''}`} />
                {f.toggle && (
                  <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-0 bottom-3 text-outline hover:text-primary-container transition-colors">
                    <span className="material-symbols-outlined text-lg">{showPass ? 'visibility_off' : 'visibility'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="flex items-start gap-3 py-1">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 bg-surface-container border-outline-variant text-primary-container focus:ring-primary-container cursor-pointer" />
            <label className="text-xs text-on-surface-variant leading-relaxed font-['Space_Grotesk'] cursor-pointer" onClick={() => setAgreed(v => !v)}>
              I accept the <span className="text-primary-container">Neural Core Protocols</span> and Data Privacy Regulations.
            </label>
          </div>

          {error && (
            <div className="px-3 py-2 bg-error-container/20 border border-error/40 text-error text-xs tracking-widest font-['Space_Grotesk']">⚠ {error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 bg-primary-container text-on-primary-container font-['Space_Grotesk'] text-xs font-bold tracking-widest uppercase hover:shadow-[0_0_20px_rgba(0,241,254,0.6)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'CREATING ACCOUNT...' : 'CREATE SECURE ACCOUNT'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-on-surface-variant font-['Space_Grotesk']">
            Already registered?{' '}
            <Link to="/login" className="text-secondary-dim hover:text-primary-container transition-colors font-bold ml-1 uppercase">Login</Link>
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-8 flex justify-between w-full max-w-6xl text-[10px] font-['Space_Grotesk'] text-on-surface-variant/40 uppercase tracking-widest">
        <span>COORD: 34.0522° N, 118.2437° W</span>
        <span>© 2024 WIFI THREAT ANALYZER | SECURE CORE OPS</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#00ff41]" />UPLINK ACTIVE</span>
      </div>
    </div>
  )
}
