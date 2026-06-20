import { useState } from 'react'
import { TrendingUp, TrendingDown, RefreshCw, ChevronDown, ArrowRight, CheckCircle } from 'lucide-react'
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useRates } from '../hooks/useRates'
import DashboardNav from '../components/DashboardNav'
import Footer from '../components/Footer'

type CurrencyKey = 'USD' | 'EUR' | 'GBP'

const CURRENCY_META = [
  { key: 'USD' as CurrencyKey, label: 'Dólar',  desc: 'Dólar Americano', symbol: '$' },
  { key: 'EUR' as CurrencyKey, label: 'Euro',   desc: 'Euro',             symbol: '€' },
  { key: 'GBP' as CurrencyKey, label: 'Libra',  desc: 'Libra Esterlina', symbol: '£' },
]

export default function Converter() {
  const { user, userData, refreshUserData } = useAuth()
  const ratesInfo = useRates()

  const [activeIdx, setActiveIdx] = useState(0)
  const [convertFrom, setConvertFrom] = useState('')
  const [buyAmount, setBuyAmount]   = useState('')
  const [loadingConvert, setLoadingConvert] = useState(false)
  const [loadingBuy, setLoadingBuy]         = useState(false)
  const [successConvert, setSuccessConvert] = useState(false)
  const [successBuy, setSuccessBuy]         = useState(false)
  const [errorConvert, setErrorConvert]     = useState('')
  const [errorBuy, setErrorBuy]             = useState('')

  const cur     = CURRENCY_META[activeIdx]
  const rateInf = ratesInfo[cur.key]
  const rate    = rateInf.bid
  const bal = {
    BRL: userData?.balance?.BRL ?? 0,
    USD: userData?.balance?.USD ?? 0,
    EUR: userData?.balance?.EUR ?? 0,
    GBP: userData?.balance?.GBP ?? 0,
  }

  const brlReceive = convertFrom ? (parseFloat(convertFrom) * rate).toFixed(2) : ''
  const fxReceive  = buyAmount   ? (parseFloat(buyAmount)  / rate).toFixed(4) : ''

  const fmtBRL = (v: string | number) => {
    const n = typeof v === 'string' ? parseFloat(v) : v
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleConvert = async () => {
    if (!user || !convertFrom || parseFloat(convertFrom) <= 0) return
    const available = bal[cur.key] ?? 0
    const amount = Math.min(parseFloat(convertFrom), available)
    if (available <= 0 || amount <= 0) {
      setErrorConvert('Saldo insuficiente.')
      return
    }
    setLoadingConvert(true)
    setErrorConvert('')
    try {
      const brl = parseFloat((amount * rate).toFixed(2))
      const newFx  = parseFloat(((bal[cur.key] ?? 0) - amount).toFixed(8))
      const newBRL = parseFloat(((bal.BRL ?? 0) + brl).toFixed(2))

      await Promise.all([
        addDoc(collection(db, 'transactions'), {
          uid: user.uid,
          type: 'convert',
          fromCurrency: cur.key,
          toCurrency: 'BRL',
          fromAmount: amount,
          toAmount: brl,
          rate,
          status: 'completed',
          createdAt: serverTimestamp(),
        }),
        updateDoc(doc(db, 'users', user.uid), {
          'balance.BRL': newBRL,
          [`balance.${cur.key}`]: newFx,
        }),
      ])

      await refreshUserData()
      setConvertFrom('')
      setSuccessConvert(true)
      setTimeout(() => setSuccessConvert(false), 3000)
    } catch {
      setErrorConvert('Erro ao processar. Tente novamente.')
    } finally {
      setLoadingConvert(false)
    }
  }

  const handleBuy = async () => {
    if (!user || !buyAmount || parseFloat(buyAmount) <= 0) return
    const brlAvail = bal.BRL ?? 0
    const brl = Math.min(parseFloat(buyAmount), brlAvail)
    if (brlAvail <= 0 || brl <= 0) {
      setErrorBuy('Saldo em BRL insuficiente.')
      return
    }
    setLoadingBuy(true)
    setErrorBuy('')
    try {
      const fxAmount = parseFloat((brl / rate).toFixed(8))
      const newBRL = parseFloat(((bal.BRL ?? 0) - brl).toFixed(2))
      const newFx  = parseFloat(((bal[cur.key] ?? 0) + fxAmount).toFixed(8))

      await Promise.all([
        addDoc(collection(db, 'transactions'), {
          uid: user.uid,
          type: 'buy',
          fromCurrency: 'BRL',
          toCurrency: cur.key,
          fromAmount: brl,
          toAmount: fxAmount,
          rate,
          status: 'completed',
          createdAt: serverTimestamp(),
        }),
        updateDoc(doc(db, 'users', user.uid), {
          'balance.BRL': newBRL,
          [`balance.${cur.key}`]: newFx,
        }),
      ])

      await refreshUserData()
      setBuyAmount('')
      setSuccessBuy(true)
      setTimeout(() => setSuccessBuy(false), 3000)
    } catch {
      setErrorBuy('Erro ao processar. Tente novamente.')
    } finally {
      setLoadingBuy(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <DashboardNav />

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-blue-600/[0.03] blur-[140px] pointer-events-none rounded-full" />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-16 relative z-10">

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-1.5 text-white">Câmbio Internacional</h1>
          <p className="text-slate-400 text-sm font-medium">Compre moeda estrangeira com Cartão ou Pix · Spread 0.15%</p>
        </div>

        <div className="space-y-5">

          {/* ── Currency selector tabs ── */}
          <div className="grid grid-cols-3 gap-3">
            {CURRENCY_META.map((c, i) => {
              const active = activeIdx === i
              const r = ratesInfo[c.key]
              return (
                <button
                  key={c.key}
                  onClick={() => { setActiveIdx(i); setConvertFrom(''); setBuyAmount(''); setErrorConvert(''); setErrorBuy('') }}
                  className={`relative p-[18px] rounded-3xl border text-left transition-all duration-300 overflow-hidden ${
                    active
                      ? 'border-blue-600/30 bg-blue-600/[0.08] shadow-[0_4px_20px_rgba(37,99,235,0.2)]'
                      : 'border-white/5 hover:border-white/10 bg-white/[0.01]'
                  }`}
                  style={{ backdropFilter: active ? undefined : 'blur(20px)' }}
                >
                  {active && <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent pointer-events-none" />}
                  <div className={`text-2xl mb-1.5 leading-none font-semibold tracking-wider ${active ? 'text-blue-400' : 'text-slate-400'}`}>{c.key}</div>
                  <p className={`text-[10px] font-semibold uppercase tracking-widest mb-2.5 ${active ? 'text-blue-400' : 'text-slate-500'}`}>{c.label}</p>
                  <p className="text-white font-semibold font-mono text-sm tracking-tight mt-0.5 tabular-nums">{r.bid.toFixed(4)}</p>
                  <p className={`text-[9.5px] font-semibold font-mono tracking-tight mt-1 tabular-nums ${r.up ? 'text-emerald-400' : 'text-red-400'}`}>
                    {r.up ? '▲' : '▼'}{r.pct.toFixed(2)}%
                  </p>
                </button>
              )
            })}
          </div>

          {/* ── Info bar ── */}
          <div className="flex items-center justify-between p-[18px] rounded-3xl border border-blue-600/30 bg-blue-600/[0.08]">
            <div className="flex items-center gap-3.5">
              <span className="text-3xl leading-none">{cur.key}</span>
              <div>
                <p className="text-white font-semibold">{cur.desc}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5 tabular-nums">1 {cur.key} = R$ {rate.toFixed(4)}</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-semibold tabular-nums ${rateInf.up ? 'text-emerald-400' : 'text-red-400'}`}>
              {rateInf.up ? <TrendingUp size={14} aria-hidden /> : <TrendingDown size={14} aria-hidden />}
              {rateInf.up ? '+' : ''}{rateInf.pct.toFixed(2)}% hoje
            </div>
          </div>

          {/* ── Convert FX → BRL ── */}
          <div className="border border-blue-600/15 rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.015)', backdropFilter: 'blur(40px)' }}>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">Converter para Real (BRL)</h2>
              <p className="text-[11.5px] text-slate-400 mt-1.5 leading-relaxed font-medium">
                Transforme seu saldo em {cur.desc} em Real Brasileiro para habilitar o saque.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Você converte</label>
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] text-slate-400 font-mono tabular-nums">Saldo: {cur.symbol} {(bal[cur.key] ?? 0).toFixed(4)}</span>
                  <button onClick={() => setConvertFrom((bal[cur.key] ?? 0).toFixed(4))} className="text-[9px] text-blue-400 hover:text-blue-300 font-semibold uppercase tracking-wider bg-blue-500/10 px-2.5 py-1 rounded-lg hover:bg-blue-500/20 transition-all">
                    Usar Tudo
                  </button>
                </div>
              </div>
              <div className="flex items-center rounded-2xl px-5 py-4 gap-3 border border-blue-600/30 bg-black/40 focus-within:ring-2 focus-within:ring-blue-500/25 transition-all duration-300">
                <span className="text-base font-semibold shrink-0 text-blue-400">{cur.symbol}</span>
                <input
                  placeholder="0.00" type="number" value={convertFrom}
                  onChange={e => { setConvertFrom(e.target.value); setErrorConvert('') }}
                  className="flex-1 bg-transparent text-white outline-none font-mono font-semibold text-2xl min-w-0 placeholder:text-slate-700 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold uppercase tracking-widest text-slate-400 bg-slate-900/70 border-slate-800/80 shrink-0">
                  <span>{cur.key}</span><ChevronDown size={12} aria-hidden />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.04]" />
              <div className="flex items-center gap-2.5">
                <RefreshCw size={13} className="text-slate-500" aria-hidden />
                <span className="text-[10px] text-slate-500 font-mono tracking-tight tabular-nums whitespace-nowrap">
                  1 {cur.key} = R$ {rate.toFixed(4)}
                </span>
              </div>
              <div className="flex-1 h-px bg-white/[0.04]" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Você recebe</label>
              <div className="flex items-center border border-white/5 bg-black/40 rounded-2xl px-5 py-4 gap-3">
                <span className="text-slate-400 text-base font-semibold shrink-0">R$</span>
                <span className="flex-1 font-mono font-semibold text-2xl tabular-nums text-slate-700">
                  {brlReceive ? fmtBRL(brlReceive) : '0,00'}
                </span>
                <span className="text-slate-500 text-xs font-semibold shrink-0">BRL</span>
              </div>
            </div>

            {errorConvert && <p className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-xl py-2.5">{errorConvert}</p>}

            {successConvert ? (
              <div className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle size={16} aria-hidden /> Conversão realizada com sucesso!
              </div>
            ) : (
              <button
                onClick={handleConvert}
                disabled={!convertFrom || parseFloat(convertFrom) <= 0 || loadingConvert}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-white text-sm transition-all duration-300 shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5 active:scale-95 bg-blue-600 hover:enabled:bg-blue-500 shadow-blue-600/25"
              >
                {loadingConvert
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><ArrowRight size={16} aria-hidden /> Converter {cur.key} para Real (BRL)</>
                }
              </button>
            )}

            <p className="text-center text-[10px] text-slate-500 font-mono leading-relaxed">
              * O saldo ficará disponível em Reais (BRL) na sua conta e você poderá acessar a aba inicial para sacá-lo.
            </p>
          </div>

          {/* ── Buy FX with BRL ── */}
          <div className="border border-white/5 rounded-3xl p-6 sm:p-8 space-y-6" style={{ background: 'rgba(255,255,255,0.015)', backdropFilter: 'blur(40px)' }}>
            <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Comprar Moeda Estrangeira</h2>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Você paga</label>
                <span className="text-[10px] text-slate-400 font-mono tabular-nums">Saldo: R$ {fmtBRL(bal.BRL ?? 0)}</span>
              </div>
              <div className="flex items-center border border-white/5 bg-black/40 rounded-2xl px-5 py-4 gap-3 focus-within:ring-2 focus-within:ring-blue-500/25 transition-all duration-300">
                <span className="text-slate-400 text-base font-semibold shrink-0">R$</span>
                <input
                  placeholder="0,00" type="number" value={buyAmount}
                  onChange={e => { setBuyAmount(e.target.value); setErrorBuy('') }}
                  className="flex-1 bg-transparent text-white outline-none font-mono font-semibold text-2xl min-w-0 placeholder:text-slate-700 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-slate-500 text-xs font-semibold shrink-0">BRL</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.04]" />
              <div className="flex items-center gap-2.5">
                <RefreshCw size={13} className="text-slate-500" aria-hidden />
                <span className="text-[10px] text-slate-500 font-mono tracking-tight tabular-nums whitespace-nowrap">
                  1 {cur.key} = R$ {rate.toFixed(4)}
                </span>
              </div>
              <div className="flex-1 h-px bg-white/[0.04]" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Você recebe</label>
              <div className="flex items-center rounded-2xl px-5 py-4 gap-3 border border-blue-600/30 bg-blue-600/[0.08]">
                <span className="text-base font-semibold shrink-0 text-blue-400">{cur.symbol}</span>
                <span className="flex-1 font-mono font-semibold text-2xl tabular-nums text-slate-700">{fxReceive || '0.0000'}</span>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold uppercase tracking-widest text-slate-400 bg-slate-900/70 border-slate-800/80 shrink-0">
                  <span>{cur.key}</span><ChevronDown size={12} aria-hidden />
                </button>
              </div>
            </div>

            {errorBuy && <p className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-xl py-2.5">{errorBuy}</p>}

            {successBuy ? (
              <div className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle size={16} aria-hidden /> Compra realizada com sucesso!
              </div>
            ) : (
              <button
                onClick={handleBuy}
                disabled={!buyAmount || parseFloat(buyAmount) <= 0 || loadingBuy}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-white text-sm transition-all duration-300 shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5 active:scale-95 bg-blue-600 hover:enabled:bg-blue-500 shadow-blue-600/25"
              >
                {loadingBuy
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><ArrowRight size={16} aria-hidden /> Comprar {cur.symbol} {cur.key} Agora</>
                }
              </button>
            )}

            <p className="text-center text-[10px] text-slate-500 font-mono leading-relaxed">
              Cartão de Crédito / Débito ou Pix · Crédito em até 7 segundos após confirmação
            </p>
          </div>

        </div>
      </main>

      <Footer />

      <button className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-[0_8px_30px_rgba(37,99,235,0.35)] z-[250] bg-blue-600 hover:bg-blue-500 text-white transition-all duration-300 ease-out active:scale-90 outline-none select-none" aria-label="Abrir suporte">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse" aria-hidden>
          <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </div>
  )
}
