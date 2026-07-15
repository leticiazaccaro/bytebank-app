import { configureStore } from '@reduxjs/toolkit'
import { transactionsApi } from './transactionsApi'

// design.md AD-002: Redux Toolkit + RTK Query, used only in Client
// Components, one store instance per app load via `makeStore()` — never a
// module-scoped singleton (that would leak state across requests/users in
// the Next.js App Router).
export function makeStore() {
  return configureStore({
    reducer: {
      [transactionsApi.reducerPath]: transactionsApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(transactionsApi.middleware),
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
