import type { StoredApiKeys, Test, Run } from "./types"

// Native IndexedDB implementation without external dependencies
const DB_NAME = 'llm-comparison-tool'
const DB_VERSION = 1
const STORES = {
  API_KEYS: 'apiKeys',
  TESTS: 'tests', 
  RUNS: 'runs'
}

// Legacy localStorage keys for migration
const STORAGE_KEYS = {
  API_KEYS: "llm_comparison_api_keys",
  TESTS: "llm_comparison_tests",
  RUNS: "llm_comparison_runs",
}

let db: IDBDatabase | null = null

// Initialize IndexedDB
async function initDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      // Auto-migrate from localStorage on first initialization
      migrateFromLocalStorage().then(() => resolve(db!))
    }
    
    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      
      // Create object stores
      if (!database.objectStoreNames.contains(STORES.API_KEYS)) {
        database.createObjectStore(STORES.API_KEYS)
      }
      
      if (!database.objectStoreNames.contains(STORES.TESTS)) {
        const testStore = database.createObjectStore(STORES.TESTS, { keyPath: 'id' })
        testStore.createIndex('by-created', 'createdAt')
      }
      
      if (!database.objectStoreNames.contains(STORES.RUNS)) {
        const runStore = database.createObjectStore(STORES.RUNS, { keyPath: 'id' })
        runStore.createIndex('by-timestamp', 'timestamp')
      }
    }
  })
}

// Helper function to promisify IndexedDB operations
function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// --- API Key Storage ---
export async function loadApiKeys(): Promise<StoredApiKeys> {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORES.API_KEYS], 'readonly')
    const store = transaction.objectStore(STORES.API_KEYS)
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      const keyRequest = store.getAllKeys()
      
      Promise.all([
        promisifyRequest(request),
        promisifyRequest(keyRequest)
      ]).then(([values, keys]) => {
        const apiKeys: StoredApiKeys = {}
        keys.forEach((key, index) => {
          apiKeys[key as string] = values[index]
        })
        resolve(apiKeys)
      }).catch(reject)
    })
  } catch (error) {
    console.error("Failed to load API keys from IndexedDB:", error)
    return {}
  }
}

export async function saveApiKeys(apiKeys: StoredApiKeys): Promise<void> {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORES.API_KEYS], 'readwrite')
    const store = transaction.objectStore(STORES.API_KEYS)
    
    // Clear existing keys
    await promisifyRequest(store.clear())
    
    // Save new keys
    for (const [provider, key] of Object.entries(apiKeys)) {
      await promisifyRequest(store.put(key, provider))
    }
  } catch (error) {
    console.error("Failed to save API keys to IndexedDB:", error)
    throw error
  }
}

// --- Test Storage ---
export async function loadTests(): Promise<Test[]> {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORES.TESTS], 'readonly')
    const store = transaction.objectStore(STORES.TESTS)
    const index = store.index('by-created')
    
    const tests = await promisifyRequest(index.getAll())
    return tests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error("Failed to load tests from IndexedDB:", error)
    return []
  }
}

export async function saveTest(newTest: Test): Promise<Test[]> {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORES.TESTS], 'readwrite')
    const store = transaction.objectStore(STORES.TESTS)
    
    await promisifyRequest(store.put(newTest))
    return await loadTests()
  } catch (error) {
    console.error("Failed to save test to IndexedDB:", error)
    throw error
  }
}

export async function deleteTest(id: string): Promise<Test[]> {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORES.TESTS], 'readwrite')
    const store = transaction.objectStore(STORES.TESTS)
    
    await promisifyRequest(store.delete(id))
    return await loadTests()
  } catch (error) {
    console.error("Failed to delete test from IndexedDB:", error)
    return await loadTests()
  }
}

// --- Run Storage ---
export async function loadRuns(): Promise<Run[]> {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORES.RUNS], 'readonly')
    const store = transaction.objectStore(STORES.RUNS)
    const index = store.index('by-timestamp')
    
    const runs = await promisifyRequest(index.getAll())
    return runs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  } catch (error) {
    console.error("Failed to load runs from IndexedDB:", error)
    return []
  }
}

export async function saveRun(newRun: Run): Promise<Run[]> {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORES.RUNS], 'readwrite')
    const store = transaction.objectStore(STORES.RUNS)
    
    await promisifyRequest(store.put(newRun))
    
    const runs = await loadRuns()
    const runCount = runs.length
    if (runCount >= 50) {
      console.warn(`Storage Info: You have ${runCount} runs stored. Consider cleaning up old runs if performance becomes an issue.`)
    }
    
    return runs
  } catch (error) {
    console.error("Failed to save run to IndexedDB:", error)
    throw new Error(`Failed to save run: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function deleteRun(id: string): Promise<Run[]> {
  try {
    const database = await initDB()
    const transaction = database.transaction([STORES.RUNS], 'readwrite')
    const store = transaction.objectStore(STORES.RUNS)
    
    await promisifyRequest(store.delete(id))
    return await loadRuns()
  } catch (error) {
    console.error("Failed to delete run from IndexedDB:", error)
    return await loadRuns()
  }
}

// --- Global Storage Management ---
export async function clearAllData(): Promise<void> {
  if (
    confirm("Are you sure you want to clear ALL application data (API keys, tests, and runs)? This cannot be undone.")
  ) {
    try {
      const database = await initDB()
      const transaction = database.transaction([STORES.API_KEYS, STORES.TESTS, STORES.RUNS], 'readwrite')
      
      await Promise.all([
        promisifyRequest(transaction.objectStore(STORES.API_KEYS).clear()),
        promisifyRequest(transaction.objectStore(STORES.TESTS).clear()),
        promisifyRequest(transaction.objectStore(STORES.RUNS).clear())
      ])
      
      console.log("All application data cleared.")
    } catch (error) {
      console.error("Failed to clear all data:", error)
      throw error
    }
  }
}

export async function exportAllData(): Promise<void> {
  try {
    const data = {
      apiKeys: await loadApiKeys(),
      tests: await loadTests(),
      runs: await loadRuns(),
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
  } catch (error) {
    console.error("Failed to export data:", error)
    throw error
  }
}

export async function importAllData(importedData: any): Promise<{ tests: Test[]; runs: Run[]; apiKeys: StoredApiKeys }> {
  if (typeof importedData !== "object" || !importedData.tests || !importedData.runs || !importedData.apiKeys) {
    throw new Error("Invalid import data format. Expected an object with 'apiKeys', 'tests', and 'runs'.")
  }

  try {
    // Import API Keys
    await saveApiKeys(importedData.apiKeys)

    // Import Tests (merge and deduplicate)
    const existingTests = await loadTests()
    const allTests = [...existingTests, ...importedData.tests]
    const uniqueTestsMap = new Map<string, Test>()
    allTests.forEach((test) => uniqueTestsMap.set(test.id, test))
    
    const database = await initDB()
    const testTransaction = database.transaction([STORES.TESTS], 'readwrite')
    const testStore = testTransaction.objectStore(STORES.TESTS)
    await promisifyRequest(testStore.clear())
    
    for (const test of uniqueTestsMap.values()) {
      await promisifyRequest(testStore.put(test))
    }

    // Import Runs (merge and deduplicate)
    const existingRuns = await loadRuns()
    const allRuns = [...existingRuns, ...importedData.runs]
    const uniqueRunsMap = new Map<string, Run>()
    allRuns.forEach((run) => uniqueRunsMap.set(run.id, run))
    
    const runTransaction = database.transaction([STORES.RUNS], 'readwrite')
    const runStore = runTransaction.objectStore(STORES.RUNS)
    await promisifyRequest(runStore.clear())
    
    for (const run of uniqueRunsMap.values()) {
      await promisifyRequest(runStore.put(run))
    }

    return { 
      apiKeys: await loadApiKeys(), 
      tests: await loadTests(), 
      runs: await loadRuns() 
    }
  } catch (error) {
    console.error("Failed to import data:", error)
    throw error
  }
}

export async function getStorageUsage(): Promise<number> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const used = estimate.usage || 0
      return used / (1024 * 1024) // Convert to MB
    }
    return 0
  } catch (error) {
    console.error("Failed to get storage usage:", error)
    return 0
  }
}

export async function getStorageDiagnostics(): Promise<{
  totalSize: number
  itemCounts: { [key: string]: number }
  itemSizes: { [key: string]: number }
}> {
  try {
    const [apiKeys, tests, runs] = await Promise.all([
      loadApiKeys(),
      loadTests(),
      loadRuns()
    ])
    
    return {
      totalSize: await getStorageUsage(),
      itemCounts: {
        tests: tests.length,
        runs: runs.length,
        apiKeys: Object.keys(apiKeys).length,
      },
      itemSizes: {
        tests: 0, // Not easily calculable in IndexedDB
        runs: 0,
        apiKeys: 0,
      },
    }
  } catch (error) {
    console.error("Failed to get storage diagnostics:", error)
    return {
      totalSize: 0,
      itemCounts: { tests: 0, runs: 0, apiKeys: 0 },
      itemSizes: { tests: 0, runs: 0, apiKeys: 0 },
    }
  }
}

export async function cleanupOldRuns(maxRuns: number = 50): Promise<{ removed: number; newCount: number }> {
  try {
    const runs = await loadRuns()
    if (runs.length <= maxRuns) {
      return { removed: 0, newCount: runs.length }
    }
    
    const runsToKeep = runs.slice(0, maxRuns)
    const runsToRemove = runs.slice(maxRuns)
    
    const database = await initDB()
    const transaction = database.transaction([STORES.RUNS], 'readwrite')
    const store = transaction.objectStore(STORES.RUNS)
    
    // Remove old runs
    for (const run of runsToRemove) {
      await promisifyRequest(store.delete(run.id))
    }
    
    return {
      removed: runsToRemove.length,
      newCount: runsToKeep.length,
    }
  } catch (error) {
    console.error("Failed to cleanup old runs:", error)
    throw error
  }
}

// --- Migration from localStorage ---
async function migrateFromLocalStorage(): Promise<{ migrated: boolean; counts: { tests: number; runs: number; apiKeys: number } }> {
  let migrated = false
  const counts = { tests: 0, runs: 0, apiKeys: 0 }
  
  try {
    // Check if there's data in localStorage to migrate
    const hasLocalStorageData = 
      localStorage.getItem(STORAGE_KEYS.API_KEYS) ||
      localStorage.getItem(STORAGE_KEYS.TESTS) ||
      localStorage.getItem(STORAGE_KEYS.RUNS)
    
    if (!hasLocalStorageData) {
      return { migrated: false, counts }
    }
    
    console.log("Migrating data from localStorage to IndexedDB...")
    
    // Migrate API Keys
    const apiKeysData = localStorage.getItem(STORAGE_KEYS.API_KEYS)
    if (apiKeysData) {
      const apiKeys = JSON.parse(apiKeysData)
      await saveApiKeys(apiKeys)
      counts.apiKeys = Object.keys(apiKeys).length
    }
    
    // Migrate Tests
    const testsData = localStorage.getItem(STORAGE_KEYS.TESTS)
    if (testsData) {
      const tests = JSON.parse(testsData)
      if (Array.isArray(tests)) {
        const database = await initDB()
        const transaction = database.transaction([STORES.TESTS], 'readwrite')
        const store = transaction.objectStore(STORES.TESTS)
        
        for (const test of tests) {
          await promisifyRequest(store.put(test))
        }
        counts.tests = tests.length
      }
    }
    
    // Migrate Runs
    const runsData = localStorage.getItem(STORAGE_KEYS.RUNS)
    if (runsData) {
      const runs = JSON.parse(runsData)
      if (Array.isArray(runs)) {
        const database = await initDB()
        const transaction = database.transaction([STORES.RUNS], 'readwrite')
        const store = transaction.objectStore(STORES.RUNS)
        
        for (const run of runs) {
          await promisifyRequest(store.put(run))
        }
        counts.runs = runs.length
      }
    }
    
    // Clear localStorage after successful migration
    localStorage.removeItem(STORAGE_KEYS.API_KEYS)
    localStorage.removeItem(STORAGE_KEYS.TESTS)
    localStorage.removeItem(STORAGE_KEYS.RUNS)
    
    migrated = true
    console.log(`Migration completed: ${counts.tests} tests, ${counts.runs} runs, ${counts.apiKeys} API keys`)
    
  } catch (error) {
    console.error("Migration failed:", error)
    // Don't throw error - continue with IndexedDB even if migration fails
  }
  
  return { migrated, counts }
}