'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [modo, setModo]           = useState('login') // 'login' | 'recuperar'
  const [email, setEmail]         = useState('')
  const [senha, setSenha]         = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [erro, setErro]           = useState('')
  const [sucesso, setSucesso]     = useState('')
  const [loading, setLoading]     = useState(false)

  async function login(e) {
    e.preventDefault()
    setErro(''); setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) throw error
      router.push('/envio')
    } catch {
      setErro('Email ou senha incorretos. Tente novamente.')
    } finally { setLoading(false) }
  }

  async function recuperarSenha(e) {
    e.preventDefault()
    setErro(''); setSucesso(''); setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })
      if (error) throw error
      setSucesso('Email enviado! Verifique sua caixa de entrada para redefinir a senha.')
    } catch {
      setErro('Erro ao enviar email. Verifique se o endereço está correto.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f2f8 0%, #e8ecf8 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo/Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #3b5bdb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 20px rgba(99,102,241,.35)',
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M6 14l5 5 11-11" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0e1117', marginBottom: 4 }}>
            Gestão de Documentos
          </h1>
          <p style={{ fontSize: 13, color: '#8891a8' }}>
            {modo === 'login' ? 'Faça login para continuar' : 'Recuperação de senha'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: 16,
          border: '1px solid #e2e5ef', padding: 32,
          boxShadow: '0 4px 24px rgba(0,0,0,.08)',
        }}>

          {/* LOGIN */}
          {modo === 'login' && (
            <form onSubmit={login}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#8891a8', marginBottom: 6 }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com.br" required
                  style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #e2e5ef',
                    borderRadius:9, fontSize:14, outline:'none', color:'#0e1117',
                    transition:'border .15s', boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor='#3b5bdb'}
                  onBlur={e => e.target.style.borderColor='#e2e5ef'}
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#8891a8', marginBottom:6 }}>Senha</label>
                <div style={{ position: 'relative' }}>
                  <input type={showSenha ? 'text' : 'password'} value={senha}
                    onChange={e => setSenha(e.target.value)} placeholder="••••••••" required
                    style={{ width:'100%', padding:'11px 42px 11px 14px', border:'1.5px solid #e2e5ef',
                      borderRadius:9, fontSize:14, outline:'none', color:'#0e1117',
                      transition:'border .15s', boxSizing:'border-box' }}
                    onFocus={e => e.target.style.borderColor='#3b5bdb'}
                    onBlur={e => e.target.style.borderColor='#e2e5ef'}
                  />
                  <button type="button" onClick={() => setShowSenha(!showSenha)} style={{
                    position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#8891a8',
                  }}>{showSenha ? '🙈' : '👁️'}</button>
                </div>
              </div>

              {/* Link esqueceu senha */}
              <div style={{ textAlign: 'right', marginBottom: 20 }}>
                <button type="button" onClick={() => { setModo('recuperar'); setErro(''); setSucesso('') }}
                  style={{ background:'none', border:'none', cursor:'pointer',
                    fontSize:12, color:'#3b5bdb', fontWeight:600, padding:0 }}>
                  Esqueceu a senha?
                </button>
              </div>

              {erro && (
                <div style={{ background:'#fff1f2', border:'1px solid #fecdd3', borderRadius:8,
                  padding:'10px 14px', fontSize:13, color:'#be123c', marginBottom:16 }}>
                  ⚠️ {erro}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width:'100%', padding:'12px',
                background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #3b5bdb, #7c3aed)',
                color:'#fff', border:'none', borderRadius:9, fontSize:15, fontWeight:700,
                cursor: loading ? 'not-allowed' : 'pointer', transition:'all .15s',
                boxShadow: loading ? 'none' : '0 2px 12px rgba(99,102,241,.35)',
              }}>
                {loading ? '⏳ Entrando…' : '🔐 Entrar'}
              </button>
            </form>
          )}

          {/* RECUPERAR SENHA */}
          {modo === 'recuperar' && (
            <form onSubmit={recuperarSenha}>
              <p style={{ fontSize:13, color:'#8891a8', marginBottom:20, lineHeight:1.5 }}>
                Digite seu email e enviaremos um link para redefinir sua senha.
              </p>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#8891a8', marginBottom:6 }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com.br" required
                  style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #e2e5ef',
                    borderRadius:9, fontSize:14, outline:'none', color:'#0e1117',
                    transition:'border .15s', boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor='#3b5bdb'}
                  onBlur={e => e.target.style.borderColor='#e2e5ef'}
                />
              </div>

              {erro && (
                <div style={{ background:'#fff1f2', border:'1px solid #fecdd3', borderRadius:8,
                  padding:'10px 14px', fontSize:13, color:'#be123c', marginBottom:16 }}>
                  ⚠️ {erro}
                </div>
              )}

              {sucesso && (
                <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8,
                  padding:'10px 14px', fontSize:13, color:'#15803d', marginBottom:16 }}>
                  ✅ {sucesso}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width:'100%', padding:'12px', marginBottom:12,
                background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #3b5bdb, #7c3aed)',
                color:'#fff', border:'none', borderRadius:9, fontSize:15, fontWeight:700,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? '⏳ Enviando…' : '📧 Enviar link de recuperação'}
              </button>

              <button type="button" onClick={() => { setModo('login'); setErro(''); setSucesso('') }}
                style={{ width:'100%', padding:'10px', background:'var(--subtle)',
                  border:'1.5px solid #e2e5ef', borderRadius:9, fontSize:13,
                  fontWeight:600, cursor:'pointer', color:'#8891a8' }}>
                ← Voltar ao login
              </button>
            </form>
          )}
        </div>

        {/* Rodapé */}
        <div style={{ textAlign:'center', marginTop:24 }}>
          <p style={{ fontSize:11, color:'#b0b8cc' }}>
            Desenvolvido por <strong style={{ color:'#8891a8' }}>Unidade Estratégica</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
