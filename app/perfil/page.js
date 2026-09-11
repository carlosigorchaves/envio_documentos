'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase'

export default function PerfilPage() {
  const router = useRouter()
  const [user, setUser]           = useState(null)
  const [nome, setNome]           = useState('')
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha]   = useState('')
  const [confirmar, setConfirmar]   = useState('')
  const [msgPerfil, setMsgPerfil]   = useState('')
  const [msgSenha, setMsgSenha]     = useState('')
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) { router.push('/login'); return }
      setUser(data.user)
      setNome(data.user.user_metadata?.nome || '')
    })
  }, [router])

  async function salvarPerfil() {
    setLoading(true); setMsgPerfil('')
    try {
      const { error } = await supabase.auth.updateUser({
        data: { nome }
      })
      if (error) throw error
      setMsgPerfil('✅ Perfil atualizado com sucesso!')
    } catch(err) {
      setMsgPerfil('❌ Erro: ' + err.message)
    } finally { setLoading(false) }
  }

  async function alterarSenha() {
    setMsgSenha('')
    if (!novaSenha) return setMsgSenha('❌ Informe a nova senha.')
    if (novaSenha !== confirmar) return setMsgSenha('❌ As senhas não coincidem.')
    if (novaSenha.length < 6) return setMsgSenha('❌ A senha deve ter pelo menos 6 caracteres.')

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha })
      if (error) throw error
      setMsgSenha('✅ Senha alterada com sucesso!')
      setSenhaAtual(''); setNovaSenha(''); setConfirmar('')
    } catch(err) {
      setMsgSenha('❌ Erro: ' + err.message)
    } finally { setLoading(false) }
  }

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return null

  const iniciais = (nome || user.email || '?').slice(0,2).toUpperCase()

  return (
    <Layout title="Meu Perfil">
      <div style={{ maxWidth: 560 }}>

        {/* Avatar e dados básicos */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b5bdb, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
              {iniciais}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{nome || 'Usuário'}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{user.email}</div>
              <div style={{ marginTop: 4 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 10px',
                  borderRadius: 99, background: 'var(--blue-lt)', color: 'var(--blue)',
                }}>
                  Administrador
                </span>
              </div>
            </div>
          </div>

          <div className="card-title">👤 Dados do perfil</div>
          <div className="fg">
            <label>Nome completo</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Seu nome completo"/>
          </div>
          <div className="fg">
            <label>Email</label>
            <input type="text" value={user.email} disabled
              style={{ opacity: .6, cursor: 'not-allowed' }}/>
          </div>

          {msgPerfil && (
            <div style={{ fontSize: 13, marginBottom: 12,
              color: msgPerfil.startsWith('✅') ? 'var(--green)' : 'var(--rose)' }}>
              {msgPerfil}
            </div>
          )}

          <button className="btn btn-primary" onClick={salvarPerfil}
            disabled={loading} style={{ maxWidth: 200 }}>
            💾 Salvar perfil
          </button>
        </div>

        {/* Alterar senha */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">🔐 Alterar senha</div>

          <div className="fg">
            <label>Nova senha</label>
            <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"/>
          </div>
          <div className="fg">
            <label>Confirmar nova senha</label>
            <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)}
              placeholder="Repita a nova senha"/>
          </div>

          {msgSenha && (
            <div style={{ fontSize: 13, marginBottom: 12,
              color: msgSenha.startsWith('✅') ? 'var(--green)' : 'var(--rose)' }}>
              {msgSenha}
            </div>
          )}

          <button className="btn btn-sm" onClick={alterarSenha} disabled={loading}>
            🔑 Alterar senha
          </button>
        </div>

        {/* Sair */}
        <div className="card">
          <div className="card-title">🚪 Sessão</div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
            Conectado como <strong>{user.email}</strong>
          </p>
          <button className="btn btn-rose" onClick={sair}>
            🚪 Sair do sistema
          </button>
        </div>
      </div>
    </Layout>
  )
}
