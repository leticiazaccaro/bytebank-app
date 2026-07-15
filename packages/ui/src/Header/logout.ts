// AUTH-06: manual "Sair" logout, shared by Header (desktop) and BottomNav
// (mobile) — both call the shell's own POST /api/auth/logout endpoint,
// which is same-origin from the browser's perspective regardless of which
// zone rendered the click (design.md Architecture Overview: the shell's
// rewrite makes every zone appear to share one origin), then hard-navigate
// to /login. Mirrors the automatic session-expiry redirect in
// apps/mf-transactions/src/store/errorMiddleware.ts's logoutAndRedirect.
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' })
  } finally {
    window.location.href = '/login'
  }
}
