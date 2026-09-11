'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [novaSenha, setNovaSenha]   = useState('')
  const [confirmar, setConfirmar]   = useState('')
  const [erro, setErro]             = useState('')
  const [sucesso, setSucesso]       = useState('')
  const [loading, setLoading]       = useState(false)
  const [pronto, setPronto]         = useState(false)

  useEffect(() => {
    // Verifica se tem sessão válida (vinda do link do email)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setPronto(true)
      else setErro('Link inválido ou expirado. Solicite um novo.')
    })
  }, [])

  async function redefinir(e) {
    e.preventDefault()
    setErro('')
    if (novaSenha !== confirmar) return setErro('As senhas não coincidem.')
    if (novaSenha.length < 6) return setErro('A senha deve ter pelo menos 6 caracteres.')
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha })
      if (error) throw error
      setSucesso('Senha redefinida com sucesso!')
      setTimeout(() => router.push('/envio'), 2000)
    } catch(err) {
      setErro('Erro ao redefinir: ' + err.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight:'100vh', background:'linear-gradient(135deg,#f0f2f8,#e8ecf8)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{
            width:56, height:56, borderRadius:16,
            background:'linear-gradient(135deg,#3b5bdb,#7c3aed)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 16px', boxShadow:'0 4px 20px rgba(99,102,241,.35)',
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M6 14l5 5 11-11" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#0e1117', marginBottom:4 }}>Redefinir senha</h1>
          <p style={{ fontSize:13, color:'#8891a8' }}>Digite sua nova senha abaixo</p>
        </div>

        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e2e5ef', padding:32, boxShadow:'0 4px 24px rgba(0,0,0,.08)' }}>
          {!pronto && erro ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
              <p style={{ color:'#be123c', fontSize:13 }}>{erro}</p>
              <button onClick={() => router.push('/login')} style={{
                marginTop:16, padding:'10px 20px', background:'#3b5bdb',
                color:'#fff', border:'none', borderRadius:9, cursor:'pointer', fontSize:13, fontWeight:600,
              }}>Voltar ao login</button>
            </div>
          ) : sucesso ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>✅</div>
              <p style={{ color:'#15803d', fontSize:13, fontWeight:600 }}>{sucesso}</p>
              <p style={{ color:'#8891a8', fontSize:12, marginTop:4 }}>Redirecionando…</p>
            </div>
          ) : (
            <form onSubmit={redefinir}>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#8891a8', marginBottom:6 }}>Nova senha</label>
                <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres" required
                  style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #e2e5ef',
                    borderRadius:9, fontSize:14, outline:'none', boxSizing:'border-box' }}/>
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#8891a8', marginBottom:6 }}>Confirmar nova senha</label>
                <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)}
                  placeholder="Repita a nova senha" required
                  style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #e2e5ef',
                    borderRadius:9, fontSize:14, outline:'none', boxSizing:'border-box' }}/>
              </div>
              {erro && (
                <div style={{ background:'#fff1f2', border:'1px solid #fecdd3', borderRadius:8,
                  padding:'10px 14px', fontSize:13, color:'#be123c', marginBottom:16 }}>⚠️ {erro}</div>
              )}
              <button type="submit" disabled={loading} style={{
                width:'100%', padding:'12px',
                background: loading ? '#a5b4fc' : 'linear-gradient(135deg,#3b5bdb,#7c3aed)',
                color:'#fff', border:'none', borderRadius:9, fontSize:15, fontWeight:700, cursor:'pointer',
              }}>{loading ? '⏳ Salvando…' : '🔐 Redefinir senha'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
