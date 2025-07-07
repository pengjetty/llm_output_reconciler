export interface ModelConfig {
  provider: string
  model: string
}

export interface ModelCapability {
  input: string[]
  output: string[]
  context: string
  useCases: string
  pricing?: {
    inputPerMillion: number
    outputPerMillion: number
  }
  deprecated?: boolean
}

export interface ProviderConfig {
  [modelName: string]: ModelCapability
}

export interface Test {
  id: string
  name: string
  prompt: string
  imageInput: string | null // Base64 or URL
  goldenCopy: string
  createdAt: string
}

export interface RunResult {
  model: string
  provider: string
  output: string
  diffScore: number // Percentage of difference (0-1)
  diffHtml: string // HTML with highlighted differences
  error: boolean
  // Enhanced diff metrics
  similarity?: number // Similarity score (0-1)
  levenshteinDistance?: number
  wordCount?: { golden: number; output: number }
  changes?: { added: number; removed: number; modified: number }
  semanticSimilarity?: number // Semantic similarity (0-1)
  executionTime?: number // Time taken to generate response (ms)
  // Line-based diff metrics
  lineDiffScore?: number // Line-based diff score (0-1)
  lineDiffHtml?: string // HTML with line-based diff highlighting
  lineCount?: { golden: number; output: number }
  lineChanges?: { added: number; removed: number; modified: number }
  // JSON-based diff metrics
  jsonDiffScore?: number // JSON structural diff score (0-1)
  jsonDiffHtml?: string // HTML with JSON structural diff highlighting
  jsonSimilarity?: number // JSON structural similarity (0-1)
  normalizedGolden?: string // Normalized golden copy for comparison
  normalizedOutput?: string // Normalized output for comparison
  isValidJson?: { golden: boolean; output: boolean }
  parseErrors?: { golden?: string; output?: string }
  jsonChanges?: {
    structuralChanges: number
    valueChanges: number
    additions: number
    removals: number
  }
}

export interface Run {
  id: string
  testId: string // Link to the Test
  modelConfigs: ModelConfig[]
  results: RunResult[]
  timestamp: string
  apiKeysUsed: { [provider: string]: boolean } // To indicate which API keys were used (not the keys themselves)
}

export interface StoredApiKeys {
  [provider: string]: string
}

export type StoredRun = Run
