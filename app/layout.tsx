import './layout.css'
import { Orbitron } from 'next/font/google'

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '700'], // pick the weights you need
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={orbitron.variable}>
      <body className="bg-cyber-bg text-cyber-primary font-sans">
        {children}
      </body>
    </html>
  )
}
