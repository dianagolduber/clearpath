'use client'

import { useState } from 'react'
import { ClipboardList, Mail, Users, ArrowRight } from 'lucide-react'
import { InputForm, type FormData } from '@/components/input-form'
import { InstitutionCards } from '@/components/institution-cards'
import type { Institution, MemorialItem } from '@/lib/types'

export default function Home() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [memorialItems, setMemorialItems] = useState<MemorialItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userDescription, setUserDescription] = useState('')
  const [deceasedName, setDeceasedName] = useState('')
  const [loadingState, setLoadingState] = useState('')

  const handleSubmit = async (data: FormData) => {
    // Build a natural-language description from structured fields
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ')
    const datePart = data.dateOfPassing
      ? ` on ${new Date(data.dateOfPassing + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
      : ''
    const accountsPart = data.knownAccounts.trim()
      ? ` They had accounts with: ${data.knownAccounts.trim()}.`
      : ''
    const description = `${fullName} passed away${datePart}. They lived in ${data.state}.${accountsPart}`

    setIsLoading(true)
    setError(null)
    setUserDescription(description)
    setDeceasedName(fullName)
    setLoadingState(data.state || 'Arizona')
    setInstitutions([])
    setMemorialItems([])
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      
      const responseData = await response.json()
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to generate letters')
      }

      const sorted = [...(responseData.institutions || [])].sort((a: Institution, b: Institution) => a.deadlineDays - b.deadlineDays)
      setInstitutions(sorted)
      setMemorialItems(responseData.memorialItems ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (institutionName: string, index: number) => {
    // Extract state from user description
    const stateMatch = userDescription.match(/\b(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)\b/i)
    const state = stateMatch ? stateMatch[0] : 'United States'
    
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          institutionName, 
          state,
          currentLetter: institutions[index].letter,
          userDescription,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to verify')
      }
      
      const data = await response.json()
      
      // Update the specific institution with the refined letter
      setInstitutions(prev => prev.map((inst, i) => 
        i === index ? { ...inst, letter: data.refinedLetter } : inst
      ))
      
      return data
    } catch (err) {
      throw err
    }
  }

  const handleStartOver = () => {
    setInstitutions([])
    setMemorialItems([])
    setUserDescription('')
    setDeceasedName('')
    setError(null)
  }

  return (
    <main className="min-h-screen">
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <img src="/clear-path-logo.jpg" alt="" aria-hidden="true" className="h-12 w-12 object-contain rounded-md" />
            <h1 className="font-serif text-3xl text-foreground">Clear Path</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin" />
            <div className="text-center max-w-md">
              <h2 className="font-serif text-2xl sm:text-3xl text-foreground mb-3">
                Drafting your letters...
              </h2>
              <p className="text-muted-foreground">
                This takes 30 seconds to 1 minute. We&apos;re researching deadlines and drafting letters specific to {loadingState}.
              </p>
            </div>
          </div>
        ) : institutions.length === 0 ? (
          <div className="flex flex-col items-center gap-8 sm:gap-12">
            <header className="text-center max-w-2xl">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground leading-tight mb-4 max-w-2xl">
                Losing someone is hard.
                <br />
                <span className="whitespace-nowrap">The paperwork doesn&apos;t have to be.</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
                <span className="whitespace-nowrap block">We draft the letters. We track the deadlines.</span>
                <span className="whitespace-nowrap block">You take care of your family.</span>
              </p>
            </header>

            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full max-w-3xl">
              <div className="flex-1 bg-card border border-border rounded-lg p-4 text-center">
                <ClipboardList className="mx-auto mb-3 text-muted-foreground" size={22} strokeWidth={1.5} />
                <h3 className="font-medium text-foreground text-sm mb-1">Fill out once</h3>
                <p className="text-xs text-muted-foreground">Name, date of passing, state, and any accounts you remember. We&apos;ll fill in the gaps.</p>
              </div>
              <div className="hidden sm:flex items-center text-muted-foreground/40 shrink-0">
                <ArrowRight size={18} />
              </div>
              <div className="flex-1 bg-card border border-border rounded-lg p-4 text-center">
                <Mail className="mx-auto mb-3 text-muted-foreground" size={22} strokeWidth={1.5} />
                <h3 className="font-medium text-foreground text-sm mb-1">Get 5 letters</h3>
                <p className="text-xs text-muted-foreground">State-specific letters for banks, SSA, insurance, and more — prioritized by legal deadline.</p>
              </div>
              <div className="hidden sm:flex items-center text-muted-foreground/40 shrink-0">
                <ArrowRight size={18} />
              </div>
              <div className="flex-1 bg-card border border-border rounded-lg p-4 text-center">
                <Users className="mx-auto mb-3 text-muted-foreground" size={22} strokeWidth={1.5} />
                <h3 className="font-medium text-foreground text-sm mb-1">Assign &amp; track</h3>
                <p className="text-xs text-muted-foreground">Split tasks across family. Everyone gets their letters, deadlines, and an email portal to track what&apos;s been sent.</p>
              </div>
            </div>
            
            <InputForm onSubmit={handleSubmit} isLoading={isLoading} />

            {error && (
              <div className="w-full max-w-2xl p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
                <p className="text-destructive">{error}</p>
              </div>
            )}

            <div className="w-full max-w-2xl border-t border-border pt-8 mt-2">
              <a href="/prepare" className="flex items-center justify-between group bg-card border border-border rounded-xl px-6 py-5 hover:border-foreground/30 transition-all">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Planning ahead?</p>
                  <p className="font-serif text-lg text-foreground">Prepare your own estate information</p>
                  <p className="text-sm text-muted-foreground mt-1">Store your accounts, contacts, and wishes so your family has everything they need.</p>
                </div>
                <span className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all text-xl ml-4">&#8594;</span>
              </a>
            </div>
          </div>
        ) : (
          <InstitutionCards
            institutions={institutions}
            memorialItems={memorialItems}
            onVerify={handleVerify}
            onStartOver={handleStartOver}
            deceasedName={deceasedName}
          />
        )}
      </div>
    </main>
  )
}
