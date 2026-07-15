import { describe, expect, it } from 'vitest'

import { suggestCategory } from './categories'

describe('suggestCategory', () => {
  it('suggests alimentacao for "Fui ao mercado"', () => {
    expect(suggestCategory('Fui ao mercado')).toBe('alimentacao')
  })

  it('suggests alimentacao for "Jantar em restaurante"', () => {
    expect(suggestCategory('Jantar em restaurante')).toBe('alimentacao')
  })

  it('suggests transporte for "Corrida de Uber"', () => {
    expect(suggestCategory('Corrida de Uber')).toBe('transporte')
  })

  it('suggests transporte for "Abastecimento de gasolina"', () => {
    expect(suggestCategory('Abastecimento de gasolina')).toBe('transporte')
  })

  it('suggests moradia for "Pagamento do aluguel"', () => {
    expect(suggestCategory('Pagamento do aluguel')).toBe('moradia')
  })

  it('suggests moradia for "Conta de luz"', () => {
    expect(suggestCategory('Conta de luz')).toBe('moradia')
  })

  it('suggests lazer for "Assinatura do Netflix"', () => {
    expect(suggestCategory('Assinatura do Netflix')).toBe('lazer')
  })

  it('suggests lazer for "Ingresso de cinema"', () => {
    expect(suggestCategory('Ingresso de cinema')).toBe('lazer')
  })

  it('suggests saude for "Compra na farmácia"', () => {
    expect(suggestCategory('Compra na farmácia')).toBe('saude')
  })

  it('suggests saude for "Consulta com médico"', () => {
    expect(suggestCategory('Consulta com médico')).toBe('saude')
  })

  it('suggests salario for "Salário do mês"', () => {
    expect(suggestCategory('Salário do mês')).toBe('salario')
  })

  it('suggests salario for "Pagamento de holerite"', () => {
    expect(suggestCategory('Pagamento de holerite')).toBe('salario')
  })

  it('falls back to outros when no keyword matches', () => {
    expect(suggestCategory('Transação genérica sem palavra-chave conhecida')).toBe('outros')
  })

  it('matches keywords case-insensitively', () => {
    expect(suggestCategory('UBER PARA O TRABALHO')).toBe('transporte')
  })
})
