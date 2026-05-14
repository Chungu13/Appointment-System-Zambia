import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import { Scissors } from 'lucide-react'
import { publicClient } from '../../lib/apollo'
import { ALL_SALONS } from '../../graphql/queries/salons'
import SalonCard from '../../components/salon/SalonCard'
import CategoryFilter from '../../components/salon/CategoryFilter'
import SearchBar from '../../components/salon/SearchBar'
import { PageSpinner, ErrorMessage } from '../../components/ui/Spinner'

function DirectoryContent() {
  const [search, setSearch] = useState('')
  const [type, setType] = useState(null)

  const { data, loading, error } = useQuery(ALL_SALONS, {
    client: publicClient,
    variables: { businessType: type },
  })

  const salons = (data?.salons ?? []).filter((s) =>
    !search || s.businessName.toLowerCase().includes(search.toLowerCase()) ||
    s.city?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="bg-primary text-on-primary">
        <div className="max-w-5xl mx-auto px-4 py-14 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Scissors size={28} />
            <span className="font-display text-4xl font-bold">BeautyBook ZM</span>
          </div>
          <p className="text-on-primary/80 text-lg mb-8 max-w-sm mx-auto">
            Discover and book top salons across Zambia.
          </p>
          <div className="max-w-lg mx-auto">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search salons or areas…"
            />
          </div>
        </div>
      </header>

      {/* Filter bar */}
      <div className="border-b border-outline-variant bg-surface-container-low">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <CategoryFilter selected={type} onChange={setType} />
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        {loading && <PageSpinner />}
        {error && <ErrorMessage message="Could not load salons. Is the backend running?" className="mb-6" />}

        {!loading && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-semibold text-on-surface">
                {type ? `${type.replace('_', ' ')} salons` : 'All salons'}
              </h2>
              <span className="text-sm text-on-surface-variant">{salons.length} found</span>
            </div>

            {salons.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-16">
                No salons found. Try a different search or filter.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {salons.map((salon) => (
                  <SalonCard key={salon.id} salon={salon} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-outline-variant mt-16 py-8 text-center text-sm text-on-surface-variant">
        © {new Date().getFullYear()} BeautyBook ZM · Built for Zambia
      </footer>
    </div>
  )
}

export default function SalonDirectory() {
  return <DirectoryContent />
}
