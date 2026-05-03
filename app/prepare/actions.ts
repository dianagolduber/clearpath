'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function savePreparedEstate(formData: {
  fullName: string
  state: string
  dateOfBirth?: string
  accounts: Array<{ type: string; institution: string; accountNumber?: string; policyNumber?: string; notes?: string }>
  contacts: Array<{ type: string; name: string; phone?: string; email?: string; notes?: string }>
  notes: Array<{ title: string; content: string }>
  trustedContacts: Array<{ email: string; name: string }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Save or update prepared_estates
  const { data: estate, error: estateError } = await supabase
    .from('prepared_estates')
    .upsert(
      {
        user_id: user.id,
        full_name: formData.fullName,
        state: formData.state,
        date_of_birth: formData.dateOfBirth || null,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (estateError) throw estateError

  // Delete existing accounts/contacts/notes and re-add (simpler than update logic)
  await supabase.from('estate_accounts').delete().eq('estate_id', estate.id)
  await supabase.from('estate_contacts').delete().eq('estate_id', estate.id)
  await supabase.from('estate_notes').delete().eq('estate_id', estate.id)
  await supabase.from('trusted_contacts').delete().eq('estate_id', estate.id)

  // Insert accounts
  if (formData.accounts.length > 0) {
    const { error: accountError } = await supabase.from('estate_accounts').insert(
      formData.accounts.map((a) => ({
        estate_id: estate.id,
        account_type: a.type,
        institution_name: a.institution,
        account_number: a.accountNumber || null,
        policy_number: a.policyNumber || null,
        notes: a.notes || null,
      }))
    )
    if (accountError) throw accountError
  }

  // Insert contacts
  if (formData.contacts.length > 0) {
    const { error: contactError } = await supabase.from('estate_contacts').insert(
      formData.contacts.map((c) => ({
        estate_id: estate.id,
        contact_type: c.type,
        name: c.name,
        phone: c.phone || null,
        email: c.email || null,
        notes: c.notes || null,
      }))
    )
    if (contactError) throw contactError
  }

  // Insert notes
  if (formData.notes.length > 0) {
    const { error: notesError } = await supabase.from('estate_notes').insert(
      formData.notes.map((n) => ({
        estate_id: estate.id,
        title: n.title,
        content: n.content,
      }))
    )
    if (notesError) throw notesError
  }

  // Insert trusted contacts
  if (formData.trustedContacts.length > 0) {
    const { error: trustedError } = await supabase.from('trusted_contacts').insert(
      formData.trustedContacts.map((t) => ({
        estate_id: estate.id,
        email: t.email,
        name: t.name,
      }))
    )
    if (trustedError) throw trustedError
  }

  return estate
}
