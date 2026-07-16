// Shared E2E test helpers (T54/T55) — drives the real /register and /login
// pages of apps/shell exactly as a user would, against the stub API fixture
// (stub-api-server.mjs). Not part of any app's production code.
import { expect, type Page } from 'playwright/test'

export interface E2EUser {
  username: string
  email: string
  password: string
}

/** Unique credentials per test run so repeated runs never collide on email uniqueness. */
export function uniqueUser(label: string): E2EUser {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`
  return {
    username: `${label}-${suffix}`,
    email: `${label}-${suffix}@example.com`,
    password: 'Str0ngPassw0rd!1',
  }
}

/** AUTH-01: fills and submits the /register form, ending on /login. */
export async function registerUser(page: Page, user: E2EUser): Promise<void> {
  await page.goto('/register')
  await page.getByLabel('Nome de usuário').fill(user.username)
  await page.getByLabel('E-mail').fill(user.email)
  await page.getByLabel('Senha').fill(user.password)
  await page.getByRole('button', { name: 'Cadastrar' }).click()
  await expect(page).toHaveURL(/\/login$/)
}

/** AUTH-02: fills and submits the /login form, ending on the Home zone. */
export async function loginUser(page: Page, user: E2EUser): Promise<void> {
  await page.getByLabel('E-mail').fill(user.email)
  await page.getByLabel('Senha').fill(user.password)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL('http://localhost:3000/')
}

export async function registerAndLogin(page: Page, user: E2EUser): Promise<void> {
  await registerUser(page, user)
  await loginUser(page, user)
}
