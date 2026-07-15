// TXN-06: "WHEN a lista filtrada tem mais itens do que cabem na viewport
// THEN o sistema SHALL carregar mais itens automaticamente ao rolar (scroll
// infinito) sem re-fetch da API." Reveals one more page of the
// already-fully-loaded dataset, capped at the total count.
export function nextVisibleCount(currentVisibleCount: number, totalCount: number, pageSize: number): number {
  return Math.min(currentVisibleCount + pageSize, totalCount)
}
