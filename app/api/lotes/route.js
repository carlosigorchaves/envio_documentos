import { NextResponse } from 'next/server'
import { listarLotes } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const data = await listarLotes()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ erro: err.message }, { status: 500 })
  }
}
