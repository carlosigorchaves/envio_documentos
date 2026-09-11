'use client'
import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import * as XLSX from 'xlsx'

const STATUS_LABEL = { pendente:'Pendente', enviado:'Enviado', visualizado:'Visualizado', assinado:'Assinado', rejeitado:'Rejeitado' }
const fmtData = iso => !iso ? '—' : new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})

export default function AcompanhamentoPage() {
  const [colaboradores, setColaboradores] = useState([])
  const [lotes, setLotes]                 = useState([])
  const [loteAtivo, setLoteAtivo]         = useState(null)
  const [filtro, setFiltro]               = useState('todos')
  const [busca, setBusca]                 = useState('')
  const [sincronizando, setSincronizando] = useState(false)
  const [msg, setMsg]                     = useState('')

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

  // Filtros aplicados
  let lista = colaboradores
  if (filtro !== 'todos') lista = lista.filter(c => c.status === filtro)
  if (busca) lista = lista.filter(c =>
    (c.nome||'').toLowerCase().includes(busca.toLowerCase()) ||
    (c.email||'').toLowerCase().includes(busca.toLowerCase()) ||
    (c.matricula||'').includes(busca) ||
    (c.cpf||'').includes(busca)
  )

  const stats = {
    total:       colaboradores.length,
    enviado:     colaboradores.filter(c => c.status === 'enviado').length,
    visualizado: colaboradores.filter(c => c.status === 'visualizado').length,
    assinado:    colaboradores.filter(c => c.status === 'assinado').length,
    pendente:    colaboradores.filter(c => c.status === 'pendente').length,
  }

  // Exportar Excel
  function exportarExcel() {
    const dados = lista.map(c => ({
      'Matrícula':    c.matricula || c.cpf || '',
      'Nome':         c.nome      || '',
      'Email':        c.email     || '',
      'Cargo':        c.cargo     || '',
      'Status':       STATUS_LABEL[c.status] || c.status,
      'Enviado em':   c.enviado_em    ? new Date(c.enviado_em).toLocaleString('pt-BR')    : '',
      'Visualizado em': c.visualizado_em ? new Date(c.visualizado_em).toLocaleString('pt-BR') : '',
      'Assinado em':  c.assinado_em   ? new Date(c.assinado_em).toLocaleString('pt-BR')   : '',
      'Rejeitado em': c.rejeitado_em  ? new Date(c.rejeitado_em).toLocaleString('pt-BR')  : '',
      'Lote':         c.lote_id       || '',
    }))

    const ws  = XLSX.utils.json_to_sheet(dados)
    const wb  = XLSX.utils.book_new()

    // Larguras das colunas
    ws['!cols'] = [
      { wch: 12 }, { wch: 35 }, { wch: 30 }, { wch: 25 },
      { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 25 },
    ]

    XLSX.utils.book_append_sheet(wb, ws, 'Acompanhamento')

    const filtroLabel = filtro !== 'todos' ? `_${filtro}` : ''
    const loteLabel   = loteAtivo ? `_${loteAtivo.slice(-6)}` : ''
    XLSX.writeFile(wb, `acompanhamento${filtroLabel}${loteLabel}_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  return (
    <Layout
      title="Acompanhamento"
      actions={
        <>
          <button className="btn btn-green" onClick={exportarExcel} title="Exportar lista atual para Excel">
            📥 Exportar Excel ({lista.length})
          </button>
          <button className="btn btn-teal" onClick={sincronizar} disabled={sincronizando}>
            {sincronizando ? '⏳ Sincronizando…' : '🔄 Sincronizar'}
          </button>
        </>
      }
    >
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total',        num: stats.total,       c:'#3b5bdb' },
          { label:'Enviados',     num: stats.enviado,     c:'#7c3aed' },
          { label:'Visualizados', num: stats.visualizado, c:'#0b9488' },
          { label:'Assinados',    num: stats.assinado,    c:'#15803d' },
          { label:'Pendentes',    num: stats.pendente,    c:'#b45309' },
        ].map(s => (
          <div key={s.label} className="stat" style={{ '--c': s.c }}>
            <div className="stat-num">{s.num}</div>
            <div className="stat-lbl">{s.label}</div>
            {s.label === 'Assinados' && stats.total > 0 &&
              <div className="stat-pct">{Math.round(s.num/stats.total*100)}% do total</div>}
          </div>
        ))}
      </div>

      {msg && <div className="alert alert-info" style={{ marginBottom:16 }}>✅ {msg}</div>}

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
          <input className="sinput" placeholder="🔍 Buscar nome, email ou matrícula…"
            value={busca} onChange={e => setBusca(e.target.value)}/>
          <div style={{ flex:1 }}/>
          {['todos','pendente','enviado','visualizado','assinado','rejeitado'].map(f => (
            <button key={f} className={`fbtn${filtro===f?' on':''}`} onClick={() => setFiltro(f)}>
              {STATUS_LABEL[f] || 'Todos'}
            </button>
          ))}
        </div>

        {/* Info de registros filtrados */}
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:10 }}>
          Exibindo <strong>{lista.length}</strong> de <strong>{colaboradores.length}</strong> colaboradores
          {filtro !== 'todos' && ` · Filtro: ${STATUS_LABEL[filtro]}`}
          {busca && ` · Busca: "${busca}"`}
        </div>

        <div className="twrap">
          <table>
            <thead><tr>
              <th>Matrícula</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Cargo</th>
              <th>Status</th>
              <th>Enviado</th>
              <th>Visualizado</th>
              <th>Assinado</th>
            </tr></thead>
            <tbody>
              {lista.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:32, color:'var(--muted)' }}>
                  Nenhum colaborador encontrado.
                </td></tr>
              ) : lista.map(c => (
                <tr key={c.id}>
                  <td className="mono">{c.matricula || c.cpf || '—'}</td>
                  <td><strong>{c.nome||''}</strong></td>
                  <td className="mono">{c.email||''}</td>
                  <td>{c.cargo||'—'}</td>
                  <td><span className={`tag tag-${c.status}`}>{STATUS_LABEL[c.status]||c.status}</span></td>
                  <td className="mono">{fmtData(c.enviado_em)}</td>
                  <td className="mono">{fmtData(c.visualizado_em)}</td>
                  <td className="mono">{fmtData(c.assinado_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
