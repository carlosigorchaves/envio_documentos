import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Leitura pública (usada pela tela de login)
export async function GET() {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    )
    const { data, error } = await sb
      .from('configuracoes')
      .select('logo_base64, nome_empresa, cor_primaria')
      .eq('id', 'default')
      .single()

    if (error) throw error
    return NextResponse.json(data || {})
  } catch (err) {
    return NextResponse.json({}, { status: 200 }) // retorna vazio sem erro
  }
}

// Escrita autenticada (usada pela tela de configurações)
export async function POST(req) {
  try {
    const body = await req.json()
    const sb   = supabaseAdmin()

    const { error } = await sb
      .from('configuracoes')
      .upsert({
        id:           'default',
        logo_base64:  body.logoBase64  || null,
        nome_empresa: body.nomeEmpresa || '',
        cor_primaria: body.corPrimaria || '#3b5bdb',
        updated_at:   new Date().toISOString(),
      })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ erro: err.message }, { status: 500 })
  }
}
