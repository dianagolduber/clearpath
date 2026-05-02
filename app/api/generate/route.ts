import { generateText, Output } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { generationResponseSchema } from '@/lib/types'

const openai = createOpenAI({
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  apiKey: process.env.VERCEL_AI_GATEWAY_TOKEN,
})

export async function POST(req: Request) {
  try {
    const { description } = await req.json()

    if (!description || typeof description !== 'string') {
      return Response.json({ error: 'Description is required' }, { status: 400 })
    }

    console.log('[v0] Starting generation with description:', description.substring(0, 100))

    const { output } = await generateText({
      model: openai('anthropic/claude-sonnet-4-5'),
      system: `You are a compassionate and knowledgeable estate administration assistant specializing in Arizona law. Your role is to help Arizona families navigate the difficult paperwork after a loved one's death.

Based on the information provided about the deceased, generate TWO things:

## 1. Institutions (5-8 items)
A list of prioritized institutions that need to be contacted. For each institution, provide:
- A formal, ready-to-mail letter in proper business letter format with date, salutation, body, enclosed documents list, and "Sincerely, [Your Name]" closing
- Evidence/documents needed
- Deadline in days and urgency based on Arizona law (A.R.S. statutes where applicable)

Prioritize in this order:
1. Social Security Administration (always first — urgent)
2. Arizona Department of Revenue & state benefits
3. Banks and financial institutions
4. Insurance companies (life, health, auto)
5. Employers and retirement accounts
6. Utilities (APS, SRP, water, etc.)
7. Credit card companies
8. Other Arizona-specific institutions

## 2. Memorial Items (exactly 3)
Generate all three of the following:

**funeral_home** — A formal letter to a funeral home requesting cremation or burial services and transferring arrangements. Use professional language. Leave placeholders like [Funeral Home Name] and [Your Name].

**obituary** — A warm, personal obituary of approximately 150 words written in third person. Use the name and any details provided. Celebrate their life with dignity. End with survivors or a closing sentiment.

**eulogy_opening** — A warm, heartfelt eulogy opening paragraph of approximately 200 words that a family member could read aloud. Use first person ("We gather today..."). It should acknowledge grief, celebrate the person's character, and invite reflection. Use any details provided to personalise it.`,
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
    console.log('[v0] Memorial items count:', output?.memorialItems?.length ?? 0)

    return Response.json({
      institutions: output?.institutions ?? [],
      memorialItems: output?.memorialItems ?? [],
    })
  } catch (error) {
    console.error('[v0] Generation error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: `Failed to generate: ${message}` }, { status: 500 })
  }
}
