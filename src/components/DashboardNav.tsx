import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, RefreshCw, Link2, User, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/dashboard',  icon: <LayoutDashboard size={16} aria-hidden /> },
  { label: 'Câmbio',     href: '/converter',  icon: <RefreshCw size={16} aria-hidden /> },
  { label: 'Contas',     href: '/contas',     icon: <Link2 size={16} aria-hidden /> },
  { label: 'Histórico',  href: '/status',     icon: <RefreshCw size={16} aria-hidden /> },
]

export default function DashboardNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-black/60 backdrop-blur-md border-b border-white/[0.05] shadow-[0_2px_15px_rgba(0,0,0,0.2)] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 outline-none select-none">
            <span className="text-white font-black text-xl tracking-tight">Exchange</span>
            <span className="hidden sm:inline-block text-[9px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider ml-1">
              Elite Exchange
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            <div className="flex items-center gap-0.5 bg-white/[0.015] border border-white/[0.04] rounded-full p-0.5 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      active
                        ? 'bg-blue-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span className="tracking-wide">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            <div className="w-px h-4 bg-white/[0.08] mx-3" />

            <button className="p-2 text-slate-400 hover:text-white rounded-[10px] hover:bg-white/[0.04] transition-colors" title="Perfil">
              <User size={16} aria-hidden />
            </button>
            <button onClick={handleLogout} className="p-2 text-red-400/80 hover:text-red-400 rounded-[10px] hover:bg-red-500/10 transition-colors" title="Sair">
              <LogOut size={16} aria-hidden />
            </button>
          </div>

          {/* Mobile */}
          <div className="lg:hidden flex items-center gap-1.5">
            <button className="p-2 text-slate-400 hover:text-white rounded-[10px] hover:bg-white/[0.04]" title="Perfil">
              <User size={18} aria-hidden />
            </button>
            <button
              className="text-white p-2 rounded-xl hover:bg-white/[0.04]"
              aria-label="Menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[99] bg-black/95 flex flex-col pt-20 px-6 lg:hidden">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 py-4 border-b border-white/[0.05] text-base font-medium transition-colors ${
                  active ? 'text-blue-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
          <button onClick={handleLogout} className="flex items-center gap-3 py-4 text-red-400 text-base font-medium mt-4">
            <LogOut size={16} />
            Sair
          </button>
        </div>
      )}
    </>
  )
}
