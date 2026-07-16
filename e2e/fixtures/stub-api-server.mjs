// Test-only fixture — NOT part of the production runtime.
//
// Replicates the exact contract of the real `tech-challenge-2` API endpoints
// that packages/shared/src/apiClient.ts calls (POST /user, POST /user/auth,
// GET /account, GET /account/:id/statement, POST/PUT/DELETE
// /account/transaction/:id), so the Phase 10 E2E suite can drive the real
// shell/mf-dashboard/mf-transactions Route Handlers end-to-end without the
// real API being available in this environment (see design.md "Data Models"
// and packages/shared/src/apiClient.ts for the payload/response shapes this
// mirrors). Started by Playwright's `webServer` config (playwright.config.ts)
// for the `npm run test:e2e` run only — it is never imported by any app.
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'

const PORT = Number(process.env.PORT ?? 4310)

/** @type {Map<string, {id: string, username: string, email: string, password: string}>} */
const usersByEmail = new Map()
/** @type {Map<string, {id: string, type: string, userId: string}>} */
const accountsByUserId = new Map()
/** @type {Map<string, any[]>} keyed by accountId */
const transactionsByAccount = new Map()
/** @type {Map<string, string>} token -> userId */
const tokensByToken = new Map()

function sendJson(res, status, body) {
  const payload = body === undefined ? '' : JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(payload)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => (raw += chunk))
    req.on('end', () => {
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function authenticate(req) {
  const header = req.headers['authorization']
  if (!header || !header.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length)
  const userId = tokensByToken.get(token)
  return userId ?? null
}

function findTransaction(id) {
  for (const [accountId, transactions] of transactionsByAccount) {
    const index = transactions.findIndex((transaction) => transaction.id === id)
    if (index !== -1) return { accountId, index, transaction: transactions[index] }
  }
  return null
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  const { pathname } = url

  try {
    // POST /user — register (design.md apiClient.register)
    if (req.method === 'POST' && pathname === '/user') {
      const body = await readBody(req)
      const { username, email, password } = body
      if (!username || !email || !password) {
        return sendJson(res, 400, { message: 'username, email e password são obrigatórios.' })
      }
      if (usersByEmail.has(email)) {
        return sendJson(res, 409, { message: 'E-mail já cadastrado.' })
      }
      const user = { id: randomUUID(), username, email, password }
      usersByEmail.set(email, user)
      const account = { id: randomUUID(), type: 'corrente', userId: user.id }
      accountsByUserId.set(user.id, account)
      transactionsByAccount.set(account.id, [])
      return sendJson(res, 201, { id: user.id, username: user.username, email: user.email })
    }

    // POST /user/auth — login (design.md apiClient.login)
    if (req.method === 'POST' && pathname === '/user/auth') {
      const body = await readBody(req)
      const { email, password } = body
      const user = usersByEmail.get(email)
      if (!user || user.password !== password) {
        return sendJson(res, 401, { message: 'Credenciais inválidas.' })
      }
      const token = randomUUID()
      tokensByToken.set(token, user.id)
      return sendJson(res, 200, {
        token,
        user: { id: user.id, username: user.username, email: user.email },
      })
    }

    // Everything below requires Authorization: Bearer <token>
    const userId = authenticate(req)
    if (!userId) {
      return sendJson(res, 401, { message: 'Não autorizado.' })
    }

    // GET /account (apiClient.fetchStatement resolves accountId via this)
    if (req.method === 'GET' && pathname === '/account') {
      const account = accountsByUserId.get(userId)
      return sendJson(res, 200, account ? [account] : [])
    }

    // GET /account/:id/statement
    const statementMatch = pathname.match(/^\/account\/([^/]+)\/statement$/)
    if (req.method === 'GET' && statementMatch) {
      const accountId = statementMatch[1]
      return sendJson(res, 200, transactionsByAccount.get(accountId) ?? [])
    }

    // POST /account/transaction
    if (req.method === 'POST' && pathname === '/account/transaction') {
      const body = await readBody(req)
      const { accountId, type, value, from, to, anexo, urlAnexo } = body
      if (!accountId || !transactionsByAccount.has(accountId)) {
        return sendJson(res, 400, { message: 'accountId inválido.' })
      }
      if (type !== 'Debit' && type !== 'Credit') {
        return sendJson(res, 400, { message: 'type deve ser Debit ou Credit.' })
      }
      const transaction = {
        id: randomUUID(),
        accountId,
        type,
        value: Math.abs(Number(value)),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        ...(anexo ? { anexo } : {}),
        ...(urlAnexo ? { urlAnexo } : {}),
        date: new Date().toISOString(),
      }
      transactionsByAccount.get(accountId).push(transaction)
      return sendJson(res, 201, transaction)
    }

    // PUT /account/transaction/:id
    const idMatch = pathname.match(/^\/account\/transaction\/([^/]+)$/)
    if (req.method === 'PUT' && idMatch) {
      const found = findTransaction(idMatch[1])
      if (!found) return sendJson(res, 404, { message: 'Transação não encontrada.' })
      const patch = await readBody(req)
      const updated = {
        ...found.transaction,
        ...patch,
        ...(patch.value !== undefined ? { value: Math.abs(Number(patch.value)) } : {}),
      }
      transactionsByAccount.get(found.accountId)[found.index] = updated
      return sendJson(res, 200, updated)
    }

    // DELETE /account/transaction/:id — real API responds 204, no body
    if (req.method === 'DELETE' && idMatch) {
      const found = findTransaction(idMatch[1])
      if (!found) return sendJson(res, 404, { message: 'Transação não encontrada.' })
      transactionsByAccount.get(found.accountId).splice(found.index, 1)
      res.writeHead(204)
      return res.end()
    }

    return sendJson(res, 404, { message: 'Not found (stub fixture).' })
  } catch (error) {
    return sendJson(res, 500, { message: `Stub API error: ${error instanceof Error ? error.message : String(error)}` })
  }
})

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[stub-api-fixture] listening on http://localhost:${PORT} (test fixture, not production code)`)
})
