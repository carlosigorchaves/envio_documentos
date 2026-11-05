'use client'
import { useState, useRef } from 'react'
import Layout from '@/components/Layout'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { supabase } from '@/lib/supabase'

export default function EnvioPage() {
  const router = useRouter()
  const [modo, setModo]           = useState('ocr')
  const [nomeDoc, setNomeDoc]     = useState('')
  const [mensagem, setMensagem]   = useState('')
  const [excelFile, setExcelFile] = useState(null)
  const [pdfFile, setPdfFile]     = useState(null)
  const [preview, setPreview]     = useState(null)
  const [enviando, setEnviando]   = useState(false)
  const [progresso, setProgresso] = useState({ show: false, label: '', pct: 0 })
  const [resultado, setResultado] = useState(null)
  const [erro, setErro]           = useState('')
  const [fonte, setFonte]         = useState('excel')   // 'excel' | 'rm'
  const [rmLista, setRmLista]     = useState(null)
  const [rmBuscando, setRmBuscando] = useState(false)
  const [centroSel, setCentroSel] = useState('')
  const [sincronizando, setSincronizando] = useState(false)
  const [sincMsg, setSincMsg] = useState('')
  const [sel, setSel] = useState({})          // páginas "para conferir" marcadas para envio
  const [confEnv, setConfEnv] = useState(false)
  const [confMsg, setConfMsg] = useState('')
  const [conf, setConf] = useState(null)      // janela de confirmação antes do envio
  const [confTexto, setConfTexto] = useState('')

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

  async function pegarToken() {
    const { data: sess } = await supabase.auth.getSession()
    const token = sess?.session?.access_token
    if (!token) throw new Error('Sessão expirada. Faça login novamente.')
    return token
  }

  async function buscarRM() {
    setErro(''); setRmBuscando(true); setRmLista(null); setPreview(null)
    try {
      const OCR_URL = process.env.NEXT_PUBLIC_OCR_SERVICE_URL
      if (!OCR_URL) throw new Error('NEXT_PUBLIC_OCR_SERVICE_URL não configurada no Vercel.')
      const token = await pegarToken()
      const res = await fetch(`${OCR_URL}/rm/colaboradores`, { headers: { Authorization: `Bearer ${token}` } })
      const texto = await res.text()
      let data
      try { data = JSON.parse(texto) }
      catch { throw new Error(`O servidor respondeu de forma inesperada (HTTP ${res.status}). ${texto.slice(0,120)}`) }
      if (data.erro) throw new Error(data.erro)
      const lista = data.colaboradores || []
      setRmLista(lista)
      setCentroSel('')
      montarPreviewRM(lista, '')
    } catch (err) {
      setErro(err.message)
    } finally {
      setRmBuscando(false)
    }
  }

  async function sincronizarRM() {
    setErro(''); setSincMsg(''); setSincronizando(true)
    try {
      const OCR_URL = process.env.NEXT_PUBLIC_OCR_SERVICE_URL
      const token = await pegarToken()
      const res = await fetch(`${OCR_URL}/rm/sincronizar`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
      const texto = await res.text()
      let d
      try { d = JSON.parse(texto) } catch { throw new Error(`Resposta inesperada (HTTP ${res.status}). ${texto.slice(0,120)}`) }
      if (d.erro) throw new Error(d.erro)
      setSincMsg(`✅ Cadastro atualizado: ${d.total} funcionários · ${d.novos} novos · ${d.atualizados} alterados · ${d.removidos} baixados`)
      await buscarRM()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSincronizando(false)
    }
  }

  async function confirmarSelecionados() {
    const itens = (resultado?.paraConferir || []).filter((c, i) => sel[i] && c.sugestao)
    if (!itens.length) return
    const porMat = {}
    itens.forEach(c => { const m = c.sugestao.matricula; porMat[m] = [...(porMat[m] || []), ...c.paginas] })
    const confirmacoes = Object.entries(porMat).map(([matricula, paginas]) => ({
      matricula, paginas: [...new Set(paginas)].sort((a, b) => a - b),
    }))
    setErro(''); setConfMsg(''); setConfEnv(true)
    try {
      const OCR_URL = process.env.NEXT_PUBLIC_OCR_SERVICE_URL
      const token = await pegarToken()
      const form = new FormData()
      form.append('pdf', pdfFile)
      if (fonte==='excel') form.append('excel', excelFile)
      else form.append('fonte', 'rm')
      form.append('nomeDocumento', nomeDoc)
      form.append('mensagem', mensagem)
      form.append('confirmacoes', JSON.stringify(confirmacoes))
      const res = await fetch(`${OCR_URL}/enviar-paginas`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
      const texto = await res.text()
      let d
      try { d = JSON.parse(texto) } catch { throw new Error(`Resposta inesperada (HTTP ${res.status}). ${texto.slice(0,120)}`) }
      if (d.erro) throw new Error(d.erro)
      const okMats = new Set(d.resultados.filter(r => r.ok).map(r => String(r.matricula)))
      setConfMsg(`✅ ${d.enviados} documento(s) enviado(s)` + (d.erros ? ` · ❌ ${d.erros} com erro` : ''))
      setResultado(r => ({
        ...r,
        paraConferir: r.paraConferir.filter((c, i) => !(sel[i] && c.sugestao && okMats.has(String(c.sugestao.matricula)))),
        enviados: (r.enviados || 0) + d.enviados,
      }))
      setSel({})
    } catch (err) {
      setErro(err.message)
    } finally {
      setConfEnv(false)
    }
  }

  function montarPreviewRM(lista, centro) {
    const base = centro ? lista.filter(c => String(c.centro_custo) === centro) : lista
    const ativos = base.filter(c => c.situacao !== 'demitido')
    const comEmail = ativos.filter(c => c.email && c.email.includes('@'))
    setPreview({
      rm: true,
      heads: ['matricula', 'nome', 'email', 'centro_custo', 'situacao'],
      total: base.length, validos: comEmail.length,
      ativos: ativos.length, demitidos: base.length - ativos.length,
      semEmail: ativos.length - comEmail.length,
      sample: comEmail.slice(0, 5),
    })
  }

  const centrosRM = rmLista ? [...new Set(rmLista.map(c => String(c.centro_custo || '')).filter(Boolean))].sort() : []

  function validar() {
    if (fonte==='excel' && !excelFile) return 'Selecione a planilha Excel.'
    if (fonte==='rm' && !rmLista)      return 'Clique em "Buscar do RM" para carregar os colaboradores.'
    if (!pdfFile)                      return modo==='ocr' ? 'Selecione o PDF com os documentos.' : 'Selecione o PDF do documento.'
    if (!nomeDoc)                      return 'Informe o nome do documento.'
    return ''
  }

  // Abre a janela de confirmação: mostra o modo, a quantidade e se o Autentique está em teste ou real
  async function abrirConfirmacao() {
    const msg = validar()
    if (msg) return setErro(msg)
    setErro(''); setConfTexto('')
    let sandbox = null
    try {
      const OCR_URL = process.env.NEXT_PUBLIC_OCR_SERVICE_URL
      const r = await fetch(`${OCR_URL}/health`)
      sandbox = (await r.json()).sandbox
    } catch {}
    const qtd = modo==='padrao' ? (preview?.validos ?? 0) : null
    setConf({ modo, fonte, qtd, sandbox, pdf: pdfFile?.name, centro: centroSel })
  }

  function executarEnvio() {
    const m = conf?.modo
    setConf(null)
    if (m==='padrao') enviarPadrao(); else enviarOCR()
  }

  async function enviarPadrao() {
    if (fonte==='excel' && !excelFile) return setErro('Selecione a planilha Excel.')
    if (fonte==='rm' && !rmLista)      return setErro('Clique em "Buscar do RM" para carregar os colaboradores.')
    if (!pdfFile)   return setErro('Selecione o PDF do documento.')
    if (!nomeDoc)   return setErro('Informe o nome do documento.')
    setErro(''); setResultado(null)

    const form = new FormData()
    if (fonte==='excel') form.append('excel', excelFile)
    else { form.append('fonte', 'rm'); form.append('centroCusto', centroSel) }
    form.append('pdf', pdfFile)
    form.append('nomeDocumento', nomeDoc)
    form.append('mensagem', mensagem)

    setEnviando(true)
    setProgresso({ show: true, label: 'Enviando arquivos e criando documentos na Autentique...', pct: 10 })

    let pct = 10
    const iv = setInterval(() => {
      pct = Math.min(pct + 1, 90)
      setProgresso(p => ({ ...p, pct, label: `Enviando documentos para assinatura... ${pct}%` }))
    }, 2000)

    try {
      const OCR_URL = process.env.NEXT_PUBLIC_OCR_SERVICE_URL
      if (!OCR_URL) throw new Error('NEXT_PUBLIC_OCR_SERVICE_URL não configurada no Vercel.')
      const { data: sess } = await supabase.auth.getSession()
      const token = sess?.session?.access_token
      if (!token) throw new Error('Sessão expirada. Faça login novamente.')

      // Arquivos vão direto ao Railway (o Vercel recusa arquivos acima de 4,5 MB)
      const res = await fetch(`${OCR_URL}/enviar-padrao`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      clearInterval(iv)
      const texto = await res.text()
      let data
      try { data = JSON.parse(texto) }
      catch { throw new Error(`O servidor respondeu de forma inesperada (HTTP ${res.status}). ${texto.slice(0,120)}`) }
      if (data.erro) throw new Error(data.erro)
      setProgresso({ show: true, label: `✅ ${data.enviados}/${data.total} documentos enviados!`, pct: 100 })
      setResultado(data)
      setTimeout(() => router.push('/acompanhamento'), 2500)
    } catch(err) {
      clearInterval(iv)
      setErro(err.message)
      setProgresso({ show: false, label: '', pct: 0 })
    } finally {
      setEnviando(false)
    }
  }

  async function enviarOCR() {
    if (!pdfFile)   return setErro('Selecione o PDF com os contracheques.')
    if (fonte==='excel' && !excelFile) return setErro('Selecione a planilha Excel com os colaboradores.')
    if (fonte==='rm' && !rmLista)      return setErro('Clique em "Buscar do RM" para carregar os colaboradores.')
    if (!nomeDoc)   return setErro('Informe o nome do documento.')
    setErro(''); setResultado(null)

    const form = new FormData()
    form.append('pdf', pdfFile)
    if (fonte==='excel') form.append('excel', excelFile)
    else form.append('fonte', 'rm')
    form.append('nomeDocumento', nomeDoc)
    form.append('mensagem', mensagem)

    setEnviando(true)
    setProgresso({ show: true, label: '🔍 Lendo PDF com OCR — isso pode levar alguns minutos...', pct: 10 })

    let pct = 10
    const iv = setInterval(() => {
      pct = Math.min(pct + 1, 85)
      setProgresso(p => ({ ...p, pct, label: `🔍 Processando páginas com OCR... ${pct}%` }))
    }, 3000)

    try {
      const OCR_URL = process.env.NEXT_PUBLIC_OCR_SERVICE_URL
      if (!OCR_URL) throw new Error('NEXT_PUBLIC_OCR_SERVICE_URL não configurada no Vercel.')
      const { data: sess } = await supabase.auth.getSession()
      const token = sess?.session?.access_token
      if (!token) throw new Error('Sessão expirada. Faça login novamente.')

      // PDF vai direto ao Railway (o Vercel recusa arquivos acima de 4,5 MB)
      const res  = await fetch(`${OCR_URL}/processar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      clearInterval(iv)
      const texto = await res.text()
      let data
      try { data = JSON.parse(texto) }
      catch { throw new Error(`O servidor de OCR respondeu de forma inesperada (HTTP ${res.status}). ${texto.slice(0,120)}`) }
      if (data.erro) throw new Error(data.erro)
      setProgresso({ show: true, label: `✅ ${data.enviados} documento(s) enviado(s) de ${data.colaboradoresIdentificados} identificados!`, pct: 100 })
      setResultado(data)
      // se houver páginas para conferir, fica na tela para a pessoa ler o resumo
      if (!(data.paraConferir?.length || data.naoIdentificadas?.length)) setTimeout(() => router.push('/acompanhamento'), 3000)
    } catch(err) {
      clearInterval(iv)
      setErro(err.message)
      setProgresso({ show: false, label: '', pct: 0 })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Layout title="Novo envio">
      {/* Seletor de modo */}
      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <ModoCard
          ativo={modo==='ocr'}
          onClick={() => { setModo('ocr'); setErro(''); setResultado(null); setExcelFile(null); setPdfFile(null); setPreview(null); setRmLista(null); setCentroSel('') }}
          icon="🔍"
          titulo="PDF inteligente (OCR)"
          desc="1 PDF com múltiplos contracheques + Excel com emails — o sistema identifica e separa automaticamente"
        />
        <ModoCard
          ativo={modo==='padrao'}
          onClick={() => { setModo('padrao'); setErro(''); setResultado(null); setExcelFile(null); setPdfFile(null); setPreview(null); setRmLista(null); setCentroSel('') }}
          icon="📋"
          titulo="Envio padrão"
          desc="Excel com colaboradores + 1 PDF igual para todos assinarem"
        />
      </div>

      <div style={{ display:'grid', gridTemplateColumns: modo==='padrao' ? '1fr 1fr' : '1fr 1fr', gap:20, maxWidth:1100 }}>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card">
            <div className="card-title">
              {modo==='padrao' ? '📋 Dados do envio' : '🔍 PDF inteligente com OCR'}
            </div>

            {modo==='ocr' && (
              <div className="alert alert-info" style={{ marginBottom:14 }}>
                ℹ️ O sistema vai ler cada página do PDF via OCR, identificar a matrícula, cruzar com o Excel e enviar o contracheque individual para cada colaborador.
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

            {/* Fonte dos colaboradores: Excel ou TOTVS RM */}
            <div className="fg">
              <label>Fonte dos colaboradores *</label>
              <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                <button type="button" className={fonte==='excel' ? 'btn btn-primary' : 'btn'}
                  onClick={() => { setFonte('excel'); setPreview(null); setRmLista(null); setErro('') }}>📋 Planilha Excel</button>
                <button type="button" className={fonte==='rm' ? 'btn btn-primary' : 'btn'}
                  onClick={() => { setFonte('rm'); setPreview(null); setExcelFile(null); setErro('') }}>🔗 TOTVS RM</button>
              </div>

              {fonte==='excel' ? (
                <div>
                  <UploadZone
                    accept=".xlsx,.xls"
                    icon="📋"
                    label="Clique ou arraste o Excel aqui"
                    file={excelFile}
                    onChange={f => { setExcelFile(f); lerExcelPreview(f) }}
                  />
                  <span className="hint">
                    {modo==='ocr'
                      ? 'Colunas obrigatórias: nome, email, matricula · opcionais: cargo, centro_custo, situacao (ativo/demitido)'
                      : 'Colunas obrigatórias: nome, email, matricula · opcionais: cpf, cargo, centro_custo, situacao'}
                  </span>
                </div>
              ) : (
                <div>
                  <button type="button" className="btn btn-primary" onClick={buscarRM} disabled={rmBuscando}>
                    {rmBuscando ? '⏳ Carregando...' : (rmLista ? '🔄 Recarregar cadastro' : '🔗 Buscar do RM')}
                  </button>
                  <button type="button" className="btn" style={{ marginLeft:8 }} onClick={sincronizarRM} disabled={sincronizando || rmBuscando}>
                    {sincronizando ? '⏳ Sincronizando com o RM...' : '♻️ Sincronizar com o RM'}
                  </button>
                  {sincMsg && <div className="hint" style={{ marginTop:6 }}>{sincMsg}</div>}
                  {rmLista && <span className="hint" style={{ marginLeft:10 }}>{rmLista.length} registros no cadastro</span>}
                  {rmLista && modo==='padrao' && centrosRM.length > 0 && (
                    <div style={{ marginTop:10 }}>
                      <label>Filtrar por centro de custo</label>
                      <select value={centroSel} onChange={e => { setCentroSel(e.target.value); montarPreviewRM(rmLista, e.target.value) }}>
                        <option value="">Todos</option>
                        {centrosRM.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {preview?.rm && preview.validos > 200 && (
                        <div className="hint" style={{ marginTop:6 }}>
                          ⚠️ {preview.validos} destinatários: o envio leva cerca de 1 segundo por pessoa. Para listas grandes, filtre por centro de custo.
                        </div>
                      )}
                    </div>
                  )}
                  <span className="hint">Os dados vêm do cadastro de funcionários (carga do RM); use Sincronizar para trazer admissões, alterações e desligamentos. Demitidos não recebem o documento.</span>
                </div>
              )}
            </div>

            <hr className="divider"/>

            {/* PDF */}
            <div className="fg">
              <label>
                {modo==='ocr'
                  ? 'PDF com todos os contracheques *'
                  : 'Documento PDF a assinar *'}
              </label>
              <UploadZone
                accept=".pdf"
                icon="📄"
                label={modo==='ocr'
                  ? 'Clique ou arraste o PDF com todos os contracheques'
                  : 'Clique ou arraste o PDF aqui'}
                file={pdfFile}
                onChange={setPdfFile}
              />
              {modo==='ocr' && (
                <span className="hint">O OCR vai ler cada página, identificar a matrícula e separar automaticamente.</span>
              )}
            </div>

            <hr className="divider"/>
            <button className="btn btn-primary"
              onClick={abrirConfirmacao}
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
                {resultado.semMatricula > 0 && <div style={{ color:'var(--amber)' }}>⚠️ Matrícula não encontrada no Excel: <strong>{resultado.semMatricula}</strong></div>}
                {resultado.erros > 0 && <div style={{ color:'var(--rose)' }}>❌ Erros: <strong>{resultado.erros}</strong></div>}
                {resultado.paginasAnexadas > 0 && <div>📎 Páginas sem identificação anexadas ao documento anterior: <strong>{resultado.paginasAnexadas}</strong></div>}
                {resultado.paraConferir?.length > 0 && (
                  <div style={{ color:'var(--amber)', marginTop:6 }}>
                    ⚠️ <strong>{resultado.paraConferir.length}</strong> para conferir (não foram enviados):
                    {resultado.paraConferir.map((c, i) => (
                      <label key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', marginLeft:14, marginTop:4, fontSize:12, cursor: c.sugestao ? 'pointer' : 'default' }}>
                        {c.sugestao
                          ? <input type="checkbox" checked={!!sel[i]} onChange={e => setSel(s => ({ ...s, [i]: e.target.checked }))}/>
                          : <span style={{ width:13 }}/>}
                        <span>
                          pág. {c.paginas.join(', ')} — {c.motivo}
                          {c.sugestao && <strong> → enviar para {c.sugestao.nome} ({c.sugestao.matricula})</strong>}
                        </span>
                      </label>
                    ))}
                    {Object.values(sel).some(Boolean) && (
                      <button type="button" className="btn btn-primary" style={{ marginTop:8, marginLeft:14 }}
                        onClick={confirmarSelecionados} disabled={confEnv}>
                        {confEnv ? '⏳ Enviando...' : '✅ Confirmar e enviar selecionados'}
                      </button>
                    )}
                    {confMsg && <div style={{ marginLeft:14, marginTop:6 }}>{confMsg}</div>}
                  </div>
                )}
                {resultado.naoIdentificadas?.length > 0 && <div style={{ color:'var(--amber)' }}>❓ Páginas sem identificação: <strong>{resultado.naoIdentificadas.join(', ')}</strong></div>}
              </div>
            )}
          </div>
        </div>

        {/* Preview Excel */}
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
                <span className="tag tag-enviado">{preview.total} {preview.rm ? 'registros' : 'linhas'}</span>
                <span className="tag tag-assinado">{preview.validos} com email válido</span>
                {preview.rm
                  ? <>
                      <span className="tag tag-enviado">{preview.ativos} ativos</span>
                      {preview.demitidos > 0 && <span className="tag tag-rejeitado">{preview.demitidos} demitidos (não recebem)</span>}
                      {preview.semEmail > 0 && <span className="tag tag-rejeitado">{preview.semEmail} ativos sem email</span>}
                    </>
                  : preview.total - preview.validos > 0 && <span className="tag tag-rejeitado">{preview.total - preview.validos} ignoradas</span>}
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
      </div>
      {conf && (() => {
        const grande = conf.modo==='padrao' && conf.qtd > 50
        const podeEnviar = !grande || confTexto.trim() === String(conf.qtd)
        return (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
            <div className="card" style={{ maxWidth:480, width:'100%', background:'var(--white)' }}>
              <div className="card-title">Confirmar envio</div>
              <div style={{ fontSize:13, lineHeight:1.7 }}>
                <div><strong>Modo:</strong> {conf.modo==='ocr' ? '🔍 PDF inteligente (OCR) — cada pessoa recebe só as páginas dela' : '📋 Envio padrão — o MESMO PDF inteiro vai para cada pessoa'}</div>
                <div><strong>Colaboradores:</strong> {conf.fonte==='rm' ? '🔗 TOTVS RM' : '📋 Planilha Excel'}{conf.centro ? ` · centro de custo ${conf.centro}` : ''}</div>
                <div><strong>Arquivo:</strong> {conf.pdf}</div>
                <div><strong>Destinatários:</strong> {conf.modo==='padrao' ? <b>{conf.qtd} pessoas</b> : 'uma pessoa por documento identificado no PDF'}</div>
                <div><strong>Ambiente:</strong> {conf.sandbox === true ? '🧪 Teste (sandbox) — ninguém recebe de verdade' : conf.sandbox === false ? <b style={{ color:'var(--rose)' }}>⚠️ REAL — os colaboradores recebem o e-mail agora</b> : 'não foi possível confirmar (trate como REAL)'}</div>
              </div>
              {grande && (
                <div className="fg" style={{ marginTop:12 }}>
                  <label>Para confirmar, digite o número de destinatários ({conf.qtd})</label>
                  <input type="text" value={confTexto} onChange={e => setConfTexto(e.target.value)} placeholder={String(conf.qtd)} autoFocus/>
                </div>
              )}
              <div style={{ display:'flex', gap:8, marginTop:14, justifyContent:'flex-end' }}>
                <button type="button" className="btn" onClick={() => setConf(null)}>Cancelar</button>
                <button type="button" className="btn btn-primary" onClick={executarEnvio} disabled={!podeEnviar}>Confirmar e enviar</button>
              </div>
            </div>
          </div>
        )
      })()}
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
