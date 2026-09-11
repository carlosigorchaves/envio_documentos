'use client'
import { useState, useEffect, useRef } from 'react'
import Layout from '@/components/Layout'

export default function ConfigPage() {
  const [logoBase64, setLogoBase64]   = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [corPrimaria, setCorPrimaria] = useState('#3b5bdb')
  const [salvando, setSalvando]       = useState(false)
  const [msg, setMsg]                 = useState('')
  const fileRef = useRef()

  useEffect(() => {
    // Carrega configurações do Supabase
    fetch('/api/config').then(r => r.json()).then(cfg => {
      if (cfg.logo_base64)  setLogoBase64(cfg.logo_base64)
      if (cfg.nome_empresa) setNomeEmpresa(cfg.nome_empresa)
      if (cfg.cor_primaria) setCorPrimaria(cfg.cor_primaria)

      // Sincroniza com localStorage para o Sidebar
      const local = {
        logoUrl:     cfg.logo_base64  || '',
        nomeEmpresa: cfg.nome_empresa || '',
        corPrimaria: cfg.cor_primaria || '#3b5bdb',
      }
      localStorage.setItem('ue_config', JSON.stringify(local))
      window.dispatchEvent(new Event('ue_config_updated'))
    }).catch(() => {})
  }, [])

  function handleLogo(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => setLogoBase64(e.target.result)
    reader.readAsDataURL(file)
  }

  async function salvar() {
    setSalvando(true); setMsg('')
    try {
      const res  = await fetch('/api/config', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ logoBase64, nomeEmpresa, corPrimaria }),
      })
      const data = await res.json()
      if (data.erro) throw new Error(data.erro)

      // Atualiza localStorage e dispara evento para o Sidebar atualizar
      const local = { logoUrl: logoBase64, nomeEmpresa, corPrimaria }
      localStorage.setItem('ue_config', JSON.stringify(local))
      window.dispatchEvent(new Event('ue_config_updated'))

      setMsg('✅ Configurações salvas com sucesso!')
    } catch(err) {
      setMsg('❌ Erro ao salvar: ' + err.message)
    } finally { setSalvando(false) }
  }

  return (
    <Layout title="Configurações">
      <div style={{ maxWidth: 600 }}>

        {/* Logo */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">🖼️ Logo da empresa</div>
          <div style={{
            width: '100%', height: 130,
            background: 'var(--subtle)', borderRadius: 'var(--r8)',
            border: '1.5px dashed var(--border2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, overflow: 'hidden',
          }}>
            {logoBase64 ? (
              <img src={logoBase64} alt="Logo"
                style={{ maxHeight: 110, maxWidth: '85%', objectFit: 'contain' }}/>
            ) : (
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhuma logo configurada</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-sm" onClick={() => fileRef.current.click()}>
              📁 Selecionar imagem
            </button>
            {logoBase64 && (
              <button className="btn btn-rose" onClick={() => setLogoBase64('')}>
                🗑 Remover logo
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*"
            style={{ display: 'none' }} onChange={e => handleLogo(e.target.files[0])}/>
          <div className="hint" style={{ marginTop: 8 }}>
            Formatos: PNG, JPG, SVG. Recomendado: fundo transparente (PNG). A logo aparece na tela de login e no menu lateral.
          </div>
        </div>

        {/* Dados da empresa */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">🏢 Identidade visual</div>
          <div className="fg">
            <label>Nome da empresa</label>
            <input type="text" value={nomeEmpresa}
              onChange={e => setNomeEmpresa(e.target.value)}
              placeholder="Ex: Instituto Social Se Liga"/>
          </div>
          <div className="fg">
            <label>Cor principal</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="color" value={corPrimaria}
                onChange={e => setCorPrimaria(e.target.value)}
                style={{ width: 48, height: 38, border: '1.5px solid var(--border)',
                  borderRadius: 'var(--r8)', cursor: 'pointer', padding: 2 }}/>
              <input type="text" value={corPrimaria}
                onChange={e => setCorPrimaria(e.target.value)}
                style={{ width: 110 }}/>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                Cor usada nos destaques do sistema
              </span>
            </div>
          </div>
        </div>

        {/* Preview tela de login */}
        {(logoBase64 || nomeEmpresa) && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">👁️ Preview — tela de login</div>
            <div style={{
              background: 'linear-gradient(135deg, #f0f2f8, #e8ecf8)',
              borderRadius: 'var(--r8)', padding: 24, textAlign: 'center',
            }}>
              {logoBase64 && (
                <img src={logoBase64} alt="Logo"
                  style={{ maxHeight: 70, maxWidth: '70%', objectFit: 'contain', marginBottom: 12 }}/>
              )}
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0e1117' }}>UE Sign</div>
              {nomeEmpresa && (
                <div style={{ fontSize: 12, color: '#8891a8', marginTop: 2 }}>{nomeEmpresa}</div>
              )}
              <div style={{ fontSize: 11, color: '#b0b8cc', marginTop: 4 }}>
                Assinaturas digitais simplificadas
              </div>
            </div>
          </div>
        )}

        {msg && (
          <div style={{
            padding: '11px 16px', borderRadius: 'var(--r8)', fontSize: 13, marginBottom: 14,
            background: msg.startsWith('✅') ? 'var(--green-lt)' : 'var(--rose-lt)',
            color:      msg.startsWith('✅') ? 'var(--green)'    : 'var(--rose)',
            border:     `1px solid ${msg.startsWith('✅') ? '#bbf7d0' : '#fecdd3'}`,
          }}>{msg}</div>
        )}

        <button className="btn btn-primary" onClick={salvar}
          disabled={salvando} style={{ maxWidth: 220 }}>
          {salvando ? '⏳ Salvando…' : '💾 Salvar configurações'}
        </button>
      </div>
    </Layout>
  )
}
