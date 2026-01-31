// app/layout.jsx
import { Inter } from 'next/font/google'
import './globals.css'
import ToastProvider from './ToastProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'REAL Milk Aggregator',
  description: 'Full-stack dairy distribution platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}