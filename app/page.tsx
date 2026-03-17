import { redirect } from 'next/navigation'
import { getUser, getUserOrgs } from '@/lib/auth'
import Link from 'next/link'
import LandingPage from './components/landing-page'

export default async function HomePage() {
  const user = await getUser()

  if (!user) {
    return <LandingPage />
  }

  const orgs = await getUserOrgs()

  if (orgs.length === 1) {
    redirect(`/${orgs[0].org.slug}`)
  }

  if (orgs.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
        <h1 className="text-2xl font-bold">Bem-vindo ao StockPro</h1>
        <p className="text-gray-600">Crie sua primeira organização para começar.</p>
        <Link
          href="/onboarding"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Criar Organização
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl font-bold">Selecione uma organização</h1>
      <div className="grid gap-4 w-full max-w-md">
        {orgs.map(({ org, role }) => (
          <Link
            key={org.id}
            href={`/${org.slug}`}
            className="border rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <h2 className="font-semibold">{org.name}</h2>
            <p className="text-sm text-gray-500">/{org.slug} &middot; {role}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
