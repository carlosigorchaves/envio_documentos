'use client'
import { useState, useRef } from 'react'
import Layout from '@/components/Layout'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'

const CAMPOS = ['nome', 'email', 'cpf', 'cargo']
const normK  = k => String(k).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim()

export default function EnvioPage() {
  const router = useRouter()
  const [nomeDoc, setNomeDoc]     = useState('')
  const [mensagem, setMensagem]   = useState('')
  const [excelFile, setExcelFile] = useState(null)
  const [pdfFile, setPdfFile]     = useState(null)
  const [preview, setPreview]     = useState(null)
  const [enviando, setEnviando]   = useState(false)
  const [progresso, setProgresso] = useState({ show: false, label: '', pct: 0 })
  const [erro, setErro]           = useState('')

  function lerExcelPreview(file) {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const wb   = XLSX.read(e.target.result, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
        const heads = Object.keys(rows[0] || {})
        const validos = rows.filter(r => {
          const entry = Object.entries(r).find(([k]) => k.toLowerCase().includes('email'))
          return entry && String(entry[1]).includes('@')
        })
        setPreview({ rows, heads, total: rows.length, validos: validos.length, sample: rows.slice(0,5) })
      } catch(err) {
        setPreview({ erro: err.message })
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function onExcel(file) {
    setExcelFile(file)
    lerExcelPreview(file)
  }

  async function enviar() {
    if (!excelFile) return setErro('Selecione a planilha Excel.')
    if (!pdfFile)   return setErro('Selecione o PDF do documento.')
    if (!nomeDoc)   return setErro('Informe o nome do documento.')
    setErro('')
    setEnviando(true)
    setProgresso({ show: true, label: 'Enviando arquivos…', pct: 10 })

    try {
      const form = new FormData()
      form.append('excel', excelFile)
      form.append('pdf', pdfFile)
      form.append('nomeDocumento', nomeDoc)
      form.append('mensagem', mensagem)

      setProgresso({ show: true, label: 'Processando colaboradores…', pct: 40 })
      const res  = await fetch('/api/enviar', { method: 'POST', body: form })
      const data = await res.json()

      if (!data.ok) throw new Error(data.erro || 'Erro desconhecido')

      setProgresso({ show: true, label: `✅ ${data.total} colaborador(es) em processamento!`, pct: 100 })
      setTimeout(() => router.push('/acompanhamento'), 1800)
    } catch(err) {
      setErro(err.message)
      setProgresso({ show: false, label: '', pct: 0 })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Layout title="Novo envio">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 1100 }}>

        {/* Coluna esquerda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-title">📋 Dados do envio</div>
            {erro && <div className="alert alert-warn" style={{ marginBottom: 14 }}>⚠️ {erro}</div>}
            <div className="fg">
              <label>Nome do documento *</label>
              <input type="text" value={nomeDoc} onChange={e => setNomeDoc(e.target.value)} placeholder="Ex: Política de Férias 2025"/>
            </div>
            <div className="fg">
              <label>Mensagem para os colaboradores</label>
              <textarea value={mensagem} onChange={e => setMensagem(e.target.value)} placeholder="Ex: Por favor, assine até sexta-feira." rows={3}/>
            </div>
          </div>

          <div className="card">
            <div className="card-title">📎 Arquivos</div>
            <div className="fg">
              <label>Planilha Excel * (.xlsx)</label>
              <UploadZone
                accept=".xlsx,.xls"
                icon="📋"
                label="Clique ou arraste o Excel aqui"
                file={excelFile}
                onChange={onExcel}
              />
              <span className="hint">Colunas: <strong>nome</strong> e <strong>email</strong> (obrigatórias) · cpf, cargo (opcionais)</span>
            </div>
            <hr className="divider"/>
            <div className="fg">
              <label>Documento PDF a assinar *</label>
              <UploadZone
                accept=".pdf"
                icon="📄"
                label="Clique ou arraste o PDF aqui"
                file={pdfFile}
                onChange={setPdfFile}
              />
              <span className="hint">Este PDF será enviado para todos os colaboradores da planilha.</span>
            </div>
            <hr className="divider"/>
            <button className="btn btn-primary" onClick={enviar} disabled={enviando}>
              {enviando ? '⏳ Enviando…' : '🚀 Enviar para todos os colaboradores'}
            </button>
            {progresso.show && (
              <div className="prog-wrap" style={{ display: 'block', marginTop: 12 }}>
                <div className="prog-lbl">{progresso.label}</div>
                <div className="prog-bar">
                  <div className="prog-fill" style={{ width: progresso.pct + '%' }}/>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Coluna direita: preview */}
        <div className="card">
          <div className="card-title">👥 Colaboradores identificados</div>
          {!preview ? (
            <div className="empty" style={{ padding: 40 }}>
              <div className="empty-icon">📋</div>
              <div className="empty-txt">Selecione a planilha Excel para ver os colaboradores aqui.</div>
            </div>
          ) : preview.erro ? (
            <div className="alert alert-warn">❌ Erro ao ler planilha: {preview.erro}</div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                <span className="tag tag-enviado">{preview.total} linhas</span>
                <span className="tag tag-assinado">{preview.validos} com email válido</span>
                {preview.total - preview.validos > 0 && <span className="tag tag-rejeitado">{preview.total - preview.validos} ignoradas</span>}
              </div>
              <div className="twrap">
                <table>
                  <thead><tr>{preview.heads.map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {preview.sample.map((r, i) => (
                      <tr key={i}>{preview.heads.map(h => <td key={h} className="mono">{String(r[h]||'')}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.total > 5 && <div className="hint" style={{ marginTop: 6 }}>Mostrando 5 de {preview.total} linhas.</div>}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

function UploadZone({ accept, icon, label, file, onChange }) {
  const [drag, setDrag] = useState(false)
  const ref = useRef()

  function handleFile(f) { if (f) onChange(f) }
  return (
    <div
      onClick={() => ref.current.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]) }}
      className={`uzone${drag ? ' drag' : ''}`}
    >
      <input ref={ref} type="file" accept={accept} style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])}/>
      <div className="uzone-icon">{icon}</div>
      <div className="uzone-lbl">{label}</div>
      {file && <div className="uzone-name">✓ {file.name}</div>}
    </div>
  )
}
