import type { StoredApiKeys, Test, Run } from "./types"

const STORAGE_KEYS = {
  API_KEYS: "llm_comparison_api_keys",
  TESTS: "llm_comparison_tests",
  RUNS: "llm_comparison_runs",
}

const MAX_STORAGE_MB = 5 // Maximum storage in MB for all data

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

function enforceStorageQuota(): void {
  let currentSize = getLocalStorageSize()
  const runs = loadRuns()
  const tests = loadTests()

  // Prioritize keeping tests over runs if space is tight
  while (currentSize > MAX_STORAGE_MB && (runs.length > 0 || tests.length > 0)) {
    if (runs.length > 0) {
      runs.shift() // Remove oldest run
      localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(runs))
    } else if (tests.length > 0) {
      tests.shift() // Remove oldest test
      localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests))
    }
    currentSize = getLocalStorageSize()
  }
}

// --- API Key Storage ---
export function loadApiKeys(): StoredApiKeys {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.API_KEYS)
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error("Failed to load API keys from localStorage:", error)
    // Removed localStorage.removeItem here
    return {}
  }
}

export function saveApiKeys(apiKeys: StoredApiKeys): void {
  try {
    localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(apiKeys))
    enforceStorageQuota()
  } catch (error) {
    console.error("Failed to save API keys to localStorage:", error)
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("Local storage quota exceeded when saving API keys.")
    }
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
    // Removed localStorage.removeItem here
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
    enforceStorageQuota()
  } catch (error) {
    console.error("Failed to save test to localStorage:", error)
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("Local storage quota exceeded when saving test.")
    }
  }
  return tests
}

export function deleteTest(id: string): Test[] {
  let tests = loadTests()
  tests = tests.filter((test) => test.id !== id)
  try {
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests))
    enforceStorageQuota()
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
    // Removed localStorage.removeItem here
  }
  return []
}

export function saveRun(newRun: Run): Run[] {
  const runs = loadRuns()
  runs.unshift(newRun) // Add new run to the beginning

  try {
    localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(runs))
    enforceStorageQuota()
  } catch (error) {
    console.error("Failed to save run to localStorage:", error)
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("Local storage quota exceeded when saving run.")
    }
  }
  return runs
}

export function deleteRun(id: string): Run[] {
  let runs = loadRuns()
  runs = runs.filter((run) => run.id !== id)
  try {
    localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(runs))
    enforceStorageQuota()
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

  // Backup current data before importing
  const currentApiKeys = localStorage.getItem(STORAGE_KEYS.API_KEYS)
  const currentTests = localStorage.getItem(STORAGE_KEYS.TESTS)
  const currentRuns = localStorage.getItem(STORAGE_KEYS.RUNS)

  if (currentApiKeys) localStorage.setItem(`${STORAGE_KEYS.API_KEYS}_backup_${Date.now()}`, currentApiKeys)
  if (currentTests) localStorage.setItem(`${STORAGE_KEYS.TESTS}_backup_${Date.now()}`, currentTests)
  if (currentRuns) localStorage.setItem(`${STORAGE_KEYS.RUNS}_backup_${Date.now()}`, currentRuns)

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

  enforceStorageQuota()

  return { apiKeys: loadApiKeys(), tests: loadTests(), runs: loadRuns() }
}

export function getStorageUsage(): number {
  return getLocalStorageSize()
}
