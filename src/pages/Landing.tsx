import { Link } from 'react-router-dom'
import {
  DollarSign, Euro, PoundSterling, ArrowRight, ChevronRight,
  ExternalLink, TrendingUp, Zap, Lock, Globe, Database, Building2,
  Shield, FileText,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const TICKER_ITEMS = [
  { pair: 'USD/BRL', value: 'R$ 5,1247', change: '+0,23%', up: true },
  { pair: 'EUR/BRL', value: 'R$ 5,5981', change: '+0,17%', up: true },
  { pair: 'GBP/BRL', value: 'R$ 6,4832', change: '-0,09%', up: false },
  { pair: 'USD/EUR', value: '$ 0,9156',  change: '+0,05%', up: true },
  { pair: 'GBP/USD', value: '$ 1,2651',  change: '-0,12%', up: false },
]

const FEATURES = [
  {
    icon: <TrendingUp size={20} className="text-blue-400" aria-hidden />,
    iconBg: 'bg-blue-600/10 border-blue-600/15',
    title: 'Cotações em Tempo Real',
    desc: 'Dados de mercado com latência inferior a 100ms. Spreads mínimos e preços competitivos em todas as operações.',
  },
  {
    icon: <Zap size={20} className="text-yellow-400" aria-hidden />,
    iconBg: 'bg-yellow-500/10 border-yellow-500/15',
    title: 'Liquidação Instantânea',
    desc: 'Conversão e liquidação de cambiais em segundos. Integração direta com as principais instituições financeiras.',
  },
  {
    icon: <Lock size={20} className="text-emerald-400" aria-hidden />,
    iconBg: 'bg-emerald-600/10 border-emerald-600/15',
    title: 'Segurança Nível Bancário',
    desc: 'Criptografia AES-256, autenticação multifator e infraestrutura em conformidade com as normas do BACEN.',
  },
  {
    icon: <Globe size={20} className="text-purple-400" aria-hidden />,
    iconBg: 'bg-purple-600/10 border-purple-600/15',
    title: 'Múltiplas Moedas',
    desc: 'Opere com USD, EUR, GBP e BRL numa única plataforma unificada com conversão automática e histórico completo.',
  },
  {
    icon: <Database size={20} className="text-orange-400" aria-hidden />,
    iconBg: 'bg-orange-500/10 border-orange-500/15',
    title: 'Histórico Completo',
    desc: 'Contratos de câmbio emitidos automaticamente para cada operação realizada, com rastreabilidade integral.',
  },
  {
    icon: <Building2 size={20} className="text-rose-400" aria-hidden />,
    iconBg: 'bg-rose-600/10 border-rose-600/15',
    title: 'Conformidade Regulatória',
    desc: 'Operações 100% registradas junto ao Banco Central. Certificação OFAC e plena conformidade com legislação cambial.',
  },
]

const SECURITY = [
  {
    icon: <Building2 size={22} className="text-blue-400" aria-hidden />,
    iconBg: 'bg-blue-600/10 border-blue-600/20',
    hoverGlow: 'bg-blue-600/10',
    title: 'Registro no Banco Central',
    desc: 'Para sua segurança, todas as operações são registradas junto ao Banco Central do Brasil conforme as exigências da Resolução CMN nº 4.841.',
  },
  {
    icon: <Lock size={22} className="text-emerald-400" aria-hidden />,
    iconBg: 'bg-emerald-600/10 border-emerald-600/20',
    hoverGlow: 'bg-emerald-600/10',
    title: 'Proteção de Dados',
    desc: 'Contamos com um programa efetivo de segurança das informações e monitoramento contínuo de riscos cibernéticos com criptografia AES-256.',
  },
  {
    icon: <FileText size={22} className="text-purple-400" aria-hidden />,
    iconBg: 'bg-purple-600/10 border-purple-600/20',
    hoverGlow: 'bg-purple-600/10',
    title: 'Contratos de Câmbio',
    desc: 'Receba o contrato de câmbio completo para todas as operações realizadas na plataforma, com validade jurídica e rastreabilidade integral.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ── */}
        <div className="relative flex flex-col items-center justify-center overflow-hidden pt-16">
          {/* Background gradients */}
          <div
            className="absolute inset-0 -z-10 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 0%, rgba(37,99,235,0.04) 0%, transparent 65%), radial-gradient(circle at 100% 100%, rgba(124,58,237,0.03) 0%, transparent 50%)',
            }}
          />
          <div
            className="absolute inset-0 -z-10 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10 pb-4 lg:py-12 lg:pb-4">
            <div className="text-center max-w-4xl mx-auto">

              {/* Live badge */}
              <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-600/20 rounded-full px-4 py-2 mb-8">
                <div className="relative w-2 h-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-50" />
                </div>
                <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">
                  Mercados em operação · Ao vivo
                </span>
              </div>

              {/* Currency icons */}
              <div className="flex items-center justify-center gap-4 mb-8">
                {[
                  { icon: <DollarSign size={24} strokeWidth={1.5} />, label: 'USD', cls: 'animate-float' },
                  { icon: <Euro size={24} strokeWidth={1.5} />, label: 'EUR', cls: 'animate-float-delay' },
                  { icon: <PoundSterling size={24} strokeWidth={1.5} />, label: 'GBP', cls: 'animate-float-delay-2' },
                ].map(({ icon, label, cls }) => (
                  <div key={label} className={`flex flex-col items-center gap-2 ${cls}`}>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-600/10 border border-blue-600/15 flex items-center justify-center text-blue-400 backdrop-blur-sm hover:scale-110 transition-transform duration-300">
                      {icon}
                    </div>
                    <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{label}</span>
                  </div>
                ))}
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9] mb-6">
                <span className="text-white">Câmbio de</span>
                <br />
                <span className="text-gradient-blue">Alto Nível.</span>
                <br />
                <span className="text-white">Simplicidade Total.</span>
              </h1>

              <p className="text-slate-400 text-base sm:text-lg lg:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
                Cotações ao vivo, spreads mínimos e liquidação instantânea.
                <br className="hidden sm:block" />
                A plataforma que profissionais do câmbio confiam.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Link
                  to="/cadastro"
                  className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.97] px-8 py-4 rounded-2xl font-bold text-white text-sm transition-all duration-300 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5"
                >
                  Abrir Conta Grátis
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" aria-hidden />
                </Link>
                <a
                  href="#recursos"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 border border-slate-800 hover:border-slate-700 active:scale-[0.97] px-8 py-4 rounded-2xl font-bold text-slate-300 hover:text-white text-sm transition-all duration-300 hover:-translate-y-0.5"
                >
                  Ver Recursos
                  <ChevronRight size={16} className="text-slate-500" aria-hidden />
                </a>
              </div>

              {/* BCB badge */}
              <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-3 bg-emerald-500/5 border border-emerald-500/12 rounded-2xl px-6 py-4 mb-12 max-w-xl mx-auto shadow-lg shadow-emerald-500/5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-xs text-slate-400 font-bold text-emerald-400">BCB</span>
                </div>
                <div className="hidden sm:block h-4 w-px bg-slate-800" />
                <p className="text-xs text-slate-400 font-medium">
                  Instituição autorizada ·{' '}
                  <a
                    href="https://www.bcb.gov.br/rex/iamc/port/correspondentes/correspondentes.asp?frame=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-2 transition-all inline-flex items-center gap-0.5"
                  >
                    Confira no Banco Central
                    <ExternalLink size={10} aria-hidden />
                  </a>
                </p>
              </div>

              {/* Ticker */}
              <div
                className="w-full max-w-2xl mx-auto overflow-hidden relative border-y border-slate-800/60"
                style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)' }}
              >
                <div className="flex w-max animate-ticker py-1.5">
                  {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-5 cursor-default shrink-0">
                      <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{item.pair}</span>
                      <span className="text-white font-mono font-semibold text-[11px]">{item.value}</span>
                      <span className={`text-[9px] font-bold ${item.up ? 'text-green-500' : 'text-red-500'}`}>{item.change}</span>
                      <span className="text-slate-800 text-[10px] ml-1">·</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent -z-10" />
        </div>

        {/* ── Banner ── */}
        <section className="py-0 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-950/40 shadow-2xl group flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-600/25 transition-colors duration-500" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-600/25 transition-colors duration-500" />
              <div className="relative w-full h-48 sm:h-64 lg:h-80 bg-gradient-to-br from-blue-950/50 via-slate-900/50 to-emerald-950/50 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-slate-500 text-sm font-medium mb-2">Banner da Plataforma</p>
                  <p className="text-slate-700 text-xs">Adicione sua imagem aqui</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Recursos ── */}
        <section id="recursos" className="pt-8 pb-24 lg:pt-10 lg:pb-32 relative overflow-hidden">
          {/* Floating symbols bg */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden>
            {['$', '€', '£', '$', '€', '£'].map((sym, i) => (
              <span
                key={i}
                className="absolute font-black text-white select-none opacity-[0.025]"
                style={{
                  fontSize: `${[6, 8, 10, 6, 8, 10][i]}rem`,
                  top: `${[10, 25, 40, 55, 70, 85][i]}%`,
                  left: i % 2 === 0 ? `${[3, 5, 7][Math.floor(i / 2)]}%` : undefined,
                  right: i % 2 !== 0 ? `${[4, 6, 8][Math.floor(i / 2)]}%` : undefined,
                  animation: `${[4, 4.6, 5.2, 5.8, 6.4, 7][i]}s ease-in-out ${[0, 0.8, 1.6, 2.4, 3.2, 4][i]}s infinite float`,
                }}
              >
                {sym}
              </span>
            ))}
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 lg:mb-20">
              <div className="inline-flex items-center gap-2 text-blue-500 text-xs font-black uppercase tracking-[3px] mb-4">
                <div className="h-px w-8 bg-blue-600/50" />
                Recursos da Plataforma
                <div className="h-px w-8 bg-blue-600/50" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-white mb-4">
                Tudo que você precisa para
                <br />
                <span className="text-gradient-blue">operar com confiança</span>
              </h2>
              <p className="text-slate-500 text-base max-w-xl mx-auto">
                Infraestrutura de nível institucional, acessível através de uma interface moderna e intuitiva.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group relative bg-[#080808] border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className={`w-11 h-11 ${f.iconBg} border rounded-xl flex items-center justify-center mb-5`}>
                      {f.icon}
                    </div>
                    <h3 className="text-white font-bold text-base mb-2 tracking-tight">{f.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Segurança ── */}
        <section id="seguranca" className="py-24 lg:py-32 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-16 mb-14">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 text-emerald-500 text-xs font-black uppercase tracking-[3px] mb-4">
                  <Shield size={14} aria-hidden />
                  Segurança em cada transação
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-white">
                  Protegido por
                  <br />
                  <span className="text-gradient-blue">múltiplas camadas</span>
                </h2>
              </div>
              <div className="lg:w-80 bg-emerald-600/5 border border-emerald-600/15 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-emerald-600/10 rounded-lg flex items-center justify-center">
                    <Shield size={16} className="text-emerald-500" aria-hidden />
                  </div>
                  <span className="text-emerald-400 text-xs font-black uppercase tracking-widest">Status Ativo</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Infraestrutura monitorada 24/7 com resposta a incidentes em menos de 15 minutos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 mb-12">
              {SECURITY.map((s) => (
                <div
                  key={s.title}
                  className="group relative bg-[#080808] border border-slate-800/80 rounded-2xl p-6 lg:p-7 hover:border-slate-700 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${s.hoverGlow}`} />
                  <div className="relative z-10">
                    <div className={`w-12 h-12 ${s.iconBg} border rounded-2xl flex items-center justify-center mb-5`}>
                      {s.icon}
                    </div>
                    <h3 className="text-white font-bold text-base mb-3 tracking-tight">{s.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 bg-slate-900/40 border border-slate-800/60 rounded-2xl px-6 py-5 text-center sm:text-left">
              <span className="text-slate-400 font-bold text-sm">BCB</span>
              <p className="text-slate-400 text-sm leading-relaxed">
                Confira no Banco Central. Acesse o{' '}
                <a
                  href="https://www.bcb.gov.br/rex/iamc/port/correspondentes/correspondentes.asp?frame=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors inline-flex items-center gap-1"
                >
                  site oficial do BCB <ExternalLink size={12} aria-hidden />
                </a>{' '}
                para validar todas as informações diretamente na fonte oficial.
              </p>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-20 lg:py-28 relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/10 to-black" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/8 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-[#080808] border border-slate-800/80 rounded-3xl p-12 lg:p-20 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-600/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-600/20 to-transparent" />
              <div className="relative z-10">
                <span className="inline-block text-blue-500 text-xs font-black uppercase tracking-[3px] mb-6">
                  Comece agora, é gratuito
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-white mb-5">
                  Pronto para operar em
                  <br />
                  <span className="text-gradient-blue">alto nível?</span>
                </h2>
                <p className="text-slate-400 text-base mb-8 max-w-xl mx-auto leading-relaxed">
                  Crie sua conta em menos de 2 minutos. Sem taxa de adesão, sem burocracia. Comece a operar com câmbio institucional agora mesmo.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to="/cadastro"
                    className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.97] px-8 py-4 rounded-2xl font-bold text-white text-sm transition-all duration-300 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5"
                  >
                    Criar Conta Gratuitamente
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" aria-hidden />
                  </Link>
                  <Link
                    to="/login"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 border border-slate-800 hover:border-slate-700 active:scale-[0.97] px-8 py-4 rounded-2xl font-bold text-slate-300 hover:text-white text-sm transition-all duration-300"
                  >
                    Já tenho conta
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
