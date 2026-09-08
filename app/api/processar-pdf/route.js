/**
 * POST /api/processar-pdf
 * Recebe o PDF e encaminha para o serviço OCR no Railway.
 * O Railway faz o OCR, separa os PDFs e envia para a Autentique.
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

    // Repassa o form diretamente para o Railway
    const form = await req.formData()

    const res  = await fetch(`${OCR_URL}/processar`, {
      method:  'POST',
      headers: { 'x-ocr-secret': OCR_SECRET },
      body:    form,
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })

  } catch (err) {
    console.error('[processar-pdf]', err)
    return NextResponse.json({ erro: err.message }, { status: 500 })
  }
}
