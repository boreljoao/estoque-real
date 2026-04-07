'use client'

import { useState, useRef, useTransition, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { createProduct, updateProduct } from '../../actions/products.actions'
import { createCategory } from '../../actions/categories.actions'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CategoryOption = {
  id:    string
  name:  string
  color: string | null
}

export type ProductForEdit = {
  id:          string
  name:        string
  sku:         string
  barcode:     string | null
  description: string | null
  imageUrl:    string | null
  costPrice:   number
  salePrice:   number
  unit:        string
  minStock:    number
  maxStock:    number | null
  categoryId:  string | null
  isActive:    boolean
  tags:        string[]
}

type Props = {
  orgSlug:            string
  orgId:              string
  initialCategories:  CategoryOption[]
  product?:           ProductForEdit   // present = edit mode
  onClose:            () => void
  onSuccess:          () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const UNITS = ['un', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'cx', 'par', 'pc', 'rolo', 'fardo']

// ─── BRL currency helpers ─────────────────────────────────────────────────────

function formatBRL(val: string): string {
  const digits = val.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10) / 100
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseBRL(val: string): number {
  return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0
}

// ─── Sparkline (mini) preview ─────────────────────────────────────────────────

function MarginBadge({ cost, sale }: { cost: number; sale: number }) {
  if (!cost || !sale) return null
  const margin = ((sale - cost) / sale) * 100
  const color  = margin >= 30 ? '#2E7D32' : margin >= 10 ? '#E65100' : '#B71C1C'
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, marginLeft: 6 }}>
      {margin.toFixed(1)}% margem
    </span>
  )
}

// ─── Tag input ────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('')

  function add(value: string) {
    const v = value.trim().toLowerCase()
    if (v && !tags.includes(v)) onChange([...tags, v])
    setInput('')
  }

  function remove(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

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

// ─── Image uploader ───────────────────────────────────────────────────────────

function ImageUploader({
  orgId,
  preview,
  onUpload,
}: {
  orgId:    string
  preview:  string | null
  onUpload: (url: string) => void
}) {
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const inputRef                  = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { setError('Apenas imagens (JPG, PNG, WebP)'); return }
    if (file.size > 5 * 1024 * 1024)    { setError('Máximo 5MB');                      return }
    setError(null)
    setUploading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const ext  = file.name.split('.').pop()
      const path = `${orgId}/${crypto.randomUUID()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: false })
      if (uploadErr) throw uploadErr
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      onUpload(data.publicUrl)
    } catch (e: any) {
      setError(e?.message ?? 'Erro no upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className={`pf-image-drop${dragging ? ' dragging' : ''}${uploading ? ' uploading' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true)  }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      {preview ? (
        <img src={preview} alt="Preview" className="pf-image-preview" />
      ) : (
        <div className="pf-image-placeholder">
          {uploading ? (
            <span className="pf-image-uploading">Enviando…</span>
          ) : (
            <>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>Arraste ou clique para enviar</span>
              <span style={{ fontSize: 11, color: '#bbb' }}>JPG, PNG, WebP — máx. 5MB</span>
            </>
          )}
        </div>
      )}
      {error && <div className="pf-image-error">{error}</div>}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProductFormModal({
  orgSlug,
  orgId,
  initialCategories,
  product,
  onClose,
  onSuccess,
}: Props) {
  const router    = useRouter()
  const isEdit    = !!product
  const [isPending, startTransition] = useTransition()

  // Form state
  const [name,        setName]        = useState(product?.name        ?? '')
  const [sku,         setSku]         = useState(product?.sku         ?? '')
  const [barcode,     setBarcode]     = useState(product?.barcode     ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [imageUrl,    setImageUrl]    = useState<string | null>(product?.imageUrl ?? null)
  const [costRaw,     setCostRaw]     = useState(
    product ? product.costPrice.toFixed(2).replace('.', ',') : '',
  )
  const [saleRaw,     setSaleRaw]     = useState(
    product ? product.salePrice.toFixed(2).replace('.', ',') : '',
  )
  const [unit,        setUnit]        = useState(product?.unit        ?? 'un')
  const [minStock,    setMinStock]    = useState(String(product?.minStock ?? 0))
  const [maxStock,    setMaxStock]    = useState(String(product?.maxStock ?? ''))
  const [categoryId,  setCategoryId]  = useState(product?.categoryId  ?? '')
  const [isActive,    setIsActive]    = useState(product?.isActive    ?? true)
  const [tags,        setTags]        = useState<string[]>(product?.tags ?? [])
  const [error,       setError]       = useState<string | null>(null)
  const [limitHit,    setLimitHit]    = useState<{ current: number; max: number; plan: string } | null>(null)

  // Categories (local so inline create works)
  const [categories, setCategories]    = useState<CategoryOption[]>(initialCategories)
  const [newCatName,  setNewCatName]   = useState('')
  const [creatingCat, setCreatingCat]  = useState(false)
  const [showCatForm, setShowCatForm]  = useState(false)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const costValue = parseBRL(costRaw)
  const saleValue = parseBRL(saleRaw)

  // ── inline category create ──
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

  // ── submit ──
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Nome é obrigatório');  return }
    if (!sku.trim())  { setError('SKU é obrigatório');   return }
    setError(null)

    const payload = {
      name:        name.trim(),
      sku:         sku.trim(),
      barcode:     barcode.trim()     || null,
      description: description.trim() || null,
      imageUrl:    imageUrl           || null,
      costPrice:   costValue,
      salePrice:   saleValue,
      unit,
      minStock:    Number(minStock)   || 0,
      maxStock:    maxStock ? (Number(maxStock) || null) : null,
      categoryId:  categoryId         || null,
      isActive,
      tags,
    }

    startTransition(async () => {
      const res = isEdit
        ? await updateProduct(orgSlug, product!.id, payload)
        : await createProduct(orgSlug, payload)

      if (!res.success) {
        if (res.error === 'LIMIT_REACHED') {
          setLimitHit({ current: (res as any).current, max: (res as any).max, plan: (res as any).plan })
        } else {
          setError(res.error)
        }
        return
      }
      router.refresh()
      onSuccess()
    })
  }

  return (
    <div className="pf-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="pf-modal">
        {/* Header */}
        <div className="pf-modal-header">
          <div className="pf-modal-title">{isEdit ? 'Editar Produto' : 'Novo Produto'}</div>
          <button type="button" className="pf-modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="pf-modal-body">
          <div className="pf-cols">
            {/* ── Left column ── */}
            <div className="pf-col">
              <ImageUploader orgId={orgId} preview={imageUrl} onUpload={setImageUrl} />

              <div className="pf-field">
                <label className="pf-label">Nome <span className="pf-required">*</span></label>
                <input className="pf-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do produto" />
              </div>

              <div className="pf-field">
                <label className="pf-label">Descrição</label>
                <textarea
                  className="pf-input pf-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição opcional..."
                  rows={3}
                />
              </div>

              <div className="pf-row">
                <div className="pf-field" style={{ flex: 1 }}>
                  <label className="pf-label">SKU <span className="pf-required">*</span></label>
                  <input className="pf-input" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="ABC-001" />
                </div>
                <div className="pf-field" style={{ flex: 1 }}>
                  <label className="pf-label">Cód. Barras</label>
                  <input className="pf-input" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="EAN / QR" />
                </div>
              </div>
            </div>

            {/* ── Right column ── */}
            <div className="pf-col">
              {/* Category */}
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
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
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
                    <button
                      type="button"
                      className="pf-cat-btn"
                      onClick={handleCreateCategory}
                      disabled={creatingCat}
                    >
                      {creatingCat ? '…' : 'Criar'}
                    </button>
                    <button type="button" className="pf-cat-cancel" onClick={() => setShowCatForm(false)}>×</button>
                  </div>
                )}
              </div>

              {/* Prices */}
              <div className="pf-row">
                <div className="pf-field" style={{ flex: 1 }}>
                  <label className="pf-label">Preço de Custo</label>
                  <div className="pf-input-prefix">
                    <span className="pf-prefix">R$</span>
                    <input
                      className="pf-input pf-input-after-prefix"
                      value={costRaw}
                      onChange={(e) => setCostRaw(e.target.value)}
                      onBlur={(e)  => setCostRaw(formatBRL(e.target.value))}
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div className="pf-field" style={{ flex: 1 }}>
                  <label className="pf-label">
                    Preço de Venda
                    <MarginBadge cost={costValue} sale={saleValue} />
                  </label>
                  <div className="pf-input-prefix">
                    <span className="pf-prefix">R$</span>
                    <input
                      className="pf-input pf-input-after-prefix"
                      value={saleRaw}
                      onChange={(e) => setSaleRaw(e.target.value)}
                      onBlur={(e)  => setSaleRaw(formatBRL(e.target.value))}
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>

              {/* Unit */}
              <div className="pf-field">
                <label className="pf-label">Unidade</label>
                <select className="pf-input pf-select" value={unit} onChange={(e) => setUnit(e.target.value)}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              {/* Stock limits */}
              <div className="pf-row">
                <div className="pf-field" style={{ flex: 1 }}>
                  <label className="pf-label">Estoque Mínimo</label>
                  <input
                    className="pf-input"
                    type="number"
                    min="0"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                  />
                </div>
                <div className="pf-field" style={{ flex: 1 }}>
                  <label className="pf-label">Estoque Máximo</label>
                  <input
                    className="pf-input"
                    type="number"
                    min="0"
                    value={maxStock}
                    onChange={(e) => setMaxStock(e.target.value)}
                    placeholder="—"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="pf-field">
                <label className="pf-label">Tags</label>
                <TagInput tags={tags} onChange={setTags} />
              </div>

              {/* Active toggle */}
              <div className="pf-field pf-toggle-row">
                <div>
                  <div className="pf-toggle-label">Produto ativo</div>
                  <div className="pf-toggle-desc">Produtos inativos não aparecem nas movimentações</div>
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
            </div>
          </div>

          {/* Limit reached upgrade prompt */}
          {limitHit && (
            <div className="pf-limit-box">
              <div className="pf-limit-title">Limite de produtos atingido</div>
              <div className="pf-limit-desc">
                Você está usando <strong>{limitHit.current}</strong> de <strong>{limitHit.max}</strong> produtos no plano <strong>{limitHit.plan}</strong>.
                Faça upgrade para adicionar produtos ilimitados.
              </div>
              <button
                type="button"
                className="dash-btn dash-btn-primary"
                style={{ marginTop: 8 }}
                onClick={async () => {
                  const res = await fetch('/api/stripe/checkout', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orgId, plan: 'PRO' }),
                  })
                  const data = await res.json()
                  if (data.url) window.location.href = data.url
                }}
              >
                Fazer upgrade para Pro →
              </button>
            </div>
          )}

          {/* Error */}
          {error && <div className="pf-error">{error}</div>}

          {/* Footer */}
          <div className="pf-modal-footer">
            <button type="button" className="dash-btn dash-btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="dash-btn dash-btn-primary" disabled={isPending}>
              {isPending ? (
                <><span className="qmp-spinner" /> Salvando…</>
              ) : (
                isEdit ? 'Salvar alterações' : 'Criar produto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
