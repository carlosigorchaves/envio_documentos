import { NextResponse } from 'next/server'
import { listarColaboradores, atualizarStatus } from '@/lib/db'
import { consultarDocumento } from '@/lib/autentique'

export const runtime = 'nodejs'

export async function POST(req) {
  try {
    const body   = await req.json().catch(() => ({}))
    const loteId = body.loteId || undefined
    const assinados = await listarColaboradores({ loteId, status: 'assinado' })

    const arquivos = []
    for (const c of assinados) {
      let url = c.arquivo_assinado_url
      if (!url && c.document_id) {
        try {
          const doc = await consultarDocumento(c.document_id)
          url = doc.files?.signed
          if (url) await atualizarStatus(c.document_id, { email: c.email, status: 'assinado', arquivoUrl: url })
        } catch {}
      }
      arquivos.push({
        id: c.id, nome: c.nome, email: c.email,
        documentId: c.document_id, url: url || null,
        nomeArquivo: `${(c.nome || c.email).replace(/\s+/g, '-').toLowerCase()}.pdf`,
        assinadoEm: c.assinado_em,
      })
    }

    return NextResponse.json({ total: arquivos.length, arquivos })
  } catch (err) {
    return NextResponse.json({ erro: err.message }, { status: 500 })
  }
}
