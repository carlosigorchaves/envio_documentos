import Sidebar from './Sidebar'

export default function Layout({ children, title, actions }) {
  const sandbox = process.env.AUTENTIQUE_SANDBOX !== 'false'

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar sandbox={sandbox} />
      <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div style={{
          background: 'var(--white)', borderBottom: '1px solid var(--border)',
          padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 12,
          position: 'sticky', top: 0, zIndex: 9,
        }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, flex: 1 }}>{title}</h1>
          {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
        </div>
        {/* Body */}
        <div style={{ padding: 28, flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
