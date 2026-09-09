import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { inserirLote, buscarPorLote, marcarEnviado } from '@/lib/db'
import { criarDocumento, isSandbox } from '@/lib/autentique'

export const runtime = 'nodejs'
export const maxDuration = 60

const CAMPOS = ['nome', 'email', 'cpf', 'matricula', 'cargo']
const normK  = k => String(k).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

function lerExcel(buffer) {
  const wb   = XLSX.read(buffer, { type: 'buffer' })
  const ws   = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

  return rows.map(row => {
    const c = {}, extras = {}
    for (const [k, v] of Object.entries(row)) {
      const nk = normK(k)
      if (CAMPOS.includes(nk)) c[nk] = String(v).trim()
      else extras[k] = String(v).trim()
    }
    return { ...c, extras }
  }).filter(c => c.email && c.email.includes('@'))
}

export async function POST(req) {
  try {
    const form      = await req.formData()
    const excelFile = form.get('excel')
    const pdfFile   = form.get('pdf')
    const nomeDoc   = form.get('nomeDocumento') || 'Documento para assinatura'
    const mensagem  = form.get('mensagem') || ''

    if (!excelFile) return NextResponse.json({ erro: 'Planilha Excel obrigatória.' }, { status: 400 })
    if (!pdfFile)   return NextResponse.json({ erro: 'PDF obrigatório.' }, { status: 400 })

    const excelBuf = Buffer.from(await excelFile.arrayBuffer())
    const pdfBuf   = Buffer.from(await pdfFile.arrayBuffer())
    const pdfNome  = pdfFile.name || 'documento.pdf'

    const colaboradores = lerExcel(excelBuf)
    if (!colaboradores.length)
      return NextResponse.json({ erro: 'Nenhum colaborador com email válido encontrado.' }, { status: 400 })

    const loteId = 'lote_' + Date.now()
    await inserirLote(colaboradores, loteId)

    // Envio síncrono
    const inseridos  = await buscarPorLote(loteId)
    const resultados = []

    for (const col of inseridos) {
      try {
        const doc = await criarDocumento({
          nome:        `${nomeDoc} - ${col.nome || col.email}`,
          pdfBuffer:   pdfBuf,
          pdfNome,
          signatarios: [{ email: col.email, nome: col.nome }],
          mensagem,
        })
        const sig = doc.signatures?.[0]
        await marcarEnviado(col.id, {
          documentId:        doc.id,
          signaturePublicId: sig?.public_id,
          linkAssinatura:    sig?.link?.short_link,
        })
        resultados.push({ email: col.email, ok: true, documentId: doc.id })
      } catch (err) {
        resultados.push({ email: col.email, ok: false, erro: err.message })
        console.error(`[erro] ${col.email}: ${err.message}`)
      }
      if (inseridos.indexOf(col) < inseridos.length - 1) {
        await new Promise(r => setTimeout(r, 1100))
      }
    }

    const enviados = resultados.filter(r => r.ok).length
    return NextResponse.json({
      ok: true, loteId,
      total: colaboradores.length,
      enviados,
      erros: resultados.filter(r => !r.ok).length,
      sandbox: isSandbox(),
    })

  } catch (err) {
    console.error('[enviar]', err)
    return NextResponse.json({ erro: err.message }, { status: 500 })
  }
}
