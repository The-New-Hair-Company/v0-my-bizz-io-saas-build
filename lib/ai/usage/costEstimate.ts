/**
 * Estimate LLM cost in USD for a given token count.
 * Prices are approximate and updated manually.
 * Model: openai/gpt-4o-mini (via Vercel AI Gateway)
 */

const PRICE_PER_1K_INPUT_USD = 0.00015   // $0.15 / 1M input tokens
const PRICE_PER_1K_OUTPUT_USD = 0.0006   // $0.60 / 1M output tokens

export function estimateCostUsd(tokensIn: number, tokensOut: number): number {
  const inputCost = (tokensIn / 1000) * PRICE_PER_1K_INPUT_USD
  const outputCost = (tokensOut / 1000) * PRICE_PER_1K_OUTPUT_USD
  return parseFloat((inputCost + outputCost).toFixed(8))
}
