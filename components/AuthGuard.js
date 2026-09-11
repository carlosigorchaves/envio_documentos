'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ROTAS_PUBLICAS = ['/login']

export default function AuthGuard({ children }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [ok, setOk] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const isPublica = ROTAS_PUBLICAS.includes(pathname)
      if (!session && !isPublica) {
        router.push('/login')
      } else if (session && pathname === '/login') {
        router.push('/envio')
      } else {
        setOk(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session && !ROTAS_PUBLICAS.includes(pathname)) {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [pathname, router])

  if (!ok) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>Carregando…</div>
    </div>
  )

  return children
}
