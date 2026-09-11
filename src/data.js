import { mixHex, withAlpha, isLight } from './utils.js'

// Catégories : id, libellé FR, emoji, couleur pastille
export const CATEGORIES = [
  // Dépenses
  { id: 'groceries', label: 'Courses', emoji: '🛒', color: '#7cc46a', type: 'expense' },
  { id: 'restaurants', label: 'Restaurant & café', emoji: '🍔', color: '#ff7a6b', type: 'expense' },
  { id: 'transport', label: 'Transports', emoji: '🚌', color: '#4a90e2', type: 'expense' },
  { id: 'housing', label: 'Logement', emoji: '🏠', color: '#9b7ede', type: 'expense' },
  { id: 'utilities', label: 'Factures', emoji: '💡', color: '#f5a623', type: 'expense' },
  { id: 'health', label: 'Santé', emoji: '💊', color: '#f26b9c', type: 'expense' },
  { id: 'fun', label: 'Loisirs', emoji: '🎮', color: '#c86bff', type: 'expense' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#ec6c8b', type: 'expense' },
  { id: 'subscriptions', label: 'Abonnements', emoji: '📺', color: '#4cc3d9', type: 'expense' },
  { id: 'travel', label: 'Voyages', emoji: '✈️', color: '#36b6a0', type: 'expense' },
  { id: 'education', label: 'Éducation', emoji: '📚', color: '#6b8cff', type: 'expense' },
  { id: 'gifts', label: 'Cadeaux', emoji: '🎁', color: '#ff8fa3', type: 'expense' },
  { id: 'fees', label: 'Frais & taxes', emoji: '🧾', color: '#9aa7b5', type: 'expense' },
  { id: 'other_expense', label: 'Autre', emoji: '📦', color: '#8a94a6', type: 'expense' },
  // Revenus
  { id: 'salary', label: 'Salaire', emoji: '💼', color: '#34c77b', type: 'income' },
  { id: 'freelance', label: 'Freelance', emoji: '💻', color: '#48b8a8', type: 'income' },
  { id: 'gift_in', label: 'Cadeau reçu', emoji: '🎉', color: '#f79ab6', type: 'income' },
  { id: 'refund', label: 'Remboursement', emoji: '↩️', color: '#6fbfd9', type: 'income' },
  { id: 'other_income', label: 'Autre revenu', emoji: '💰', color: '#d9b24c', type: 'income' },
]

export const categoryById = (id) =>
  CATEGORIES.find((c) => c.id === id) || CATEGORIES.find((c) => c.id === 'other_expense')

export const categoriesForType = (type) => CATEGORIES.filter((c) => c.type === type)

// Couleurs d'accent personnalisables (comme Cashew)
const A = (label, dark, light, gd, gl) => ({
  label,
  dark: { accent: dark, soft: withAlpha(dark, 0.15), on: isLight(dark) ? '#0a140d' : '#ffffff', grad: gd },
  light: { accent: light, soft: withAlpha(light, 0.12), on: isLight(light) ? '#0a140d' : '#ffffff', grad: gl },
})

export const ACCENTS = {
  green: A('Vert', '#96ecb1', '#1f9d55', ['#7db989', '#c5e2c1'], ['#67b078', '#a8d2b0']),
  teal: A('Turquoise', '#7fe6d4', '#0f9c87', ['#5fc2b3', '#bdeee6'], ['#4bb3a2', '#9cd9d0']),
  blue: A('Bleu', '#92ccf7', '#2378b8', ['#73a9d8', '#bcdff4'], ['#5d9ccb', '#a9d2ea']),
  cyan: A('Cyan', '#93dcf2', '#1d8bb0', ['#70bdd6', '#c5ecf6'], ['#54a9c8', '#a7d9e8']),
  indigo: A('Indigo', '#a9b6ff', '#4a5fd6', ['#8695e3', '#d3d9fb'], ['#6c7ddb', '#acb6ec']),
  purple: A('Violet', '#c8b4ff', '#7557dd', ['#a388e0', '#d8ccf4'], ['#967ee2', '#cbbff2']),
  pink: A('Rose', '#ffadd7', '#d14e92', ['#de83b5', '#f4c7df'], ['#d97aad', '#f0bcd8']),
  red: A('Rouge', '#ff9d98', '#cf4a43', ['#dd726d', '#f2bdb8'], ['#d97770', '#efb6b1']),
  orange: A('Orange', '#ffc88c', '#cf7622', ['#e3a45d', '#f3d3ab'], ['#df9a53', '#f0c89a']),
  amber: A('Jaune', '#ffe08f', '#b8860b', ['#e3c46f', '#f8ecc4'], ['#cf9f2f', '#ecd279']),
  lime: A('Citron vert', '#c6ee84', '#6fa020', ['#a7cc63', '#e3f4c2'], ['#8fba44', '#c3dd8f']),
  cocoa: A('Cacao', '#d9b48f', '#9a6b3f', ['#bd9470', '#ecd6bd'], ['#b98a5f', '#dfc39e']),
}

// Palette pour une couleur d'accent personnalisée (hex) ou prédéfinie
export function paletteForAccent(accent, mode) {
  if (accent && accent[0] === '#') {
    const base = mode === 'dark' ? mixHex(accent, '#ffffff', 0.42) : mixHex(accent, '#000000', 0.12)
    return {
      accent: base,
      soft: withAlpha(base, mode === 'dark' ? 0.16 : 0.12),
      on: isLight(base) ? '#0a140d' : '#ffffff',
      grad: [mixHex(base, '#000000', 0.16), mixHex(base, '#ffffff', 0.18)],
    }
  }
  return ACCENTS[accent]?.[mode] || ACCENTS.green[mode]
}

// Styles de fond : chaque teinte existe en mode sombre et clair
const S = (label, dark, light) => ({ label, dark, light })

export const STYLES = {
  default: S(
    'Vert',
    { bg: '#0c100e', elevated: '#101512', surface: '#151c18', surface2: '#1d2620', surface3: '#26312a' },
    { bg: '#eef2ef', elevated: '#f5f7f5', surface: '#ffffff', surface2: '#f0f4f1', surface3: '#e2e9e4' },
  ),
  slate: S(
    'Bleu nuit',
    { bg: '#0c0f14', elevated: '#10141b', surface: '#151a22', surface2: '#1e2530', surface3: '#2a3340' },
    { bg: '#edf0f5', elevated: '#f5f7fa', surface: '#ffffff', surface2: '#ecf0f5', surface3: '#dfe6ee' },
  ),
  graphite: S(
    'Gris',
    { bg: '#0e0f10', elevated: '#131415', surface: '#181a1c', surface2: '#232628', surface3: '#303438' },
    { bg: '#eff0f2', elevated: '#f6f6f8', surface: '#ffffff', surface2: '#eef0f2', surface3: '#e2e4e9' },
  ),
  mocha: S(
    'Cacao',
    { bg: '#110e0c', elevated: '#161210', surface: '#1c1815', surface2: '#27221e', surface3: '#342d28' },
    { bg: '#f4f0e8', elevated: '#faf7f1', surface: '#fdfbf7', surface2: '#f1ebdf', surface3: '#e5ddce' },
  ),
  amoled: S(
    'Noir pur',
    { bg: '#000000', elevated: '#0b0b0b', surface: '#131313', surface2: '#1e1e1e', surface3: '#2b2b2b' },
    { bg: '#f4f5f7', elevated: '#fbfbfc', surface: '#ffffff', surface2: '#eef0f3', surface3: '#e3e6eb' },
  ),
}

export const CURRENCIES = [
  { code: 'EUR', label: 'Euro — €' },
  { code: 'USD', label: 'Dollar US — $' },
  { code: 'GBP', label: 'Livre — £' },
  { code: 'CHF', label: 'Franc suisse — CHF' },
  { code: 'CAD', label: 'Dollar canadien — $' },
  { code: 'JPY', label: 'Yen — ¥' },
]

export const ACCOUNT_COLORS = [
  '#4a90e2', '#52b788', '#f5a623', '#f26b9c', '#9b7ede',
  '#4cc3d9', '#ff7a6b', '#7cc46a', '#c86bff', '#8a94a6',
]

export const ACCOUNT_EMOJIS = ['🏦', '💵', '💳', '🪙', '🏧', '🐷', '📱', '🧧', '💎', '🛡️']
