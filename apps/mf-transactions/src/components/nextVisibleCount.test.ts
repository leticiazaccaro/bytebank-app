import { describe, expect, it } from 'vitest'
import { nextVisibleCount } from './nextVisibleCount'

describe('nextVisibleCount', () => {
  it('reveals one more page worth of items (TXN-06)', () => {
    expect(nextVisibleCount(20, 45, 20)).toBe(40)
  })

  it('caps the visible count at the total, never exceeding what is already loaded', () => {
    expect(nextVisibleCount(40, 45, 20)).toBe(45)
  })

  it('is idempotent once every item is already visible', () => {
    expect(nextVisibleCount(45, 45, 20)).toBe(45)
  })

  it('does not reveal more than the total when the dataset is smaller than a page', () => {
    expect(nextVisibleCount(0, 10, 20)).toBe(10)
  })
})
