'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleNameChange(value: string) {
    setName(value)
    if (!slugEdited) {
      setSlug(slugify(value))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (name.trim().length < 2) {
      setError('Nome precisa ter pelo menos 2 caracteres.')
      return
    }
    if (slug.length < 2) {
      setError('Slug precisa ter pelo menos 2 caracteres.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (res.status === 409) {
          setError('Esse slug já está em uso. Escolha outro.')
        } else {
          setError(data.error?.toString() || 'Erro ao criar organização.')
        }
        setLoading(false)
        return
      }

      const { org } = await res.json()
      router.push(`/${org.slug}`)
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fafafa',
      padding: '24px',
    }}>
      <form onSubmit={handleSubmit} style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '48px 40px',
        maxWidth: '460px',
        width: '100%',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
            Configure sua empresa
          </h1>
          <p style={{ color: '#666', marginTop: '8px', fontSize: '14px' }}>
            Crie sua organização para começar a gerenciar seu estoque.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>
            Nome da empresa
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ex: Minha Loja"
            required
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '15px',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>
            Slug (URL)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            <span style={{
              padding: '10px 12px',
              background: '#f3f3f3',
              borderRadius: '8px 0 0 8px',
              border: '1px solid #ddd',
              borderRight: 'none',
              fontSize: '14px',
              color: '#888',
            }}>
              stockpro.com/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value))
                setSlugEdited(true)
              }}
              placeholder="minha-loja"
              required
              style={{
                padding: '10px 14px',
                borderRadius: '0 8px 8px 0',
                border: '1px solid #ddd',
                fontSize: '15px',
                outline: 'none',
                flex: 1,
              }}
            />
          </div>
        </div>

        {error && (
          <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px',
            borderRadius: '10px',
            border: 'none',
            background: loading ? '#93a3f8' : '#4f46e5',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {loading ? 'Criando...' : 'Criar e Começar'}
        </button>
      </form>
    </main>
  )
}
