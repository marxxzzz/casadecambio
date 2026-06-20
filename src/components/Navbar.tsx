import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          scrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/[0.04]' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 outline-none select-none apple-touch" aria-label="Exchange">
            <span className="text-white font-black text-xl tracking-tight">Exchange</span>
            <span className="hidden sm:inline-block text-[9px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider ml-1">
              Elite Exchange
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            <a href="#recursos" className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors font-medium">
              Recursos
            </a>
            <a href="#seguranca" className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors font-medium">
              Segurança
            </a>
            <div className="w-px h-4 bg-white/[0.08] mx-3" />
            <div className="flex items-center gap-3">
              <Link to="/login" className="px-4 py-2 text-xs text-slate-300 hover:text-white transition-all duration-300 font-medium">
                Entrar
              </Link>
              <Link
                to="/cadastro"
                className="bg-blue-600 px-5 py-2 rounded-full text-xs font-semibold text-white hover:bg-blue-500 shadow-[0_4px_12px_rgba(37,99,235,0.2)] apple-touch transition-colors"
              >
                Criar Conta
              </Link>
            </div>
          </div>

          <div className="lg:hidden flex items-center gap-1.5">
            <button
              className="text-white p-2 rounded-xl hover:bg-white/[0.04] apple-touch"
              aria-label="Menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-[99] bg-black/95 flex flex-col pt-20 px-6 lg:hidden">
          <a
            href="#recursos"
            onClick={() => setMenuOpen(false)}
            className="py-4 text-lg text-slate-300 hover:text-white border-b border-white/[0.05] font-medium transition-colors"
          >
            Recursos
          </a>
          <a
            href="#seguranca"
            onClick={() => setMenuOpen(false)}
            className="py-4 text-lg text-slate-300 hover:text-white border-b border-white/[0.05] font-medium transition-colors"
          >
            Segurança
          </a>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="w-full py-4 text-center text-sm font-semibold text-white border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/cadastro"
              onClick={() => setMenuOpen(false)}
              className="w-full py-4 text-center text-sm font-bold text-white bg-blue-600 rounded-2xl hover:bg-blue-500 transition-colors"
            >
              Criar Conta Grátis
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
