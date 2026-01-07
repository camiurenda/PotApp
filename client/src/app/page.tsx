'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Wallet } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión')
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (userNum: 1 | 2) => {
    const emails = ['camila@parejafinance.app', 'lucia@parejafinance.app']
    const passwords = ['camila123', 'lucia123']
    
    setEmail(emails[userNum - 1])
    setPassword(passwords[userNum - 1])
    
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: emails[userNum - 1], 
          password: passwords[userNum - 1]
        }),
      })

      if (res.ok) {
        router.push('/dashboard')
      } else {
        setError('Usuarios no creados. Haz clic en "Crear Usuarios" primero.')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const seedUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      
      if (res.ok) {
        setError('')
        alert('Usuarios creados! Ahora puedes iniciar sesión.')
      } else {
        setError(data.error || 'Error al crear usuarios')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
            <Wallet className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ParejaFinance</h1>
          <p className="text-gray-500 mt-2 flex items-center justify-center gap-1">
            Gestión financiera con equidad <Heart className="w-4 h-4 text-red-400" />
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center mb-4">Acceso rápido</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => quickLogin(1)}
                disabled={loading}
                className="btn-secondary text-sm"
              >
                Camila
              </button>
              <button
                onClick={() => quickLogin(2)}
                disabled={loading}
                className="btn-secondary text-sm"
              >
                Lucía
              </button>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={seedUsers}
              disabled={loading}
              className="w-full text-sm text-primary-600 hover:text-primary-700 py-2"
            >
              Crear Usuarios (primera vez)
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Sistema de equidad proporcional basado en neto disponible
        </p>
      </div>
    </div>
  )
}
