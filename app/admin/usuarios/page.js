'use client'
import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'

export default function UsuariosPage() {
  const [usuarios, setUsuarios]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [criando, setCriando]     = useState(false)
  const [form, setForm]           = useState({ nome:'', email:'', senha:'' })
  const [msg, setMsg]             = useState({ texto:'', tipo:'' })
  const [showSenha, setShowSenha] = useState(false)

  useEffect(() => { carregarUsuarios() }, [])

  async function carregarUsuarios() {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/usuarios')
      const data = await res.json()
      setUsuarios(data.usuarios || [])
    } catch { setUsuarios([]) }
    finally { setLoading(false) }
  }

  async function criarUsuario(e) {
    e.preventDefault()
    setMsg({ texto:'', tipo:'' })
    if (form.senha.length < 6) return setMsg({ texto:'A senha deve ter pelo menos 6 caracteres.', tipo:'erro' })
    setCriando(true)
    try {
      const res  = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.erro) throw new Error(data.erro)
      setMsg({ texto:'✅ Usuário criado com sucesso!', tipo:'ok' })
      setForm({ nome:'', email:'', senha:'' })
      await carregarUsuarios()
    } catch(err) {
      setMsg({ texto:'❌ ' + err.message, tipo:'erro' })
    } finally { setCriando(false) }
  }

  async function deletarUsuario(id, email) {
    if (!confirm(`Remover o usuário ${email}?`)) return
    try {
      const res  = await fetch(`/api/admin/usuarios?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.erro) throw new Error(data.erro)
      setMsg({ texto:'✅ Usuário removido.', tipo:'ok' })
      await carregarUsuarios()
    } catch(err) {
      setMsg({ texto:'❌ ' + err.message, tipo:'erro' })
    }
  }

  return (
    <Layout title="Gerenciar usuários">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, maxWidth:900 }}>

        {/* Formulário criar usuário */}
        <div className="card">
          <div className="card-title">➕ Novo usuário administrador</div>

          <form onSubmit={criarUsuario}>
            <div className="fg">
              <label>Nome completo *</label>
              <input type="text" value={form.nome} required
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Nome do usuário"/>
            </div>
            <div className="fg">
              <label>Email *</label>
              <input type="email" value={form.email} required
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@dominio.com.br"/>
            </div>
            <div className="fg">
              <label>Senha *</label>
              <div style={{ position:'relative' }}>
                <input type={showSenha ? 'text' : 'password'} value={form.senha} required
                  onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  style={{ paddingRight: 40 }}/>
                <button type="button" onClick={() => setShowSenha(!showSenha)} style={{
                  position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', fontSize:15, color:'var(--muted)',
                }}>{showSenha ? '🙈' : '👁️'}</button>
              </div>
              <span className="hint">Mínimo 6 caracteres. Recomendado: letras, números e símbolos.</span>
            </div>

            {msg.texto && (
              <div style={{
                padding:'10px 14px', borderRadius:'var(--r8)', fontSize:13, marginBottom:14,
                background: msg.tipo==='ok' ? 'var(--green-lt)' : 'var(--rose-lt)',
                color:      msg.tipo==='ok' ? 'var(--green)'    : 'var(--rose)',
                border:     `1px solid ${msg.tipo==='ok' ? '#bbf7d0' : '#fecdd3'}`,
              }}>{msg.texto}</div>
            )}

            <button type="submit" className="btn btn-primary" disabled={criando}>
              {criando ? '⏳ Criando…' : '➕ Criar usuário'}
            </button>
          </form>
        </div>

        {/* Lista de usuários */}
        <div className="card">
          <div className="card-title">👥 Usuários cadastrados</div>
          {loading ? (
            <div style={{ color:'var(--muted)', fontSize:13 }}>Carregando…</div>
          ) : usuarios.length === 0 ? (
            <div className="empty" style={{ padding:20 }}>
              <div className="empty-icon">👤</div>
              <div className="empty-txt">Nenhum usuário encontrado.</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {usuarios.map(u => (
                <div key={u.id} style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'10px 14px', background:'var(--subtle)',
                  borderRadius:'var(--r8)', border:'1px solid var(--border)',
                }}>
                  <div style={{
                    width:34, height:34, borderRadius:'50%',
                    background:'linear-gradient(135deg, var(--blue), #7c3aed)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:12, fontWeight:800, color:'#fff', flexShrink:0,
                  }}>
                    {(u.nome || u.email).slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{u.nome || '—'}</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{u.email}</div>
                  </div>
                  <span style={{
                    fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99,
                    background:'var(--blue-lt)', color:'var(--blue)',
                  }}>Admin</span>
                  <button className="btn btn-rose" style={{ padding:'5px 10px', fontSize:11 }}
                    onClick={() => deletarUsuario(u.id, u.email)}>
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
