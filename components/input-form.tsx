'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
  'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
  'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
]

export interface FormData {
  firstName: string
  lastName: string
  state: string
  dateOfPassing: string
  knownAccounts: string
}

interface InputFormProps {
  onSubmit: (data: FormData) => void
  isLoading: boolean
}

export function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    state: 'Arizona',
    dateOfPassing: '',
    knownAccounts: '',
  })

  const set = (key: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const canSubmit = form.firstName.trim() && !isLoading

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-xl p-6 sm:p-8 flex flex-col gap-6">

        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="firstName">
                First name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="firstName"
                placeholder="Margaret"
                value={form.firstName}
                onChange={set('firstName')}
                disabled={isLoading}
                required
              />
            </Field>
          </FieldGroup>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="lastName">Last name</FieldLabel>
              <Input
                id="lastName"
                placeholder="Chen"
                value={form.lastName}
                onChange={set('lastName')}
                disabled={isLoading}
              />
            </Field>
          </FieldGroup>
        </div>

        {/* State + Date row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="state">
                State of residence
              </FieldLabel>
              <div className="px-3 py-2 bg-muted border border-border rounded-md text-foreground">
                Arizona
              </div>
            </Field>
          </FieldGroup>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="dateOfPassing">Date of passing</FieldLabel>
              <Input
                id="dateOfPassing"
                type="date"
                value={form.dateOfPassing}
                onChange={set('dateOfPassing')}
                disabled={isLoading}
              />
            </Field>
          </FieldGroup>
        </div>

        {/* Known accounts */}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="knownAccounts">
              Known accounts or institutions{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </FieldLabel>
            <Textarea
              id="knownAccounts"
              placeholder="e.g. Chase Bank, Blue Cross insurance, PG&E utilities, Social Security, Fidelity 401k..."
              value={form.knownAccounts}
              onChange={set('knownAccounts')}
              disabled={isLoading}
              className="min-h-[96px] resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank if you&apos;re not sure — we&apos;ll suggest the most common ones.
            </p>
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          disabled={!canSubmit}
          className="w-full sm:w-auto sm:self-end"
          size="lg"
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2" />
              Generating letters...
            </>
          ) : (
            'Generate letters'
          )}
        </Button>
      </div>
    </form>
  )
}
