import { configureStore } from '@reduxjs/toolkit'
import { transactionsApi } from './transactionsApi'
import { createErrorMiddleware, logoutAndRedirect, uiErrorSlice } from './errorMiddleware'

// design.md AD-002: Redux Toolkit + RTK Query, used only in Client
// Components, one store instance per app load via `makeStore()` — never a
// module-scoped singleton (that would leak state across requests/users in
// the Next.js App Router).
export function makeStore() {
  return configureStore({
    reducer: {
      [transactionsApi.reducerPath]: transactionsApi.reducer,
      [uiErrorSlice.name]: uiErrorSlice.reducer,
    },
    // T43: errorMiddleware must run after transactionsApi.middleware so the
    // rejected-action shape it inspects (`{ status, data }` from
    // fetchBaseQuery) already exists on the action by the time it sees it.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(transactionsApi.middleware)
        .concat(createErrorMiddleware({ onSessionExpired: logoutAndRedirect })),
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
