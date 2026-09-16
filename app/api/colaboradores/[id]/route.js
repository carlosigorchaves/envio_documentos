import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

// Editar colaborador
export async function PUT(req, { params }) {
  try {
    const { id } = params
    const body   = await req.json()
    const sb     = supabaseAdmin()

    const updates = {}
    if (body.nome        !== undefined) updates.nome         = body.nome
    if (body.email       !== undefined) updates.email        = body.email
    if (body.cpf         !== undefined) updates.cpf          = body.cpf
    if (body.matricula   !== undefined) updates.matricula    = body.matricula
    if (body.cargo       !== undefined) updates.cargo        = body.cargo
    if (body.centro_custo !== undefined) updates.centro_custo = body.centro_custo
    if (body.situacao    !== undefined) updates.situacao     = body.situacao

    const { data, error } = await sb
      .from('colaboradores')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ ok: true, colaborador: data })
  } catch (err) {
    return NextResponse.json({ erro: err.message }, { status: 500 })
  }
}

// Excluir colaborador (só se não tiver documento)
export async function DELETE(req, { params }) {
  try {
    const { id } = params
    const sb     = supabaseAdmin()

    // Verifica se tem documento na Autentique
    const { data: col, error: selErr } = await sb
      .from('colaboradores')
      .select('id, document_id, nome')
      .eq('id', id)
      .single()

    if (selErr) throw selErr

    if (col.document_id) {
      return NextResponse.json({
        erro: 'Este colaborador já possui documento enviado na Autentique. Use a opção "Desativar" para marcá-lo como Demitido.',
        temDocumento: true,
      }, { status: 400 })
    }

    const { error } = await sb.from('colaboradores').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ erro: err.message }, { status: 500 })
  }
}
