import { supabaseAdmin } from './supabase'

const sb = () => supabaseAdmin()

export async function inserirLote(colaboradores, loteId) {
  const rows = colaboradores.map(c => ({
    lote_id: loteId,
    nome:    c.nome  || '',
    email:   c.email || '',
    cpf:     c.cpf   || null,
    cargo:   c.cargo || null,
    extras:  c.extras && Object.keys(c.extras).length ? c.extras : null,
    status:  'pendente',
  }))
  const { error } = await sb().from('colaboradores').insert(rows)
  if (error) throw new Error('Supabase insert: ' + error.message)
}

export async function buscarPorLote(loteId) {
  const { data, error } = await sb()
    .from('colaboradores').select('*')
    .eq('lote_id', loteId).order('id', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function marcarEnviado(id, { documentId, signaturePublicId, linkAssinatura }) {
  const { error } = await sb().from('colaboradores').update({
    document_id:         documentId,
    signature_public_id: signaturePublicId || null,
    link_assinatura:     linkAssinatura    || null,
    status:              'enviado',
    enviado_em:          new Date().toISOString(),
  }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function atualizarStatus(documentId, { email, status, quando, arquivoUrl } = {}) {
  let q = sb().from('colaboradores').select('id,status,visualizado_em,assinado_em,rejeitado_em')
    .eq('document_id', documentId)
  if (email) q = q.eq('email', email)

  const { data: rows, error } = await q
  if (error) throw new Error(error.message)
  if (!rows?.length) return false

  let alterou = false
  for (const row of rows) {
    const up = {}
    if (status === 'visualizado' && !row.visualizado_em) { up.visualizado_em = quando || new Date().toISOString(); up.status = 'visualizado' }
    if (status === 'assinado'    && !row.assinado_em)    { up.assinado_em    = quando || new Date().toISOString(); up.status = 'assinado'; if (arquivoUrl) up.arquivo_assinado_url = arquivoUrl }
    if (status === 'rejeitado'   && !row.rejeitado_em)   { up.rejeitado_em   = quando || new Date().toISOString(); up.status = 'rejeitado' }
    if (arquivoUrl && !row.arquivo_assinado_url) up.arquivo_assinado_url = arquivoUrl

    if (Object.keys(up).length) {
      await sb().from('colaboradores').update(up).eq('id', row.id)
      alterou = true
    }
  }
  return alterou
}

export async function listarColaboradores({ loteId, status } = {}) {
  let q = sb().from('colaboradores').select('*').order('created_at', { ascending: false })
  if (loteId) q = q.eq('lote_id', loteId)
  if (status && status !== 'todos') q = q.eq('status', status)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data || []
}

export async function listarLotes() {
  const { data, error } = await sb()
    .from('colaboradores').select('lote_id,status,created_at').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  const mapa = {}
  for (const r of (data || [])) {
    if (!r.lote_id) continue
    if (!mapa[r.lote_id]) mapa[r.lote_id] = { loteId: r.lote_id, criadoEm: r.created_at, total:0, pendente:0, enviado:0, visualizado:0, assinado:0, rejeitado:0 }
    mapa[r.lote_id].total++
    mapa[r.lote_id][r.status] = (mapa[r.lote_id][r.status] || 0) + 1
  }
  return Object.values(mapa)
}
