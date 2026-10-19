import type { Metadata } from 'next'
import { DM_Serif_Display, Inter } from 'next/font/google'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import './globals.css'

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-dm-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'SaccoSphere — The network Kenya’s cooperatives run on',
    template: '%s — SaccoSphere',
  },
  description:
    'SaccoSphere is the shared infrastructure behind Kenya’s SACCOs — one account for members across every cooperative they belong to, bank-grade ledger and compliance underneath every SACCO that runs one.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSerif.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  )
}
