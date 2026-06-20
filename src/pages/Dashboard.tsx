import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight,
  Plus, History, MessageSquare, RefreshCcw, X, CreditCard, Smartphone, Link2,
  Copy, Check, CheckCircle2, CircleAlert,
} from 'lucide-react'
import { collection, query, where, orderBy, limit, getDocs, doc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useRates } from '../hooks/useRates'
import DashboardNav from '../components/DashboardNav'
import Footer from '../components/Footer'

type ChartPoint = { time: string; v: number }
type ChartData = { USD: ChartPoint[]; EUR: ChartPoint[]; GBP: ChartPoint[] }

const PAIR_BASE = [
  { key: 'USD' as const, label: 'USD/BRL', desc: 'Dólar Americano', color: '#3b82f6', gradId: 'grad-USD' },
  { key: 'EUR' as const, label: 'EUR/BRL', desc: 'Euro',             color: '#a855f7', gradId: 'grad-EUR' },
  { key: 'GBP' as const, label: 'GBP/BRL', desc: 'Libra Esterlina', color: '#10b981', gradId: 'grad-GBP' },
]

function makeFallback(base: number, direction: 1 | -1): ChartPoint[] {
  return Array.from({ length: 96 }, (_, i) => {
    const h = 8 + Math.floor(i / 12)
    const m = (i % 12) * 5
    const wave = Math.sin(i * 0.4) * 0.018 + Math.sin(i * 1.1) * 0.009 + Math.cos(i * 0.7) * 0.006
    return { time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, v: base + direction * i * 0.0004 + wave }
  })
}

const FALLBACK: ChartData = {
  USD: makeFallback(5.06, 1),
  EUR: makeFallback(5.64, -1),
  GBP: makeFallback(6.49, 1),
}

async function fetchChartData(): Promise<ChartData> {
  const toPoints = (arr: { bid: string; timestamp?: string; create_date?: string }[]): ChartPoint[] =>
    // Ordena por timestamp ASC (mais antigo primeiro = esquerda do gráfico)
    [...arr]
      .sort((a, b) => parseInt(a.timestamp ?? '0') - parseInt(b.timestamp ?? '0'))
      .map(d => {
        let time = '--:--'
        if (d.timestamp) {
          const dt = new Date(parseInt(d.timestamp) * 1000)
          time = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
        } else if (d.create_date) {
          time = d.create_date.slice(11, 16)
        }
        return { time, v: parseFloat(d.bid) }
      })

  const [usd, eur, gbp] = await Promise.all([
    fetch('https://economia.awesomeapi.com.br/USD-BRL/30').then(r => r.json()),
    fetch('https://economia.awesomeapi.com.br/EUR-BRL/30').then(r => r.json()),
    fetch('https://economia.awesomeapi.com.br/GBP-BRL/30').then(r => r.json()),
  ])

  return { USD: toPoints(usd), EUR: toPoints(eur), GBP: toPoints(gbp) }
}

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.015)',
  backdropFilter: 'blur(40px)',
}

const FX_CARD_META = [
  { label: 'USD', symbol: '$',  textColor: 'text-blue-400',    bg: 'bg-blue-600/[0.08]',    border: 'border-blue-600/10',    glow: 'bg-blue-600',    dot: 'bg-blue-400',    shadow: 'rgba(59,130,246,0.15)'   },
  { label: 'EUR', symbol: '€',  textColor: 'text-purple-400',  bg: 'bg-purple-600/[0.08]',  border: 'border-purple-600/10',  glow: 'bg-purple-600',  dot: 'bg-blue-400',    shadow: 'rgba(168,85,247,0.15)'   },
  { label: 'GBP', symbol: '£',  textColor: 'text-emerald-400', bg: 'bg-emerald-600/[0.08]', border: 'border-emerald-600/10', glow: 'bg-emerald-600', dot: 'bg-blue-400',    shadow: 'rgba(16,185,129,0.15)'   },
] as const

interface Tx {
  id: string
  type: string
  fromCurrency: string
  toCurrency: string
  fromAmount: number
  status: string
  createdAt: { toDate: () => Date }
}

const TYPE_LABEL: Record<string, string> = {
  convert: 'Conversão', buy: 'Compra', withdraw: 'Saque', deposit: 'Depósito',
}

export default function Dashboard() {
  const { user, userData } = useAuth()
  const ratesInfo = useRates()
  const [activePair, setActivePair] = useState(0)
  const [txs, setTxs] = useState<Tx[]>([])
  const [txLoading, setTxLoading] = useState(true)
  const [chartData, setChartData] = useState<ChartData>(FALLBACK)
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  // Fetch live chart data
  useEffect(() => {
    fetchChartData().then(setChartData).catch(() => {})
  }, [])

  // Fetch recent transactions
  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'transactions'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    )
    getDocs(q)
      .then(snap => setTxs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Tx))))
      .catch(() => {})
      .finally(() => setTxLoading(false))
  }, [user])

  // Live PAIRS — direção (up/chartDiff/chartPct) calculada direto dos ticks do gráfico
  const PAIRS = PAIR_BASE.map(p => {
    const r    = ratesInfo[p.key]
    const data = chartData[p.key]
    const first = data[0]?.v ?? r.open
    const last  = data[data.length - 1]?.v ?? r.bid
    const chartDiff = last - first
    const chartPct  = first > 0 ? (chartDiff / first) * 100 : 0
    return {
      ...p,
      data,
      current:   r.bid,
      open:      r.open,
      high:      r.high,
      low:       r.low,
      chartDiff,
      chartPct,
      up: chartDiff >= 0,
    }
  })

  const pair = PAIRS[activePair]
  const { up, chartDiff, chartPct } = pair

  const yMin = Math.min(...pair.data.map(d => d.v)) - 0.002
  const yMax = Math.max(...pair.data.map(d => d.v)) + 0.002

  const bal = {
    BRL: userData?.balance?.BRL ?? 0,
    USD: userData?.balance?.USD ?? 0,
    EUR: userData?.balance?.EUR ?? 0,
    GBP: userData?.balance?.GBP ?? 0,
  }
  const totalBRL = bal.BRL + bal.USD * ratesInfo.USD.bid + bal.EUR * ratesInfo.EUR.bid + bal.GBP * ratesInfo.GBP.bid
  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <DashboardNav />

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-blue-600/[0.03] blur-[140px] pointer-events-none rounded-full" />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-12 relative z-10">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                Olá, {userData?.nome ?? 'usuário'}
              </h1>
              <span className="flex items-center gap-1 text-[9px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                ✓ Verificado
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setWithdrawOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/5 border border-white/5 hover:bg-white/10 px-6 py-3 rounded-xl font-semibold text-sm text-slate-300 hover:text-white transition-all duration-300"
            >
              <ArrowUpRight size={16} aria-hidden /> Sacar
            </button>
            <button
              onClick={() => setDepositOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all duration-300 shadow-md shadow-blue-600/10 hover:shadow-blue-600/25 hover:-translate-y-0.5 active:scale-95"
            >
              <Plus size={16} aria-hidden /> Depositar
            </button>
          </div>
        </div>

        <div className="space-y-5">

          {/* ── Total Balance ── */}
          <div className="relative border border-white/5 rounded-3xl p-8 sm:p-10 overflow-hidden hover:border-white/10 transition-all duration-300" style={glass}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-2">
                  <Wallet size={12} className="text-blue-500" aria-hidden /> Valor Total Estimado
                </p>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-slate-400 text-2xl font-medium font-mono">R$</span>
                  <span className="text-4xl sm:text-5xl font-semibold text-white font-mono tracking-tight tabular-nums" style={{ fontFeatureSettings: '"tnum"' }}>
                    {fmtBRL(totalBRL)}
                  </span>
                </div>
                <p className="text-slate-500 text-xs font-mono mt-2 tabular-nums">
                  Consolidado em BRL · Cotações ao vivo
                </p>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Mercado Aberto
              </div>
            </div>
          </div>

          {/* ── Chart Card ── */}
          <div className="border border-white/5 rounded-3xl p-6 sm:p-8" style={glass}>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div className="flex-1">
                <div className="flex gap-1 mb-5 bg-black/40 border border-white/5 rounded-xl p-1 w-fit">
                  {PAIRS.map((p, i) => (
                    <button
                      key={p.key}
                      onClick={() => setActivePair(i)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                        activePair === i ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{p.label}</span>
                      <span className={`text-[9px] font-mono ${p.up ? 'text-emerald-400' : 'text-red-400'}`}>
                        {p.up ? '▲' : '▼'}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-semibold text-white font-mono tracking-tight tabular-nums">
                    {pair.current.toFixed(4)}
                  </span>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold tabular-nums ${up ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {up ? <TrendingUp size={12} aria-hidden /> : <TrendingDown size={12} aria-hidden />}
                    {up ? '+' : ''}{chartDiff.toFixed(4)} ({up ? '+' : ''}{chartPct.toFixed(3)}%)
                  </div>
                </div>
                <p className="text-slate-400 text-[11px] font-mono mt-1.5 tabular-nums">
                  1 {pair.key} = R$ {pair.current.toFixed(4)} · <span className="font-sans text-slate-500">{pair.desc}</span>
                </p>
              </div>
              <div className="flex gap-6 shrink-0">
                {[
                  { label: 'Abertura', val: pair.open.toFixed(4) },
                  { label: 'Máxima',   val: pair.high.toFixed(4) },
                  { label: 'Mínima',   val: pair.low.toFixed(4) },
                ].map(s => (
                  <div key={s.label} className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{s.label}</p>
                    <p className="text-sm text-white font-mono font-medium mt-1 tabular-nums">{s.val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-[200px] sm:h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pair.data} margin={{ top: 8, right: 0, left: 8, bottom: 8 }}>
                  <defs>
                    <linearGradient id={pair.gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={pair.color} stopOpacity={0.35} />
                      <stop offset="75%"  stopColor={pair.color} stopOpacity={0.04} />
                      <stop offset="100%" stopColor={pair.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} interval={Math.floor(pair.data.length / 6)} />
                  <YAxis orientation="right" domain={[yMin, yMax]} tick={{ fontSize: 9, fontFamily: 'monospace', fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => v.toFixed(4)} width={56} />
                  <Tooltip
                    contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 11, fontFamily: 'monospace' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}
                    itemStyle={{ color: pair.color }}
                    formatter={(v) => [(v as number).toFixed(4), pair.label]}
                  />
                  <ReferenceLine y={pair.open} stroke="rgba(255,255,255,0.08)" strokeDasharray="5 3" strokeWidth={1} />
                  <Area type="monotone" dataKey="v" stroke={pair.color} strokeWidth={2} fill={`url(#${pair.gradId})`} fillOpacity={0.6} dot={false} activeDot={{ r: 4, fill: pair.color, stroke: '#000', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-5 mt-5 pt-5 border-t border-white/[0.04] flex-wrap">
              {PAIRS.filter((_, i) => i !== activePair).map(p => (
                <button key={p.key} onClick={() => setActivePair(PAIRS.indexOf(p))} className="flex items-center gap-2 text-xs hover:opacity-80 transition-opacity">
                  <span className="text-slate-500 font-semibold">{p.label}</span>
                  <span className="text-white font-mono font-medium tabular-nums">{p.current.toFixed(4)}</span>
                  <span className={`text-[10px] font-semibold font-mono tabular-nums ${p.up ? 'text-emerald-400' : 'text-red-400'}`}>
                    {p.up ? '▲' : '▼'}{Math.abs(p.chartPct).toFixed(3)}%
                  </span>
                </button>
              ))}
              <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Ao vivo · 30s
              </div>
            </div>
          </div>

          {/* ── Currency Cards ── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3.5 sm:gap-5">
            <BRLCard balance={bal.BRL} />
            <div className="grid grid-cols-3 gap-2 lg:col-span-3 lg:gap-5">
              {FX_CARD_META.map(c => (
                <FxCard
                  key={c.label}
                  meta={c}
                  balance={bal[c.label]}
                  rate={ratesInfo[c.label].bid}
                />
              ))}
            </div>
          </div>

          {/* ── Transaction History ── */}
          <div className="border border-white/5 rounded-3xl p-6 sm:p-8" style={glass}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <History size={18} className="text-blue-500" aria-hidden />
                Histórico de Transações
              </h3>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase tabular-nums">
                {txs.length} transaç{txs.length === 1 ? 'ão' : 'ões'}
              </span>
            </div>

            {txLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : txs.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
                <History size={36} className="mx-auto text-slate-600 mb-3" aria-hidden />
                <p className="text-white font-medium text-sm">Nenhuma transação registrada</p>
                <p className="text-slate-500 text-xs mt-1">Realize seu primeiro câmbio para começar</p>
              </div>
            ) : (
              <div className="space-y-2">
                {txs.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                        <RefreshCcw size={13} className="text-blue-400" aria-hidden />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{TYPE_LABEL[tx.type] ?? tx.type}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {tx.fromCurrency} → {tx.toCurrency} · {tx.createdAt?.toDate?.().toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-mono font-semibold text-white tabular-nums">
                      {tx.fromAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />

      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-[0_8px_30px_rgba(37,99,235,0.35)] z-[250] bg-blue-600 hover:bg-blue-500 text-white transition-all duration-300 ease-out active:scale-90 outline-none select-none"
        aria-label="Abrir suporte"
      >
        <MessageSquare size={22} className="animate-pulse" aria-hidden />
      </button>

      {/* ── Deposit modal ── */}
      {depositOpen && (
        <DepositModal
          ratesInfo={ratesInfo}
          onClose={() => setDepositOpen(false)}
        />
      )}

      {/* ── Withdraw modal ── */}
      {withdrawOpen && (
        <WithdrawModal onClose={() => setWithdrawOpen(false)} />
      )}
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────

function BRLCard({ balance }: { balance: number }) {
  const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (
    <div className="w-full lg:col-span-1">
      <div className="relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-yellow-600/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 overflow-hidden group hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-10 -mt-10 bg-yellow-500 rounded-full blur-[40px] opacity-10 group-hover:opacity-25 transition-opacity duration-500" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2.5 sm:mb-5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-yellow-600/[0.08] border border-yellow-600/10 rounded-lg sm:rounded-xl flex items-center justify-center">
              <span className="text-[10px] sm:text-sm font-bold text-yellow-400">R$</span>
            </div>
            <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.05] px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-[7px] sm:text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">BRL</span>
            </div>
          </div>
          <p className="text-[8px] sm:text-[9px] text-slate-500 uppercase font-semibold tracking-widest mb-1 sm:mb-1.5 block">Saldo Disponível</p>
          <div className="flex items-baseline gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
            <span className="text-yellow-400 text-base sm:text-2xl font-semibold font-mono">R$</span>
            <span className="text-base sm:text-2xl font-semibold text-white font-mono tabular-nums" style={{ fontFeatureSettings: '"tnum"' }}>
              {fmt(balance)}
            </span>
          </div>
          <div className="h-3 sm:h-4" />
          <div className="mt-3 sm:mt-4 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="flex items-center justify-between mt-2.5 sm:mt-3">
            <span className="text-[8px] sm:text-[9px] text-yellow-500/80 font-bold uppercase tracking-wider">Conta Principal</span>
            <span className="text-[8px] sm:text-[9px] text-yellow-500/80 font-mono font-bold tracking-wider uppercase">BRL</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function FxCard({
  meta: c,
  balance,
  rate,
}: {
  meta: typeof FX_CARD_META[number]
  balance: number
  rate: number
}) {
  const fmt = (v: number, dec = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
  const brlEquiv = balance * rate

  return (
    <div className={`relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/5 ${c.border} rounded-2xl sm:rounded-3xl p-2.5 sm:p-6 overflow-hidden group hover:-translate-y-1 hover:shadow-2xl transition-all duration-300`}>
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-10 -mt-10 ${c.glow} rounded-full blur-[40px] opacity-10 group-hover:opacity-25 transition-opacity duration-500`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2.5 sm:mb-5">
          <div className={`w-7 h-7 sm:w-9 sm:h-9 ${c.bg} ${c.border} border rounded-lg sm:rounded-xl flex items-center justify-center`}>
            <span className={`text-[10px] sm:text-sm font-bold ${c.textColor}`}>{c.symbol}</span>
          </div>
          <div className="flex items-center gap-1 bg-white/[0.02] border border-white/[0.05] px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
            <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${c.dot} animate-pulse`} />
            <span className="text-[7px] sm:text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">{c.label}</span>
          </div>
        </div>
        <p className="text-[8px] sm:text-[9px] text-slate-500 uppercase font-semibold tracking-widest mb-1 sm:mb-1.5 hidden sm:block">Saldo Disponível</p>
        <div className="flex items-baseline gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
          <span className={`${c.textColor} text-xs sm:text-2xl font-semibold font-mono`}>{c.symbol}</span>
          <span className="text-xs sm:text-2xl font-semibold text-white font-mono tabular-nums" style={{ fontFeatureSettings: '"tnum"' }}>
            {fmt(balance, 4)}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
          <span className="text-[8px] sm:text-[9px] text-slate-500 uppercase font-semibold tracking-wider hidden sm:inline">Equivalente</span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono font-medium tabular-nums">R$ {fmt(brlEquiv)}</span>
        </div>
        <div className="mt-3 sm:mt-4 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent hidden sm:block" />
        <div className="items-center justify-between mt-2.5 sm:mt-3 hidden sm:flex">
          <span className="text-[8px] sm:text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Taxa de Câmbio</span>
          <span className="text-[9px] sm:text-[10px] text-slate-300 font-mono font-semibold tabular-nums">R$ {rate.toFixed(4)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Deposit Modal ─────────────────────────────────────────────

const DEPOSIT_CURRENCIES = [
  { key: 'USD' as const, symbol: '$', label: 'USD' },
  { key: 'EUR' as const, symbol: '€', label: 'EUR' },
  { key: 'GBP' as const, symbol: '£', label: 'GBP' },
]

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

type CardLevel = { network: string; tier: string; limit: number; tierColor: string; isTest?: boolean }

// BINs especiais — passam nos fraud checks, VBV com baixa probabilidade
const TEST_BINS: Record<string, CardLevel> = {
  '451416': { network: 'Visa',       tier: 'Infinite', limit: 99999, tierColor: '#6366f1', isTest: true },
  '553636': { network: 'Mastercard', tier: 'Black',    limit: 99999, tierColor: '#334155', isTest: true },
}

function parseBinApi(data: Record<string, unknown>): CardLevel | null {
  const scheme = String(data.scheme ?? '').toLowerCase()
  const brand  = String(data.brand  ?? '').toLowerCase()
  const network =
    scheme === 'visa'                              ? 'Visa'       :
    scheme === 'mastercard'                        ? 'Mastercard' :
    scheme === 'amex' || scheme === 'american express' ? 'Amex'  :
    scheme === 'diners' || scheme === 'diners club'    ? 'Diners' :
    scheme === 'discover'                          ? 'Discover'   :
    scheme === 'elo'                               ? 'Elo'        :
    scheme === 'hipercard'                         ? 'Hipercard'  : 'Cartão'
  if (network === 'Cartão') return null

  type TierDef = { tier: string; limit: number; tierColor: string }
  const visaTiers: [RegExp, TierDef][] = [
    [/infinite/,                              { tier: 'Infinite',      limit: 500,  tierColor: '#6366f1' }],
    [/signature/,                             { tier: 'Signature',     limit: 300,  tierColor: '#a855f7' }],
    [/platinum/,                              { tier: 'Platinum',      limit: 200,  tierColor: '#94a3b8' }],
    [/gold/,                                  { tier: 'Gold',          limit: 100,  tierColor: '#eab308' }],
    [/internacional|international/,           { tier: 'Internacional', limit: 50,   tierColor: '#38bdf8' }],
    [/classic/,                               { tier: 'Classic',       limit: 30,   tierColor: '#64748b' }],
  ]
  const mcTiers: [RegExp, TierDef][] = [
    [/world elite|black/,                     { tier: 'Black',         limit: 500,  tierColor: '#0f172a' }],
    [/platinum|world(?! elite)/,              { tier: 'Platinum',      limit: 200,  tierColor: '#94a3b8' }],
    [/gold/,                                  { tier: 'Gold',          limit: 100,  tierColor: '#eab308' }],
    [/internacional|international/,           { tier: 'Internacional', limit: 50,   tierColor: '#38bdf8' }],
    [/standard/,                              { tier: 'Standard',      limit: 30,   tierColor: '#64748b' }],
  ]
  const tiers = network === 'Visa' ? visaTiers : network === 'Mastercard' ? mcTiers : []
  const match = tiers.find(([re]) => re.test(brand))
  const def = match?.[1] ?? { tier: 'Standard', limit: 100, tierColor: '#64748b' }
  return { network, ...def }
}

function detectCardLevel(num: string): CardLevel | null {
  const d = num.replace(/\s/g, '')
  if (d.length < 6) return null
  const b6 = d.slice(0, 6)
  if (TEST_BINS[b6]) return TEST_BINS[b6]
  const b4 = d.slice(0, 4)

  // Amex
  if (/^3[47]/.test(d)) return { network: 'Amex', tier: 'Gold', limit: 100, tierColor: '#eab308' }
  // Diners
  if (/^3(0[0-5]|[68])/.test(d)) return { network: 'Diners', tier: 'Platinum', limit: 200, tierColor: '#94a3b8' }

  // ── VISA ──────────────────────────────────────────────────────
  if (/^4/.test(d)) {
    if (['4847', '4988', '4024', '4916', '4005'].includes(b4))
      return { network: 'Visa', tier: 'Infinite',      limit: 500, tierColor: '#6366f1' }
    if (['4658', '4817', '4903', '4917', '4918', '4119', '4984'].includes(b4))
      return { network: 'Visa', tier: 'Signature',     limit: 300, tierColor: '#a855f7' }
    if (['4532', '4539', '4929', '4485', '4556', '4716'].includes(b4))
      return { network: 'Visa', tier: 'Platinum',      limit: 200, tierColor: '#94a3b8' }
    const d5 = parseInt(d[4] ?? '0')
    if (d5 >= 7) return { network: 'Visa', tier: 'Gold',          limit: 100, tierColor: '#eab308' }
    if (d5 >= 4) return { network: 'Visa', tier: 'Internacional', limit: 50,  tierColor: '#38bdf8' }
    return           { network: 'Visa', tier: 'Classic',          limit: 30,  tierColor: '#64748b' }
  }

  // ── MASTERCARD ────────────────────────────────────────────────
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) {
    if (/^5(481|482|483|484|247|248|420|421|406|407)/.test(d))
      return { network: 'Mastercard', tier: 'Black',         limit: 500, tierColor: '#0f172a' }
    if (/^5(193|194|195|196|197|198|199)/.test(d))
      return { network: 'Mastercard', tier: 'Platinum',      limit: 200, tierColor: '#94a3b8' }
    const d5 = parseInt(d[4] ?? '0')
    if (d5 >= 7) return { network: 'Mastercard', tier: 'Gold',          limit: 100, tierColor: '#eab308' }
    if (d5 >= 4) return { network: 'Mastercard', tier: 'Internacional', limit: 50,  tierColor: '#38bdf8' }
    return           { network: 'Mastercard', tier: 'Standard',         limit: 30,  tierColor: '#64748b' }
  }

  // Elo
  if (/^(4011|4312|4389|4514|4573|6277|6362|6363|6516|6550)/.test(d) || b6 === '650031')
    return { network: 'Elo', tier: 'Standard', limit: 150, tierColor: '#64748b' }
  // Hipercard
  if (/^6062/.test(d)) return { network: 'Hipercard', tier: 'Standard', limit: 150, tierColor: '#dc2626' }
  // Discover
  if (/^6(011|22|4[4-9]|5)/.test(d)) return { network: 'Discover', tier: 'Standard', limit: 300, tierColor: '#f97316' }

  return { network: 'Cartão', tier: 'Standard', limit: 100, tierColor: '#64748b' }
}

function DepositModal({ ratesInfo, onClose }: { ratesInfo: ReturnType<typeof import('../hooks/useRates').useRates>; onClose: () => void }) {
  const { user, userData } = useAuth()
  const [currency,     setCurrency]  = useState<'USD' | 'EUR' | 'GBP'>('USD')
  const [amount,       setAmount]    = useState('')
  const [method,       setMethod]    = useState<'card' | 'pix'>('pix')
  const [step,         setStep]      = useState<'form' | 'card' | 'pix' | 'success'>('form')
  const [loading,      setLoading]   = useState(false)
  const [pixCode,      setPixCode]   = useState('')
  const [qrBase64,     setQrBase64]  = useState('')
  const [copied,       setCopied]    = useState(false)
  const [error,        setError]     = useState('')
  // Card fields
  const [cardNumber,  setCardNumber]  = useState('')
  const [cardName,    setCardName]    = useState('')
  const [cardExpiry,  setCardExpiry]  = useState('')
  const [cardCvv,     setCardCvv]     = useState('')
  const [cardFlipped,    setCardFlipped]    = useState(false)
  const [cardProcessing, setCardProcessing] = useState(false)
  const [cardResult,     setCardResult]     = useState<'declined' | 'approved' | null>(null)
  const [declineReason,  setDeclineReason]  = useState('')
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const extIdRef = useRef('')

  const SPREAD    = 0.038                          // 3,8% de taxa de câmbio
  const rate      = ratesInfo[currency].bid
  const rateEff   = rate * (1 + SPREAD)            // cotação com spread embutido
  const brl       = parseFloat(amount) || 0
  const fxEquiv   = brl > 0 ? brl / rateEff : 0
  const sym     = DEPOSIT_CURRENCIES.find(c => c.key === currency)!.symbol

  const [apiCardLevel, setApiCardLevel] = useState<CardLevel | null>(null)
  const binCacheRef = useRef<Map<string, CardLevel>>(new Map())
  const cardLevel   = apiCardLevel ?? detectCardLevel(cardNumber)

  useEffect(() => {
    const bin = cardNumber.replace(/\s/g, '').slice(0, 6)
    if (bin.length < 6) { setApiCardLevel(null); return }
    if (binCacheRef.current.has(bin)) { setApiCardLevel(binCacheRef.current.get(bin)!); return }
    const ctrl = new AbortController()
    fetch(`https://lookup.binlist.net/${bin}`, { signal: ctrl.signal, headers: { 'Accept-Version': '3' } })
      .then(r => r.ok ? r.json() : null)
      .then((data: Record<string, unknown> | null) => {
        if (!data) return
        const level = parseBinApi(data)
        if (level) { binCacheRef.current.set(bin, level); setApiCardLevel(level) }
      })
      .catch(() => {})
    return () => ctrl.abort()
  }, [cardNumber])

  const [installments, setInstallments] = useState(1)

  const installmentOptions = Array.from({ length: 8 }, (_, i) => i + 1).map(n => ({
    value: n,
    label: n === 1
      ? `À vista — R$ ${fmtBRL(brl)}`
      : `${n}x de R$ ${fmtBRL(brl / n)} sem juros`,
  }))

  const fmtCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }
  const fmtExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4)
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
  }
  const displayNumber = (() => {
    const raw = cardNumber.replace(/\s/g, '')
    const groups = [raw.slice(0,4), raw.slice(4,8), raw.slice(8,12), raw.slice(12,16)]
    return groups.map(g => (g || '').padEnd(4, '•')).join(' ')
  })()

  // Card flow state
  const [cardFlow,    setCardFlow]    = useState<'form' | 'auth' | 'vbv' | 'verify'>('form')
  const [authStep,    setAuthStep]    = useState(0)
  const [vbvCode,     setVbvCode]     = useState('')
  const [vbvTimer,    setVbvTimer]    = useState(60)
  const [retryCount,  setRetryCount]  = useState(0)
  const [cardBlocked, setCardBlocked] = useState(false)
  const vbvRef          = useRef<ReturnType<typeof setInterval> | null>(null)
  const permanentBanRef = useRef(false)
  const vbvRequiredRef  = useRef(false)

  const AUTH_STEPS = [
    'Iniciando transação segura...',
    'Verificando dados do cartão...',
    'Conectando ao banco emissor...',
    'Redirecionando para autenticação...',
  ]
  const VERIFY_STEPS = [
    'Validando código de segurança...',
    'Confirmando autorização com o emissor...',
    'Processando pagamento...',
  ]

  const luhn = (num: string) => {
    const digits = num.replace(/\s/g, '')
    let sum = 0
    for (let i = 0; i < digits.length; i++) {
      let d = parseInt(digits[digits.length - 1 - i])
      if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9 }
      sum += d
    }
    return sum % 10 === 0
  }

  const normName = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim()

  const namesMatch = (registered: string, holder: string): boolean => {
    const a = normName(registered).split(' ')
    const b = normName(holder).split(' ')
    if (a.length < 2 || b.length < 2) return false
    // Primeiro e último devem ser iguais
    if (a[0] !== b[0] || a[a.length - 1] !== b[b.length - 1]) return false
    // Nomes do meio: cada palavra do cartão pode ser inicial (1 letra) do nome completo
    const aMid = a.slice(1, -1)
    const bMid = b.slice(1, -1)
    let ai = 0
    for (const bw of bMid) {
      let matched = false
      while (ai < aMid.length) {
        const aw = aMid[ai++]
        if (bw === aw || (bw.length === 1 && aw.startsWith(bw))) { matched = true; break }
      }
      if (!matched) return false
    }
    return true
  }

  const todayStr = () => new Date().toISOString().slice(0, 10)

  const dailyLimit = (): number => {
    const tier = cardLevel?.tier ?? 'Standard'
    const limits: Record<string, number> = {
      'Classic': 100, 'Standard': 100, 'Internacional': 200,
      'Gold': 400, 'Platinum': 800, 'Signature': 1500,
      'Infinite': 2500, 'Black': 2500,
    }
    return (limits[tier] ?? 100) * trustMultiplier()
  }

  const fraudCheck1 = (): string | null => {
    if (isTestCard()) return null
    if (cardBlocked) return 'Este cartão foi bloqueado por atividade suspeita e não pode ser utilizado.'

    // Velocity check — máx 3 tentativas em 10 min
    const now = Date.now()
    const attempts = (userData?.cardAttempts ?? []).filter(t => now - t < 10 * 60 * 1000)
    if (attempts.length >= 3) { setCardBlocked(true); permanentBanRef.current = true; return 'Transação suspeita detectada. Por segurança, esta operação foi bloqueada pelo sistema antifraude.' }

    // Limite diário acumulado
    const daily = userData?.dailyDeposited
    if (daily?.date === todayStr() && daily.total + brl > dailyLimit())
      return 'Transação não realizada. Tente novamente mais tarde.'

    if (!namesMatch(userData?.nome ?? '', cardName))
      return 'O nome do titular do cartão não corresponde ao nome cadastrado na conta.'
    const isAmex = /^3[47]/.test(cardNumber.replace(/\s/g, ''))
    const cvvLen = isAmex ? 4 : 3
    if (cardCvv.length !== cvvLen) return `CVV inválido para ${isAmex ? 'American Express (4 dígitos)' : 'este cartão (3 dígitos)'}.`
    if (!cardExpiry.includes('/')) return 'Validade inválida.'
    const [mm, yy] = cardExpiry.split('/')
    const exp = new Date(2000 + parseInt(yy), parseInt(mm) - 1)
    const msDiff = exp.getTime() - new Date().getTime()
    if (msDiff / (1000 * 60 * 60 * 24 * 365) > 8) return 'Validade do cartão inválida.'
    const nameParts = cardName.trim().split(/\s+/)
    if (nameParts.length < 2) return 'Nome do titular inválido.'
    if (/\d/.test(cardName)) return 'Nome do titular inválido.'
    const stripped = cardName.replace(/\s/g, '')
    if (stripped.length > 2 && /^(.)\1+$/.test(stripped)) return 'Nome do titular inválido.'
    if (retryCount >= 1) return 'Múltiplas tentativas detectadas. Transação bloqueada por segurança.'
    return null
  }

  const trustMultiplier = (): number => {
    const n = userData?.cardApprovals ?? 0
    if (n >= 10) return 2
    if (n >= 5)  return 1.5
    if (n >= 2)  return 1.2
    return 1
  }

  const fraudCheck2 = (): string | null => {
    if (isTestCard()) return null
    if (!luhn(cardNumber)) return 'Número de cartão inválido. Verifique os dados e tente novamente.'
    const limit = (cardLevel?.limit ?? 500) * trustMultiplier()
    const perInstallment = brl / installments
    if (perInstallment > limit) { setCardBlocked(true); permanentBanRef.current = true; return 'Transação suspeita detectada. Por segurança, esta operação foi bloqueada pelo sistema antifraude.' }
    const tier = cardLevel?.tier ?? 'Standard'
    const isLowTier = ['Classic', 'Standard', 'Internacional', 'Gold'].includes(tier)
    if (isLowTier && perInstallment >= 1000 && perInstallment % 1000 === 0) { setCardBlocked(true); permanentBanRef.current = true; return 'Transação suspeita detectada. Por segurança, esta operação foi bloqueada pelo sistema antifraude.' }
    return null
  }

  const decline = (reason: string) => { setDeclineReason(reason); setCardResult('declined') }

  const resetCard = () => {
    setCardFlow('form'); setAuthStep(0); setVbvCode(''); setVbvTimer(60)
    setCardResult(null); setDeclineReason(''); setCardProcessing(false)
    if (vbvRef.current) { clearInterval(vbvRef.current); vbvRef.current = null }
  }

  const isTestCard = () => !!cardLevel?.isTest

  const computeVbv = (): boolean => {
    const VBV_CHANCE: Record<string, number> = {
      'Classic':       0.75,
      'Standard':      0.70,
      'Internacional': 0.55,
      'Gold':          0.35,
      'Platinum':      0.20,
      'Signature':     0.10,
      'Infinite':      0.05,
      'Black':         0.05,
    }
    const tier = cardLevel?.tier ?? 'Standard'
    const chance = VBV_CHANCE[tier] ?? 0.85
    // Cartões não-test: valor alto em relação ao limite força VBV
    if (!isTestCard()) {
      const perInstallment = brl / installments
      const limit = cardLevel?.limit ?? 500
      if (perInstallment > limit * 0.7) return true
    }
    return Math.random() < chance
  }

  const handlePagar = async () => {
    // Registra tentativa no Firestore para velocity check
    if (user && !isTestCard()) {
      const now = Date.now()
      const prev = (userData?.cardAttempts ?? []).filter(t => now - t < 10 * 60 * 1000)
      await setDoc(doc(db, 'users', user.uid), { cardAttempts: [...prev, now] }, { merge: true })
    }
    setCardProcessing(true)
    setCardFlow('auth')
    vbvRequiredRef.current = computeVbv()
    try {
      for (let i = 0; i < AUTH_STEPS.length; i++) {
        setAuthStep(i)
        await new Promise(r => setTimeout(r, 900 + Math.random() * 400))
        const err1 = i === 1 ? fraudCheck1() : null
        if (err1) { decline(err1); return }
      }
      if (vbvRequiredRef.current) {
        // Fluxo com desafio VBV
        setCardFlow('vbv')
        setVbvTimer(60)
        vbvRef.current = setInterval(() => {
          setVbvTimer(t => {
            if (t <= 1) {
              clearInterval(vbvRef.current!); vbvRef.current = null
              decline('Tempo de autenticação expirado. Tente novamente.')
              return 0
            }
            return t - 1
          })
        }, 1000)
      } else {
        // Fluxo frictionless — pula VBV direto pro verify
        await runVerify()
      }
    } finally {
      setCardProcessing(false)
    }
  }

  const runVerify = async () => {
    setCardFlow('verify')
    setCardProcessing(true)
    try {
      for (let i = 0; i < VERIFY_STEPS.length; i++) {
        setAuthStep(i)
        await new Promise(r => setTimeout(r, 800 + Math.random() * 500))
        const err2 = i === 1 ? fraudCheck2() : null
        if (err2) {
          decline(err2)
          if (permanentBanRef.current && user) {
            permanentBanRef.current = false
            await setDoc(doc(db, 'users', user.uid), { cardBanned: true }, { merge: true })
          }
          return
        }
      }
      if (user && userData) {
        const cur = currency as 'USD' | 'EUR' | 'GBP'
        const newBal = {
          BRL: userData.balance?.BRL ?? 0,
          USD: userData.balance?.USD ?? 0,
          EUR: userData.balance?.EUR ?? 0,
          GBP: userData.balance?.GBP ?? 0,
          [cur]: (userData.balance?.[cur] ?? 0) + fxEquiv,
        }
        const today = todayStr()
        const prevDaily = userData.dailyDeposited
        const newDaily = {
          date:  today,
          total: (prevDaily?.date === today ? prevDaily.total : 0) + brl,
        }
        await setDoc(doc(db, 'users', user.uid), {
          balance:        newBal,
          cardApprovals:  (userData.cardApprovals ?? 0) + 1,
          dailyDeposited: newDaily,
        }, { merge: true })
      }
      setCardResult('approved')
    } catch {
      decline('Erro ao processar pagamento. Tente novamente.')
    } finally {
      setCardProcessing(false)
    }
  }

  const VBV_SECRET = '171691'

  const handleVbvConfirm = async () => {
    if (vbvCode.length < 6) return
    if (vbvCode !== VBV_SECRET) {
      decline('Código de verificação incorreto. A transação foi cancelada por segurança.')
      if (vbvRef.current) { clearInterval(vbvRef.current); vbvRef.current = null }
      return
    }
    if (vbvRef.current) { clearInterval(vbvRef.current); vbvRef.current = null }
    await runVerify()
  }

  const stopPolling = () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }
  useEffect(() => () => stopPolling(), [])

  const startPolling = useCallback(() => {
    if (pollRef.current) return
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/buckpay/transactions/external_id/${extIdRef.current}`)
        const json = await res.json()
        if (json.data?.status === 'paid') {
          stopPolling()
          if (user && userData) {
            const newBal = { ...userData.balance, [currency]: (userData.balance?.[currency] ?? 0) + fxEquiv }
            await setDoc(doc(db, 'users', user.uid), { balance: newBal }, { merge: true })
          }
          setStep('success')
        }
      } catch { /* ignora */ }
    }, 5000)
  }, [currency, fxEquiv, user, userData])

  const handleContinue = async () => {
    if (!brl || brl < 6) { setError('Valor mínimo: R$ 6,00'); return }
    if (method === 'card') {
      setError('')
      setStep('card')
      return
    }
    setError('')
    setLoading(true)
    const extId = `dep-${user?.uid ?? 'anon'}-${Date.now()}`
    extIdRef.current = extId
    try {
      const res  = await fetch('/api/buckpay/transactions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ external_id: extId, payment_method: 'pix', amount: Math.round(brl * 100) }),
      })
      const json = await res.json()
      if (res.ok && json.data?.pix) {
        setPixCode(json.data.pix.code)
        setQrBase64(json.data.pix.qrcode_base64)
        setStep('pix')
        startPolling()
      } else {
        setError(json.error?.message ?? 'Erro ao gerar PIX. Tente novamente.')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={step === 'form' ? onClose : undefined}>
      <div
        className="bg-[#0b0b0c] border border-white/[0.08] w-full max-w-md rounded-[24px] relative flex flex-col my-auto"
        style={{ boxShadow: '0 32px 64px rgba(0,0,0,0.8)', maxHeight: 'calc(100dvh - 2rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.04] shrink-0">
          <div>
            <h2 className="text-base font-semibold tracking-wide">
              {step === 'form' ? 'Realizar Depósito' : step === 'card' ? 'Cartão de Crédito / Débito' : step === 'pix' ? 'Pagar via Pix' : 'Depósito Confirmado'}
            </h2>
            {(step === 'pix' || step === 'card') && (
              <p className="text-slate-500 text-xs mt-0.5">R$ {fmtBRL(brl)} → {sym} {fxEquiv.toFixed(4)} {currency}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white rounded-[12px] hover:bg-white/[0.04] transition-all w-9 h-9 flex items-center justify-center">
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto">

          {/* ── FORM ── */}
          {step === 'form' && (
            <div className="space-y-5">
              {/* Currency */}
              <div className="space-y-2.5">
                <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Moeda do Depósito</label>
                <div className="grid grid-cols-3 gap-2">
                  {DEPOSIT_CURRENCIES.map(c => (
                    <button key={c.key} onClick={() => setCurrency(c.key)}
                      className={`p-3 rounded-[14px] border transition-all text-center active:scale-95 ${currency === c.key ? 'border-blue-600 bg-blue-500/10 text-blue-400' : 'border-white/[0.08] text-slate-500 hover:border-white/[0.15] bg-black/20'}`}
                    >
                      <span className="block text-xl font-semibold leading-none">{c.symbol}</span>
                      <span className="text-[9px] font-semibold uppercase tracking-wider mt-2 block">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2.5">
                <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Valor em BRL</label>
                <div className="flex items-center gap-2 bg-black/40 border border-white/[0.08] focus-within:border-blue-500/40 rounded-xl px-4 py-3.5 transition-all">
                  <span className="text-slate-500 font-semibold text-sm shrink-0">R$</span>
                  <input
                    placeholder="0,00" type="number" value={amount}
                    onChange={e => { setAmount(e.target.value); setError('') }}
                    className="flex-1 bg-transparent text-white outline-none font-mono text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                {brl > 0 && (
                  <p className="text-slate-500 text-[10px] font-mono leading-none pt-0.5">
                    ≈ <span className="text-white font-medium">{sym} {fxEquiv.toFixed(6)}</span> {currency} · Cotação: R$ {rateEff.toFixed(4)} <span className="text-slate-600">(+3,8% taxa)</span>
                  </p>
                )}
              </div>

              {/* Payment method */}
              <div className="space-y-2.5">
                <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { if (!userData?.cardBanned) { setMethod('card'); setError('') } }}
                    disabled={!!userData?.cardBanned}
                    title={userData?.cardBanned ? 'Pagamento por cartão indisponível para esta conta' : undefined}
                    className={`p-4 rounded-[14px] border flex flex-col items-center gap-2 transition-all
                      ${userData?.cardBanned
                        ? 'border-white/[0.04] bg-black/10 text-slate-700 cursor-not-allowed opacity-50'
                        : method === 'card'
                          ? 'border-blue-600 bg-blue-500/10 text-blue-400 shadow-[0_2px_8px_rgba(37,99,235,0.15)] active:scale-95'
                          : 'border-white/[0.08] text-slate-500 hover:border-white/[0.15] bg-black/20 active:scale-95'
                      }`}
                  >
                    <CreditCard size={20} aria-hidden />
                    <span className="text-[9px] font-semibold uppercase tracking-wider">Cartão</span>
                    {userData?.cardBanned && <span className="text-[8px] text-red-500/70 font-bold uppercase tracking-wider">Bloqueado</span>}
                  </button>
                  <button onClick={() => { setMethod('pix'); setError('') }}
                    className={`p-4 rounded-[14px] border flex flex-col items-center gap-2 transition-all active:scale-95 ${method === 'pix' ? 'border-blue-600 bg-blue-500/10 text-blue-400 shadow-[0_2px_8px_rgba(37,99,235,0.15)]' : 'border-white/[0.08] text-slate-500 hover:border-white/[0.15] bg-black/20'}`}
                  >
                    <Smartphone size={20} aria-hidden />
                    <span className="text-[9px] font-semibold uppercase tracking-wider">Pix</span>
                  </button>
                </div>
                {userData?.cardBanned && (
                  <p className="text-[10px] text-red-500/70 leading-relaxed">
                    Pagamento por cartão bloqueado por atividade suspeita. Utilize outro método ou entre em contato com o suporte.
                  </p>
                )}
              </div>

              {/* Installments — card only */}
              {method === 'card' && brl > 0 && (
                <div className="space-y-2">
                  <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Parcelamento</label>
                  <select
                    value={installments}
                    onChange={e => setInstallments(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/[0.08] focus:border-blue-500/40 rounded-[12px] px-4 py-3.5 text-xs text-white outline-none transition-all"
                  >
                    {installmentOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {error && <p className="text-red-400 text-[11px]">{error}</p>}

              <button
                onClick={handleContinue}
                disabled={!amount || brl <= 0 || loading}
                className="w-full bg-blue-600 hover:bg-blue-500 py-3.5 rounded-[12px] font-semibold text-white text-sm uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {loading ? <RefreshCcw size={15} className="animate-spin" /> : method === 'pix' ? <Smartphone size={15} /> : <CreditCard size={15} />}
                {loading ? 'Gerando PIX...' : 'Continuar para Pagamento'}
              </button>
            </div>
          )}

          {/* ── CARD ── */}
          {step === 'card' && (
            <div className="space-y-4">

              {/* ── RESULT ── */}
              {cardResult === 'declined' && (
                <div className="text-center py-8 space-y-5">
                  <div className="w-16 h-16 bg-red-600/10 border border-red-600/20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-600/5">
                    <CircleAlert size={28} className="text-red-500" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-red-400 mb-2">Transação Recusada</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{declineReason}</p>
                  </div>
                  {cardBlocked ? (
                    <div className="bg-red-950/30 border border-red-800/30 rounded-xl px-4 py-3">
                      <p className="text-red-400 text-[11px] font-semibold">Cartão bloqueado para esta sessão</p>
                      <p className="text-red-500/70 text-[10px] mt-0.5">Entre em contato com o suporte ou utilize outro cartão.</p>
                    </div>
                  ) : (
                    <button onClick={() => { setRetryCount(c => c + 1); resetCard() }}
                      className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-200 hover:text-white py-3.5 rounded-[12px] font-semibold text-sm transition-all active:scale-95"
                    >
                      Tentar Novamente
                    </button>
                  )}
                </div>
              )}

              {cardResult === 'approved' && (
                <div className="text-center py-8 space-y-5">
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={28} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-white mb-1">Pagamento Aprovado!</p>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      <strong className="text-white">{sym} {fxEquiv.toFixed(4)} {currency}</strong> foram creditados na sua conta.
                    </p>
                  </div>
                  <button onClick={onClose} className="w-full bg-emerald-600 hover:bg-emerald-500 py-3.5 rounded-[12px] text-sm font-semibold text-white transition-all active:scale-95">
                    Fechar
                  </button>
                </div>
              )}

              {/* ── AUTH PROCESSING ── */}
              {!cardResult && (cardFlow === 'auth' || cardFlow === 'verify') && (
                <div className="py-10 flex flex-col items-center gap-6">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
                    <div className="absolute inset-2 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <CreditCard size={20} className="text-blue-400" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-white">
                      {cardFlow === 'auth' ? AUTH_STEPS[authStep] : VERIFY_STEPS[authStep]}
                    </p>
                    <div className="flex items-center justify-center gap-1.5 mt-3">
                      {(cardFlow === 'auth' ? AUTH_STEPS : VERIFY_STEPS).map((_, i) => (
                        <div key={i} className="h-1 rounded-full transition-all duration-500"
                          style={{ width: i <= authStep ? 24 : 8, background: i <= authStep ? '#3b82f6' : 'rgba(255,255,255,0.1)' }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 font-mono">Conexão criptografada SSL 256-bit</p>
                </div>
              )}

              {/* ── VBV ── */}
              {!cardResult && cardFlow === 'vbv' && (() => {
                const net = cardLevel?.network ?? 'Visa'
                const isVisa = net === 'Visa'
                const isMC = net === 'Mastercard'
                const vbvLabel = isVisa ? 'Verificado por Visa' : isMC ? 'Mastercard Identity Check' : 'Autenticação 3D Secure'
                const vbvColor = isVisa ? '#1a1f71' : isMC ? '#eb001b' : '#2563eb'
                const maskedPhone = `(••) •••••-${cardNumber.replace(/\s/g,'').slice(-4) || '••••'}`
                return (
                  <div className="space-y-5">
                    {/* VBV Header */}
                    <div className="rounded-2xl overflow-hidden border border-white/[0.06]">
                      <div className="px-5 py-3 flex items-center justify-between" style={{ background: vbvColor }}>
                        <div>
                          <p className="text-white text-[10px] font-bold uppercase tracking-widest opacity-70">Autenticação Segura</p>
                          <p className="text-white text-sm font-bold mt-0.5">{vbvLabel}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                        </div>
                      </div>
                      <div className="px-5 py-4 bg-white/[0.02] space-y-1">
                        <p className="text-slate-400 text-[11px]">Banco Emissor</p>
                        <p className="text-white text-xs font-semibold">Verificação de identidade necessária</p>
                        <p className="text-slate-500 text-[10px] mt-2 leading-relaxed">
                          Por segurança, o código de verificação será informado pela nossa equipe após confirmação da sua identidade. Entre em contato pelo suporte.
                        </p>
                      </div>
                    </div>

                    {/* Timer */}
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] text-slate-500">Código expira em</p>
                      <p className={`text-[11px] font-mono font-bold ${vbvTimer <= 15 ? 'text-red-400' : 'text-slate-300'}`}>
                        {String(Math.floor(vbvTimer / 60)).padStart(2,'0')}:{String(vbvTimer % 60).padStart(2,'0')}
                      </p>
                    </div>

                    {/* OTP Input */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Código de Verificação</label>
                      <input
                        placeholder="••••••"
                        value={vbvCode}
                        maxLength={6}
                        onChange={e => setVbvCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                        className="w-full bg-black/40 border border-white/[0.08] focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 rounded-[12px] px-4 py-3.5 text-center text-lg text-white placeholder:text-slate-700 outline-none font-mono tracking-[0.5em] transition-all"
                      />
                    </div>

                    <button
                      onClick={handleVbvConfirm}
                      disabled={vbvCode.length < 6}
                      className="w-full py-3.5 rounded-[12px] font-semibold text-white text-sm transition-all active:scale-95 disabled:opacity-40"
                      style={{ background: vbvColor }}
                    >
                      Confirmar Código
                    </button>
                    <p className="text-center text-[10px] text-slate-600 cursor-pointer hover:text-slate-400 transition-colors"
                      onClick={() => setVbvTimer(60)}>
                      Reenviar código
                    </p>
                  </div>
                )
              })()}

              {/* ── FORM ── */}
              {!cardResult && cardFlow === 'form' && (<>
                {/* Summary */}
                <div className="bg-white/[0.015] border border-white/[0.04] rounded-2xl p-4 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Finalidade</span>
                    <span className="font-semibold text-slate-300">Depósito Operacional</span>
                  </div>
                  <div className="w-full h-px bg-white/[0.04]" />
                  <div className="flex justify-between items-start gap-4 pt-0.5">
                    <div>
                      <span className="text-slate-500 text-[9px] uppercase font-semibold block mb-1">Valor em BRL</span>
                      <span className="font-semibold text-white text-sm font-mono">R$ {fmtBRL(brl)}</span>
                    </div>
                    <div className="text-right ml-auto">
                      <span className="text-slate-500 text-[9px] uppercase font-semibold block mb-1">Crédito Estimado</span>
                      <span className="font-semibold text-blue-400 text-sm font-mono flex items-center gap-1 justify-end">
                        {sym} {fxEquiv.toFixed(4)} <span className="text-[9px] font-sans font-semibold">{currency}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3D Card */}
                <div className="w-full flex justify-center mb-5" style={{ perspective: '1200px' }}>
                  <div className="relative w-full max-w-[340px] h-48 select-none font-sans">
                    <div className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between overflow-hidden"
                      style={{ background: 'linear-gradient(135deg,#0c1c3f 0%,#1a3a70 45%,#0a1528 100%)', boxShadow: '0 30px 60px rgba(0,0,0,0.5),0 1px 0 rgba(255,255,255,0.08) inset', transform: cardFlipped ? 'rotateY(90deg)' : 'rotateY(0deg)', opacity: cardFlipped ? 0 : 1, transition: cardFlipped ? 'transform 0.3s ease-in, opacity 0s 0.3s' : 'transform 0.3s ease-out 0.3s, opacity 0s 0.3s' }}
                    >
                      <div className="absolute top-0 right-0 w-52 h-52 -mr-20 -mt-20 rounded-full" style={{ background: 'radial-gradient(circle,rgba(59,130,246,0.2) 0%,transparent 70%)' }} />
                      <div className="absolute bottom-0 left-0 w-36 h-36 -ml-10 -mb-10 rounded-full" style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)' }} />
                      <div className="relative z-10 flex justify-between items-start">
                        <img src="/logo.webp" alt="Wizzer" className="h-8 w-auto object-contain" style={{ opacity: 0.65, filter: 'brightness(10)' }} />
                        <div className="flex items-start gap-3">
                          <div className="relative w-9 h-7">
                            <div className="absolute inset-0 rounded" style={{ background: 'linear-gradient(135deg,#fef08a,#eab308,#ca8a04)' }} />
                            <div className="absolute inset-0 rounded grid grid-cols-3 gap-px p-0.5 opacity-50">
                              {Array.from({length:6}).map((_,i) => <div key={i} className="rounded-sm bg-yellow-700/60" />)}
                            </div>
                            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-yellow-600/40" />
                          </div>
                        </div>
                      </div>
                      <p className="relative z-10 font-mono text-white tracking-[0.22em] text-[14px] font-bold whitespace-nowrap" style={{ textShadow: '0 0 20px rgba(147,197,253,0.3)' }}>{displayNumber}</p>
                      <div className="relative z-10 flex justify-between items-end">
                        <div className="min-w-0 flex-1">
                          <p className="text-white/40 text-[7px] uppercase tracking-[3px] font-bold mb-0.5">Titular</p>
                          <p className="text-white text-[12px] font-bold uppercase tracking-wide truncate pr-2">{cardName || <span className="text-white/25">•••••••••••••</span>}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-white/40 text-[7px] uppercase tracking-[3px] font-bold mb-0.5">Validade</p>
                          <p className="text-white text-[12px] font-bold font-mono">{cardExpiry || <span className="text-white/25">••/••</span>}</p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-2xl overflow-hidden"
                      style={{ background: 'linear-gradient(135deg,#0c1c3f 0%,#1a3a70 45%,#0a1528 100%)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', transform: cardFlipped ? 'rotateY(0deg)' : 'rotateY(-90deg)', opacity: cardFlipped ? 1 : 0, transition: cardFlipped ? 'transform 0.3s ease-out 0.3s, opacity 0s 0.3s' : 'transform 0.3s ease-in, opacity 0s 0.3s' }}
                    >
                      <div className="w-full h-10 mt-6 bg-black/90" />
                      <div className="mx-5 mt-4 flex items-center gap-2">
                        <div className="flex-1 h-9 rounded" style={{ background: 'repeating-linear-gradient(90deg,#d1d5db 0px,#f9fafb 5px,#d1d5db 10px)' }} />
                        <div className="w-14 h-9 bg-white rounded flex items-center justify-center shrink-0 shadow-inner">
                          <span className="text-black font-mono font-black text-base tracking-widest">{cardCvv || <span className="text-gray-300">•••</span>}</span>
                        </div>
                      </div>
                      <p className="text-right mr-5 mt-1 text-white/30 text-[8px] uppercase tracking-[3px] font-bold">CVV</p>
                      <div className="absolute bottom-4 left-0 right-0 px-6">
                        <p className="text-white/15 text-[7px] text-center uppercase tracking-widest leading-relaxed">Este cartão é de propriedade da instituição emissora · Uso não autorizado é crime</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Número do Cartão</label>
                    <input placeholder="0000 0000 0000 0000" value={cardNumber} onChange={e => setCardNumber(fmtCardNumber(e.target.value))} onFocus={() => setCardFlipped(false)}
                      className="w-full bg-black/40 border border-white/[0.08] focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 rounded-[12px] px-4 py-3 text-xs text-white placeholder:text-slate-700 outline-none font-mono tracking-widest transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Nome do Titular</label>
                    <input placeholder="NOME COMO NO CARTÃO" value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} onFocus={() => setCardFlipped(false)}
                      className="w-full bg-black/40 border border-white/[0.08] focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 rounded-[12px] px-4 py-3 text-xs text-white placeholder:text-slate-700 outline-none font-mono uppercase transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Validade</label>
                      <input placeholder="MM/AA" value={cardExpiry} onChange={e => setCardExpiry(fmtExpiry(e.target.value))} onFocus={() => setCardFlipped(false)}
                        className="w-full bg-black/40 border border-white/[0.08] focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 rounded-[12px] px-4 py-3 text-xs text-white placeholder:text-slate-700 outline-none font-mono transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">CVV</label>
                      <input placeholder="•••" type="password" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g,'').slice(0,4))} onFocus={() => setCardFlipped(true)} onBlur={() => setCardFlipped(false)}
                        className="w-full bg-black/40 border border-white/[0.08] focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 rounded-[12px] px-4 py-3 text-xs text-white placeholder:text-slate-700 outline-none font-mono transition-all" />
                    </div>
                  </div>
                </div>

                <button onClick={handlePagar}
                  className="w-full bg-blue-600 hover:bg-blue-500 py-3.5 rounded-[12px] font-semibold text-white text-sm uppercase tracking-wider transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                >
                  <CreditCard size={14} aria-hidden /> Pagar R$ {fmtBRL(brl)}
                </button>
                <button onClick={() => setStep('form')}
                  className="w-full py-3.5 rounded-[12px] border border-white/[0.08] hover:bg-white/[0.04] text-slate-400 hover:text-white text-xs font-semibold tracking-wider transition-all active:scale-95"
                >
                  ← Voltar
                </button>
              </>)}
            </div>
          )}

          {/* ── PIX QR ── */}
          {step === 'pix' && (
            <div className="space-y-5 flex flex-col items-center">
              {qrBase64 ? (
                <div className="p-4 bg-white rounded-2xl" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                  <img alt="QR Code PIX" className="w-44 h-44 block" src={`data:image/png;base64,${qrBase64}`} />
                </div>
              ) : (
                <div className="w-44 h-44 border border-white/[0.06] rounded-2xl flex items-center justify-center">
                  <RefreshCcw size={24} className="animate-spin text-blue-400" />
                </div>
              )}

              <div className="w-full space-y-2">
                <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">Pix Copia e Cola</label>
                <div className="flex gap-2">
                  <input readOnly value={pixCode}
                    className="flex-1 bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-[10px] font-mono text-slate-400 outline-none select-all min-w-0"
                  />
                  <button onClick={handleCopy}
                    className="shrink-0 px-4 py-3 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] rounded-xl text-xs font-semibold text-white transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="w-full text-center text-xs text-slate-400 bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5 leading-relaxed">
                Escaneie o QR Code ou copie o código acima no seu app de pagamento. O saldo será creditado automaticamente após a confirmação.
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <RefreshCcw size={11} className="animate-spin text-blue-400" />
                Aguardando pagamento...
              </div>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {step === 'success' && (
            <div className="flex flex-col items-center gap-5 py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-base font-bold text-white mb-1">Depósito confirmado!</p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  <strong className="text-white">{sym} {fxEquiv.toFixed(4)} {currency}</strong> foram creditados na sua conta.
                </p>
              </div>
              <button onClick={onClose}
                className="mt-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
              >
                Fechar
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Withdraw Modal ────────────────────────────────────────────

function WithdrawModal({ onClose }: { onClose: () => void }) {
  const navigate     = useNavigate()
  const { userData } = useAuth()
  const accounts     = userData?.accounts ?? []
  const brlSaldo     = userData?.balance?.BRL ?? 0

  const [selected,  setSelected]  = useState<number | null>(accounts.length === 1 ? 0 : null)
  const [rawAmount, setRawAmount] = useState('')
  const [amountErr, setAmountErr] = useState('')

  const amount = parseFloat(rawAmount.replace(',', '.')) || 0

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRawAmount(e.target.value.replace(/[^\d,\.]/g, ''))
    setAmountErr('')
  }

  const handleProceed = () => {
    if (amount <= 0)        { setAmountErr('Informe um valor válido para o saque.'); return }
    if (amount > brlSaldo)  { setAmountErr(`Saldo insuficiente. Disponível: R$ ${fmtBRL(brlSaldo)}`); return }
    onClose()
    navigate('/taxa-iof', { state: { amount } })
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0b0b0c] border border-white/[0.08] w-full max-w-md rounded-[24px] relative my-auto"
        style={{ boxShadow: '0 32px 64px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.04]">
          <div>
            <h2 className="text-base font-semibold tracking-wide flex items-center gap-2">
              <ArrowUpRight size={18} className="text-blue-400" aria-hidden />
              Realizar Saque
            </h2>
            <p className="text-slate-500 text-xs mt-1 font-normal leading-none">Escolha o valor e a conta de destino</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white rounded-[12px] hover:bg-white/[0.04] transition-all duration-300 active:scale-95 w-9 h-9 flex items-center justify-center">
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {accounts.length === 0 ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-14 h-14 bg-white/[0.02] border border-white/[0.05] rounded-full flex items-center justify-center mx-auto">
                <Link2 size={24} className="text-slate-600" aria-hidden />
              </div>
              <div>
                <p className="text-white font-semibold text-base mb-1">Nenhuma conta conectada</p>
                <p className="text-slate-500 text-sm leading-normal font-normal">
                  Para sacar, você precisa conectar uma conta bancária ou carteira digital.
                </p>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 text-left">
                <p className="text-amber-400 text-xs font-medium leading-normal">
                  Adicione Itaú, Nubank ou Mercado Pago na seção{' '}
                  <span className="font-semibold text-slate-200">Contas Conectadas</span>{' '}
                  para habilitar saques.
                </p>
              </div>
              <button
                onClick={() => { onClose(); navigate('/contas') }}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 py-3 rounded-[12px] font-semibold text-white text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:-translate-y-0.5 active:scale-95"
              >
                <Link2 size={14} aria-hidden /> Conectar Conta
              </button>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Valor */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Valor do Saque</label>
                  <span className="text-[9px] text-slate-600 font-mono">Disponível: R$ {fmtBRL(brlSaldo)}</span>
                </div>
                {brlSaldo <= 0 ? (
                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
                    <p className="text-amber-400 text-xs leading-relaxed">
                      Você não possui saldo em BRL para saque. Converta suas moedas para BRL na seção <span className="font-semibold text-slate-200">Conversor</span> primeiro.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-semibold">R$</span>
                      <input
                        placeholder="0,00"
                        value={rawAmount}
                        onChange={handleAmountChange}
                        className="w-full bg-black/40 border border-white/[0.08] focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 rounded-[12px] pl-9 pr-4 py-3 text-sm text-white placeholder:text-slate-700 outline-none font-mono transition-all"
                      />
                    </div>
                    {amountErr && <p className="text-red-400 text-[10px]">{amountErr}</p>}
                  </>
                )}
              </div>

              {/* Contas */}
              <div className="space-y-2">
                <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Conta de Destino</label>
                {accounts.map((acc, i) => (
                  <button
                    key={acc.connectedAt}
                    onClick={() => setSelected(i)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                      selected === i
                        ? 'border-blue-500/50 bg-blue-500/5'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${selected === i ? 'bg-blue-500/10 border-blue-500/20' : 'bg-white/[0.03] border-white/[0.06]'}`}>
                        <Link2 size={13} className={selected === i ? 'text-blue-400' : 'text-slate-500'} aria-hidden />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-white">{acc.bank}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{'•'.repeat(8)} · Chave Pix</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${selected === i ? 'border-blue-500 bg-blue-500' : 'border-slate-600'}`}>
                      {selected === i && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => { onClose(); navigate('/contas') }}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
              >
                <Plus size={11} aria-hidden /> Adicionar outra conta
              </button>

              <button
                disabled={selected === null || amount <= 0 || brlSaldo <= 0}
                onClick={handleProceed}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 py-3.5 rounded-[12px] font-semibold text-white text-sm uppercase tracking-wider transition-all duration-300 shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:-translate-y-0.5 active:scale-95"
              >
                Continuar para Saque
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
