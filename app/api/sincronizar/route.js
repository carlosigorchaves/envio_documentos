import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { consultarDocumento } from '@/lib/autentique'
import { atualizarStatus } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST() {
  try {
    const sb = supabaseAdmin()

    // Busca documentos ainda não finalizados
    const { data: pendentes } = await sb
      .from('colaboradores')
      .select('document_id, email, status, visualizado_em, assinado_em')
      .in('status', ['enviado', 'visualizado'])
      .not('document_id', 'is', null)

    const ids = [...new Set((pendentes || []).map(r => r.document_id))]
    let atualizados = 0

    for (const docId of ids) {
      try {
        const doc = await consultarDocumento(docId)
        for (const sig of (doc.signatures || [])) {
          let ok = false

          if (sig.rejected) {
            ok = await atualizarStatus(docId, {
              email: sig.email,
              status: 'rejeitado',
              quando: sig.rejected.created_at,
            })
          } else if (sig.signed) {
            // Se assinou, garante que visualizado também é preenchido
            const col = (pendentes || []).find(r => r.document_id === docId && r.email === sig.email)
            if (col && !col.visualizado_em && sig.viewed) {
              await atualizarStatus(docId, {
                email: sig.email,
                status: 'visualizado',
                quando: sig.viewed.created_at,
              })
            } else if (col && !col.visualizado_em && sig.signed) {
              // Se não tem viewed mas tem signed, usa o mesmo timestamp do signed
              await atualizarStatus(docId, {
                email: sig.email,
                status: 'visualizado',
                quando: sig.signed.created_at,
              })
            }
            ok = await atualizarStatus(docId, {
              email:     sig.email,
              status:    'assinado',
              quando:    sig.signed.created_at,
              arquivoUrl: doc.files?.signed,
            })
          } else if (sig.viewed) {
            ok = await atualizarStatus(docId, {
              email:  sig.email,
              status: 'visualizado',
              quando: sig.viewed.created_at,
            })
          }

          if (ok) atualizados++
        }
        await new Promise(r => setTimeout(r, 1100))
      } catch (err) {
        console.error(`[sync] doc ${docId}:`, err.message)
      }
    }

    return NextResponse.json({
      ok: true,
      mensagem: `${atualizados} status atualizado(s).`,
      documentosConsultados: ids.length,
      atualizados,
    })
  } catch (err) {
    return NextResponse.json({ erro: err.message }, { status: 500 })
  }
}
