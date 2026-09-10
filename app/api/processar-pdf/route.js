/**
 * POST /api/processar-pdf
 * Recebe PDF + Excel e encaminha para o serviço OCR no Railway.
 */
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req) {
  try {
    const OCR_URL    = process.env.OCR_SERVICE_URL
    const OCR_SECRET = process.env.OCR_SERVICE_SECRET || ''

    if (!OCR_URL) {
      return NextResponse.json({ erro: 'OCR_SERVICE_URL não configurado.' }, { status: 500 })
    }

    // Lê o form do frontend
    const formOriginal = await req.formData()

    // Monta novo form garantindo os nomes corretos dos campos
    const novoForm = new FormData()

    const pdfFile   = formOriginal.get('pdf')
    const excelFile = formOriginal.get('excel')
    const nomeDoc   = formOriginal.get('nomeDocumento') || ''
    const mensagem  = formOriginal.get('mensagem') || ''

    if (!pdfFile)   return NextResponse.json({ erro: 'PDF obrigatório.' }, { status: 400 })
    if (!excelFile) return NextResponse.json({ erro: 'Excel obrigatório.' }, { status: 400 })

    novoForm.append('pdf',           pdfFile)
    novoForm.append('excel',         excelFile)
    novoForm.append('nomeDocumento', nomeDoc)
    novoForm.append('mensagem',      mensagem)

    const res  = await fetch(`${OCR_URL}/processar`, {
      method:  'POST',
      headers: { 'x-ocr-secret': OCR_SECRET },
      body:    novoForm,
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })

  } catch (err) {
    console.error('[processar-pdf]', err)
    return NextResponse.json({ erro: err.message }, { status: 500 })
  }
}
