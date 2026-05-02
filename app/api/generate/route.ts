import { generateText, Output } from 'ai'
import { generationResponseSchema } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const { description } = await req.json()

    if (!description || typeof description !== 'string') {
      return Response.json({ error: 'Description is required' }, { status: 400 })
    }

    console.log('[v0] Starting generation with description:', description.substring(0, 100))

    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4-5-20250514',
      system: `You are a compassionate and knowledgeable estate administration assistant. Your role is to help families navigate the difficult paperwork after a loved one's death.

Based on the information provided about the deceased, generate a list of 5-8 prioritized institutions that need to be contacted. For each institution, provide:

1. A formal, ready-to-mail letter that:
   - Uses proper business letter format
   - Includes the date and appropriate salutation
   - Clearly states the purpose (notification of death)
   - Requests specific actions (account closure, benefit claims, etc.)
   - Lists the enclosed documents
   - Ends with signature line: "Sincerely, [Your Name]"

2. Evidence needed (documents to include with the letter)

3. Deadline information based on actual legal/regulatory requirements

Prioritize institutions in this order:
1. Social Security Administration (always included - urgent)
2. Government benefits/pensions
3. Banks and financial institutions
4. Insurance companies (life, health, auto)
5. Employers/retirement accounts
6. Utilities and services
7. Credit card companies
8. Other relevant institutions

Be specific to the state mentioned for any state-specific requirements. Use professional, empathetic language throughout.`,
      output: Output.object({
        schema: generationResponseSchema,
      }),
      messages: [
        {
          role: 'user',
          content: description,
        },
      ],
    })

    console.log('[v0] Generation successful, institutions count:', output?.institutions?.length ?? 0)

    return Response.json({ institutions: output?.institutions ?? [] })
  } catch (error) {
    console.error('[v0] Generation error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: `Failed to generate: ${message}` }, { status: 500 })
  }
}
