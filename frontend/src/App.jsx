// src/App.jsx  — routing with protected routes

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Login     from './pages/Login.jsx'
import Signup    from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Analysis  from './pages/Analysis.jsx'

function Protected({ children }) {
  const { isLoggedIn, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-white/20 border-t-primary-container rounded-full spinner" />
    </div>
  )
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/analysis"  element={<Protected><Analysis /></Protected>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
