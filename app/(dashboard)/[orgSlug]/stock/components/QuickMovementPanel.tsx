'use client'

import {
  useState,
  useEffect,
  useRef,
  useOptimistic,
  useTransition,
  useCallback,
} from 'react'
import { createMovement } from '../../actions/stock.actions'

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchProduct = {
  id: string
  name: string
  sku: string
  imageUrl: string | null
  unit: string
  minStock: number
  totalStock: number
  stockByLocation: {
    locationId: string
    locationName: string
    isDefault: boolean
    quantity: number
  }[]
}

type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN'

const PRESET_REASONS: Record<MovementType, string[]> = {
  OUT:        ['Venda', 'Uso interno', 'Descarte', 'Devolução a fornecedor', 'Outro'],
  IN:         ['Compra', 'Devolução de cliente', 'Produção', 'Transferência recebida', 'Outro'],
  ADJUSTMENT: ['Inventário', 'Correção de erro', 'Perda / Avaria', 'Outro'],
  RETURN:     ['Devolução de cliente', 'Troca', 'Garantia', 'Outro'],
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuickMovementPanel({ orgSlug }: { orgSlug: string }) {
  const [isOpen, setIsOpen]                 = useState(false)
  const [query, setQuery]                   = useState('')
  const [searchResults, setSearchResults]   = useState<SearchProduct[]>([])
  const [isSearching, setIsSearching]       = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<SearchProduct | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [movementType, setMovementType]     = useState<MovementType>('OUT')
  const [quantity, setQuantity]             = useState(1)
  const [reason, setReason]                 = useState('')
  const [customReason, setCustomReason]     = useState('')
  const [submitStatus, setSubmitStatus]     = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg]             = useState('')

  const searchInputRef  = useRef<HTMLInputElement>(null)
  const debounceRef     = useRef<ReturnType<typeof setTimeout>>()
  const lastKeyTimeRef  = useRef(0)

  const [isPending, startTransition] = useTransition()

  // Optimistic stock count — resets automatically when selectedProduct changes
  const [optimisticStock, addOptimisticStock] = useOptimistic(
    selectedProduct?.totalStock ?? 0,
    (_current: number, next: number) => next,
  )

  // ── Open/close listeners ────────────────────────────────────────────────────

  useEffect(() => {
    const onOpen = () => setIsOpen(true)
    window.addEventListener('open-quick-movement', onOpen)
    return () => window.removeEventListener('open-quick-movement', onOpen)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((v) => !v)
      }
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Autofocus search when panel opens
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // ── Search ──────────────────────────────────────────────────────────────────

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) { setSearchResults([]); return }
      setIsSearching(true)
      try {
        const res  = await fetch(`/api/${orgSlug}/products/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setSearchResults(data.products ?? [])
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    },
    [orgSlug],
  )

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setSearchResults([])
    clearTimeout(debounceRef.current)
    if (!val.trim()) return
    debounceRef.current = setTimeout(() => doSearch(val), 200)
  }

  // Barcode scanner: characters arrive very fast + Enter
  const handleQueryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const now = Date.now()
    const gap = now - lastKeyTimeRef.current
    if (e.key === 'Enter') {
      if (gap < 100 && query.length > 0) {
        clearTimeout(debounceRef.current)
        doSearch(query)
      }
      return
    }
    lastKeyTimeRef.current = now
  }

  // ── Product selection ───────────────────────────────────────────────────────

  const selectProduct = (p: SearchProduct) => {
    setSelectedProduct(p)
    setQuery('')
    setSearchResults([])
    setQuantity(1)
    setReason('')
    setCustomReason('')
    setSubmitStatus('idle')
    setErrorMsg('')
    // Auto-select: prefer default location, fallback to first
    const loc = p.stockByLocation.find((s) => s.isDefault) ?? p.stockByLocation[0]
    setSelectedLocationId(loc?.locationId ?? '')
  }

  // ── Derived UI values ───────────────────────────────────────────────────────

  const currentStockAtLocation =
    selectedProduct?.stockByLocation.find((s) => s.locationId === selectedLocationId)?.quantity ?? 0

  const previewAfter = (() => {
    if (!selectedProduct) return 0
    if (movementType === 'ADJUSTMENT') return quantity          // absolute
    if (movementType === 'OUT')        return Math.max(0, currentStockAtLocation - quantity)
    return currentStockAtLocation + quantity
  })()

  const stockBadge = (qty: number, min: number) => {
    if (qty <= 0) return { label: 'Sem estoque', cls: 'critical' }
    if (min > 0 && qty <= min * 0.5) return { label: 'Crítico', cls: 'critical' }
    if (min > 0 && qty <= min)       return { label: 'Atenção', cls: 'warning' }
    return { label: 'OK', cls: 'ok' }
  }

  const finalReason = reason === 'Outro' ? customReason : reason

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (!selectedProduct || !selectedLocationId || isPending) return
    if (movementType === 'ADJUSTMENT' && !finalReason.trim()) {
      setSubmitStatus('error')
      setErrorMsg('Motivo é obrigatório para ajustes de estoque.')
      return
    }
    setSubmitStatus('idle')
    setErrorMsg('')

    startTransition(async () => {
      // Optimistic: compute new total before server responds
      const optNext = movementType === 'ADJUSTMENT'
        ? quantity
        : movementType === 'OUT'
          ? Math.max(0, optimisticStock - quantity)
          : optimisticStock + quantity
      addOptimisticStock(optNext)

      const result = await createMovement(orgSlug, {
        productId:  selectedProduct.id,
        locationId: selectedLocationId,
        type:       movementType,
        quantity,
        reason:     finalReason || null,
      })

      if (result.success) {
        setSubmitStatus('success')
        window.dispatchEvent(
          new CustomEvent('stock-updated', {
            detail: { productId: selectedProduct.id, movementType, quantity },
          }),
        )
        // Reset for next operation after brief success animation
        setTimeout(() => {
          setSelectedProduct(null)
          setQuantity(1)
          setReason('')
          setCustomReason('')
          setSubmitStatus('idle')
          searchInputRef.current?.focus()
        }, 1400)
      } else {
        setSubmitStatus('error')
        setErrorMsg(result.error)
      }
    })
  }

  const resetPanel = () => {
    setSelectedProduct(null)
    setQuery('')
    setSearchResults([])
    setQuantity(1)
    setReason('')
    setCustomReason('')
    setSubmitStatus('idle')
    setErrorMsg('')
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className={`qmp-overlay${isOpen ? ' open' : ''}`}
        onClick={() => setIsOpen(false)}
        aria-hidden
      />

      {/* Panel */}
      <aside className={`qmp-panel${isOpen ? ' open' : ''}`} role="dialog" aria-modal aria-label="Nova Movimentação">
        {/* ── Header ── */}
        <div className="qmp-header">
          <div>
            <div className="qmp-header-title">Nova Movimentação</div>
            <div className="qmp-header-sub">
              <kbd className="qmp-kbd">Ctrl</kbd><span>+</span><kbd className="qmp-kbd">K</kbd>
              <span style={{ marginLeft: 8, color: '#888' }}>para abrir / fechar</span>
            </div>
          </div>
          <button className="qmp-close-btn" onClick={() => setIsOpen(false)} aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="qmp-body">

          {/* ── Step 1: Search ── */}
          <div className="qmp-step">
            <label className="dash-label">
              {selectedProduct ? '1. Produto selecionado' : '1. Buscar produto'}
            </label>

            {!selectedProduct ? (
              <div className="qmp-search-wrap">
                <svg className="qmp-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="dash-input qmp-search-input"
                  placeholder="Nome, SKU ou código de barras…"
                  value={query}
                  onChange={handleQueryChange}
                  onKeyDown={handleQueryKeyDown}
                  autoComplete="off"
                />
                {isSearching && <div className="qmp-search-spinner" />}

                {searchResults.length > 0 && (
                  <div className="qmp-results-dropdown">
                    {searchResults.map((p) => {
                      const badge = stockBadge(p.totalStock, p.minStock)
                      return (
                        <button
                          key={p.id}
                          className="qmp-result-item"
                          onClick={() => selectProduct(p)}
                        >
                          <div className="qmp-result-img">
                            {p.imageUrl
                              ? <img src={p.imageUrl} alt={p.name} />
                              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            }
                          </div>
                          <div className="qmp-result-info">
                            <div className="qmp-result-name">{p.name}</div>
                            <div className="qmp-result-sku">{p.sku}</div>
                          </div>
                          <div className="qmp-result-stock">
                            <div className="qmp-result-qty">{p.totalStock} {p.unit}</div>
                            <span className={`dash-badge ${badge.cls}`}>{badge.label}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {!isSearching && query.length > 1 && searchResults.length === 0 && (
                  <div className="qmp-results-dropdown">
                    <div className="qmp-no-results">Nenhum produto encontrado para "{query}"</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="qmp-product-card">
                <div className="qmp-product-img">
                  {selectedProduct.imageUrl
                    ? <img src={selectedProduct.imageUrl} alt={selectedProduct.name} />
                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  }
                </div>
                <div className="qmp-product-info">
                  <div className="qmp-product-name">{selectedProduct.name}</div>
                  <div className="qmp-product-sku">{selectedProduct.sku}</div>
                  <div className="qmp-product-locations">
                    {selectedProduct.stockByLocation.map((s) => (
                      <span key={s.locationId} className="qmp-loc-chip">
                        {s.locationName}: <strong>{s.quantity}</strong>
                      </span>
                    ))}
                    {selectedProduct.stockByLocation.length === 0 && (
                      <span className="qmp-loc-chip">Sem estoque registrado</span>
                    )}
                  </div>
                </div>
                <div className="qmp-product-stock">
                  <div className="qmp-total-stock" style={{ color: isPending ? '#FF6B2C' : undefined }}>
                    {optimisticStock}
                  </div>
                  <div className="qmp-total-label">{selectedProduct.unit} total</div>
                </div>
                <button className="qmp-change-btn" onClick={resetPanel} title="Trocar produto">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" />
                    <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* ── Steps 2–4: only shown after product selected ── */}
          {selectedProduct && (
            <>
              {/* ── Step 2: Type ── */}
              <div className="qmp-step">
                <label className="dash-label">2. Tipo de movimentação</label>
                <div className="qmp-type-row">
                  {(
                    [
                      { type: 'OUT' as const,        label: 'Saída',     icon: '↓', color: '#E53935' },
                      { type: 'IN' as const,         label: 'Entrada',   icon: '↑', color: '#2E7D32' },
                      { type: 'ADJUSTMENT' as const, label: 'Ajuste',    icon: '⇌', color: '#E65100' },
                      { type: 'RETURN' as const,     label: 'Devolução', icon: '↩', color: '#1565C0' },
                    ] as const
                  ).map(({ type, label, icon, color }) => (
                    <button
                      key={type}
                      className={`qmp-type-btn${movementType === type ? ' selected' : ''}`}
                      style={{ '--type-color': color } as React.CSSProperties}
                      onClick={() => { setMovementType(type); setReason(''); setCustomReason('') }}
                    >
                      <span className="qmp-type-icon">{icon}</span>
                      <span className="qmp-type-label">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Location selector (if multiple) ── */}
              {selectedProduct.stockByLocation.length > 1 && (
                <div className="qmp-step">
                  <label className="dash-label">Local</label>
                  <select
                    className="dash-input"
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                  >
                    {selectedProduct.stockByLocation.map((s) => (
                      <option key={s.locationId} value={s.locationId}>
                        {s.locationName} ({s.quantity} {selectedProduct.unit})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* ── Step 3: Quantity ── */}
              <div className="qmp-step">
                <label className="dash-label">
                  3. {movementType === 'ADJUSTMENT' ? 'Novo total em estoque' : 'Quantidade'}
                </label>
                <div className="qmp-qty-row">
                  <button
                    className="qmp-qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >−</button>
                  <input
                    type="number"
                    className="dash-input qmp-qty-input"
                    min={movementType === 'ADJUSTMENT' ? 0 : 1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(movementType === 'ADJUSTMENT' ? 0 : 1, Number(e.target.value) || 0))}
                  />
                  <button
                    className="qmp-qty-btn"
                    onClick={() => setQuantity((q) => q + 1)}
                  >+</button>
                </div>

                {movementType !== 'ADJUSTMENT' && (
                  <div className="qmp-preview">
                    <span>Estoque no local:</span>
                    <strong>{currentStockAtLocation}</strong>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <strong
                      style={{
                        color: movementType === 'OUT' && previewAfter < currentStockAtLocation
                          ? previewAfter === 0 ? '#C62828' : '#E65100'
                          : movementType === 'IN' || movementType === 'RETURN' ? '#2E7D32' : '#444'
                      }}
                    >
                      {previewAfter}
                    </strong>
                    <span>{selectedProduct.unit}</span>
                    {movementType === 'OUT' && previewAfter < 0 && (
                      <span className="qmp-warn-inline">estoque insuficiente</span>
                    )}
                  </div>
                )}
                {movementType === 'ADJUSTMENT' && (
                  <div className="qmp-preview">
                    <span>Atual:</span>
                    <strong>{currentStockAtLocation}</strong>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    <strong style={{ color: '#E65100' }}>{quantity}</strong>
                    <span>{selectedProduct.unit}</span>
                  </div>
                )}
              </div>

              {/* ── Step 4: Reason ── */}
              <div className="qmp-step">
                <label className="dash-label">
                  4. Motivo
                  {movementType !== 'ADJUSTMENT' && (
                    <span style={{ fontWeight: 400, color: '#aaa', marginLeft: 6 }}>(opcional)</span>
                  )}
                </label>
                <div className="qmp-reason-chips">
                  {PRESET_REASONS[movementType].map((r) => (
                    <button
                      key={r}
                      className={`qmp-reason-chip${reason === r ? ' selected' : ''}`}
                      onClick={() => setReason((prev) => prev === r ? '' : r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                {reason === 'Outro' && (
                  <input
                    type="text"
                    className="dash-input"
                    style={{ marginTop: 8 }}
                    placeholder="Descreva o motivo…"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    autoFocus
                  />
                )}
              </div>

              {/* ── Error ── */}
              {submitStatus === 'error' && (
                <div className="qmp-error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {errorMsg}
                </div>
              )}

              {/* ── Submit ── */}
              <div className="qmp-footer">
                {submitStatus === 'success' ? (
                  <div className="qmp-success">
                    <div className="qmp-success-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span>Movimentação registrada!</span>
                  </div>
                ) : (
                  <button
                    className="qmp-submit-btn"
                    onClick={handleSubmit}
                    disabled={
                      isPending ||
                      !selectedLocationId ||
                      quantity < 1 ||
                      (movementType === 'ADJUSTMENT' && quantity < 0)
                    }
                  >
                    {isPending ? (
                      <>
                        <div className="qmp-spinner" />
                        Registrando…
                      </>
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Confirmar{' '}
                        {movementType === 'OUT' ? 'Saída' :
                         movementType === 'IN' ? 'Entrada' :
                         movementType === 'ADJUSTMENT' ? 'Ajuste' : 'Devolução'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── Empty state ── */}
          {!selectedProduct && !query && (
            <div className="qmp-hint">
              <div className="qmp-hint-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
              </div>
              <div className="qmp-hint-text">Digite o nome, SKU ou passe o leitor de código de barras</div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
