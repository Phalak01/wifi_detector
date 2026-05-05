// src/context/AuthContext.jsx
// Global auth state — wrap app in <AuthProvider>, use useAuth() anywhere.

import { createContext, useContext, useState, useEffect } from 'react'
import { getMe } from '../services/api'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('wta_token')
    if (token) {
      getMe()
        .then(r  => setUser(r.data.user))
        .catch(() => { localStorage.removeItem('wta_token'); setUser(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  function login(token, userData) {
    localStorage.setItem('wta_token', token)
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('wta_token')
    setUser(null)
  }

  return (
    <Ctx.Provider value={{ user, loading, login, logout, isLoggedIn: !!user }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
