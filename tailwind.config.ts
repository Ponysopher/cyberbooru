// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [ './app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}' ],
  theme: {
    extend: {
      // colors: {
      //   cyber: {
      //     bg: '#121212',
      //     surface: '#1e1e1e',
      //     primary: '#ff00cc',
      //     secondary: '#00ffe7',
      //     purple: '#c084fc',
      //   },
      // },
      fontFamily: {
        sans: ['var(--font-orbitron)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
