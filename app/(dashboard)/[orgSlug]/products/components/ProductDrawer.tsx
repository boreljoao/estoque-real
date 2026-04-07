'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { updateProduct, archiveProduct, restoreProduct } from '../../actions/products.actions'
import { createCategory } from '../../actions/categories.actions'
import type { CategoryOption, ProductForEdit } from './ProductFormModal'
import type { ProductHistoryResponse } from '@/app/api/[orgSlug]/products/[productId]/history/route'

// ─── Sparkline SVG ────────────────────────────────────────────────────────────

function Sparkline({ days }: { days: ProductHistoryResponse['days'] }) {
  const W = 280
  const H = 56
  const PAD = 4

  // Build cumulative net line
  let cum = 0
  const points = days.map((d) => { cum += d.net; return cum })
  const min = Math.min(0, ...points)
  const max = Math.max(0, ...points)
  const range = max - min || 1

  const coords = points.map((v, i) => {
    const x = PAD + ((W - PAD * 2) / (points.length - 1)) * i
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const zeroY = H - PAD - ((0 - min) / range) * (H - PAD * 2)
  const lastV = points[points.length - 1]
  const color = lastV >= 0 ? '#2E7D32' : '#E53935'

  return (
    <svg width={W} height={H} style={{ display: 'block', overflow: 'visible' }}>
      {/* Zero baseline */}
      <line
        x1={PAD} y1={zeroY.toFixed(1)}
        x2={W - PAD} y2={zeroY.toFixed(1)}
        stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 3"
      />
      {/* Area fill */}
      <polyline
        points={[`${PAD},${H - PAD}`, ...coords, `${W - PAD},${H - PAD}`].join(' ')}
        fill={color}
        fillOpacity="0.08"
        stroke="none"
      />
      {/* Line */}
      <polyline
        points={coords.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {coords.length > 0 && (
        <circle
          cx={coords[coords.length - 1].split(',')[0]}
          cy={coords[coords.length - 1].split(',')[1]}
          r="3"
          fill={color}
        />
      )}
    </svg>
  )
}

// ─── BRL helpers (same as modal) ──────────────────────────────────────────────

function formatBRL(val: string): string {
  const digits = val.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10) / 100
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseBRL(val: string): number {
  return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0
}

// ─── Tag input (same as modal) ────────────────────────────────────────────────

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('')
  function add(v: string) {
    const s = v.trim().toLowerCase()
    if (s && !tags.includes(s)) onChange([...tags, s])
    setInput('')
  }
  function remove(tag: string) { onChange(tags.filter((t) => t !== tag)) }
  return (
    <div className="pf-tag-input">
      {tags.map((tag) => (
        <span key={tag} className="pf-tag-chip">
          {tag}
          <button type="button" onClick={() => remove(tag)} className="pf-tag-remove">×</button>
        </span>
      ))}
      <input
        className="pf-tag-field"
        value={input}
        placeholder={tags.length === 0 ? 'Adicionar tag...' : ''}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) }
          if (e.key === 'Backspace' && !input && tags.length > 0) remove(tags[tags.length - 1])
        }}
        onBlur={() => { if (input) add(input) }}
      />
    </div>
  )
}

// ─── MarginBadge ──────────────────────────────────────────────────────────────

function MarginBadge({ cost, sale }: { cost: number; sale: number }) {
  if (!cost || !sale) return null
  const margin = ((sale - cost) / sale) * 100
  const color  = margin >= 30 ? '#2E7D32' : margin >= 10 ? '#E65100' : '#B71C1C'
  return <span style={{ fontSize: 11, fontWeight: 700, color, marginLeft: 6 }}>{margin.toFixed(1)}% margem</span>
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const UNITS = ['un', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'cx', 'par', 'pc', 'rolo', 'fardo']

type Props = {
  orgSlug:    string
  orgId:      string
  product:    ProductForEdit | null
  categories: CategoryOption[]
  onClose:    () => void
  onSuccess:  () => void
}

export function ProductDrawer({ orgSlug, orgId, product, categories: initCats, onClose, onSuccess }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form state — reset when product changes
  const [name,        setName]        = useState('')
  const [sku,         setSku]         = useState('')
  const [barcode,     setBarcode]     = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl,    setImageUrl]    = useState<string | null>(null)
  const [costRaw,     setCostRaw]     = useState('')
  const [saleRaw,     setSaleRaw]     = useState('')
  const [unit,        setUnit]        = useState('un')
  const [minStock,    setMinStock]    = useState('0')
  const [maxStock,    setMaxStock]    = useState('')
  const [categoryId,  setCategoryId]  = useState('')
  const [isActive,    setIsActive]    = useState(true)
  const [tags,        setTags]        = useState<string[]>([])
  const [error,       setError]       = useState<string | null>(null)
  const [success,     setSuccess]     = useState(false)

  const [categories,  setCategories]  = useState<CategoryOption[]>(initCats)
  const [newCatName,  setNewCatName]  = useState('')
  const [creatingCat, setCreatingCat] = useState(false)
  const [showCatForm, setShowCatForm] = useState(false)

  // History for sparkline
  const [history,     setHistory]     = useState<ProductHistoryResponse | null>(null)
  const [histLoading, setHistLoading] = useState(false)

  useEffect(() => {
    if (!product) return
    setName(product.name)
    setSku(product.sku)
    setBarcode(product.barcode ?? '')
    setDescription(product.description ?? '')
    setImageUrl(product.imageUrl ?? null)
    setCostRaw(product.costPrice.toFixed(2).replace('.', ','))
    setSaleRaw(product.salePrice.toFixed(2).replace('.', ','))
    setUnit(product.unit)
    setMinStock(String(product.minStock))
    setMaxStock(product.maxStock != null ? String(product.maxStock) : '')
    setCategoryId(product.categoryId ?? '')
    setIsActive(product.isActive)
    setTags(product.tags)
    setError(null)
    setSuccess(false)
    setHistory(null)

    // Fetch history
    setHistLoading(true)
    fetch(`/api/${orgSlug}/products/${product.id}/history`)
      .then((r) => r.json())
      .then((d) => setHistory(d))
      .catch(() => {})
      .finally(() => setHistLoading(false))
  }, [product?.id, orgSlug])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!product) return null

  const costValue = parseBRL(costRaw)
  const saleValue = parseBRL(saleRaw)

  async function handleCreateCategory() {
    if (!newCatName.trim()) return
    setCreatingCat(true)
    const res = await createCategory(orgSlug, { name: newCatName.trim(), sortOrder: 0 })
    setCreatingCat(false)
    if (!res.success) { setError(res.error); return }
    const newCat: CategoryOption = { id: res.data.id, name: newCatName.trim(), color: null }
    setCategories((prev) => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)))
    setCategoryId(res.data.id)
    setNewCatName('')
    setShowCatForm(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Nome é obrigatório'); return }
    if (!sku.trim())  { setError('SKU é obrigatório');  return }
    setError(null)

    startTransition(async () => {
      const res = await updateProduct(orgSlug, product.id, {
        name:        name.trim(),
        sku:         sku.trim(),
        barcode:     barcode.trim()     || null,
        description: description.trim() || null,
        imageUrl:    imageUrl           || null,
        costPrice:   costValue,
        salePrice:   saleValue,
        unit,
        minStock:    Number(minStock) || 0,
        maxStock:    maxStock ? (Number(maxStock) || null) : null,
        categoryId:  categoryId        || null,
        isActive,
        tags,
      })

      if (!res.success) { setError(res.error); return }
      setSuccess(true)
      router.refresh()
      setTimeout(() => { setSuccess(false); onSuccess() }, 1000)
    })
  }

  function handleArchive() {
    if (!confirm(`Arquivar "${product.name}"? Ele não aparecerá mais nas listagens.`)) return
    startTransition(async () => {
      const res = await archiveProduct(orgSlug, product.id)
      if (!res.success) { setError(res.error); return }
      router.refresh()
      onSuccess()
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div className="pdrawer-backdrop" onClick={onClose} />

      {/* Drawer */}
      <div className="pdrawer">
        {/* Header */}
        <div className="pdrawer-header">
          <div>
            <div className="pdrawer-title">Editar Produto</div>
            <div className="pdrawer-sub">{product.sku}</div>
          </div>
          <button type="button" className="pf-modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Sparkline history */}
        <div className="pdrawer-history">
          <div className="pdrawer-history-label">
            Movimentação — 30 dias
            {history && (
              <span style={{ marginLeft: 8, fontWeight: 400, color: '#888', fontSize: 11 }}>
                {history.movementCount} mov · +{history.totalIn} / -{history.totalOut}
              </span>
            )}
          </div>
          {histLoading ? (
            <div style={{ height: 56, display: 'flex', alignItems: 'center', color: '#aaa', fontSize: 12 }}>
              Carregando…
            </div>
          ) : history?.days ? (
            <Sparkline days={history.days} />
          ) : (
            <div style={{ height: 56, display: 'flex', alignItems: 'center', color: '#aaa', fontSize: 12 }}>
              Sem movimentações no período
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="pdrawer-form">
          {/* Image preview (compact) */}
          {imageUrl && (
            <div className="pdrawer-img-wrap">
              <img src={imageUrl} alt="" className="pdrawer-img" />
              <button type="button" className="pdrawer-img-remove" onClick={() => setImageUrl(null)}>
                Remover foto
              </button>
            </div>
          )}

          <div className="pf-field">
            <label className="pf-label">Nome <span className="pf-required">*</span></label>
            <input className="pf-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="pf-field">
            <label className="pf-label">Descrição</label>
            <textarea className="pf-input pf-textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="pf-row">
            <div className="pf-field" style={{ flex: 1 }}>
              <label className="pf-label">SKU <span className="pf-required">*</span></label>
              <input className="pf-input" value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
            <div className="pf-field" style={{ flex: 1 }}>
              <label className="pf-label">Cód. Barras</label>
              <input className="pf-input" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            </div>
          </div>

          <div className="pf-field">
            <label className="pf-label">Categoria</label>
            <select
              className="pf-input pf-select"
              value={categoryId}
              onChange={(e) => {
                if (e.target.value === '__new__') { setShowCatForm(true); setCategoryId('') }
                else setCategoryId(e.target.value)
              }}
            >
              <option value="">— Sem categoria —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="__new__">+ Criar nova categoria…</option>
            </select>
            {showCatForm && (
              <div className="pf-inline-cat">
                <input
                  className="pf-input"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nome da categoria"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory() } }}
                  autoFocus
                />
                <button type="button" className="pf-cat-btn" onClick={handleCreateCategory} disabled={creatingCat}>
                  {creatingCat ? '…' : 'Criar'}
                </button>
                <button type="button" className="pf-cat-cancel" onClick={() => setShowCatForm(false)}>×</button>
              </div>
            )}
          </div>

          <div className="pf-row">
            <div className="pf-field" style={{ flex: 1 }}>
              <label className="pf-label">Preço de Custo</label>
              <div className="pf-input-prefix">
                <span className="pf-prefix">R$</span>
                <input className="pf-input pf-input-after-prefix" value={costRaw}
                  onChange={(e) => setCostRaw(e.target.value)}
                  onBlur={(e) => setCostRaw(formatBRL(e.target.value))} placeholder="0,00" />
              </div>
            </div>
            <div className="pf-field" style={{ flex: 1 }}>
              <label className="pf-label">
                Preço de Venda
                <MarginBadge cost={costValue} sale={saleValue} />
              </label>
              <div className="pf-input-prefix">
                <span className="pf-prefix">R$</span>
                <input className="pf-input pf-input-after-prefix" value={saleRaw}
                  onChange={(e) => setSaleRaw(e.target.value)}
                  onBlur={(e) => setSaleRaw(formatBRL(e.target.value))} placeholder="0,00" />
              </div>
            </div>
          </div>

          <div className="pf-row">
            <div className="pf-field" style={{ flex: 1 }}>
              <label className="pf-label">Unidade</label>
              <select className="pf-input pf-select" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="pf-field" style={{ flex: 1 }}>
              <label className="pf-label">Estoque Mín.</label>
              <input className="pf-input" type="number" min="0" value={minStock} onChange={(e) => setMinStock(e.target.value)} />
            </div>
            <div className="pf-field" style={{ flex: 1 }}>
              <label className="pf-label">Estoque Máx.</label>
              <input className="pf-input" type="number" min="0" value={maxStock} onChange={(e) => setMaxStock(e.target.value)} placeholder="—" />
            </div>
          </div>

          <div className="pf-field">
            <label className="pf-label">Tags</label>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          <div className="pf-field pf-toggle-row">
            <div>
              <div className="pf-toggle-label">Produto ativo</div>
              <div className="pf-toggle-desc">Inativos não aparecem nas movimentações</div>
            </div>
            <button
              type="button"
              className={`pf-toggle ${isActive ? 'on' : 'off'}`}
              onClick={() => setIsActive((v) => !v)}
              aria-pressed={isActive}
            >
              <span className="pf-toggle-thumb" />
            </button>
          </div>

          {error && <div className="pf-error">{error}</div>}

          {success && (
            <div className="pf-success">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Alterações salvas!
            </div>
          )}

          <div className="pdrawer-footer">
            <button
              type="button"
              className="dash-btn"
              style={{ color: '#B71C1C', background: 'transparent', border: '1px solid #FFCDD2' }}
              onClick={handleArchive}
              disabled={isPending}
            >
              Arquivar
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="dash-btn dash-btn-ghost" onClick={onClose}>Cancelar</button>
              <button type="submit" className="dash-btn dash-btn-primary" disabled={isPending}>
                {isPending ? <><span className="qmp-spinner" /> Salvando…</> : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
