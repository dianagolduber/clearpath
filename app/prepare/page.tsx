'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { savePreparedEstate } from './actions'
import { useRouter } from 'next/navigation'

export default function PreparePage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [state, setState] = useState('CA')
  const [dateOfBirth, setDateOfBirth] = useState('')
  
  const [accounts, setAccounts] = useState([
    { type: 'bank', institution: '', accountNumber: '', policyNumber: '', notes: '' },
  ])
  const [contacts, setContacts] = useState([
    { type: 'attorney', name: '', phone: '', email: '', notes: '' },
  ])
  const [notes, setNotes] = useState([{ title: '', content: '' }])
  const [trustedContacts, setTrustedContacts] = useState([{ email: '', name: '' }])
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setIsLoading(true)
    setError('')
    try {
      await savePreparedEstate({
        fullName,
        state,
        dateOfBirth: dateOfBirth || undefined,
        accounts: accounts.filter((a) => a.institution),
        contacts: contacts.filter((c) => c.name),
        notes: notes.filter((n) => n.title && n.content),
        trustedContacts: trustedContacts.filter((t) => t.email),
      })
      router.push('/prepare/share')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <img src="/clear-path-logo.jpg" alt="" aria-hidden="true" className="h-12 w-12 object-contain rounded-md" />
            <h1 className="font-serif text-3xl text-foreground">Clear Path</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl">
          <h2 className="font-serif text-3xl text-foreground mb-2">Prepare Your Information</h2>
          <p className="text-muted-foreground mb-8">Store your estate details in one secure place and share access with trusted family members.</p>

          {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

          {/* Personal Information */}
          <div className="mb-8">
            <h3 className="font-semibold text-foreground mb-4">Your Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">State</label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="CA" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date of Birth</label>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Financial Accounts */}
          <div className="mb-8">
            <h3 className="font-semibold text-foreground mb-4">Financial Accounts</h3>
            <div className="space-y-4">
              {accounts.map((account, idx) => (
                <div key={idx} className="p-4 border border-border rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select
                        value={account.type}
                        onChange={(e) => {
                          const newAccounts = [...accounts]
                          newAccounts[idx].type = e.target.value
                          setAccounts(newAccounts)
                        }}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="bank">Bank</option>
                        <option value="investment">Investment</option>
                        <option value="insurance">Insurance</option>
                        <option value="utility">Utility</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Institution</label>
                      <Input
                        value={account.institution}
                        onChange={(e) => {
                          const newAccounts = [...accounts]
                          newAccounts[idx].institution = e.target.value
                          setAccounts(newAccounts)
                        }}
                        placeholder="Bank name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Account Number</label>
                    <Input
                      value={account.accountNumber}
                      onChange={(e) => {
                        const newAccounts = [...accounts]
                        newAccounts[idx].accountNumber = e.target.value
                        setAccounts(newAccounts)
                      }}
                      placeholder="Last 4 digits or policy #"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <Textarea
                      value={account.notes}
                      onChange={(e) => {
                        const newAccounts = [...accounts]
                        newAccounts[idx].notes = e.target.value
                        setAccounts(newAccounts)
                      }}
                      placeholder="Contact info, login details location, etc."
                      className="min-h-20"
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setAccounts([...accounts, { type: 'bank', institution: '', accountNumber: '', policyNumber: '', notes: '' }])}
              >
                + Add Account
              </Button>
            </div>
          </div>

          {/* Key Contacts */}
          <div className="mb-8">
            <h3 className="font-semibold text-foreground mb-4">Key Contacts</h3>
            <div className="space-y-4">
              {contacts.map((contact, idx) => (
                <div key={idx} className="p-4 border border-border rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select
                        value={contact.type}
                        onChange={(e) => {
                          const newContacts = [...contacts]
                          newContacts[idx].type = e.target.value
                          setContacts(newContacts)
                        }}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="attorney">Attorney</option>
                        <option value="accountant">Accountant</option>
                        <option value="financial_advisor">Financial Advisor</option>
                        <option value="executor">Executor</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <Input
                        value={contact.name}
                        onChange={(e) => {
                          const newContacts = [...contacts]
                          newContacts[idx].name = e.target.value
                          setContacts(newContacts)
                        }}
                        placeholder="Full name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <Input
                        value={contact.phone}
                        onChange={(e) => {
                          const newContacts = [...contacts]
                          newContacts[idx].phone = e.target.value
                          setContacts(newContacts)
                        }}
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <Input
                        value={contact.email}
                        onChange={(e) => {
                          const newContacts = [...contacts]
                          newContacts[idx].email = e.target.value
                          setContacts(newContacts)
                        }}
                        placeholder="Email address"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setContacts([...contacts, { type: 'attorney', name: '', phone: '', email: '', notes: '' }])}
              >
                + Add Contact
              </Button>
            </div>
          </div>

          {/* Important Notes */}
          <div className="mb-8">
            <h3 className="font-semibold text-foreground mb-4">Important Notes</h3>
            <div className="space-y-4">
              {notes.map((note, idx) => (
                <div key={idx} className="p-4 border border-border rounded-lg space-y-3">
                  <Input
                    value={note.title}
                    onChange={(e) => {
                      const newNotes = [...notes]
                      newNotes[idx].title = e.target.value
                      setNotes(newNotes)
                    }}
                    placeholder="e.g., 'Where to find the will'"
                  />
                  <Textarea
                    value={note.content}
                    onChange={(e) => {
                      const newNotes = [...notes]
                      newNotes[idx].content = e.target.value
                      setNotes(newNotes)
                    }}
                    placeholder="Details here..."
                    className="min-h-24"
                  />
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setNotes([...notes, { title: '', content: '' }])}
              >
                + Add Note
              </Button>
            </div>
          </div>

          {/* Trusted Contacts */}
          <div className="mb-8">
            <h3 className="font-semibold text-foreground mb-4">Share With (Up to 5 People)</h3>
            <div className="space-y-4">
              {trustedContacts.map((trusted, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-3">
                  <Input
                    value={trusted.name}
                    onChange={(e) => {
                      const newTrusted = [...trustedContacts]
                      newTrusted[idx].name = e.target.value
                      setTrustedContacts(newTrusted)
                    }}
                    placeholder="Their name"
                  />
                  <Input
                    value={trusted.email}
                    onChange={(e) => {
                      const newTrusted = [...trustedContacts]
                      newTrusted[idx].email = e.target.value
                      setTrustedContacts(newTrusted)
                    }}
                    placeholder="Their email"
                    type="email"
                  />
                </div>
              ))}
              {trustedContacts.length < 5 && (
                <Button
                  variant="outline"
                  onClick={() => setTrustedContacts([...trustedContacts, { email: '', name: '' }])}
                >
                  + Add Person
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save & Share'}
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
