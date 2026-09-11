import './globals.css'
import AuthGuard from '@/components/AuthGuard'

export const metadata = {
  title: 'Envio de Documentos — Autentique',
  description: 'Sistema de envio e acompanhamento de documentos para assinatura',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthGuard>
          {children}
        </AuthGuard>
      </body>
    </html>
  )
}
