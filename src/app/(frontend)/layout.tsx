import React from 'react'
import './styles.css'

export const metadata = {
  title: 'Placeholder',
}

export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="ar" dir="rtl">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
