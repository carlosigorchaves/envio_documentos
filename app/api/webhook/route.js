import { NextResponse } from 'next/server'
import { atualizarStatus } from '@/lib/db'
import { consultarDocumento } from '@/lib/autentique'

export const runtime = 'nodejs'

export async function POST(req) {
  // Responde rápido
  const body = await req.json().catch(() => ({}))

  setImmediate(async () => {
    try {
      const type   = body?.event?.type || body?.type
      const obj    = body?.event?.data?.object || body
      const docId  = obj?.document_id || obj?.document?.id || obj?.id
      const email  = obj?.email || obj?.signer?.email

      switch (type) {
        case 'signature.viewed':
          if (docId) await atualizarStatus(docId, { email, status: 'visualizado' }); break
        case 'signature.accepted':
        case 'signature.signed':
          if (docId) await atualizarStatus(docId, { email, status: 'assinado' }); break
        case 'signature.rejected':
          if (docId) await atualizarStatus(docId, { email, status: 'rejeitado' }); break
        case 'document.finished':
          if (docId) {
            const doc = await consultarDocumento(docId)
            for (const sig of (doc.signatures || [])) {
              if (sig.signed) await atualizarStatus(docId, {
                email: sig.email, status: 'assinado',
                quando: sig.signed.created_at, arquivoUrl: doc.files?.signed,
              })
            }
          }
          break
      }
    } catch (err) {
      console.error('[webhook]', err.message)
    }
  })

  return NextResponse.json({ ok: true })
}
