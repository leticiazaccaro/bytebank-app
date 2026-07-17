import { createSlice, isRejectedWithValue } from '@reduxjs/toolkit'
import type { Middleware, PayloadAction, UnknownAction } from '@reduxjs/toolkit'

// design.md Error Handling Strategy: a 401 from any of this zone's own
// Route Handlers means the upstream JWT expired — every one of them already
// normalizes that case to a plain `401` (see apps/mf-transactions/src/app/api/
// transactions/route.ts and [id]/route.ts). Any other failure (network
// error, 5xx, 4xx validation) surfaces as a generic message instead.
export interface RtkQueryErrorPayload {
  status?: number | string
  data?: { message?: string }
}

export const FALLBACK_ERROR_MESSAGE = 'Ocorreu um erro. Tente novamente.'

// Shared with TransactionFormModal's own submit-error banner — same
// upstream error shape, same "prefer the server's message, fall back to a
// generic one" rule.
export function extractUiErrorMessage(payload?: RtkQueryErrorPayload): string {
  return payload?.data?.message ?? FALLBACK_ERROR_MESSAGE
}

interface UiErrorState {
  message: string | null
}

const initialState: UiErrorState = { message: null }

// AUTH-05/API-05: holds the latest non-401 error message so it can be
// announced by the UI (wired via aria-live in T46) without touching
// transactionsApi's own cache — a failed mutation/query must not corrupt
// the list state already held there.
export const uiErrorSlice = createSlice({
  name: 'uiError',
  initialState,
  reducers: {
    setError: (state, action: PayloadAction<string>) => {
      state.message = action.payload
    },
    clearError: (state) => {
      state.message = null
    },
  },
})

export const { setError, clearError } = uiErrorSlice.actions

export interface ErrorMiddlewareDeps {
  /** AUTH-05: called once per detected 401 — logs the session out and redirects. */
  onSessionExpired: () => void
}

function extractPayload(action: UnknownAction): RtkQueryErrorPayload | undefined {
  return (action as { payload?: RtkQueryErrorPayload }).payload
}

/**
 * AUTH-05/API-05: catches every failed RTK Query query/mutation across this
 * zone via the `isRejectedWithValue` matcher — `fetchBaseQuery` reports a
 * non-2xx response as `{ status, data }` through `rejectWithValue`
 * internally, so this is the single chokepoint for both cases without
 * threading error handling through every call site individually.
 */
export function createErrorMiddleware(deps: ErrorMiddlewareDeps): Middleware {
  return (api) => (next) => (action) => {
    if (isRejectedWithValue(action)) {
      const payload = extractPayload(action as UnknownAction)
      if (payload?.status === 401) {
        deps.onSessionExpired()
      } else {
        api.dispatch(setError(extractUiErrorMessage(payload)))
      }
    }
    return next(action)
  }
}

// AUTH-06/AUTH-05: the real API has no session/logout endpoint of its own
// (see apps/shell's logout Route Handler) — this only needs to reach the
// shell zone's `/api/auth/logout`, which is same-origin from the browser's
// perspective (design.md Architecture Overview: the shell's rewrite makes
// every zone appear to share one origin) and is never rewritten to a remote
// zone (apps/shell/src/proxy.ts's PUBLIC_PATHS/next.config.ts rewrites both
// leave `/api/auth/*` owned by the shell itself).
export async function logoutAndRedirect(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' })
  } finally {
    window.location.href = '/login'
  }
}
