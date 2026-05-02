'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'

interface InputFormProps {
  onSubmit: (description: string) => void
  isLoading: boolean
}

export function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (description.trim() && !isLoading) {
      onSubmit(description.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col gap-4">
        <label htmlFor="description" className="sr-only">
          Describe your loved one and their accounts
        </label>
        <Textarea
          id="description"
          placeholder="Tell us about your loved one. Include their name, state of residence, and any accounts or institutions you know about (banks, insurance, utilities, subscriptions, etc.)

Example: My mother, Margaret Chen, passed away on March 15th. She lived in California. She had accounts with Chase Bank, Blue Cross insurance, PG&E utilities, and Social Security. She also had a 401k through Fidelity from her work at..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          className="min-h-[200px] bg-card border-border text-foreground placeholder:text-muted-foreground resize-none text-base leading-relaxed"
        />
        <Button 
          type="submit" 
          disabled={!description.trim() || isLoading}
          className="w-full sm:w-auto sm:self-end"
          size="lg"
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2" />
              Analyzing...
            </>
          ) : (
            'Generate Letters'
          )}
        </Button>
      </div>
    </form>
  )
}
