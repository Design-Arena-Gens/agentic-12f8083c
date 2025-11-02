import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dog Video Factory - AI Video Generator',
  description: 'Generate AI videos of dogs for YouTube Shorts using Veo 3.1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
