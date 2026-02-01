'use client';
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class" // Adds .dark to <html> → matches your @custom-variant
      defaultTheme="system" // Defaults to user's system preference (light/dark)
      enableSystem // Respect prefers-color-scheme
      disableTransitionOnChange // Prevents flash/transition flicker on toggle
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
