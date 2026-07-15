import { beforeEach, describe, expect, it } from 'vitest'

import { CATEGORY_INDEX_STORAGE_KEY, getCategoryIndex, setCategoryForTransaction } from './categoryIndex'

beforeEach(() => {
  localStorage.clear()
})

describe('getCategoryIndex / setCategoryForTransaction', () => {
  it('round-trips a category set for a transaction', () => {
    setCategoryForTransaction('tx-1', 'alimentacao')

    expect(getCategoryIndex()).toEqual({ 'tx-1': 'alimentacao' })
  })

  it('merges multiple transactions into the same index on round-trip', () => {
    setCategoryForTransaction('tx-1', 'alimentacao')
    setCategoryForTransaction('tx-2', 'transporte')

    expect(getCategoryIndex()).toEqual({ 'tx-1': 'alimentacao', 'tx-2': 'transporte' })
  })

  it('returns an empty index when localStorage has no entry (no throw)', () => {
    expect(() => getCategoryIndex()).not.toThrow()
    expect(getCategoryIndex()).toEqual({})
  })

  it('falls back to an empty index when the stored value is corrupted JSON (no throw)', () => {
    localStorage.setItem(CATEGORY_INDEX_STORAGE_KEY, 'not-valid-json{{{')

    expect(() => getCategoryIndex()).not.toThrow()
    expect(getCategoryIndex()).toEqual({})
  })
})
