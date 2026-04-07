'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { createProduct } from '@/app/(dashboard)/[orgSlug]/actions/products.actions'
import { createMovement } from '@/app/(dashboard)/[orgSlug]/actions/stock.actions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

function formatBRL(raw: string): string {
  const n = raw.replace(/\D/g, '')
  if (!n) return ''
  return (Number(n) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

type InviteRow = { email: string; role: 'EDITOR' | 'ADMIN' | 'VIEWER' }

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: 1 | 2 | 3 }) {
  const STEPS = ['Sua empresa', 'Primeiro produto', 'Sua equipe']
  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '12px' }}>
        {STEPS.map((label, i) => {
          const n       = i + 1
          const done    = n < step
          const current = n === step
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: n < 3 ? 1 : 'none' }}>
              <div style={{
                width:          '28px',
                height:         '28px',
                borderRadius:   '50%',
                flexShrink:     0,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontSize:       '12px',
                fontWeight:     700,
                background:     done ? '#2563EB' : current ? '#EFF6FF' : '#F1F5F9',
                color:          done ? '#fff' : current ? '#2563EB' : '#94A3B8',
                border:         current ? '2px solid #2563EB' : done ? 'none' : '1.5px solid #E2E8F0',
                transition:     'all 0.2s',
              }}>
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : n}
              </div>
              {n < 3 && (
                <div style={{
                  flex:       1,
                  height:     '2px',
                  background: done ? '#2563EB' : '#E2E8F0',
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {STEPS.map((label, i) => (
          <span key={label} style={{
            fontSize:   '11px',
            fontWeight: i + 1 === step ? 600 : 400,
            color:      i + 1 === step ? '#2563EB' : i + 1 < step ? '#64748B' : '#94A3B8',
            flex:       '1',
            textAlign:  i === 0 ? 'left' : i === 2 ? 'right' : 'center',
          }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

function Field({
  label, hint, children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{label}</label>
      {children}
      {hint && <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8' }}>{hint}</p>}
    </div>
  )
}

const INPUT_STYLE: React.CSSProperties = {
  padding:      '10px 14px',
  borderRadius: '8px',
  border:       '1.5px solid #E2E8F0',
  fontSize:     '14px',
  color:        '#0F172A',
  outline:      'none',
  width:        '100%',
  boxSizing:    'border-box',
  transition:   'border-color 0.15s',
}

const BTN_PRIMARY: React.CSSProperties = {
  width:        '100%',
  padding:      '12px',
  borderRadius: '10px',
  border:       'none',
  background:   '#2563EB',
  color:        '#fff',
  fontSize:     '15px',
  fontWeight:   700,
  cursor:       'pointer',
  transition:   'background 0.15s',
}

const BTN_GHOST: React.CSSProperties = {
  width:        '100%',
  padding:      '12px',
  borderRadius: '10px',
  border:       '1.5px solid #E2E8F0',
  background:   'transparent',
  color:        '#64748B',
  fontSize:     '14px',
  fontWeight:   500,
  cursor:       'pointer',
  transition:   'border-color 0.15s, color 0.15s',
}

// ─── Step 1: Company ──────────────────────────────────────────────────────────

function StepCompany({
  onDone,
}: {
  onDone: (orgId: string, orgSlug: string) => void
}) {
  const [name,       setName]       = useState('')
  const [slug,       setSlug]       = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')
  const [segment,    setSegment]    = useState('')
  const [logo,       setLogo]       = useState<File | null>(null)
  const [logoPreview,setLogoPreview]= useState<string | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Auto-generate slug from name
  function handleNameChange(value: string) {
    setName(value)
    if (!slugEdited) {
      const generated = slugify(value)
      setSlug(generated)
      triggerSlugCheck(generated)
    }
  }

  // Debounced slug availability check
  const triggerSlugCheck = useCallback((value: string) => {
    clearTimeout(debounceRef.current)
    if (!value || value.length < 2) { setSlugStatus('idle'); return }
    setSlugStatus('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/orgs/check-slug?slug=${encodeURIComponent(value)}`)
        const data = await res.json()
        setSlugStatus(data.available ? 'available' : data.reason === 'format' ? 'invalid' : 'taken')
      } catch {
        setSlugStatus('idle')
      }
    }, 500)
  }, [])

  function handleSlugChange(value: string) {
    const sanitized = slugify(value)
    setSlug(sanitized)
    setSlugEdited(true)
    triggerSlugCheck(sanitized)
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Logo deve ter menos de 2MB.'); return }
    setLogo(file)
    setLogoPreview(URL.createObjectURL(file))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (slugStatus === 'taken')   { setError('Esse slug já está em uso.'); return }
    if (slugStatus === 'invalid') { setError('Slug inválido. Use letras minúsculas, números e hífens.'); return }
    setLoading(true)

    try {
      const res = await fetch('/api/orgs', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), slug }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(res.status === 409 ? 'Esse slug já está em uso.' : d.error?.toString() ?? 'Erro ao criar organização.')
        setLoading(false)
        return
      }
      const { org } = await res.json()

      // Upload logo to Supabase Storage (best-effort)
      if (logo) {
        try {
          const ext     = logo.name.split('.').pop() ?? 'png'
          const supabase = createSupabaseBrowserClient()
          await supabase.storage
            .from('org-logos')
            .upload(`${org.id}/logo.${ext}`, logo, { upsert: true })
        } catch {
          // Non-critical: logo upload failure doesn't block onboarding
        }
      }

      onDone(org.id, org.slug)
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  const slugIndicator = {
    checking:  { color: '#94A3B8', icon: '⏳', text: 'Verificando...' },
    available: { color: '#10B981', icon: '✓',  text: 'Disponível' },
    taken:     { color: '#EF4444', icon: '✗',  text: 'Já em uso' },
    invalid:   { color: '#F59E0B', icon: '!',  text: 'Formato inválido' },
    idle:      null,
  }[slugStatus]

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
          Configure sua empresa
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>
          Estas informações aparecem no seu workspace do StockPro.
        </p>
      </div>

      {/* Logo */}
      <Field label="Logo da empresa" hint="PNG ou JPG, até 2MB. Opcional.">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '12px',
            border: '1.5px dashed #E2E8F0',
            background: '#F8FAFC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0,
          }}>
            {logoPreview
              ? <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
            }
          </div>
          <label style={{
            padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #E2E8F0',
            fontSize: '13px', fontWeight: 500, color: '#475569', cursor: 'pointer',
          }}>
            {logo ? 'Alterar logo' : 'Escolher imagem'}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
          </label>
        </div>
      </Field>

      {/* Company name */}
      <Field label="Nome da empresa *">
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Ex: Distribuidora Rápida"
          required
          style={INPUT_STYLE}
          onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
          onBlur={(e)  => (e.target.style.borderColor = '#E2E8F0')}
        />
      </Field>

      {/* Slug */}
      <Field label="URL da sua organização *" hint="Letras minúsculas, números e hífens. Mínimo 2 caracteres.">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{
            padding: '10px 12px', background: '#F8FAFC', borderRadius: '8px 0 0 8px',
            border: '1.5px solid #E2E8F0', borderRight: 'none',
            fontSize: '13px', color: '#94A3B8', whiteSpace: 'nowrap',
          }}>
            stockpro.com/
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="minha-empresa"
            required
            style={{ ...INPUT_STYLE, borderRadius: '0 8px 8px 0', borderLeft: 'none' }}
            onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
            onBlur={(e)  => (e.target.style.borderColor = '#E2E8F0')}
          />
        </div>
        {slugIndicator && (
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: slugIndicator.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{slugIndicator.icon}</span> {slugIndicator.text}
          </p>
        )}
      </Field>

      {/* Segment */}
      <Field label="Segmento">
        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          style={{ ...INPUT_STYLE, background: '#fff', cursor: 'pointer' }}
        >
          <option value="">Selecione seu segmento (opcional)</option>
          {['Varejo', 'Alimentação', 'Vestuário', 'Eletrônicos', 'Saúde / Beleza', 'Outro'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      {error && <p style={{ margin: 0, fontSize: '13px', color: '#EF4444' }}>{error}</p>}

      <button type="submit" disabled={loading || slugStatus === 'taken' || slugStatus === 'invalid'}
        style={{ ...BTN_PRIMARY, opacity: (loading || slugStatus === 'taken') ? 0.7 : 1 }}>
        {loading ? 'Criando...' : 'Continuar →'}
      </button>
    </form>
  )
}

// ─── Step 2: First product ────────────────────────────────────────────────────

function StepProduct({
  orgSlug,
  onDone,
  onSkip,
}: {
  orgSlug: string
  onDone: () => void
  onSkip: () => void
}) {
  const [name,        setName]        = useState('')
  const [sku,         setSku]         = useState('')
  const [salePriceRaw,setSalePriceRaw]= useState('')
  const [qty,         setQty]         = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const salePrice = Number(salePriceRaw.replace(/\D/g, '')) / 100
    const quantity  = parseInt(qty, 10) || 0

    setLoading(true)
    try {
      const res = await createProduct(orgSlug, {
        name,
        sku:      sku.trim().toUpperCase(),
        salePrice,
        costPrice: 0,
        unit:      'un',
        minStock:  0,
        isActive:  true,
        tags:      [],
      })

      if (!res.success) {
        setError(typeof res.error === 'string' ? res.error : 'Erro ao criar produto.')
        setLoading(false)
        return
      }

      // Register initial stock movement if quantity > 0
      if (quantity > 0) {
        // Get the default location first
        const locRes = await fetch(`/api/${orgSlug}/locations/default`)
        const locData = locRes.ok ? await locRes.json() : null
        const locationId = locData?.id

        if (locationId) {
          await createMovement(orgSlug, {
            productId:  res.data.id,
            locationId,
            type:       'IN',
            quantity,
            reason:     'Estoque inicial',
          })
        }
      }

      onDone()
    } catch {
      setError('Erro ao salvar produto.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
          Adicione seu primeiro produto
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>
          Cadastre um produto para ver o dashboard em ação. Você pode pular esta etapa.
        </p>
      </div>

      <Field label="Nome do produto *">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Camiseta Básica P"
          required style={INPUT_STYLE}
          onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
          onBlur={(e)  => (e.target.style.borderColor = '#E2E8F0')}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Field label="SKU *" hint="Código único do produto">
          <input type="text" value={sku} onChange={(e) => setSku(e.target.value)}
            placeholder="Ex: CAMISA-P-001"
            required style={INPUT_STYLE}
            onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
            onBlur={(e)  => (e.target.style.borderColor = '#E2E8F0')}
          />
        </Field>

        <Field label="Preço de venda">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#94A3B8' }}>R$</span>
            <input
              type="text" value={salePriceRaw}
              onChange={(e) => setSalePriceRaw(formatBRL(e.target.value))}
              placeholder="0,00"
              style={{ ...INPUT_STYLE, paddingLeft: '32px' }}
              onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
              onBlur={(e)  => (e.target.style.borderColor = '#E2E8F0')}
            />
          </div>
        </Field>
      </div>

      <Field label="Quantidade inicial" hint="Quantas unidades você tem em estoque hoje?">
        <input type="number" value={qty} onChange={(e) => setQty(e.target.value)}
          placeholder="0" min="0"
          style={INPUT_STYLE}
          onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
          onBlur={(e)  => (e.target.style.borderColor = '#E2E8F0')}
        />
      </Field>

      {error && <p style={{ margin: 0, fontSize: '13px', color: '#EF4444' }}>{error}</p>}

      <button type="submit" disabled={loading} style={{ ...BTN_PRIMARY, opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Salvando...' : 'Salvar e continuar →'}
      </button>
      <button type="button" onClick={onSkip} style={BTN_GHOST}>
        Pular por agora
      </button>
    </form>
  )
}

// ─── Step 3: Team invites ─────────────────────────────────────────────────────

function StepInvites({
  orgId,
  onDone,
  onSkip,
}: {
  orgId: string
  onDone: () => void
  onSkip: () => void
}) {
  const [rows, setRows]     = useState<InviteRow[]>([
    { email: '', role: 'EDITOR' },
    { email: '', role: 'EDITOR' },
    { email: '', role: 'EDITOR' },
  ])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [sent,    setSent]    = useState(0)

  function updateRow(i: number, field: keyof InviteRow, value: string) {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const filled = rows.filter((r) => r.email.trim())
    if (!filled.length) { onSkip(); return }

    setLoading(true)
    setError('')
    let count = 0

    for (const row of filled) {
      try {
        const res = await fetch('/api/invites', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ orgId, email: row.email.trim(), role: row.role }),
        })
        if (res.ok) count++
        else {
          const d = await res.json()
          if (d.error !== 'User is already a member') {
            setError(`Erro ao convidar ${row.email}: ${d.error}`)
          }
        }
      } catch {
        // non-critical
      }
    }

    setSent(count)
    setTimeout(onDone, 800)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
          Convide sua equipe
        </h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>
          Adicione até 3 colaboradores agora. Mais convites podem ser enviados depois.
        </p>
      </div>

      {rows.map((row, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'center' }}>
          <input
            type="email"
            value={row.email}
            onChange={(e) => updateRow(i, 'email', e.target.value)}
            placeholder={`email${i + 1}@empresa.com`}
            style={INPUT_STYLE}
            onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
            onBlur={(e)  => (e.target.style.borderColor = '#E2E8F0')}
          />
          <select
            value={row.role}
            onChange={(e) => updateRow(i, 'role', e.target.value as InviteRow['role'])}
            style={{ ...INPUT_STYLE, width: 'auto', minWidth: '110px', cursor: 'pointer' }}
          >
            <option value="VIEWER">Visualizador</option>
            <option value="EDITOR">Editor</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      ))}

      {error && <p style={{ margin: 0, fontSize: '13px', color: '#EF4444' }}>{error}</p>}
      {sent > 0 && <p style={{ margin: 0, fontSize: '13px', color: '#10B981' }}>✓ {sent} convite{sent !== 1 ? 's' : ''} enviado{sent !== 1 ? 's' : ''}!</p>}

      <button type="submit" disabled={loading} style={{ ...BTN_PRIMARY, opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Enviando...' : 'Enviar convites e finalizar →'}
      </button>
      <button type="button" onClick={onSkip} style={BTN_GHOST}>
        Pular por agora
      </button>
    </form>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step,    setStep]    = useState<1 | 2 | 3>(1)
  const [orgId,   setOrgId]   = useState('')
  const [orgSlug, setOrgSlug] = useState('')

  function handleCompanyDone(id: string, slug: string) {
    setOrgId(id)
    setOrgSlug(slug)
    setStep(2)
  }

  function finish() {
    router.push(`/${orgSlug}?welcome=1`)
  }

  return (
    <main style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     'linear-gradient(135deg, #F0F4FF 0%, #F8FAFC 60%, #F0F4FF 100%)',
      padding:        '24px',
    }}>
      <div style={{
        background:   '#fff',
        borderRadius: '20px',
        padding:      '48px 40px',
        maxWidth:     '520px',
        width:        '100%',
        boxShadow:    '0 8px 40px rgba(15,23,42,0.08)',
        border:       '1px solid #E2E8F0',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="12" height="12" rx="2" fill="white" opacity="0.9"/>
              <rect x="5" y="5" width="6" height="6" rx="1" fill="white"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '16px', color: '#0F172A' }}>StockPro</span>
        </div>

        <ProgressBar step={step} />

        {step === 1 && (
          <StepCompany onDone={handleCompanyDone} />
        )}
        {step === 2 && (
          <StepProduct
            orgSlug={orgSlug}
            onDone={() => setStep(3)}
            onSkip={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepInvites
            orgId={orgId}
            onDone={finish}
            onSkip={finish}
          />
        )}
      </div>
    </main>
  )
}
