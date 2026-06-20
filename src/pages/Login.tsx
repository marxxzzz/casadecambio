import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Email ou senha incorretos.',
  'auth/user-not-found': 'Email ou senha incorretos.',
  'auth/wrong-password': 'Email ou senha incorretos.',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
  'auth/invalid-email': 'Email inválido.',
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setError(FIREBASE_ERRORS[code] ?? 'Erro ao acessar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <span className="text-3xl font-bold tracking-tight text-white uppercase">Exchange</span>
            <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
              Elite Exchange
            </span>
          </Link>
        </div>

        <div
          className="relative border border-white/[0.04] rounded-3xl p-8 sm:p-10"
          style={{
            background: 'rgba(255,255,255,0.015)',
            backdropFilter: 'blur(40px)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset',
          }}
        >
          <div className="mb-8">
            <h1 className="text-xl font-semibold tracking-tight text-white mb-1">Acesso à Plataforma</h1>
            <p className="text-slate-500 text-xs">Insira suas credenciais para continuar.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">E-mail</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden />
                <input
                  type="email"
                  placeholder="nome@empresa.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/[0.01] border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:border-blue-500/40 focus:bg-white/[0.02]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/[0.01] border border-white/[0.06] rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:border-blue-500/40 focus:bg-white/[0.02]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs font-medium text-center bg-red-500/10 border border-red-500/20 rounded-xl py-2.5 px-4">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600/20 text-blue-400 border border-blue-500/25 py-3 rounded-xl font-semibold text-sm shadow-[0_0_12px_rgba(59,130,246,0.1)] hover:bg-blue-600/30 active:scale-95 transition-all duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Acessar Plataforma <ArrowRight size={15} aria-hidden /></>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-xs mt-6">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Criar conta grátis
            </Link>
          </p>
        </div>

        <p className="text-center text-slate-600 text-[9px] font-mono mt-6 uppercase tracking-widest">
          Ambiente Blindado · AES-256 · TLS 1.3
        </p>
      </div>
    </div>
  )
}
