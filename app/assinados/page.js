'use client'
import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'

const fmtData = iso => !iso ? '—' : new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})

export default function AssinadosPage() {
  const [arquivos, setArquivos]       = useState([])
  const [loading, setLoading]         = useState(false)
  const [selecionados, setSelecionados] = useState(new Set())
  const [filtroLote, setFiltroLote]   = useState('')
  const [busca, setBusca]             = useState('')
  const [lotes, setLotes]             = useState([])

  useEffect(() => {
    fetch('/api/lotes').then(r => r.json()).then(d => setLotes(Array.isArray(d) ? d : []))
  }, [])

  async function buscar() {
    setLoading(true)
    setSelecionados(new Set())
    try {
      const body = filtroLote ? { loteId: filtroLote } : {}
      const res  = await fetch('/api/baixar', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      setArquivos(data.arquivos || [])
    } catch { setArquivos([]) }
    finally { setLoading(false) }
  }

  // Filtro por busca
  const listaFiltrada = arquivos.filter(a =>
    !busca ||
    (a.nome||'').toLowerCase().includes(busca.toLowerCase()) ||
    (a.email||'').toLowerCase().includes(busca.toLowerCase())
  )

  // Seleção
  function toggleSel(id) {
    setSelecionados(prev => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  function selecionarTodos() {
    if (selecionados.size === listaFiltrada.length) {
      setSelecionados(new Set())
    } else {
      setSelecionados(new Set(listaFiltrada.map(a => a.id)))
    }
  }

  function selecionarPorStatus() {
    // Já estão todos assinados, mas seleciona os filtrados
    setSelecionados(new Set(listaFiltrada.map(a => a.id)))
  }

  // Download dos selecionados
  async function baixarSelecionados() {
    const lista = listaFiltrada.filter(a => selecionados.has(a.id) && a.url)
    if (!lista.length) return alert('Nenhum arquivo selecionado com URL disponível.')

    for (const arq of lista) {
      const a = document.createElement('a')
      a.href     = arq.url
      a.download = arq.nomeArquivo
      a.target   = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      await new Promise(r => setTimeout(r, 500))
    }
  }

  const todosSelecionados = listaFiltrada.length > 0 && selecionados.size === listaFiltrada.length
  const algumSelecionado  = selecionados.size > 0

  return (
    <Layout
      title="Documentos assinados"
      actions={
        <div style={{ display:'flex', gap:8 }}>
          {algumSelecionado && (
            <button className="btn btn-green" onClick={baixarSelecionados}>
              ⬇️ Baixar selecionados ({selecionados.size})
            </button>
          )}
          <button className="btn btn-green" onClick={buscar} disabled={loading}>
            {loading ? '⏳ Buscando…' : '🔄 Buscar assinados'}
          </button>
        </div>
      }
    >
      {/* Filtros */}
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end' }}>
          <div style={{ flex:1, minWidth:200 }}>
            <label style={{ fontSize:12, color:'var(--muted)', fontWeight:600, display:'block', marginBottom:5 }}>
              Filtrar por lote
            </label>
            <select value={filtroLote} onChange={e => setFiltroLote(e.target.value)}
              style={{ width:'100%', background:'var(--white)', border:'1.5px solid var(--border)',
                borderRadius:'var(--r8)', color:'var(--ink)', padding:'9px 12px', fontSize:13, outline:'none' }}>
              <option value="">Todos os lotes</option>
              {lotes.map(l => (
                <option key={l.loteId} value={l.loteId}>
                  {l.loteId} — {l.total} colaboradores ({l.assinado||0} assinados)
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex:1, minWidth:200 }}>
            <label style={{ fontSize:12, color:'var(--muted)', fontWeight:600, display:'block', marginBottom:5 }}>
              Buscar colaborador
            </label>
            <input type="text" className="sinput" style={{ width:'100%' }}
              placeholder="🔍 Nome ou email…" value={busca} onChange={e => setBusca(e.target.value)}/>
          </div>
          <button className="btn btn-teal" onClick={buscar} disabled={loading}>
            🔍 Aplicar filtros
          </button>
        </div>
      </div>

      <div className="card">
        {arquivos.length === 0 && !loading ? (
          <div className="empty">
            <div className="empty-icon">📂</div>
            <div className="empty-txt">Clique em "Buscar assinados" para carregar os documentos.</div>
          </div>
        ) : (
          <>
            {/* Barra de seleção */}
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:14, flexWrap:'wrap' }}>
              <label style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer', fontSize:13, fontWeight:600 }}>
                <input type="checkbox"
                  checked={todosSelecionados}
                  onChange={selecionarTodos}
                  style={{ width:16, height:16, cursor:'pointer' }}
                />
                {todosSelecionados ? 'Desmarcar todos' : `Selecionar todos (${listaFiltrada.length})`}
              </label>

              {algumSelecionado && (
                <span style={{ fontSize:12, color:'var(--blue)', fontWeight:600 }}>
                  {selecionados.size} selecionado(s)
                </span>
              )}

              <div style={{ flex:1 }}/>

              <span style={{ fontSize:12, color:'var(--muted)' }}>
                {listaFiltrada.length} documento(s) encontrado(s)
              </span>
            </div>

            {/* Lista */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {listaFiltrada.map(a => (
                <div key={a.id} onClick={() => toggleSel(a.id)}
                  style={{
                    display:'flex', alignItems:'center', gap:14,
                    padding:'12px 16px',
                    background: selecionados.has(a.id) ? 'var(--blue-lt)' : 'var(--subtle)',
                    borderRadius:'var(--r8)',
                    border: selecionados.has(a.id) ? '1.5px solid var(--blue)' : '1px solid var(--border)',
                    cursor:'pointer', transition:'all .15s',
                  }}>

                  {/* Checkbox */}
                  <input type="checkbox"
                    checked={selecionados.has(a.id)}
                    onChange={() => toggleSel(a.id)}
                    onClick={e => e.stopPropagation()}
                    style={{ width:16, height:16, cursor:'pointer', flexShrink:0 }}
                  />

                  <div style={{ fontSize:22, flexShrink:0 }}>📄</div>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{a.nome || a.email}</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{a.email}</div>
                    {a.assinadoEm && (
                      <div style={{ fontSize:11, color:'var(--green)', marginTop:2 }}>
                        ✅ Assinado em {fmtData(a.assinadoEm)}
                      </div>
                    )}
                  </div>

                  {/* Botão download individual */}
                  {a.url ? (
                    <a href={a.url} target="_blank" rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{
                        color:'var(--green)', fontSize:12, fontWeight:700,
                        textDecoration:'none', padding:'6px 13px',
                        background:'var(--green-lt)', borderRadius:'var(--r4)',
                        border:'1px solid #bbf7d0', whiteSpace:'nowrap', flexShrink:0,
                      }}>
                      ⬇️ Baixar
                    </a>
                  ) : (
                    <span style={{ fontSize:11, color:'var(--muted)', flexShrink:0 }}>Processando…</span>
                  )}
                </div>
              ))}
            </div>

            {/* Botão de download em lote fixo no rodapé */}
            {algumSelecionado && (
              <div style={{
                position:'sticky', bottom:0, background:'var(--white)',
                borderTop:'1px solid var(--border)', padding:'12px 0 0',
                marginTop:16,
              }}>
                <button className="btn btn-primary" onClick={baixarSelecionados}
                  style={{ maxWidth:400 }}>
                  ⬇️ Baixar {selecionados.size} PDF(s) selecionado(s)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
