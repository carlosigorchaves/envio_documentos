'use client'
import { useState, useEffect, useRef } from 'react'
import Layout from '@/components/Layout' 

export default function ConfigPage() {
  const [logoUrl, setLogoUrl]         = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [corPrimaria, setCorPrimaria] = useState('#3b5bdb')
  const [salvo, setSalvo]             = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    const cfg = JSON.parse(localStorage.getItem('ue_config') || '{}')
    if (cfg.logoUrl)     setLogoUrl(cfg.logoUrl)
    if (cfg.nomeEmpresa) setNomeEmpresa(cfg.nomeEmpresa)
    if (cfg.corPrimaria) setCorPrimaria(cfg.corPrimaria)
  }, [])

  function handleLogo(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => setLogoUrl(e.target.result)
    reader.readAsDataURL(file)
  }

  function salvar() {
    const cfg = { logoUrl, nomeEmpresa, corPrimaria }
    localStorage.setItem('ue_config', JSON.stringify(cfg))
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2500)
    // Recarrega para aplicar o logo no sidebar
    window.dispatchEvent(new Event('ue_config_updated'))
  }

  function removerLogo() {
    setLogoUrl('')
  }

  return (
    <Layout title="Configurações">
      <div style={{ maxWidth: 600 }}>

        {/* Logo */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">🖼️ Logo da empresa</div>

          {/* Preview */}
          <div style={{
            width: '100%', height: 120,
            background: 'var(--subtle)', borderRadius: 'var(--r8)',
            border: '1.5px dashed var(--border2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, overflow: 'hidden',
          }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ maxHeight: 100, maxWidth: '80%', objectFit: 'contain' }}/>
            ) : (
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhuma logo configurada</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-sm" onClick={() => fileRef.current.click()}>
              📁 Selecionar imagem
            </button>
            {logoUrl && (
              <button className="btn btn-rose" onClick={removerLogo}>
                🗑 Remover logo
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => handleLogo(e.target.files[0])}/>
          <div className="hint" style={{ marginTop: 8 }}>
            Formatos aceitos: PNG, JPG, SVG. Recomendado: fundo transparente (PNG).
          </div>
        </div>

        {/* Nome da empresa */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">🏢 Dados da empresa</div>
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
                style={{ width: 48, height: 38, border: '1.5px solid var(--border)', borderRadius: 'var(--r8)', cursor: 'pointer', padding: 2 }}/>
              <input type="text" value={corPrimaria}
                onChange={e => setCorPrimaria(e.target.value)}
                style={{ width: 120 }}/>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Cor usada nos destaques do sistema</span>
            </div>
          </div>
        </div>

        {/* Salvar */}
        <button className="btn btn-primary" onClick={salvar} style={{ maxWidth: 200 }}>
          💾 Salvar configurações
        </button>

        {salvo && (
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
            ✅ Configurações salvas com sucesso!
          </div>
        )}
      </div>
    </Layout>
  )
}
