// T55 — covers the Independent Test sections of spec.md's P1 stories:
//
// - "Integração de transações com a API real": "Criar, editar e excluir uma
//   transação de ponta a ponta contra a API real, validando persistência
//   com reload de página."
// - "Formulário de Transação": "Criar uma transação digitando 'Uber para o
//   trabalho', confirmar sugestão de categoria 'Transporte', anexar um PDF
//   [...], salvar e reabrir em modo edição confirmando os dados
//   pré-carregados."
// - "Listagem de Transações": "Com uma conta com 20+ transações, aplicar
//   filtro de tipo + busca textual simultaneamente e confirmar resultado
//   correto; rolar a lista e confirmar carregamento incremental."
//
// KNOWN GAP (documented, not fixed by this task — see final batch summary):
// TransactionListClient renders from a static `initialData` SSR prop and
// never subscribes to the `getTransactions` RTK Query (the hook is exported
// from store/transactionsApi.ts but unused) — so a create/edit/delete
// mutation's cache invalidation has no live subscriber, and the on-screen
// list does not update without a reload. This test follows spec.md's own
// Independent Test wording above ("validando persistência com reload de
// página") and reloads after every mutation rather than asserting
// same-page live updates.
import { test, expect } from 'playwright/test'
import { registerAndLogin, uniqueUser } from './fixtures/test-users'
import { getAccountId, seedTransaction, sessionToken } from './fixtures/seed-transactions'

test('criar, editar e excluir uma transação (TXN, FORM, API-02..04)', async ({ page }) => {
  const user = uniqueUser('txn-crud')
  await registerAndLogin(page, user)

  const token = sessionToken(await page.context().cookies())
  const accountId = await getAccountId(token)
  // Unblocks the FAB (see file header) — this seed transaction is never
  // asserted on directly except as "the other" row in filter checks below.
  await seedTransaction(token, accountId, { type: 'Credit', value: 1, from: 'seed-inicial' })

  await page.goto('/transactions')
  await expect(page.getByRole('button', { name: 'Nova transação' })).toBeVisible()

  // --- FORM-01..06: create with category suggestion + attachment ---
  await page.getByRole('button', { name: 'Nova transação' }).click()
  const createDialog = page.getByRole('dialog')
  await expect(createDialog).toBeVisible()

  await createDialog.getByLabel('Tipo de transação').selectOption('Debit')
  await createDialog.getByLabel('Descrição').fill('Uber para o trabalho')
  // FORM-03: non-blocking category suggestion from keyword-matching.
  await expect(createDialog.getByLabel('Categoria')).toHaveValue('transporte')
  await createDialog.getByLabel('Valor (R$)').fill('45,90')
  // FORM-06: valid attachment (PDF, well under the 2MB limit).
  await createDialog.locator('#transaction-attachment').setInputFiles({
    name: 'comprovante.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 fake receipt content for e2e test\n%%EOF'),
  })
  await expect(createDialog.getByText('comprovante.pdf')).toBeVisible()

  await createDialog.getByRole('button', { name: 'Adicionar' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await page.reload()
  await expect(page.getByText('Uber para o trabalho')).toBeVisible()
  await expect(page.getByText(/45,90/)).toBeVisible()

  // --- TXN-01/05: type filter combined with the existing seed transaction ---
  await page.getByRole('button', { name: 'Débito', exact: true }).click()
  await expect(page.getByText('Uber para o trabalho')).toBeVisible()
  await expect(page.getByText('seed-inicial')).not.toBeVisible()

  await page.getByRole('button', { name: 'Crédito', exact: true }).click()
  await expect(page.getByText('Uber para o trabalho')).not.toBeVisible()
  await expect(page.getByText('seed-inicial')).toBeVisible()

  await page.getByRole('button', { name: 'Todos', exact: true }).click()

  // --- TXN-04: case-insensitive text search ---
  await page.getByLabel('Buscar').fill('uber')
  await expect(page.getByText('Uber para o trabalho')).toBeVisible()
  await expect(page.getByText('seed-inicial')).not.toBeVisible()
  await page.getByLabel('Buscar').fill('')
  await expect(page.getByText('seed-inicial')).toBeVisible()

  // --- FORM-07: edit mode pre-fills existing value/type/description/category/attachment ---
  await page.getByRole('button', { name: 'Editar transação de Uber para o trabalho' }).click()
  const editDialog = page.getByRole('dialog')
  await expect(editDialog).toBeVisible()
  await expect(editDialog.getByLabel('Tipo de transação')).toHaveValue('Debit')
  await expect(editDialog.getByLabel('Descrição')).toHaveValue('Uber para o trabalho')
  await expect(editDialog.getByLabel('Valor (R$)')).toHaveValue('45.9')
  await expect(editDialog.getByLabel('Categoria')).toHaveValue('transporte')
  await expect(editDialog.getByText('comprovante.pdf')).toBeVisible()

  await editDialog.getByLabel('Descrição').fill('Uber para o trabalho (editado)')
  await editDialog.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await page.reload()
  await expect(page.getByText('Uber para o trabalho (editado)')).toBeVisible()
  await expect(page.getByText('Uber para o trabalho', { exact: true })).not.toBeVisible()

  // --- API-04: delete with confirmation ---
  await page.getByRole('button', { name: 'Editar transação de Uber para o trabalho (editado)' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click()

  await page.getByRole('button', { name: 'Excluir transação de Uber para o trabalho (editado)' }).click()
  const deleteDialog = page.getByRole('dialog')
  await expect(deleteDialog).toBeVisible()
  await deleteDialog.getByRole('button', { name: 'Excluir', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await page.reload()
  await expect(page.getByText('Uber para o trabalho (editado)')).not.toBeVisible()
  await expect(page.getByText('seed-inicial')).toBeVisible()
})

test('lista com 20+ transações: paginação incremental via scroll (TXN-06)', async ({ page }) => {
  const user = uniqueUser('txn-scroll')
  await registerAndLogin(page, user)

  const token = sessionToken(await page.context().cookies())
  const accountId = await getAccountId(token)

  const TOTAL = 25
  for (let i = 0; i < TOTAL; i++) {
    await seedTransaction(token, accountId, {
      type: i % 2 === 0 ? 'Credit' : 'Debit',
      value: 10 + i,
      from: i % 2 === 0 ? `Depósito ${i}` : undefined,
      to: i % 2 !== 0 ? `Pagamento ${i}` : undefined,
    })
  }

  await page.goto('/transactions')

  const rows = page.locator('table tbody tr')
  // TXN-06: only the first page (PAGE_SIZE = 20) renders initially.
  await expect(rows).toHaveCount(20)

  // Scrolling reveals the rest of the already-loaded dataset — no re-fetch,
  // just the client-side window growing (see nextVisibleCount.ts).
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await expect(rows).toHaveCount(TOTAL)
})
