import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const sandbox = process.env.AUTENTIQUE_SANDBOX !== 'false'
  return NextResponse.json({ sandbox })
}
