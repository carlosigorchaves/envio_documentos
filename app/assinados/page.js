'use client'
import { useState } from 'react'
import Layout from '@/components/Layout'

const fmtData = iso => !iso ? '—' : new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})

export default function AssinadosPage() {
  const [arquivos, setArquivos] = useState(null)
  const [loading, setLoading]   = useState(false)

  async function buscar() {
    setLoading(true)
    try {
      const res  = await fetch('/api/baixar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const data = await res.json()
      setArquivos(data.arquivos || [])
    } catch { setArquivos([]) }
    finally { setLoading(false) }
  }

  return (
    <Layout
      title="Documentos assinados"
      actions={
        <button className="btn btn-green" onClick={buscar} disabled={loading}>
          {loading ? '⏳ Buscando…' : '⬇️ Buscar PDFs assinados'}
        </button>
      }
    >
      <div className="card">
        {arquivos === null ? (
          <div className="empty">
            <div className="empty-icon">📂</div>
            <div className="empty-txt">Clique em "Buscar PDFs assinados" para carregar os documentos disponíveis.</div>
          </div>
        ) : arquivos.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📭</div>
            <div className="empty-txt">Nenhum documento assinado ainda.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ marginBottom:8, fontSize:13, color:'var(--muted)' }}>
              {arquivos.length} documento(s) assinado(s)
            </div>
            {arquivos.map(a => (
              <div key={a.id} style={{
                display:'flex', alignItems:'center', gap:14,
                padding:'12px 16px', background:'var(--subtle)',
                borderRadius:'var(--r8)', border:'1px solid var(--border)',
              }}>
                <div style={{ fontSize:22 }}>📄</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{a.nome || a.email}</div>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>{a.email}</div>
                </div>
                <span className="tag tag-assinado">Assinado {fmtData(a.assinadoEm)}</span>
                {a.url
                  ? <a href={a.url} target="_blank" rel="noreferrer"
                      style={{ color:'var(--green)', fontSize:12, fontWeight:700, textDecoration:'none',
                               padding:'5px 12px', background:'var(--green-lt)', borderRadius:'var(--r4)' }}>
                      ⬇️ Baixar PDF
                    </a>
                  : <span style={{ fontSize:11, color:'var(--muted)' }}>Processando…</span>
                }
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
