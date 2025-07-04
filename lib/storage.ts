import type { StoredApiKeys, Test, Run } from "./types"

const STORAGE_KEYS = {
  API_KEYS: "llm_comparison_api_keys",
  TESTS: "llm_comparison_tests",
  RUNS: "llm_comparison_runs",
  BACKUPS: "llm_comparison_backups",
  STORAGE_HEALTH: "llm_comparison_storage_health",
}

interface StorageBackup {
  id: string
  timestamp: string
  type: 'manual' | 'auto' | 'pre-import' | 'emergency'
  data: {
    apiKeys: StoredApiKeys
    tests: Test[]
    runs: Run[]
  }
  size: number
}

interface StorageHealth {
  lastBackup: string | null
  backupCount: number
  totalSize: number
  lastCleanup: string | null
  errors: string[]
  warnings: string[]
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
    // Removed localStorage.removeItem here
    return {}
  }
}

export function saveApiKeys(apiKeys: StoredApiKeys): void {
  try {
    localStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(apiKeys))
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
  
  // Create auto backup before major changes
  if (existingIndex === -1 && tests.length % 5 === 0) {
    try {
      createBackup('auto')
    } catch (error) {
      console.warn('Failed to create auto backup:', error)
    }
  }
  
  if (existingIndex > -1) {
    tests[existingIndex] = newTest // Update existing test
  } else {
    tests.unshift(newTest) // Add new test to the beginning
  }

  try {
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests))
    updateStorageHealth()
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
  
  // Create auto backup before major changes
  if (runs.length % 10 === 0) {
    try {
      createBackup('auto')
    } catch (error) {
      console.warn('Failed to create auto backup:', error)
    }
  }
  
  runs.unshift(newRun) // Add new run to the beginning

  try {
    localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(runs))
    updateStorageHealth()
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

  return { apiKeys: loadApiKeys(), tests: loadTests(), runs: loadRuns() }
}

export function getStorageUsage(): number {
  return getLocalStorageSize()
}

// --- Enhanced Storage Management ---

export function createBackup(type: 'manual' | 'auto' | 'pre-import' | 'emergency' = 'manual'): StorageBackup {
  const backup: StorageBackup = {
    id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    type,
    data: {
      apiKeys: loadApiKeys(),
      tests: loadTests(),
      runs: loadRuns(),
    },
    size: 0,
  }
  
  const serialized = JSON.stringify(backup)
  backup.size = serialized.length * 2 // Approximate bytes
  
  try {
    const backups = loadBackups()
    backups.unshift(backup)
    
    // Keep only last 5 backups to manage storage
    const trimmedBackups = backups.slice(0, 5)
    localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(trimmedBackups))
    
    updateStorageHealth()
    return backup
  } catch (error) {
    console.error('Failed to create backup:', error)
    throw new Error('Failed to create backup')
  }
}

export function loadBackups(): StorageBackup[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BACKUPS)
    if (data) {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      }
    }
  } catch (error) {
    console.error('Failed to load backups:', error)
  }
  return []
}

export function restoreBackup(backupId: string): { success: boolean; error?: string } {
  try {
    const backups = loadBackups()
    const backup = backups.find(b => b.id === backupId)
    
    if (!backup) {
      return { success: false, error: 'Backup not found' }
    }
    
    // Create a pre-restore backup
    createBackup('emergency')
    
    // Restore data
    saveApiKeys(backup.data.apiKeys)
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(backup.data.tests))
    localStorage.setItem(STORAGE_KEYS.RUNS, JSON.stringify(backup.data.runs))
    
    updateStorageHealth()
    return { success: true }
  } catch (error) {
    console.error('Failed to restore backup:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export function getStorageHealth(): StorageHealth {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STORAGE_HEALTH)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Failed to load storage health:', error)
  }
  
  return {
    lastBackup: null,
    backupCount: 0,
    totalSize: 0,
    lastCleanup: null,
    errors: [],
    warnings: [],
  }
}

export function updateStorageHealth(): void {
  const health = getStorageHealth()
  const backups = loadBackups()
  
  health.lastBackup = backups.length > 0 ? backups[0].timestamp : null
  health.backupCount = backups.length
  health.totalSize = getLocalStorageSize()
  health.errors = []
  health.warnings = []
  
  // Check for warnings
  if (backups.length === 0) {
    health.warnings.push('No backups available')
  }
  
  if (health.lastBackup) {
    const lastBackupDate = new Date(health.lastBackup)
    const daysSinceBackup = (Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceBackup > 7) {
      health.warnings.push('No recent backups (>7 days)')
    }
  }
  
  try {
    localStorage.setItem(STORAGE_KEYS.STORAGE_HEALTH, JSON.stringify(health))
  } catch (error) {
    console.error('Failed to update storage health:', error)
  }
}

export function performStorageCleanup(): { itemsRemoved: number; spaceFreed: number } {
  const initialSize = getLocalStorageSize()
  let itemsRemoved = 0
  
  try {
    // Remove old backups (keep only 3 most recent)
    const backups = loadBackups()
    if (backups.length > 3) {
      const trimmedBackups = backups.slice(0, 3)
      localStorage.setItem(STORAGE_KEYS.BACKUPS, JSON.stringify(trimmedBackups))
      itemsRemoved += backups.length - 3
    }
    
    // Update health after cleanup
    const health = getStorageHealth()
    health.lastCleanup = new Date().toISOString()
    localStorage.setItem(STORAGE_KEYS.STORAGE_HEALTH, JSON.stringify(health))
    
    const spaceFreed = initialSize - getLocalStorageSize()
    return { itemsRemoved, spaceFreed }
  } catch (error) {
    console.error('Failed to perform storage cleanup:', error)
    return { itemsRemoved: 0, spaceFreed: 0 }
  }
}

export function getStorageDiagnostics(): {
  totalSize: number
  itemCounts: { [key: string]: number }
  health: StorageHealth
} {
  const health = getStorageHealth()
  
  return {
    totalSize: getLocalStorageSize(),
    itemCounts: {
      tests: loadTests().length,
      runs: loadRuns().length,
      backups: loadBackups().length,
      apiKeys: Object.keys(loadApiKeys()).length,
    },
    health,
  }
}
