'use client'

import { useState } from 'react'
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
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <header className="mb-12">
          <h1 className="font-serif text-2xl text-foreground">Clear Path</h1>
        </header>
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
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground leading-tight text-balance mb-4">
                After a death, the paperwork doesn&apos;t wait.
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed text-pretty">
                We draft the letters. We track the deadlines. You take care of your family.
              </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">&#9993;</div>
                <h3 className="font-medium text-foreground text-sm mb-1">Ready-to-Mail Letters</h3>
                <p className="text-xs text-muted-foreground">Arizona-specific notifications for banks, SSA, insurance, and more</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">&#128101;</div>
                <h3 className="font-medium text-foreground text-sm mb-1">Assign to Family</h3>
                <p className="text-xs text-muted-foreground">Divide tasks among family members with SMS reminders</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">&#128338;</div>
                <h3 className="font-medium text-foreground text-sm mb-1">Track Deadlines</h3>
                <p className="text-xs text-muted-foreground">Prioritized by urgency so nothing falls through the cracks</p>
              </div>
            </div>
            
            <InputForm onSubmit={handleSubmit} isLoading={isLoading} />
            
            {error && (
              <div className="w-full max-w-2xl p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
                <p className="text-destructive">{error}</p>
              </div>
            )}
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
