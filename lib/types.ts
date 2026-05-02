import { z } from 'zod'

export const institutionSchema = z.object({
  name: z.string().describe('Name of the institution (e.g., Social Security Administration, Bank of America)'),
  category: z.string().describe('Category of institution (e.g., Government, Financial, Insurance, Utilities, Medical)'),
  deadlineDays: z.number().describe('Number of days from death until action is recommended/required'),
  urgency: z.enum(['urgent', 'soon', 'later']).describe('Urgency level based on deadline'),
  reasonForDeadline: z.string().describe('Brief explanation of why this deadline matters'),
  letter: z.string().describe('Full formal letter ready to mail, with placeholders for signature'),
  evidenceNeeded: z.array(z.string()).describe('List of documents/evidence needed to submit with the letter'),
})

export const generationResponseSchema = z.object({
  institutions: z.array(institutionSchema).describe('Array of 8 prioritized institutions to contact'),
})

export type Institution = z.infer<typeof institutionSchema>
export type GenerationResponse = z.infer<typeof generationResponseSchema>

export interface UserInput {
  description: string
}
