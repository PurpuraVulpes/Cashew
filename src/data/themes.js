// Palettes de couleurs pour le thème de l'application.
// Chaque thème définit les nuances 50 → 800 injectées en CSS variables
// (--color-brand-*) appliquées à toute l'interface en temps réel.

export const THEMES = [
  {
    id: 'emerald',
    label: 'Émeraude',
    shades: {
      50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ce9b7',
      400: '#31d795', 500: '#0d9d6c', 600: '#0b845c', 700: '#0c6a4c', 800: '#0d5540',
    },
  },
  {
    id: 'blue',
    label: 'Océan',
    shades: {
      50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
      400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af',
    },
  },
  {
    id: 'violet',
    label: 'Violet',
    shades: {
      50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd',
      400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 800: '#5b21b6',
    },
  },
  {
    id: 'rose',
    label: 'Rose',
    shades: {
      50: '#fff1f2', 100: '#ffe4e6', 200: '#fecdd3', 300: '#fda4af',
      400: '#fb7185', 500: '#f43f5e', 600: '#e11d48', 700: '#be123c', 800: '#9f1239',
    },
  },
  {
    id: 'red',
    label: 'Rouge',
    shades: {
      50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
      400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b',
    },
  },
  {
    id: 'orange',
    label: 'Orange',
    shades: {
      50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
      400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412',
    },
  },
  {
    id: 'teal',
    label: 'Lagoon',
    shades: {
      50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4',
      400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e', 800: '#115e59',
    },
  },
  {
    id: 'slate',
    label: 'Minuit',
    shades: {
      50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
      400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b',
    },
  },
]

export const DEFAULT_THEME_ID = 'emerald'

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0]
}

export function applyThemeToDocument(themeId) {
  const theme = getTheme(themeId)
  const root = document.documentElement
  for (const [shade, value] of Object.entries(theme.shades)) {
    root.style.setProperty(`--color-brand-${shade}`, value)
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.shades[600])
  try {
    // Mémorise les nuances pour restaurer le thème avant le premier rendu (anti-flash)
    localStorage.setItem('cashew-theme-vars', JSON.stringify(theme.shades))
  } catch { /* ignore */ }
}
