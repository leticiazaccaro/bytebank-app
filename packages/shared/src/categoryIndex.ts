import { CategoryId } from './types'

export const CATEGORY_INDEX_STORAGE_KEY = 'bytebank_category_index'

export type CategoryIndex = Record<string, CategoryId>

/**
 * Reads the client-side transactionId -> CategoryId index from localStorage.
 * Missing or corrupted (non-JSON / non-object) entries fall back to an empty
 * index instead of throwing — see spec.md Edge Case "índice local limpo".
 */
export function getCategoryIndex(): CategoryIndex {
  const raw = localStorage.getItem(CATEGORY_INDEX_STORAGE_KEY)
  if (!raw) return {}

  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as CategoryIndex
    }
    return {}
  } catch {
    return {}
  }
}

/**
 * Persists the category chosen for a transaction, merging into the existing
 * index (see spec.md FORM-04).
 */
export function setCategoryForTransaction(transactionId: string, categoryId: CategoryId): void {
  const index = getCategoryIndex()
  index[transactionId] = categoryId
  localStorage.setItem(CATEGORY_INDEX_STORAGE_KEY, JSON.stringify(index))
}
