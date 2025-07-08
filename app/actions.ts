"use server"

import { generateText, type CoreMessage } from "ai"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { xai } from "@ai-sdk/xai"
import type { ModelConfig, RunResult, StoredApiKeys } from "@/lib/types"
import { calculateDiff, calculateSemanticSimilarity, calculateLineDiff, calculateJsonDiff } from "@/lib/diff"
import { isValidJson } from "@/lib/json-utils"

// Helper function to check if a string is valid JSON - now imported from json-utils

// Enhanced parallel processing with real-time feedback
export async function runComparison(
  prompt: string,
  imageInput: string | null,
  goldenCopy: string,
  selectedModels: ModelConfig[],
  apiKeys: StoredApiKeys
): Promise<RunResult[]> {
  // Create tasks for parallel execution
  const tasks = selectedModels.map((modelConfig) => 
    runSingleModel(modelConfig, prompt, imageInput, goldenCopy, apiKeys)
  )

  // Execute all models in parallel with timeout
  const results = await Promise.allSettled(
    tasks.map(task => 
      Promise.race([
        task,
        new Promise<RunResult>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 60 seconds')), 60000)
        )
      ])
    )
  )

  // Process results and handle failures
  const processedResults: RunResult[] = results.map((result, index) => {
    const modelConfig = selectedModels[index]

    if (result.status === 'fulfilled') {
      return result.value
    } else {
      console.error(`Model ${modelConfig.provider}/${modelConfig.model} failed:`, result.reason)
      return {
        model: modelConfig.model,
        provider: modelConfig.provider,
        output: `Error: ${result.reason?.message || "Unknown error"}`,
        diffScore: Number.POSITIVE_INFINITY,
        diffHtml: `<p class="text-red-500">Error: ${result.reason?.message || "Unknown error"}</p>`,
        error: true,
      }
    }
  })
  
  return processedResults
}

async function runSingleModel(
  modelConfig: ModelConfig,
  prompt: string,
  imageInput: string | null,
  goldenCopy: string,
  apiKeys: StoredApiKeys
): Promise<RunResult> {
  const { provider, model } = modelConfig
  const apiKey = apiKeys[provider]


  if (!apiKey) {
    return {
      model: model,
      provider: provider,
      output: `Error: API key for ${provider} not provided.`,
      diffScore: Number.POSITIVE_INFINITY,
      diffHtml: `<p class="text-red-500">Error: API key for ${provider} not provided.</p>`,
      error: true,
    }
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

  const startTime = Date.now()
  
  try {
    switch (provider) {
      case "openai":
        llmModel = openai(model, { 
          apiKey: apiKey,
        })
        break
      case "anthropic":
        llmModel = anthropic(model, { 
          apiKey: apiKey,
        })
        break
      case "google":
        const googleAI = createGoogleGenerativeAI({
          apiKey: apiKey,
        })
        llmModel = googleAI(model)
        break
      case "xai":
        llmModel = xai(model, { 
          apiKey: apiKey,
        })
        break
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }

    const { text } = await generateText({
      model: llmModel,
      messages: messages,
    })

    const executionTime = Date.now() - startTime
    
    const diffResult = calculateDiff(goldenCopy, text)
    const lineDiffResult = calculateLineDiff(goldenCopy, text)
    const jsonDiffResult = calculateJsonDiff(goldenCopy, text)
    const semanticSimilarity = calculateSemanticSimilarity(goldenCopy, text)

    // Determine the default similarity to match the UI's default diff method
    // Force JSON mode if golden copy is JSON, otherwise use word-level diff
    const isGoldenCopyJson = isValidJson(goldenCopy)
    const defaultSimilarity = isGoldenCopyJson ? jsonDiffResult.similarity : diffResult.similarity

    return {
      model: model,
      provider: provider,
      output: text,
      diffScore: diffResult.diffScore,
      diffHtml: diffResult.diffHtml,
      error: false,
      similarity: defaultSimilarity,
      levenshteinDistance: diffResult.levenshteinDistance,
      wordCount: diffResult.wordCount,
      changes: diffResult.changes,
      semanticSimilarity: semanticSimilarity,
      executionTime: executionTime,
      // Line-based diff data
      lineDiffScore: lineDiffResult.diffScore,
      lineDiffHtml: lineDiffResult.diffHtml,
      lineCount: lineDiffResult.lineCount,
      lineChanges: lineDiffResult.changes,
      // JSON-based diff data
      jsonDiffScore: jsonDiffResult.diffScore,
      jsonDiffHtml: jsonDiffResult.diffHtml,
      jsonSimilarity: jsonDiffResult.similarity,
      normalizedGolden: jsonDiffResult.normalizedGolden,
      normalizedOutput: jsonDiffResult.normalizedOutput,
      isValidJson: jsonDiffResult.isValidJson,
      parseErrors: jsonDiffResult.parseErrors,
      jsonChanges: jsonDiffResult.changes,
    }
  } catch (error: any) {
    console.error(`Error running model ${provider}/${model}:`, error)
    
    return {
      model: model,
      provider: provider,
      output: `Error: ${error.message || "Unknown error"}`,
      diffScore: Number.POSITIVE_INFINITY,
      diffHtml: `<p class="text-red-500">Error: ${error.message || "Unknown error"}</p>`,
      error: true,
      executionTime: Date.now() - startTime,
    }
  }
}
