'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/envio',          icon: '📤', label: 'Novo envio' },
  { href: '/acompanhamento', icon: '📊', label: 'Acompanhamento' },
  { href: '/assinados',      icon: '✅', label: 'Assinados' },
]

export default function Sidebar({ sandbox }) {
  const path = usePathname()

  return (
    <aside style={{
      width: 220, background: 'var(--white)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', position: 'fixed',
      top: 0, left: 0, bottom: 0, zIndex: 10,
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 800, fontSize: 15 }}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <rect width="26" height="26" rx="7" fill="#3b5bdb"/>
            <path d="M6 13l5 5 9-9" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Autentique
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, paddingLeft: 35 }}>
          Gestão de documentos
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 10px', flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--border2)', padding: '10px 12px 6px' }}>
          Menu
        </div>
        {LINKS.map(l => {
          const active = path === l.href
          return (
            <Link key={l.href} href={l.href} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '9px 12px', borderRadius: 'var(--r8)',
              fontSize: 13, fontWeight: active ? 600 : 500,
              color: active ? 'var(--blue)' : 'var(--muted)',
              background: active ? 'var(--blue-lt)' : 'transparent',
              textDecoration: 'none', transition: 'all .15s',
              marginBottom: 2,
            }}>
              <span style={{ fontSize: 16 }}>{l.icon}</span>
              {l.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: 14, borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
          background: sandbox ? 'var(--amber-lt)' : 'var(--green-lt)',
          color: sandbox ? 'var(--amber)' : 'var(--green)',
        }}>
          {sandbox ? '⚠️ Sandbox' : '✅ Produção'}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 5 }}>
          Token configurado ✓
        </div>
      </div>
    </aside>
  )
}
