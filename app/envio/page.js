'use client'
import { useState, useRef } from 'react'
import Layout from '@/components/Layout'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'

export default function EnvioPage() {
  const router = useRouter()
  const [modo, setModo]           = useState('padrao') // 'padrao' | 'ocr'
  const [nomeDoc, setNomeDoc]     = useState('')
  const [mensagem, setMensagem]   = useState('')
  const [excelFile, setExcelFile] = useState(null)
  const [pdfFile, setPdfFile]     = useState(null)
  const [preview, setPreview]     = useState(null)
  const [enviando, setEnviando]   = useState(false)
  const [progresso, setProgresso] = useState({ show: false, label: '', pct: 0 })
  const [resultado, setResultado] = useState(null)
  const [erro, setErro]           = useState('')

  function lerExcelPreview(file) {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const wb    = XLSX.read(e.target.result, { type: 'array' })
        const ws    = wb.Sheets[wb.SheetNames[0]]
        const rows  = XLSX.utils.sheet_to_json(ws, { defval: '' })
        const heads = Object.keys(rows[0] || {})
        const validos = rows.filter(r => {
          const v = Object.entries(r).find(([k]) => k.toLowerCase().includes('email'))
          return v && String(v[1]).includes('@')
        })
        setPreview({ rows, heads, total: rows.length, validos: validos.length, sample: rows.slice(0,5) })
      } catch(err) {
        setPreview({ erro: err.message })
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function enviarPadrao() {
    if (!excelFile) return setErro('Selecione a planilha Excel.')
    if (!pdfFile)   return setErro('Selecione o PDF do documento.')
    if (!nomeDoc)   return setErro('Informe o nome do documento.')
    setErro(''); setResultado(null)

    const form = new FormData()
    form.append('excel', excelFile)
    form.append('pdf', pdfFile)
    form.append('nomeDocumento', nomeDoc)
    form.append('mensagem', mensagem)

    setEnviando(true)
    setProgresso({ show: true, label: 'Enviando arquivos e processando...', pct: 20 })
    animProgress()

    try {
      const res  = await fetch('/api/enviar', { method: 'POST', body: form })
      const data = await res.json()
      if (data.erro) throw new Error(data.erro)
      setProgresso({ show: true, label: `✅ ${data.enviados}/${data.total} documentos enviados!`, pct: 100 })
      setResultado(data)
      setTimeout(() => router.push('/acompanhamento'), 2500)
    } catch(err) {
      setErro(err.message)
      setProgresso({ show: false, label: '', pct: 0 })
    } finally {
      setEnviando(false)
    }
  }

  async function enviarOCR() {
    if (!pdfFile) return setErro('Selecione o PDF com os contracheques.')
    if (!nomeDoc) return setErro('Informe o nome do documento.')
    setErro(''); setResultado(null)

    const form = new FormData()
    form.append('pdf', pdfFile)
    form.append('nomeDocumento', nomeDoc)
    form.append('mensagem', mensagem)

    setEnviando(true)
    setProgresso({ show: true, label: '🔍 Lendo PDF com OCR — isso pode levar alguns minutos...', pct: 10 })

    // Simula progresso visual enquanto o OCR roda
    let pct = 10
    const iv = setInterval(() => {
      pct = Math.min(pct + 1, 85)
      setProgresso(p => ({ ...p, pct, label: `🔍 Processando páginas com OCR... ${pct}%` }))
    }, 3000)

    try {
      const res  = await fetch('/api/processar-pdf', { method: 'POST', body: form })
      clearInterval(iv)
      const data = await res.json()
      if (data.erro) throw new Error(data.erro)
      setProgresso({ show: true, label: `✅ ${data.enviados} documento(s) enviado(s) de ${data.colaboradoresIdentificados} identificados!`, pct: 100 })
      setResultado(data)
      setTimeout(() => router.push('/acompanhamento'), 3000)
    } catch(err) {
      clearInterval(iv)
      setErro(err.message)
      setProgresso({ show: false, label: '', pct: 0 })
    } finally {
      setEnviando(false)
    }
  }

  function animProgress() {
    let w = 20
    const iv = setInterval(() => {
      if (!enviando && w >= 90) { clearInterval(iv); return }
      w = Math.min(w + Math.random() * 5, 90)
      setProgresso(p => ({ ...p, pct: w }))
    }, 800)
  }

  return (
    <Layout title="Novo envio">
      {/* Seletor de modo */}
      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <ModoCard
          ativo={modo==='padrao'}
          onClick={() => { setModo('padrao'); setErro(''); setResultado(null) }}
          icon="📋"
          titulo="Envio padrão"
          desc="Excel com colaboradores + 1 PDF para todos assinarem"
        />
        <ModoCard
          ativo={modo==='ocr'}
          onClick={() => { setModo('ocr'); setErro(''); setResultado(null) }}
          icon="🔍"
          titulo="PDF inteligente (OCR)"
          desc="1 PDF com múltiplos contracheques — o sistema identifica e separa automaticamente"
        />
      </div>

      <div style={{ display:'grid', gridTemplateColumns: modo==='padrao' ? '1fr 1fr' : '1fr', gap:20, maxWidth:1100 }}>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card">
            <div className="card-title">
              {modo==='padrao' ? '📋 Dados do envio' : '🔍 PDF inteligente com OCR'}
            </div>

            {modo==='ocr' && (
              <div className="alert alert-info" style={{ marginBottom:14 }}>
                ℹ️ O sistema vai ler cada página do PDF, identificar a matrícula e nome de cada colaborador via OCR, separar em PDFs individuais e enviar para o email cadastrado no sistema. Certifique-se que os colaboradores já foram cadastrados com a matrícula no campo CPF.
              </div>
            )}

            {erro && <div className="alert alert-warn" style={{ marginBottom:14 }}>⚠️ {erro}</div>}

            <div className="fg">
              <label>Nome do documento *</label>
              <input type="text" value={nomeDoc} onChange={e => setNomeDoc(e.target.value)}
                placeholder={modo==='ocr' ? 'Ex: Contracheque Julho 2026' : 'Ex: Política de Férias 2025'}/>
            </div>
            <div className="fg">
              <label>Mensagem para os colaboradores</label>
              <textarea value={mensagem} onChange={e => setMensagem(e.target.value)}
                placeholder="Ex: Por favor, assine seu contracheque até sexta-feira." rows={3}/>
            </div>

            {modo==='padrao' && (
              <div className="fg">
                <label>Planilha Excel * (.xlsx)</label>
                <UploadZone accept=".xlsx,.xls" icon="📋" label="Clique ou arraste o Excel aqui"
                  file={excelFile} onChange={f => { setExcelFile(f); lerExcelPreview(f) }}/>
                <span className="hint">Colunas: <strong>nome</strong> e <strong>email</strong> (obrigatórias) · cpf, cargo (opcionais)</span>
              </div>
            )}

            <div className="fg">
              <label>{modo==='ocr' ? 'PDF com todos os contracheques *' : 'Documento PDF a assinar *'}</label>
              <UploadZone accept=".pdf" icon="📄"
                label={modo==='ocr' ? 'Clique ou arraste o PDF com todos os contracheques' : 'Clique ou arraste o PDF aqui'}
                file={pdfFile} onChange={setPdfFile}/>
              {modo==='ocr' && <span className="hint">O sistema vai processar cada página individualmente com OCR. PDFs grandes podem levar alguns minutos.</span>}
            </div>

            <hr className="divider"/>
            <button className="btn btn-primary"
              onClick={modo==='padrao' ? enviarPadrao : enviarOCR}
              disabled={enviando}>
              {enviando
                ? (modo==='ocr' ? '🔍 Processando OCR...' : '⏳ Enviando...')
                : (modo==='ocr' ? '🔍 Processar PDF e enviar' : '🚀 Enviar para todos os colaboradores')}
            </button>

            {progresso.show && (
              <div style={{ marginTop:12 }}>
                <div className="prog-lbl">{progresso.label}</div>
                <div className="prog-bar">
                  <div className="prog-fill" style={{ width: progresso.pct+'%' }}/>
                </div>
              </div>
            )}

            {resultado && modo==='ocr' && (
              <div style={{ marginTop:14, padding:14, background:'var(--green-lt)', borderRadius:'var(--r8)', border:'1px solid #bbf7d0', fontSize:13 }}>
                <div style={{ fontWeight:700, color:'var(--green)', marginBottom:8 }}>✅ Processamento concluído</div>
                <div>📄 Páginas no PDF: <strong>{resultado.totalPaginas}</strong></div>
                <div>👥 Colaboradores identificados: <strong>{resultado.colaboradoresIdentificados}</strong></div>
                <div>📨 Documentos enviados: <strong>{resultado.enviados}</strong></div>
                {resultado.semEmail > 0 && <div style={{ color:'var(--amber)' }}>⚠️ Sem email cadastrado: <strong>{resultado.semEmail}</strong></div>}
                {resultado.erros > 0 && <div style={{ color:'var(--rose)' }}>❌ Erros: <strong>{resultado.erros}</strong></div>}
              </div>
            )}
          </div>
        </div>

        {/* Preview Excel — só no modo padrão */}
        {modo==='padrao' && (
          <div className="card">
            <div className="card-title">👥 Colaboradores identificados</div>
            {!preview ? (
              <div className="empty" style={{ padding:32 }}>
                <div className="empty-icon">📋</div>
                <div className="empty-txt">Selecione a planilha Excel para ver os colaboradores aqui.</div>
              </div>
            ) : preview.erro ? (
              <div className="alert alert-warn">❌ Erro ao ler planilha: {preview.erro}</div>
            ) : (
              <div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
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
                {preview.total > 5 && <div className="hint" style={{ marginTop:6 }}>Mostrando 5 de {preview.total} linhas.</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

function ModoCard({ ativo, onClick, icon, titulo, desc }) {
  return (
    <div onClick={onClick} style={{
      flex:1, padding:'16px 20px', borderRadius:'var(--r12)', cursor:'pointer',
      border: ativo ? '2px solid var(--blue)' : '1.5px solid var(--border)',
      background: ativo ? 'var(--blue-lt)' : 'var(--white)',
      transition: 'all .15s',
    }}>
      <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
      <div style={{ fontWeight:700, fontSize:14, color: ativo ? 'var(--blue)' : 'var(--ink)', marginBottom:4 }}>{titulo}</div>
      <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.4 }}>{desc}</div>
    </div>
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
