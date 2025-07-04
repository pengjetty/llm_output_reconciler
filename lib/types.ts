export interface ModelConfig {
  provider: string
  model: string
}

export interface ModelCapability {
  input: string[]
  output: string[]
  context: string
  useCases: string
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
  diffScore: number // Percentage of difference
  diffHtml: string // HTML with highlighted differences
  error: boolean
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
