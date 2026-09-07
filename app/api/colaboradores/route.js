import { NextResponse } from 'next/server'
import { listarColaboradores } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const loteId = searchParams.get('lote')  || undefined
    const status = searchParams.get('status') || undefined
    const data = await listarColaboradores({ loteId, status })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ erro: err.message }, { status: 500 })
  }
}
