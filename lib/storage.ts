import type { StoredApiKeys, Test, Run } from "./types"

const STORAGE_KEYS = {
  API_KEYS: "llm_comparison_api_keys",
  TESTS: "llm_comparison_tests",
  RUNS: "llm_comparison_runs",
}

function getLocalStorageSize(): number {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith("llm_comparison_")) {
      const value = localStorage.getItem(key)
      if (value) {
        total += value.length * 2 // Each char is 2 bytes in JS
      }
    }
  }
  return total / (1024 * 1024) // Convert bytes to MB
}

// --- API Key Storage ---
export function loadApiKeys(): StoredApiKeys {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.API_KEYS)
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error("Failed to load API keys from localStorage:", error)
    return {}
  }
}

export function saveApiKeys(apiKeys: StoredApiKeys): void {
  try {
    localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(apiKeys))
  } catch (error) {
    console.error("Failed to save API keys to localStorage:", error)
    throw error
  }
}

// --- Test Storage ---
export function loadTests(): Test[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TESTS)
    if (data) {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }
    }
  } catch (error) {
    console.error("Failed to load tests from localStorage:", error)
  }
  return []
}

export function saveTest(newTest: Test): Test[] {
  const tests = loadTests()
  const existingIndex = tests.findIndex((t) => t.id === newTest.id)
  
  if (existingIndex > -1) {
    tests[existingIndex] = newTest // Update existing test
  } else {
    tests.unshift(newTest) // Add new test to the beginning
  }

  try {
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests))
  } catch (error) {
    console.error("Failed to save test to localStorage:", error)
    throw error
  }
  return tests
}

export function deleteTest(id: string): Test[] {
  let tests = loadTests()
  tests = tests.filter((test) => test.id !== id)
  try {
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests))
  } catch (error) {
    console.error("Failed to delete test from localStorage:", error)
  }
  return tests
}

// --- Run Storage ---
export function loadRuns(): Run[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RUNS)
    if (data) {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      }
    }
  } catch (error) {
    console.error("Failed to load runs from localStorage:", error)
  }
  return []
}

export function saveRun(newRun: Run): Run[] {
  const runs = loadRuns()
  runs.unshift(newRun) // Add new run to the beginning
  
  try {
    localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(runs))
  } catch (error) {
    console.error("Failed to save run to localStorage:", error)
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("Storage quota exceeded. Attempting to save by removing oldest runs...")
      
      // Try to save with fewer runs by removing the oldest ones
      let retryRuns = [...runs]
      const maxRetries = 5
      let retryCount = 0
      
      while (retryCount < maxRetries && retryRuns.length > 1) {
        // Remove the last 20% of runs or at least 5 runs
        const toRemove = Math.max(5, Math.floor(retryRuns.length * 0.2))
        retryRuns = retryRuns.slice(0, -toRemove)
        
        try {
          localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(retryRuns))
          console.log(`Successfully saved run after removing ${runs.length - retryRuns.length} old runs`)
          return retryRuns
        } catch (retryError) {
          console.warn(`Retry ${retryCount + 1} failed, removing more runs...`)
          retryCount++
        }
      }
      
      // If we still can't save, throw an error with helpful message
      throw new Error(`Unable to save run due to storage limits. Tried removing up to ${runs.length - retryRuns.length} old runs. Consider manually clearing old data.`)
    }
    throw error
  }
  return runs
}

export function deleteRun(id: string): Run[] {
  let runs = loadRuns()
  runs = runs.filter((run) => run.id !== id)
  try {
    localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(runs))
  } catch (error) {
    console.error("Failed to delete run from localStorage:", error)
  }
  return runs
}

// --- Global Storage Management ---
export function clearAllData(): void {
  if (
    confirm("Are you sure you want to clear ALL application data (API keys, tests, and runs)? This cannot be undone.")
  ) {
    localStorage.removeItem(STORAGE_KEYS.API_KEYS)
    localStorage.removeItem(STORAGE_KEYS.TESTS)
    localStorage.removeItem(STORAGE_KEYS.RUNS)
    console.log("All application data cleared.")
  }
}

export function exportAllData(): void {
  const data = {
    apiKeys: loadApiKeys(),
    tests: loadTests(),
    runs: loadRuns(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `llm-comparison-tool-data-${new Date().toISOString()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importAllData(importedData: any): { tests: Test[]; runs: Run[]; apiKeys: StoredApiKeys } {
  if (typeof importedData !== "object" || !importedData.tests || !importedData.runs || !importedData.apiKeys) {
    throw new Error("Invalid import data format. Expected an object with 'apiKeys', 'tests', and 'runs'.")
  }

  // Import API Keys
  saveApiKeys(importedData.apiKeys)

  // Import Tests (merge and deduplicate)
  let newTests = [...loadTests(), ...importedData.tests]
  const uniqueTestsMap = new Map<string, Test>()
  newTests.forEach((test) => uniqueTestsMap.set(test.id, test))
  newTests = Array.from(uniqueTestsMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(newTests))

  // Import Runs (merge and deduplicate)
  let newRuns = [...loadRuns(), ...importedData.runs]
  const uniqueRunsMap = new Map<string, Run>()
  newRuns.forEach((run) => uniqueRunsMap.set(run.id, run))
  newRuns = Array.from(uniqueRunsMap.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
  localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(newRuns))

  return { apiKeys: loadApiKeys(), tests: loadTests(), runs: loadRuns() }
}

export function getStorageUsage(): number {
  return getLocalStorageSize()
}

export function getStorageDiagnostics(): {
  totalSize: number
  itemCounts: { [key: string]: number }
  itemSizes: { [key: string]: number }
} {
  const getItemSize = (key: string): number => {
    const value = localStorage.getItem(key)
    return value ? (value.length * 2) / (1024 * 1024) : 0 // MB
  }

  return {
    totalSize: getLocalStorageSize(),
    itemCounts: {
      tests: loadTests().length,
      runs: loadRuns().length,
      apiKeys: Object.keys(loadApiKeys()).length,
    },
    itemSizes: {
      tests: getItemSize(STORAGE_KEYS.TESTS),
      runs: getItemSize(STORAGE_KEYS.RUNS),
      apiKeys: getItemSize(STORAGE_KEYS.API_KEYS),
    },
  }
}

export function cleanupOldRuns(maxRuns: number = 50): { removed: number; newCount: number } {
  const runs = loadRuns()
  if (runs.length <= maxRuns) {
    return { removed: 0, newCount: runs.length }
  }
  
  const trimmedRuns = runs.slice(0, maxRuns)
  localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(trimmedRuns))
  
  return {
    removed: runs.length - maxRuns,
    newCount: maxRuns,
  }
}
