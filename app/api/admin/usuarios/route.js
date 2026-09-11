import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

// Lista usuários
export async function GET() {
  try {
    const sb = supabaseAdmin()
    const { data, error } = await sb.auth.admin.listUsers()
    if (error) throw error

    const usuarios = data.users.map(u => ({
      id:    u.id,
      email: u.email,
      nome:  u.user_metadata?.nome || '',
      criadoEm: u.created_at,
    }))

    return NextResponse.json({ usuarios })
  } catch (err) {
    return NextResponse.json({ erro: err.message }, { status: 500 })
  }
}

// Cria usuário
export async function POST(req) {
  try {
    const { nome, email, senha } = await req.json()
    if (!email || !senha) return NextResponse.json({ erro: 'Email e senha obrigatórios.' }, { status: 400 })

    const sb = supabaseAdmin()
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password:      senha,
      email_confirm: true,
      user_metadata: { nome: nome || '' },
    })
    if (error) throw error

    return NextResponse.json({ ok: true, usuario: { id: data.user.id, email: data.user.email } })
  } catch (err) {
    return NextResponse.json({ erro: err.message }, { status: 500 })
  }
}

// Deleta usuário
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ erro: 'ID obrigatório.' }, { status: 400 })

    const sb = supabaseAdmin()
    const { error } = await sb.auth.admin.deleteUser(id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ erro: err.message }, { status: 500 })
  }
}
