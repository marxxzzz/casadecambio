import { Link } from 'react-router-dom'
import { Mail, MessageSquare, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] bg-black mt-auto relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white font-black text-xl tracking-tight">Exchange</span>
              <span className="text-[9px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider ml-1">
                Elite Exchange
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs pt-1 font-normal">
              Plataforma institucional de câmbio de alto desempenho. Operações registradas junto ao Banco Central do Brasil.
            </p>
            <p className="text-slate-600 text-xs font-mono font-medium">
              Autorizada pelo BCB — Resolução CMN nº 4.841
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Plataforma</h4>
            <ul className="space-y-3">
              {[
                { label: 'Câmbio ao Vivo', to: '/dashboard' },
                { label: 'Conectar Contas', to: '/contas' },
                { label: 'Política de Privacidade', to: '#' },
                { label: 'Termos de Uso', to: '#' },
                { label: 'Conformidade OFAC', to: '#' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-sm text-slate-500 hover:text-white hover:translate-x-0.5 transition-all duration-300 font-normal inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Contato &amp; Suporte</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Mail size={14} className="text-blue-400" aria-hidden />
                </div>
                <div>
                  <p className="text-[9px] text-slate-600 uppercase font-semibold tracking-wider mb-0.5">E-mail</p>
                  <a href="mailto:contato@suporte.com" className="text-sm text-slate-300 hover:text-white transition-colors font-medium">
                    contato@suporte.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 cursor-pointer group">
                <div className="w-8 h-8 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600/10 group-hover:border-blue-500/20 transition-all">
                  <MessageSquare size={14} className="text-blue-400" aria-hidden />
                </div>
                <div>
                  <p className="text-[9px] text-slate-600 uppercase font-semibold tracking-wider mb-0.5">Suporte</p>
                  <p className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">Chat ao Vivo</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={14} className="text-blue-400" aria-hidden />
                </div>
                <div>
                  <p className="text-[9px] text-slate-600 uppercase font-semibold tracking-wider mb-0.5">Endereço</p>
                  <p className="text-sm text-slate-400 leading-normal font-normal">
                    Sua Rua, 000 — Bairro<br />
                    Sua Cidade/UF — CEP 00000-000
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-xs text-center sm:text-left font-normal">
            © {new Date().getFullYear()} Exchange Câmbio Institucional Ltda. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-slate-700 text-[10px] font-mono uppercase tracking-wider font-medium">AES-256 Encrypted</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-500 text-[10px] font-semibold uppercase tracking-wider">Sistema Operacional</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
