import { createOpenAI } from '@ai-sdk/openai'

export const gateway = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
})
