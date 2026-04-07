'use client'

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ProductFormModal }            from './ProductFormModal'
import { ProductDrawer }               from './ProductDrawer'
import type { CategoryOption, ProductForEdit } from './ProductFormModal'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SerializedProduct = {
  id:         string
  name:       string
  sku:        string
  barcode:    string | null
  description: string | null
  imageUrl:   string | null
  costPrice:  number
  salePrice:  number
  unit:       string
  minStock:   number
  maxStock:   number | null
  isActive:   boolean
  isArchived: boolean
  categoryId: string | null
  category:   { id: string; name: string; color: string | null } | null
  tags:       string[]
  totalStock: number
}

type SearchProduct = SerializedProduct & {
  stockByLocation: { locationId: string; locationName: string; isDefault: boolean; quantity: number }[]
}

type Props = {
  orgSlug:    string
  orgId:      string
  products:   SerializedProduct[]
  categories: CategoryOption[]
  total:      number
  page:       number
  perPage:    number
  filter:     string
  category:   string
  stock:      string
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function StockBadge({ product }: { product: SerializedProduct }) {
  const qty        = product.totalStock
  const isCritical = product.minStock > 0 && qty <= product.minStock * 0.5
  const isWarning  = product.minStock > 0 && qty <= product.minStock && !isCritical

  if (!product.isActive)   return <span className="dash-badge neutral">Inativo</span>
  if (product.isArchived)  return <span className="dash-badge neutral">Arquivado</span>
  if (isCritical)          return <span className="dash-badge critical">Crítico</span>
  if (isWarning)           return <span className="dash-badge warning">Atenção</span>
  return <span className="dash-badge ok">OK</span>
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductsClient({
  orgSlug,
  orgId,
  products: initialProducts,
  categories,
  total,
  page,
  perPage,
  filter,
  category,
  stock,
}: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  // Search state
  const [query,          setQuery]          = useState(searchParams.get('q') ?? '')
  const [searchResults,  setSearchResults]  = useState<SearchProduct[] | null>(null)
  const [searching,      setSearching]      = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Modal / drawer state
  const [showModal,     setShowModal]     = useState(false)
  const [activeProduct, setActiveProduct] = useState<ProductForEdit | null>(null)

  // Search with debounce
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults(null); return }
    setSearching(true)
    try {
      const res  = await fetch(`/api/${orgSlug}/products/search?q=${encodeURIComponent(q)}&take=50`)
      const data = await res.json()
      setSearchResults(data.products ?? [])
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [orgSlug])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) { setSearchResults(null); return }
    debounceRef.current = setTimeout(() => doSearch(query), 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, doSearch])

  // Update URL when filter changes
  function pushFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') params.set(key, value)
    else params.delete(key)
    params.delete('page') // reset to page 1 on filter change
    router.push(`${pathname}?${params.toString()}`)
  }

  // Convert server product to ProductForEdit
  function toEditProduct(p: SerializedProduct): ProductForEdit {
    return {
      id:          p.id,
      name:        p.name,
      sku:         p.sku,
      barcode:     p.barcode,
      description: p.description,
      imageUrl:    p.imageUrl,
      costPrice:   p.costPrice,
      salePrice:   p.salePrice,
      unit:        p.unit,
      minStock:    p.minStock,
      maxStock:    p.maxStock,
      categoryId:  p.categoryId,
      isActive:    p.isActive,
      tags:        p.tags,
    }
  }

  const displayedProducts: SerializedProduct[] = searchResults ?? initialProducts
  const totalPages = Math.ceil(total / perPage)
  const isSearching = query.trim().length > 0

  return (
    <>
      {/* ── Toolbar ── */}
      <div className="dash-header">
        <div className="dash-header-left">
          <div>
            <div className="dash-header-title">Produtos</div>
            <div className="dash-header-sub">
              {isSearching ? `${displayedProducts.length} resultado(s)` : `${total} cadastrados`}
            </div>
          </div>
        </div>
        <div className="dash-header-right">
          <div className="dash-header-search" style={{ cursor: 'text' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              className="prod-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, SKU, descrição..."
            />
            {searching && <span className="prod-search-spinner" />}
            {query && (
              <button
                className="prod-search-clear"
                onClick={() => setQuery('')}
                type="button"
              >×</button>
            )}
          </div>
        </div>
      </div>

      <div className="dash-content">
        {/* ── Filters ── */}
        <div className="dash-page-actions">
          <div className="prod-filter-bar">
            {/* Status filter */}
            <div className="prod-filter-group">
              {[
                { value: 'all',      label: 'Todos'     },
                { value: 'active',   label: 'Ativos'    },
                { value: 'inactive', label: 'Inativos'  },
                { value: 'archived', label: 'Arquivados' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  className={`dash-filter-btn ${filter === value ? 'active' : ''}`}
                  onClick={() => pushFilter('filter', value)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <select
              className="prod-filter-select"
              value={category}
              onChange={(e) => pushFilter('category', e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Stock filter */}
            <select
              className="prod-filter-select"
              value={stock}
              onChange={(e) => pushFilter('stock', e.target.value)}
            >
              <option value="">Estoque: Todos</option>
              <option value="critical">Crítico</option>
              <option value="ok">OK</option>
              <option value="no-movement">Sem movimentação (30d)</option>
            </select>
          </div>

          <button
            className="dash-btn dash-btn-primary"
            onClick={() => setShowModal(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo Produto
          </button>
        </div>

        {/* ── Table ── */}
        {displayedProducts.length > 0 ? (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>SKU</th>
                  <th>Categoria</th>
                  <th>Estoque</th>
                  <th>Custo</th>
                  <th>Venda</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((p) => (
                  <tr
                    key={p.id}
                    className="prod-row-clickable"
                    onClick={() => setActiveProduct(toEditProduct(p))}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="prod-row-thumb" />
                        ) : (
                          <div className="prod-row-thumb prod-row-thumb-placeholder" />
                        )}
                        <div>
                          <div className="bold">{p.name}</div>
                          {p.tags.length > 0 && (
                            <div className="prod-row-tags">
                              {p.tags.slice(0, 3).map((t) => (
                                <span key={t} className="prod-row-tag">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="mono">{p.sku}</td>
                    <td style={{ fontSize: '12px', color: '#888' }}>
                      {p.category
                        ? <span className="prod-cat-pill" style={p.category.color ? { background: p.category.color + '22', color: p.category.color } : {}}>{p.category.name}</span>
                        : '—'
                      }
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{p.totalStock} {p.unit}</td>
                    <td style={{ fontSize: '12px', color: '#888' }}>R$ {p.costPrice.toFixed(2)}</td>
                    <td style={{ fontSize: '12px' }}>R$ {p.salePrice.toFixed(2)}</td>
                    <td><StockBadge product={p} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination — only when not in search mode */}
            {!isSearching && totalPages > 1 && (
              <div className="dash-table-footer">
                <span>
                  Mostrando {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} de {total}
                </span>
                <div className="dash-pagination">
                  {page > 1 && (
                    <Link href={`/${orgSlug}/products?${buildPageParams(searchParams, page - 1)}`} className="dash-page-btn">←</Link>
                  )}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <Link key={p} href={`/${orgSlug}/products?${buildPageParams(searchParams, p)}`} className={`dash-page-btn ${p === page ? 'active' : ''}`}>{p}</Link>
                  ))}
                  {page < totalPages && (
                    <Link href={`/${orgSlug}/products?${buildPageParams(searchParams, page + 1)}`} className="dash-page-btn">→</Link>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="dash-table-wrap">
            <div className="dash-empty">
              <div className="dash-empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              {isSearching ? (
                <>
                  <div className="dash-empty-title">Nenhum resultado para "{query}"</div>
                  <div className="dash-empty-desc">Tente buscar por outro nome, SKU ou descrição.</div>
                </>
              ) : (
                <>
                  <div className="dash-empty-title">Nenhum produto cadastrado</div>
                  <div className="dash-empty-desc">Adicione seu primeiro produto para começar a controlar o estoque.</div>
                  <button className="dash-btn dash-btn-primary" onClick={() => setShowModal(true)}>
                    + Novo Produto
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Create modal ── */}
      {showModal && (
        <ProductFormModal
          orgSlug={orgSlug}
          orgId={orgId}
          initialCategories={categories}
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
        />
      )}

      {/* ── Edit drawer ── */}
      <ProductDrawer
        orgSlug={orgSlug}
        orgId={orgId}
        product={activeProduct}
        categories={categories}
        onClose={() => setActiveProduct(null)}
        onSuccess={() => setActiveProduct(null)}
      />
    </>
  )
}

// ─── Pagination URL helper ────────────────────────────────────────────────────

function buildPageParams(current: URLSearchParams, page: number): string {
  const p = new URLSearchParams(current.toString())
  p.set('page', String(page))
  return p.toString()
}
