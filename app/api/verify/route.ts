import { generateText } from 'ai'

interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
}

interface TavilyResponse {
  results: TavilySearchResult[]
}

async function searchTavily(query: string): Promise<TavilyResponse> {
  console.log('[v0] Tavily search starting for query:', query)
  const startTime = Date.now()
  
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: 'basic',
      include_answer: false,
      include_raw_content: false,
      max_results: 3,
    }),
  })

  const elapsed = Date.now() - startTime
  console.log('[v0] Tavily search completed in', elapsed, 'ms')

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.statusText}`)
  }

  return response.json()
}

export async function POST(req: Request) {
  const startTime = Date.now()
  console.log('[v0] Verify request starting')
  
  const { institutionName, state, currentLetter, userDescription } = await req.json()

  if (!institutionName || !currentLetter) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Search for current procedures using Tavily
  const searchQuery = `${state} ${institutionName} death notification requirements`
  
  let searchResults: TavilyResponse
  try {
    console.log('[v0] Starting Tavily search')
    searchResults = await searchTavily(searchQuery)
    console.log('[v0] Search returned', searchResults.results.length, 'results')
  } catch (error) {
    console.error('[v0] Tavily search error:', error)
    return Response.json({ 
      error: 'Search failed', 
      refinedLetter: currentLetter,
      sources: []
    }, { status: 500 })
  }

  // Format search results for Claude
  const searchContext = searchResults.results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}\nSource: ${r.url}`)
    .join('\n\n')

  // Use Claude to refine the letter based on search results
  console.log('[v0] Starting Claude refinement')
  const refinementStart = Date.now()
  
  const { text: refinedLetter } = await generateText({
    model: 'anthropic/claude-sonnet-4-5',
    messages: [
      {
        role: 'system',
        content: `You are an expert estate administration assistant. Your task is to refine a notification letter based on the most current legal procedures and requirements found in web search results.

Review the search results carefully and update the letter to:
1. Include any specific forms or reference numbers mentioned
2. Add current mailing addresses or contact information if found
3. Include any state-specific requirements discovered
4. Add any new deadline information
5. Reference specific laws or regulations if applicable

Maintain the professional, empathetic tone of the original letter. Keep the same general structure but enhance it with accurate, current information.

Output ONLY the refined letter text, nothing else.`,
      },
      {
        role: 'user',
        content: `Here is the current letter for ${institutionName}:

${currentLetter}

Here are the search results about current procedures:

${searchContext}

Please refine this letter with any relevant current information from the search results.`,
      },
    ],
  })

  const refinementElapsed = Date.now() - refinementStart
  const totalElapsed = Date.now() - startTime
  console.log('[v0] Claude refinement completed in', refinementElapsed, 'ms')
  console.log('[v0] Total verify request completed in', totalElapsed, 'ms')

  const sources = searchResults.results.map(r => r.url)

  return Response.json({ 
    refinedLetter: refinedLetter || currentLetter,
    sources,
  })
}
