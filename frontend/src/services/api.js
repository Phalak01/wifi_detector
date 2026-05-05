// src/services/api.js
// Single place for all backend calls.
// Uses axios — auto-attaches JWT token from localStorage to every request.

import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:5000' })

// Attach token automatically to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('wta_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// ── Auth ────────────────────────────────────────────────────────────────────
export const registerUser = (name, email, password) =>
  api.post('/auth/register', { name, email, password })

export const loginUser = (email, password) =>
  api.post('/auth/login', { email, password })

export const getMe = () => api.get('/auth/me')

// ── WiFi ────────────────────────────────────────────────────────────────────
export const scanNetworks   = ()                              => api.get('/wifi/scan')
export const analyzeNetwork = (ssid, enc, signal, hidden)    => api.post('/wifi/analyze', { ssid, encryption: enc, signal, hidden })
export const getScanHistory = ()                              => api.get('/wifi/history')

export default api
