// src/pages/Login.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { loginUser } from '../services/api.js'

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const { login } = useAuth()
  const navigate  = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('All fields are required'); return }
    setLoading(true)
    try {
      const res = await loginUser(email, password)
      login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed — is the backend running on port 5000?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col
      items-center justify-center px-8 relative overflow-hidden">
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
          <h2 className="font-['Space_Grotesk'] text-2xl font-semibold text-on-surface mb-1">Secure Access</h2>
          <p className="text-[11px] text-on-surface-variant uppercase tracking-widest font-['Space_Grotesk']">Authenticate Identity Protocol</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1 group">
            <label className="text-[11px] text-on-surface-variant uppercase tracking-widest font-['Space_Grotesk']">Email Address</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-0 bottom-3 text-outline text-lg group-focus-within:text-primary-container transition-colors">alternate_email</span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="OPERATOR@CYBER.SEC"
                className="w-full bg-transparent border-0 border-b border-outline/50 pl-8 pb-2 text-on-surface font-['Space_Grotesk'] text-sm focus:border-primary-container placeholder:text-outline/40 uppercase tracking-widest outline-none transition-all" />
            </div>
          </div>

          <div className="space-y-1 group">
            <label className="text-[11px] text-on-surface-variant uppercase tracking-widest font-['Space_Grotesk']">Security Key</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-0 bottom-3 text-outline text-lg group-focus-within:text-primary-container transition-colors">lock</span>
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••"
                className="w-full bg-transparent border-0 border-b border-outline/50 pl-8 pr-8 pb-2 text-on-surface font-['Space_Grotesk'] text-sm focus:border-primary-container placeholder:text-outline/40 outline-none transition-all" />
              <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-0 bottom-3 text-outline hover:text-primary-container transition-colors">
                <span className="material-symbols-outlined text-lg">{showPass ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="px-3 py-2 bg-error-container/20 border border-error/40 text-error text-xs tracking-widest font-['Space_Grotesk']">⚠ {error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 bg-primary-container text-on-primary-container font-['Space_Grotesk'] text-xs font-bold tracking-widest uppercase hover:shadow-[0_0_20px_rgba(0,241,254,0.6)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-on-surface-variant font-['Space_Grotesk']">
            No account?{' '}
            <Link to="/signup" className="text-secondary-dim hover:text-primary-container transition-colors font-bold ml-1 uppercase">Register</Link>
          </p>
        </div>
        <div className="mt-6 pt-4 border-t border-white/5 flex justify-between font-mono text-[9px] text-white/20">
          <span>BUILD: ALPHA_449</span><span>ENC: AES-256 / JWT</span>
        </div>
      </div>
    </div>
  )
}
