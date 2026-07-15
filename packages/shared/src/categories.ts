import { Category, CategoryId } from './types'

// Fixed category taxonomy with keyword dictionaries used by suggestCategory().
// The API has no category field (see design.md Data Models) — this is a
// client-side-only classification aid.
export const CATEGORIES: Category[] = [
  {
    id: 'alimentacao',
    label: 'Alimentação',
    keywords: [
      'mercado',
      'supermercado',
      'restaurante',
      'ifood',
      'lanche',
      'padaria',
      'almoco',
      'almoço',
      'jantar',
    ],
  },
  {
    id: 'transporte',
    label: 'Transporte',
    keywords: [
      'uber',
      '99',
      'combustivel',
      'combustível',
      'gasolina',
      'onibus',
      'ônibus',
      'metro',
      'metrô',
      'estacionamento',
    ],
  },
  {
    id: 'moradia',
    label: 'Moradia',
    keywords: [
      'aluguel',
      'condominio',
      'condomínio',
      'luz',
      'agua',
      'água',
      'energia',
      'internet',
      'gas',
      'gás',
    ],
  },
  {
    id: 'lazer',
    label: 'Lazer',
    keywords: ['cinema', 'netflix', 'spotify', 'show', 'viagem', 'bar', 'streaming', 'jogo'],
  },
  {
    id: 'saude',
    label: 'Saúde',
    keywords: [
      'farmacia',
      'farmácia',
      'medico',
      'médico',
      'hospital',
      'dentista',
      'academia',
      'plano de saude',
      'plano de saúde',
    ],
  },
  {
    id: 'salario',
    label: 'Salário',
    keywords: ['salario', 'salário', 'pagamento', 'holerite', 'provento', 'folha'],
  },
  {
    id: 'outros',
    label: 'Outros',
    keywords: [],
  },
]

/**
 * Suggests a CategoryId for a free-text description via keyword-matching
 * against CATEGORIES (case-insensitive). Falls back to 'outros' when no
 * keyword matches. Non-blocking suggestion — see spec.md FORM-03.
 */
export function suggestCategory(description: string): CategoryId {
  const normalized = description.toLowerCase()

  for (const category of CATEGORIES) {
    if (category.keywords.some((keyword) => normalized.includes(keyword))) {
      return category.id
    }
  }

  return 'outros'
}
