'use client'
import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import * as XLSX from 'xlsx'

const STATUS_LABEL = { pendente:'Pendente', enviado:'Enviado', visualizado:'Visualizado', assinado:'Assinado', rejeitado:'Rejeitado' }
const SITUACAO_LABEL = { ativo:'Ativo', demitido:'Demitido' }
const fmtData = iso => !iso ? '—' : new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})

// Modal de edição
function ModalEdicao({ colaborador, onSalvar, onFechar }) {
  const [form, setForm] = useState({
    nome:         colaborador.nome        || '',
    email:        colaborador.email       || '',
    cpf:          colaborador.cpf         || '',
    matricula:    colaborador.matricula   || '',
    cargo:        colaborador.cargo       || '',
    centro_custo: colaborador.centro_custo || '',
    situacao:     colaborador.situacao    || 'ativo',
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]         = useState('')

  async function salvar() {
    if (!form.nome || !form.email) return setErro('Nome e email são obrigatórios.')
    setSalvando(true); setErro('')
    try {
      const res  = await fetch(`/api/colaboradores/${colaborador.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (data.erro) throw new Error(data.erro)
      onSalvar(data.colaborador)
    } catch(err) {
      setErro(err.message)
    } finally { setSalvando(false) }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20,
    }} onClick={onFechar}>
      <div style={{
        background: 'var(--white)', borderRadius: 'var(--r12)',
        padding: 28, width: '100%', maxWidth: 520,
        boxShadow: '0 20px 60px rgba(0,0,0,.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h2 style={{ fontSize:16, fontWeight:700 }}>✏️ Editar colaborador</h2>
          <button onClick={onFechar} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--muted)' }}>×</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div className="fg" style={{ gridColumn:'1/-1' }}>
            <label>Nome completo *</label>
            <input type="text" value={form.nome} onChange={e => setForm(f=>({...f,nome:e.target.value}))} placeholder="Nome completo"/>
          </div>
          <div className="fg" style={{ gridColumn:'1/-1' }}>
            <label>Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="email@empresa.com"/>
          </div>
          <div className="fg">
            <label>Matrícula</label>
            <input type="text" value={form.matricula} onChange={e => setForm(f=>({...f,matricula:e.target.value}))} placeholder="Ex: 3839"/>
          </div>
          <div className="fg">
            <label>CPF</label>
            <input type="text" value={form.cpf} onChange={e => setForm(f=>({...f,cpf:e.target.value}))} placeholder="000.000.000-00"/>
          </div>
          <div className="fg">
            <label>Cargo</label>
            <input type="text" value={form.cargo} onChange={e => setForm(f=>({...f,cargo:e.target.value}))} placeholder="Ex: Analista"/>
          </div>
          <div className="fg">
            <label>Centro de custo</label>
            <input type="text" value={form.centro_custo} onChange={e => setForm(f=>({...f,centro_custo:e.target.value}))} placeholder="Ex: ADM-01"/>
          </div>
          <div className="fg" style={{ gridColumn:'1/-1' }}>
            <label>Situação</label>
            <select value={form.situacao} onChange={e => setForm(f=>({...f,situacao:e.target.value}))}
              style={{ width:'100%', background:'var(--white)', border:'1.5px solid var(--border)',
                borderRadius:'var(--r8)', color:'var(--ink)', padding:'9px 12px', fontSize:13, outline:'none' }}>
              <option value="ativo">✅ Ativo</option>
              <option value="demitido">🔴 Demitido</option>
            </select>
          </div>
        </div>

        {erro && (
          <div style={{ background:'var(--rose-lt)', border:'1px solid #fecdd3', borderRadius:'var(--r8)',
            padding:'10px 14px', fontSize:13, color:'var(--rose)', margin:'12px 0' }}>
            ⚠️ {erro}
          </div>
        )}

        <div style={{ display:'flex', gap:10, marginTop:20 }}>
          <button className="btn btn-primary" onClick={salvar} disabled={salvando} style={{ flex:1 }}>
            {salvando ? '⏳ Salvando…' : '💾 Salvar alterações'}
          </button>
          <button className="btn btn-sm" onClick={onFechar} style={{ minWidth:100 }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

export default function AcompanhamentoPage() {
  const [colaboradores, setColaboradores] = useState([])
  const [lotes, setLotes]                 = useState([])
  const [loteAtivo, setLoteAtivo]         = useState(null)
  const [filtro, setFiltro]               = useState('todos')
  const [filtroSituacao, setFiltroSituacao] = useState('ativo')
  const [busca, setBusca]                 = useState('')
  const [sincronizando, setSincronizando] = useState(false)
  const [msg, setMsg]                     = useState('')
  const [editando, setEditando]           = useState(null) // colaborador sendo editado
  const [confirmDelete, setConfirmDelete] = useState(null)

  const carregar = useCallback(async () => {
    const [rLotes, rCols] = await Promise.all([
      fetch('/api/lotes').then(r => r.json()),
      fetch('/api/colaboradores' + (loteAtivo ? `?lote=${loteAtivo}` : '')).then(r => r.json()),
    ])
    setLotes(Array.isArray(rLotes) ? rLotes : [])
    setColaboradores(Array.isArray(rCols) ? rCols : [])
  }, [loteAtivo])

  useEffect(() => { carregar() }, [carregar])
  useEffect(() => { const iv = setInterval(carregar, 30000); return () => clearInterval(iv) }, [carregar])

  async function sincronizar() {
    setSincronizando(true); setMsg('')
    try {
      const res  = await fetch('/api/sincronizar', { method: 'POST' })
      const data = await res.json()
      setMsg(data.mensagem || 'Sincronizado.')
      await carregar()
    } catch { setMsg('Erro ao sincronizar.') }
    finally { setSincronizando(false) }
  }

  async function excluir(col) {
    try {
      const res  = await fetch(`/api/colaboradores/${col.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.temDocumento) {
        // Oferece desativar
        if (confirm(`${col.nome} já tem documento na Autentique e não pode ser excluído.\n\nDeseja marcá-lo como Demitido?`)) {
          await fetch(`/api/colaboradores/${col.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ situacao: 'demitido' }),
          })
          await carregar()
          setMsg(`${col.nome} marcado como Demitido.`)
        }
        return
      }
      if (data.erro) throw new Error(data.erro)
      await carregar()
      setMsg(`${col.nome} excluído com sucesso.`)
    } catch(err) {
      setMsg('Erro: ' + err.message)
    } finally { setConfirmDelete(null) }
  }

  function onSalvar(colaboradorAtualizado) {
    setColaboradores(prev => prev.map(c => c.id === colaboradorAtualizado.id ? colaboradorAtualizado : c))
    setEditando(null)
    setMsg('✅ Colaborador atualizado com sucesso!')
  }

  // Exportar Excel
  function exportarExcel() {
    const dados = lista.map(c => ({
      'Matrícula':      c.matricula    || '',
      'Nome':           c.nome         || '',
      'Email':          c.email        || '',
      'CPF':            c.cpf          || '',
      'Cargo':          c.cargo        || '',
      'Centro de Custo': c.centro_custo || '',
      'Situação':       SITUACAO_LABEL[c.situacao] || c.situacao || 'Ativo',
      'Status Envio':   STATUS_LABEL[c.status]     || c.status,
      'Enviado em':     c.enviado_em     ? new Date(c.enviado_em).toLocaleString('pt-BR')     : '',
      'Visualizado em': c.visualizado_em ? new Date(c.visualizado_em).toLocaleString('pt-BR') : '',
      'Assinado em':    c.assinado_em    ? new Date(c.assinado_em).toLocaleString('pt-BR')    : '',
    }))
    const ws = XLSX.utils.json_to_sheet(dados)
    ws['!cols'] = [
      {wch:12},{wch:35},{wch:30},{wch:16},{wch:25},{wch:16},{wch:12},
      {wch:14},{wch:20},{wch:20},{wch:20},
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Colaboradores')
    XLSX.writeFile(wb, `colaboradores_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  // Filtros
  let lista = colaboradores
  if (filtro !== 'todos')       lista = lista.filter(c => c.status === filtro)
  if (filtroSituacao !== 'todos') lista = lista.filter(c => (c.situacao || 'ativo') === filtroSituacao)
  if (busca) lista = lista.filter(c =>
    (c.nome||'').toLowerCase().includes(busca.toLowerCase()) ||
    (c.email||'').toLowerCase().includes(busca.toLowerCase()) ||
    (c.matricula||'').includes(busca) ||
    (c.centro_custo||'').toLowerCase().includes(busca.toLowerCase())
  )

  const stats = {
    total:       colaboradores.length,
    enviado:     colaboradores.filter(c => c.status === 'enviado').length,
    visualizado: colaboradores.filter(c => c.status === 'visualizado').length,
    assinado:    colaboradores.filter(c => c.status === 'assinado').length,
    pendente:    colaboradores.filter(c => c.status === 'pendente').length,
    demitidos:   colaboradores.filter(c => c.situacao === 'demitido').length,
  }

  return (
    <Layout
      title="Acompanhamento"
      actions={
        <>
          <button className="btn btn-green" onClick={exportarExcel}>
            📥 Exportar Excel ({lista.length})
          </button>
          <button className="btn btn-teal" onClick={sincronizar} disabled={sincronizando}>
            {sincronizando ? '⏳ Sincronizando…' : '🔄 Sincronizar'}
          </button>
        </>
      }
    >
      {/* Modal de edição */}
      {editando && (
        <ModalEdicao
          colaborador={editando}
          onSalvar={onSalvar}
          onFechar={() => setEditando(null)}
        />
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10, marginBottom:20 }}>
        {[
          { label:'Total',        num: stats.total,       c:'#3b5bdb' },
          { label:'Enviados',     num: stats.enviado,     c:'#7c3aed' },
          { label:'Visualizados', num: stats.visualizado, c:'#0b9488' },
          { label:'Assinados',    num: stats.assinado,    c:'#15803d' },
          { label:'Pendentes',    num: stats.pendente,    c:'#b45309' },
          { label:'Demitidos',    num: stats.demitidos,   c:'#be123c' },
        ].map(s => (
          <div key={s.label} className="stat" style={{ '--c': s.c }}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div className="alert alert-info" style={{ marginBottom:16 }}>
          {msg}
          <button onClick={() => setMsg('')} style={{ background:'none', border:'none', cursor:'pointer', marginLeft:8, color:'inherit' }}>×</button>
        </div>
      )}

      {/* Lotes */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-title">📦 Lotes de envio</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button className={`lote-pill${loteAtivo===null?' sel':''}`} onClick={() => setLoteAtivo(null)}>
            Todos os lotes
          </button>
          {lotes.map(l => {
            const pct = l.total ? Math.round((l.assinado||0)/l.total*100) : 0
            return (
              <button key={l.loteId} className={`lote-pill${loteAtivo===l.loteId?' sel':''}`}
                onClick={() => setLoteAtivo(l.loteId)}>
                <div>
                  <div style={{ fontSize:12 }}>{l.total} colaboradores</div>
                  <div style={{ height:3, background:'var(--border)', borderRadius:2, width:60, marginTop:3 }}>
                    <div style={{ height:'100%', width:pct+'%', background:'var(--green)', borderRadius:2 }}/>
                  </div>
                </div>
                <span style={{ fontSize:10, opacity:.7 }}>{pct}% ✓</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tabela */}
      <div className="card">
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:14 }}>
          <input className="sinput" placeholder="🔍 Buscar nome, email, matrícula ou CC…"
            value={busca} onChange={e => setBusca(e.target.value)}/>
          <div style={{ flex:1 }}/>
          {/* Filtro situação */}
          <button className={`fbtn${filtroSituacao==='todos'?' on':''}`} onClick={() => setFiltroSituacao('todos')}>Todos</button>
          <button className={`fbtn${filtroSituacao==='ativo'?' on':''}`} onClick={() => setFiltroSituacao('ativo')}>✅ Ativos</button>
          <button className={`fbtn${filtroSituacao==='demitido'?' on':''}`} onClick={() => setFiltroSituacao('demitido')}>🔴 Demitidos</button>
          <div style={{ width:1, height:20, background:'var(--border)', margin:'0 4px' }}/>
          {/* Filtro status */}
          {['todos','pendente','enviado','visualizado','assinado','rejeitado'].map(f => (
            <button key={f} className={`fbtn${filtro===f?' on':''}`} onClick={() => setFiltro(f)}>
              {STATUS_LABEL[f] || 'Todos'}
            </button>
          ))}
        </div>

        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10 }}>
          Exibindo <strong>{lista.length}</strong> de <strong>{colaboradores.length}</strong> colaboradores
        </div>

        <div className="twrap">
          <table>
            <thead><tr>
              <th>Matrícula</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Cargo</th>
              <th>Centro Custo</th>
              <th>Situação</th>
              <th>Status</th>
              <th>Enviado</th>
              <th>Assinado</th>
              <th>Ações</th>
            </tr></thead>
            <tbody>
              {lista.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign:'center', padding:32, color:'var(--muted)' }}>
                  Nenhum colaborador encontrado.
                </td></tr>
              ) : lista.map(c => (
                <tr key={c.id} style={{ opacity: c.situacao === 'demitido' ? .6 : 1 }}>
                  <td className="mono">{c.matricula || c.cpf || '—'}</td>
                  <td><strong>{c.nome||''}</strong></td>
                  <td className="mono">{c.email||''}</td>
                  <td>{c.cargo||'—'}</td>
                  <td className="mono">{c.centro_custo||'—'}</td>
                  <td>
                    <span style={{
                      display:'inline-flex', alignItems:'center', gap:4,
                      padding:'2px 9px', borderRadius:99, fontSize:11, fontWeight:600,
                      background: c.situacao==='demitido' ? 'var(--rose-lt)' : 'var(--green-lt)',
                      color:      c.situacao==='demitido' ? 'var(--rose)'    : 'var(--green)',
                    }}>
                      {c.situacao==='demitido' ? '🔴 Demitido' : '✅ Ativo'}
                    </span>
                  </td>
                  <td><span className={`tag tag-${c.status}`}>{STATUS_LABEL[c.status]||c.status}</span></td>
                  <td className="mono">{fmtData(c.enviado_em)}</td>
                  <td className="mono">{fmtData(c.assinado_em)}</td>
                  <td>
                    <div style={{ display:'flex', gap:5 }}>
                      <button className="btn btn-sm" style={{ padding:'4px 10px', fontSize:11 }}
                        onClick={() => setEditando(c)} title="Editar">
                        ✏️
                      </button>
                      <button
                        className="btn btn-rose"
                        style={{ padding:'4px 10px', fontSize:11 }}
                        onClick={() => setConfirmDelete(c)}
                        title={c.document_id ? 'Desativar (tem documento)' : 'Excluir'}
                      >
                        {c.document_id ? '🔴' : '🗑'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999,
        }}>
          <div style={{ background:'var(--white)', borderRadius:'var(--r12)', padding:28, maxWidth:400, width:'100%' }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:12 }}>
              {confirmDelete.document_id ? '🔴 Desativar colaborador' : '🗑 Excluir colaborador'}
            </h3>
            <p style={{ fontSize:13, color:'var(--muted)', marginBottom:20, lineHeight:1.6 }}>
              {confirmDelete.document_id
                ? `"${confirmDelete.nome}" já possui documento enviado na Autentique e não pode ser excluído. Deseja marcá-lo como Demitido?`
                : `Tem certeza que deseja excluir "${confirmDelete.nome}"? Esta ação não pode ser desfeita.`
              }
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-rose" style={{ flex:1 }} onClick={() => excluir(confirmDelete)}>
                {confirmDelete.document_id ? '🔴 Marcar como Demitido' : '🗑 Excluir'}
              </button>
              <button className="btn btn-sm" style={{ flex:1 }} onClick={() => setConfirmDelete(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
