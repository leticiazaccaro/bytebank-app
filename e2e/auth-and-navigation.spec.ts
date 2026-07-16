// T54 — spec.md P1 "Autenticação contra a API real": Independent Test —
// "Cadastrar um usuário novo, fazer login, navegar para uma rota protegida,
// deslogar, confirmar que a rota protegida volta a redirecionar para
// login." Drives apps/shell, apps/mf-dashboard and apps/mf-transactions
// together (see playwright.config.ts's webServer list) against the stub API
// fixture — real Route Handlers, real proxy.ts, real cross-zone rewrites.
import { test, expect } from 'playwright/test'
import { registerUser, loginUser, uniqueUser } from './fixtures/test-users'

test('cadastro, login, navegação cross-zone e logout (AUTH-01..06, MFE-02)', async ({ page }) => {
  const user = uniqueUser('auth-nav')

  // AUTH-01: register redirects to /login on success.
  await registerUser(page, user)

  // AUTH-02: login sets the httpOnly session cookie and lands on the Home
  // zone (mf-dashboard, rewritten to appear as "/" on the shell's origin).
  await loginUser(page, user)
  await expect(page.getByText('Saldo disponível')).toBeVisible()

  // MFE-02: navigating Home -> Transações is a hard, cross-zone navigation
  // (plain <a>, not <Link>) — confirms mf-transactions mounts correctly
  // under the shell's rewrite.
  await page.locator('header').getByRole('link', { name: 'Transações' }).click()
  await expect(page).toHaveURL('http://localhost:3000/transactions')
  await expect(page.getByText('Você ainda não tem transações.')).toBeVisible()

  // AUTH-06: clicking "Sair" (T59) invalidates the session cookie and
  // redirects to /login. Retried via toPass(): immediately after a hard
  // cross-zone navigation, `next dev` is still hydrating/compiling this
  // route on first visit, and an isolated click can occasionally land
  // before the click handler is attached — a real (already-hydrated)
  // production build doesn't have this dev-only compile-on-first-visit
  // window, so retrying here verifies the actual behavior rather than
  // masking a bug.
  await expect(async () => {
    await page.locator('header').getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/login$/, { timeout: 2_000 })
  }).toPass({ timeout: 15_000 })

  // AUTH-04: the protected routes (Home and Transações, in different zones)
  // both redirect back to /login now that the session cookie is gone.
  await page.goto('http://localhost:3000/')
  await expect(page).toHaveURL(/\/login$/)

  await page.goto('http://localhost:3000/transactions')
  await expect(page).toHaveURL(/\/login$/)
})

test('login com credenciais inválidas exibe erro sem redirecionar (AUTH-03)', async ({ page }) => {
  const user = uniqueUser('auth-invalid')
  await registerUser(page, user)

  await page.getByLabel('E-mail').fill(user.email)
  await page.getByLabel('Senha').fill('senha-errada-123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('rota protegida redireciona para /login quando não autenticado (AUTH-04)', async ({ page }) => {
  await page.context().clearCookies()
  await page.goto('http://localhost:3000/')
  await expect(page).toHaveURL(/\/login$/)
})
