import { z } from 'zod'

export const institutionSchema = z.object({
  name: z.string().describe('Name of the institution (e.g., Social Security Administration, Bank of America)'),
  category: z.string().describe('Category of institution (e.g., Government, Financial, Insurance, Utilities, Medical)'),
  deadlineDays: z.number().describe('Number of days from death until action is recommended/required'),
  urgency: z.enum(['urgent', 'soon', 'later']).describe('Urgency level based on deadline'),
  reasonForDeadline: z.string().describe('Brief explanation of why this deadline matters'),
  letter: z.string().describe('Concise formal letter (100 words max) ready to mail, with placeholders for signature'),
  evidenceNeeded: z.array(z.string()).describe('List of documents/evidence needed to submit with the letter'),
})

export const memorialItemSchema = z.object({
  type: z.enum(['funeral_home', 'obituary', 'eulogy_opening']).describe('Type of memorial item'),
  title: z.string().describe('Display title, e.g. "Funeral Home Notification", "Obituary Draft", "Eulogy Opening"'),
  content: z.string().describe('The full text content — a formal letter, a 150-word obituary, or a 200-word eulogy opening paragraph'),
})

export const institutionsResponseSchema = z.object({
  institutions: z.array(institutionSchema).length(5).describe('Exactly 5 prioritized institutions to contact'),
})

export const memorialResponseSchema = z.object({
  memorialItems: z.array(memorialItemSchema).length(3).describe('Exactly 3 memorial items: funeral_home letter, obituary draft, and eulogy opening'),
})

export const generationResponseSchema = z.object({
  institutions: z.array(institutionSchema).length(5).describe('Exactly 5 prioritized institutions to contact'),
  memorialItems: z.array(memorialItemSchema).length(3).describe('Exactly 3 memorial items: funeral_home letter, obituary draft, and eulogy opening'),
})

export type Institution = z.infer<typeof institutionSchema>
export type MemorialItem = z.infer<typeof memorialItemSchema>
export type GenerationResponse = z.infer<typeof generationResponseSchema>

export interface UserInput {
  description: string
}
