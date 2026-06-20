import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCcw } from 'lucide-react'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import DashboardNav from '../components/DashboardNav'
import Footer from '../components/Footer'

interface Transaction {
  id: string
  type: 'convert' | 'buy' | 'withdraw' | 'deposit'
  fromCurrency: string
  toCurrency: string
  fromAmount: number
  toAmount: number
  rate: number
  status: 'completed' | 'pending' | 'failed'
  createdAt: { toDate: () => Date; seconds?: number }
}

const TYPE_LABEL: Record<string, string> = {
  convert: 'Conversão',
  buy:     'Compra',
  withdraw:'Saque',
  deposit: 'Depósito',
}

const STATUS_COLOR: Record<string, string> = {
  completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  pending:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  failed:    'text-red-400 bg-red-500/10 border-red-500/20',
}

const STATUS_LABEL: Record<string, string> = {
  completed: 'Concluído',
  pending:   'Pendente',
  failed:    'Falhou',
}

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.012)',
  backdropFilter: 'blur(60px)',
}

export default function Status() {
  const { user } = useAuth()
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    const load = async () => {
      try {
        const q = query(
          collection(db, 'transactions'),
          where('uid', '==', user.uid),
          orderBy('createdAt', 'desc')
        )
        const snap = await getDocs(q)
        setTxs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)))
      } catch {
        try {
          const q2 = query(collection(db, 'transactions'), where('uid', '==', user.uid))
          const snap2 = await getDocs(q2)
          const rows = snap2.docs
            .map(d => ({ id: d.id, ...d.data() } as Transaction))
            .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
          setTxs(rows)
        } catch {
          // sem permissão ou sem índice
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>
      <DashboardNav />

      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-28 pb-16 relative z-10">

        <div className="mb-8">
          <div className="flex items-center gap-3.5 mb-2">
            <div className="w-10 h-10 bg-white/[0.02] border border-white/[0.06] rounded-2xl flex items-center justify-center">
              <RefreshCcw size={16} className="text-blue-400" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Histórico de Transações</h1>
              <p className="text-slate-500 text-xs mt-0.5">Acompanhe o processamento de saques, depósitos e conversões.</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>

        ) : txs.length === 0 ? (
          <div className="border border-white/[0.04] rounded-3xl p-8 text-center flex flex-col items-center gap-5" style={glass}>
            <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.04] rounded-full flex items-center justify-center">
              <RefreshCcw size={24} className="text-slate-600" aria-hidden />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white mb-1">Nenhuma transação encontrada</h3>
              <p className="text-xs text-slate-500 leading-normal">Você ainda não realizou nenhuma movimentação na sua conta.</p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-all duration-200 active:scale-95"
            >
              Voltar ao Dashboard
            </Link>
          </div>

        ) : (
          <div className="space-y-3">
            {txs.map(tx => (
              <div
                key={tx.id}
                className="border border-white/[0.04] rounded-2xl p-4 sm:p-5 flex items-center justify-between"
                style={glass}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <RefreshCcw size={14} className="text-blue-400" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{TYPE_LABEL[tx.type] ?? tx.type}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      {tx.fromCurrency} → {tx.toCurrency}
                      {tx.createdAt?.toDate && (
                        <> · {tx.createdAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-semibold text-white font-mono tabular-nums">
                    {tx.fromAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${STATUS_COLOR[tx.status] ?? STATUS_COLOR.completed}`}>
                    {STATUS_LABEL[tx.status] ?? 'Concluído'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-[0_8px_30px_rgba(37,99,235,0.35)] z-[250] bg-blue-600 hover:bg-blue-500 text-white transition-all duration-300 ease-out active:scale-90 outline-none select-none"
        aria-label="Abrir suporte"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse" aria-hidden>
          <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    </div>
  )
}
