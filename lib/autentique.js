const API = 'https://api.autentique.com.br/v2/graphql'

function token() {
  const t = process.env.AUTENTIQUE_API_TOKEN
  if (!t) throw new Error('AUTENTIQUE_API_TOKEN não configurado.')
  return t
}

export const isSandbox = () =>
  String(process.env.AUTENTIQUE_SANDBOX).toLowerCase() === 'true'

// Cria documento na Autentique com upload de PDF
export async function criarDocumento({ nome, pdfBuffer, pdfNome, signatarios, mensagem }) {
  const FormData = (await import('form-data')).default
  const fetch    = (await import('node-fetch')).default

  const query = `
    mutation CreateDocumentMutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) {
      createDocument(sandbox: ${isSandbox()}, document: $document, signers: $signers, file: $file) {
        id name created_at
        signatures { public_id name email action { name } link { short_link } }
      }
    }`

  const variables = {
    document: { name: nome, ...(mensagem ? { message: mensagem } : {}) },
    signers:  signatarios.map(s => ({ email: s.email, name: s.nome, action: 'SIGN' })),
    file: null,
  }

  const form = new FormData()
  form.append('operations', JSON.stringify({ query, variables }))
  form.append('map', JSON.stringify({ file: ['variables.file'] }))
  form.append('file', Buffer.from(pdfBuffer), {
    filename: pdfNome || 'documento.pdf',
    contentType: 'application/pdf',
  })

  const res  = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, ...form.getHeaders() },
    body: form,
  })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0]?.message || JSON.stringify(json.errors))
  return json.data.createDocument
}

// Consulta status de um documento
export async function consultarDocumento(docId) {
  const fetch = (await import('node-fetch')).default

  const query = `
    query($id: UUID!) {
      document(id: $id) {
        id
        signatures { email viewed { created_at } signed { created_at } rejected { created_at } }
        files { signed }
      }
    }`

  const res  = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify({ query, variables: { id: docId } }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0]?.message || 'Erro Autentique')
  return json.data.document
}
