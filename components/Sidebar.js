'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const LINKS = [
  { href: '/envio',          icon: '📤', label: 'Novo envio' },
  { href: '/acompanhamento', icon: '📊', label: 'Acompanhamento' },
  { href: '/assinados',      icon: '✅', label: 'Assinados' }, 
  { href: '/config',         icon: '⚙️', label: 'Configurações' },
]

export default function Sidebar({ sandbox }) {
  const path   = usePathname()
  const router = useRouter()
  const [cfg, setCfg]   = useState({ logoUrl: '', nomeEmpresa: '', corPrimaria: '#3b5bdb' })
  const [user, setUser] = useState(null)

  useEffect(() => {
    function carregarCfg() {
      const c = JSON.parse(localStorage.getItem('ue_config') || '{}')
      setCfg({
        logoUrl:     c.logoUrl     || '',
        nomeEmpresa: c.nomeEmpresa || '',
        corPrimaria: c.corPrimaria || '#3b5bdb',
      })
    }
    carregarCfg()
    window.addEventListener('ue_config_updated', carregarCfg)

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user)
    })

    return () => window.removeEventListener('ue_config_updated', carregarCfg)
  }, [])

  async function sair() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const nomeUser    = user?.user_metadata?.nome || user?.email?.split('@')[0] || 'Usuário'
  const iniciaisUser = nomeUser.slice(0,2).toUpperCase()

  return (
    <aside style={{
      width: 224, background: 'var(--white)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', position: 'fixed',
      top: 0, left: 0, bottom: 0, zIndex: 10,
    }}>
      {/* Brand / Logo */}
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--border)' }}>
        {cfg.logoUrl ? (
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <img src={cfg.logoUrl} alt="Logo"
              style={{ maxHeight: 80, maxWidth: '90%', objectFit: 'contain' }}/>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 800, fontSize: 15, marginBottom: 2 }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <rect width="26" height="26" rx="7" fill={cfg.corPrimaria || '#3b5bdb'}/>
              <path d="M6 13l5 5 9-9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Autentique
          </div>
        )}
        {cfg.nomeEmpresa && (
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, textAlign: 'center' }}>
            {cfg.nomeEmpresa}
          </div>
        )}
        {!cfg.nomeEmpresa && !cfg.logoUrl && (
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Gestão de documentos</div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--border2)', padding: '8px 12px 6px' }}>
          Menu
        </div>
        {LINKS.map(l => {
          const active = path === l.href
          return (
            <Link key={l.href} href={l.href} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '9px 12px', borderRadius: 'var(--r8)',
              fontSize: 13, fontWeight: active ? 600 : 500,
              color: active ? (cfg.corPrimaria || 'var(--blue)') : 'var(--muted)',
              background: active ? `${cfg.corPrimaria || '#3b5bdb'}18` : 'transparent',
              textDecoration: 'none', transition: 'all .15s', marginBottom: 2,
            }}>
              <span style={{ fontSize: 16 }}>{l.icon}</span>
              {l.label}
            </Link>
          )
        })}
      </nav>

      {/* Usuário logado */}
      {user && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
          <Link href="/perfil" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', borderRadius: 'var(--r8)',
              cursor: 'pointer', transition: 'background .15s',
              marginBottom: 6,
            }}
            onMouseEnter={e => e.currentTarget.style.background='var(--subtle)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: `linear-gradient(135deg, ${cfg.corPrimaria || '#3b5bdb'}, #7c3aed)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
              }}>
                {iniciaisUser}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {nomeUser}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>Ver perfil</div>
              </div>
            </div>
          </Link>

          <button onClick={sair} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 7,
            padding: '7px 10px', borderRadius: 'var(--r8)',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--muted)', transition: 'all .15s',
            marginBottom: 8,
          }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--rose-lt)'; e.currentTarget.style.color='var(--rose)' }}
          onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--muted)' }}
          >
            🚪 Sair
          </button>

          {/* Status sandbox/prod */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
            background: sandbox ? 'var(--amber-lt)' : 'var(--green-lt)',
            color: sandbox ? 'var(--amber)' : 'var(--green)',
            marginBottom: 8,
          }}>
            {sandbox ? '⚠️ Sandbox' : '✅ Produção'}
          </div>

          {/* Rodapé UE */}
          <div style={{
            borderTop: '1px solid var(--border)', paddingTop: 8,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: 4,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--muted)', lineHeight: 1.3 }}>Desenvolvido por</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', lineHeight: 1.3 }}>Unidade Estratégica</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
