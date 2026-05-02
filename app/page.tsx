'use client'

import { useState } from 'react'
import { InputForm } from '@/components/input-form'
import { InstitutionCards } from '@/components/institution-cards'
import type { Institution } from '@/lib/types'

export default function Home() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userDescription, setUserDescription] = useState('')

  const handleSubmit = async (description: string) => {
    setIsLoading(true)
    setError(null)
    setUserDescription(description)
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate letters')
      }
      
      const data = await response.json()
      // Sort by deadline days
      const sorted = [...data.institutions].sort((a, b) => a.deadlineDays - b.deadlineDays)
      setInstitutions(sorted)
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
    setUserDescription('')
    setError(null)
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        {institutions.length === 0 ? (
          <div className="flex flex-col items-center gap-8 sm:gap-12">
            <header className="text-center max-w-2xl">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground leading-tight text-balance mb-4">
                After a death, the paperwork doesn&apos;t wait.
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed text-pretty">
                We draft the letters. We track the deadlines. You take care of your family.
              </p>
            </header>
            
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
            onVerify={handleVerify}
            onStartOver={handleStartOver}
          />
        )}
      </div>
    </main>
  )
}
