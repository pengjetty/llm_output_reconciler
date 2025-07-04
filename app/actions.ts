"use server"

import { generateText, type CoreMessage } from "ai"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { google } from "@ai-sdk/google"
import { xai } from "@ai-sdk/xai"
import type { ModelConfig, RunResult, StoredApiKeys } from "@/lib/types"
import { calculateDiff } from "@/lib/diff"

export async function runComparison(
  prompt: string,
  imageInput: string | null, // Base64 or URL
  goldenCopy: string,
  selectedModels: ModelConfig[],
  apiKeys: StoredApiKeys, // API keys are now passed as an argument
): Promise<RunResult[]> {
  const results: RunResult[] = []

  for (const modelConfig of selectedModels) {
    const { provider, model } = modelConfig
    const apiKey = apiKeys[provider]

    if (!apiKey) {
      results.push({
        model: model,
        provider: provider,
        output: `Error: API key for ${provider} not provided.`,
        diffScore: Number.POSITIVE_INFINITY,
        diffHtml: `<p class="text-red-500">Error: API key for ${provider} not provided.</p>`,
        error: true,
      })
      continue
    }

    let llmModel
    let messages: CoreMessage[] = [{ role: "user", content: prompt }]

    if (imageInput) {
      messages = [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image", image: imageInput },
          ],
        },
      ]
    }

    try {
      switch (provider) {
        case "openai":
          llmModel = openai(model, { apiKey: apiKey })
          break
        case "anthropic":
          llmModel = anthropic(model, { apiKey: apiKey })
          break
        case "google":
          llmModel = google(model, { apiKey: apiKey })
          break
        case "xai":
          llmModel = xai(model, { apiKey: apiKey })
          break
        default:
          throw new Error(`Unsupported provider: ${provider}`)
      }

      const { text } = await generateText({
        model: llmModel,
        messages: messages,
      })

      const { diffScore, diffHtml } = calculateDiff(goldenCopy, text)

      results.push({
        model: model,
        provider: provider,
        output: text,
        diffScore: diffScore,
        diffHtml: diffHtml,
        error: false,
      })
    } catch (error: any) {
      console.error(`Error running model ${provider}/${model}:`, error)
      results.push({
        model: model,
        provider: provider,
        output: `Error: ${error.message || "Unknown error"}`,
        diffScore: Number.POSITIVE_INFINITY,
        diffHtml: `<p class="text-red-500">Error: ${error.message || "Unknown error"}</p>`,
        error: true,
      })
    }
  }

  return results
}
