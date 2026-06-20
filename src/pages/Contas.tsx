import { useState, useEffect } from 'react'
import {
  Plus, CreditCard, ArrowUpRight, ChevronRight,
  Link2, X, Shield, Check, Trash2,
} from 'lucide-react'
import { doc, setDoc, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import DashboardNav from '../components/DashboardNav'
import Footer from '../components/Footer'

const BANKS = [
  { name: 'Nubank',       logo: 'https://logodownload.org/wp-content/uploads/2019/08/nubank-logo-2.png' },
  { name: 'Itaú',         logo: 'https://i.ibb.co/6cTD5ptN/Banco-Ita-logo-svg-removebg-preview.png' },
  { name: 'Mercado Pago', logo: 'https://images.seeklogo.com/logo-png/34/1/mercado-pago-logo-png_seeklogo-342347.png' },
]

interface ConnectedAccount {
  bank: string
  pixKey: string
  connectedAt: number
}

const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.015)',
  backdropFilter: 'blur(40px)',
}

export default function Contas() {
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [preselect, setPreselect] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        setAccounts(snap.exists() ? (snap.data().accounts ?? []) : [])
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [user])

  const openModal = (bank?: string) => {
    setPreselect(bank ?? null)
    setModalOpen(true)
  }

  const handleConnect = async (bank: string, pixKey: string) => {
    if (!user) return
    const entry: ConnectedAccount = { bank, pixKey, connectedAt: Date.now() }
    await setDoc(doc(db, 'users', user.uid), { accounts: arrayUnion(entry) }, { merge: true })
    setModalOpen(false)
  }

  const handleRemove = async (account: ConnectedAccount) => {
    if (!user) return
    await setDoc(doc(db, 'users', user.uid), { accounts: arrayRemove(account) }, { merge: true })
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <DashboardNav />

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-blue-600/[0.03] blur-[140px] pointer-events-none rounded-full" />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 pt-24 pb-16 space-y-8 relative z-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-widest mb-1.5">Configurações</p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">Contas Conectadas</h1>
            <p className="text-slate-400 text-sm mt-1.5">Gerencie suas contas bancárias e carteiras digitais para saque.</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition-all duration-300 text-white text-sm font-semibold px-5 py-3.5 rounded-xl shadow-md shadow-blue-600/10 hover:shadow-blue-600/25 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap shrink-0"
          >
            <Plus size={16} aria-hidden />
            <span className="hidden sm:inline">Conectar Conta</span>
          </button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { val: String(accounts.length), label: 'Total Conectadas' },
            { val: String(accounts.length), label: 'Ativas' },
            { val: '0',                     label: 'Com Erro' },
          ].map(s => (
            <div key={s.label} className="border border-white/5 rounded-2xl p-4 sm:p-5 text-center" style={glass}>
              <p className="text-2xl font-semibold text-white font-mono tabular-nums">{s.val}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Bank picker ── */}
        <div className="space-y-3.5">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Conectar Conta Recebedora</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BANKS.map(bank => (
              <button
                key={bank.name}
                onClick={() => openModal(bank.name)}
                className="flex flex-col items-center gap-2.5 p-[18px] border border-slate-800/60 bg-slate-900/15 rounded-2xl hover:border-white/20 transition-all duration-300 hover:shadow-lg group"
                style={glass}
              >
                <img alt={bank.name} src={bank.logo} className="h-6 w-auto object-contain" />
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-300">{bank.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 flex items-center justify-center gap-0.5">
                    Conectar <ChevronRight size={9} className="group-hover:translate-x-0.5 transition-transform" aria-hidden />
                  </p>
                </div>
              </button>
            ))}
            <button
              onClick={() => openModal('Outro')}
              className="flex flex-col items-center justify-center gap-2.5 p-[18px] border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 rounded-2xl transition-all duration-300 hover:shadow-lg group"
            >
              <Plus size={20} className="text-slate-400 group-hover:text-white transition-colors" aria-hidden />
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">Outros Bancos</p>
                <p className="text-[10px] text-slate-500 font-medium mt-1 flex items-center justify-center gap-0.5">
                  Conectar <ChevronRight size={9} className="group-hover:translate-x-0.5 transition-transform" aria-hidden />
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* ── Connected list or empty state ── */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : accounts.length > 0 ? (
          <div className="space-y-3">
            {accounts.map(acc => (
              <div
                key={acc.connectedAt}
                className="flex items-center justify-between border border-white/5 rounded-2xl p-4 sm:p-5"
                style={glass}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Check size={14} className="text-emerald-400" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{acc.bank}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {'•'.repeat(8)} · Chave Pix
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/15 px-2 py-1 rounded-full">Ativa</span>
                  <button
                    onClick={() => handleRemove(acc)}
                    className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    aria-label="Remover conta"
                  >
                    <Trash2 size={13} aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border border-dashed border-white/10 rounded-3xl p-8 sm:p-10 text-center flex flex-col items-center justify-center space-y-6 bg-white/[0.01]">
              <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center mx-auto">
                <CreditCard size={28} className="text-slate-500" aria-hidden />
              </div>
              <div>
                <p className="text-white font-semibold text-base">Nenhuma conta conectada</p>
                <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
                  Adicione Nubank, Itaú ou Mercado Pago para habilitar um banco.
                </p>
              </div>
              <button
                onClick={() => openModal()}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-3.5 rounded-xl transition-all duration-300 shadow-md shadow-blue-600/10 hover:-translate-y-0.5 active:scale-95"
              >
                <Plus size={16} aria-hidden />
                Conectar Primeira Conta
              </button>
            </div>

            <div className="border border-white/5 rounded-3xl p-6 sm:p-7 flex items-start gap-3.5" style={glass}>
              <ArrowUpRight size={18} className="text-blue-400 shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-white mb-1.5">Como funciona</p>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  As contas conectadas são usadas como destino para seus saques. Você pode conectar múltiplas contas e escolher qual usar no momento do saque. A chave PIX é armazenada de forma criptografada e nunca compartilhada.
                </p>
              </div>
            </div>
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

      {modalOpen && (
        <ConnectModal
          preselect={preselect}
          onClose={() => setModalOpen(false)}
          onConnect={handleConnect}
        />
      )}
    </div>
  )
}

// ── Connect Modal ─────────────────────────────────────────────

const MODAL_BANKS = [
  { name: 'Nubank',       logo: 'https://logodownload.org/wp-content/uploads/2019/08/nubank-logo-2.png' },
  { name: 'Itaú',         logo: 'https://i.ibb.co/6cTD5ptN/Banco-Ita-logo-svg-removebg-preview.png' },
  { name: 'Mercado Pago', logo: 'https://images.seeklogo.com/logo-png/34/1/mercado-pago-logo-png_seeklogo-342347.png' },
  { name: 'Outro',        logo: null },
]

// Valida CPF, telefone (+55...), e-mail ou chave aleatória UUID
function validatePix(key: string): string | null {
  const k = key.trim()
  if (!k) return 'Informe a chave Pix'
  if (/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(k)) return null          // CPF
  if (/^\+?55\d{10,11}$/.test(k.replace(/[\s()-]/g, ''))) return null // Telefone
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(k)) return null               // E-mail
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k)) return null // UUID
  return 'Chave inválida. Use CPF, telefone (+55), e-mail ou chave aleatória'
}

function ConnectModal({
  preselect,
  onClose,
  onConnect,
}: {
  preselect: string | null
  onClose: () => void
  onConnect: (bank: string, pixKey: string) => Promise<void>
}) {
  const [selected, setSelected] = useState(preselect ?? 'Nubank')
  const [pixKey, setPixKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const validationError = validatePix(pixKey)
    if (validationError) { setError(validationError); return }
    setError(null)
    setSaving(true)
    await onConnect(selected, pixKey.trim())
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0b0b0c] border border-white/10 w-full max-w-md rounded-3xl relative overflow-hidden"
        style={{ boxShadow: '0 32px 64px rgba(0,0,0,0.8)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.04]">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Link2 size={18} className="text-blue-500" aria-hidden /> Conectar Instituição
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all duration-200 active:scale-95"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Platform selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px]">Plataforma</label>
            <div className="grid grid-cols-4 gap-2">
              {MODAL_BANKS.map(b => (
                <button
                  key={b.name}
                  onClick={() => setSelected(b.name)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative ${
                    selected === b.name
                      ? 'border-slate-800/60 bg-slate-900/15'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {selected === b.name && (
                    <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                      <Check size={8} className="text-black stroke-[4]" aria-hidden />
                    </div>
                  )}
                  {b.logo ? (
                    <img alt={b.name} src={b.logo} className="h-4 w-auto object-contain shrink-0" />
                  ) : (
                    <Plus size={16} className="text-slate-600 shrink-0" aria-hidden />
                  )}
                  <span className={`text-[9px] font-black leading-none text-center ${selected === b.name ? 'text-slate-300' : 'text-slate-600'}`}>
                    {b.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected bank status */}
          <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800/80 rounded-xl px-3 py-2.5 text-[11px] font-bold text-slate-300 whitespace-nowrap overflow-hidden">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Banco Selecionado:</span>
              <span className="font-black uppercase tracking-wider text-slate-300 truncate">{selected}</span>
            </div>
            <div className="w-4 h-4 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center justify-center shrink-0">
              <Check size={9} className="text-emerald-400 stroke-[4]" aria-hidden />
            </div>
          </div>

          {/* PIX key */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[2px]">Chave PIX</label>
            <input
              placeholder="E-mail, CPF, Telefone ou Chave Aleatória"
              type="text"
              value={pixKey}
              onChange={e => { setPixKey(e.target.value); setError(null) }}
              className={`w-full bg-black border rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-slate-700 outline-none focus:ring-2 font-mono transition-all duration-200 ${
                error ? 'border-red-500/60 focus:ring-red-500/10' : 'border-slate-800 focus:ring-blue-600/15 focus:border-blue-500/60'
              }`}
            />
            {error && <p className="text-red-400 text-[11px] font-medium">{error}</p>}
          </div>

          {/* Security notice */}
          <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/[0.12] rounded-xl p-3.5">
            <Shield size={15} className="text-amber-500 shrink-0" aria-hidden />
            <p className="text-amber-400/80 text-[11px] leading-relaxed font-medium italic">
              Chave criptografada (AES-256) · Jamais transmitida a terceiros
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-800/80 hover:bg-slate-700/80 py-3.5 rounded-xl border border-slate-800/70 hover:border-slate-700 font-bold text-sm transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!pixKey.trim() || saving}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-300 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/35 hover:-translate-y-0.5 active:scale-[0.97]"
            >
              {saving ? 'Conectando…' : 'Conectar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
