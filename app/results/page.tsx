"use client"

import type React from "react"
import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Run, Test } from "@/lib/types"
import {
  loadRuns,
  loadTests,
  deleteRun,
  clearAllData,
  exportAllData,
  importAllData,
  getStorageUsage,
} from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { HistorySidebar } from "@/components/history-sidebar"
import { ResultDetail } from "@/components/result-detail"
import { useRouter } from "next/navigation"

// Loading skeleton component
function RunLoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Performance Summary Skeleton */}
        <div className="mb-6 p-4 border rounded-md bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
          <div className="flex items-center mb-3">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mr-2"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded-md">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls Skeleton */}
        <div className="mb-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse mb-3"></div>
          <div className="flex items-center space-x-6">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"></div>
          </div>
        </div>

        {/* Model Results Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-md p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ResultsPageContent() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [runs, setRuns] = useState<Run[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [selectedRun, setSelectedRun] = useState<Run | null>(null)
  const [isLoadingRun, setIsLoadingRun] = useState(false)
  const [storageUsage, setStorageUsage] = useState(0)
  // Best similarity score for the selected run (updated by ResultDetail)
  const [bestSimilarityScore, setBestSimilarityScore] = useState<number | null>(null)


  // Helper for deep comparison of arrays of objects by ID
  const areArraysEqualById = useCallback((arr1: any[], arr2: any[]) => {
    if (arr1.length !== arr2.length) return false
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i].id !== arr2[i].id) return false
    }
    return true
  }, [])

  // Function to reload all relevant state from IndexedDB and update conditionally
  const updateAllLocalData = useCallback(async () => {
    const newRuns = await loadRuns()
    const newTests = await loadTests()
    const newStorageUsage = await getStorageUsage()

    // Only update state if the data has genuinely changed (content comparison)
    setRuns((prevRuns) => (areArraysEqualById(prevRuns, newRuns) ? prevRuns : newRuns))
    setTests((prevTests) => (areArraysEqualById(prevTests, newTests) ? prevTests : newTests))
    setStorageUsage((prevUsage) => (prevUsage === newStorageUsage ? prevUsage : newStorageUsage))
  }, [areArraysEqualById]) // `areArraysEqualById` is stable, so `updateAllLocalData` is stable

  useEffect(() => {
    const loadDataAndSelectRun = async () => {
      await updateAllLocalData() // Load data on mount and whenever `updateAllLocalData` is re-created (which it isn't, due to useCallback)

      const runId = searchParams.get("runId")
      if (runId) {
        setIsLoadingRun(true)
        // Re-load runs here to ensure the latest data is used for selection
        // This is safe because updateAllLocalData is memoized and won't cause a loop.
        const currentRuns = await loadRuns() // Get fresh data for selection
        const runToSelect = currentRuns.find((run) => run.id === runId)
        if (runToSelect) {
          setSelectedRun(runToSelect)
          setBestSimilarityScore(null) // Reset best similarity when changing runs
          // Allow React to process the state change before clearing loading
          setTimeout(() => setIsLoadingRun(false), 100)
        } else {
          setIsLoadingRun(false)
          toast({
            title: "Run Not Found",
            description: "The requested run could not be found in history.",
            variant: "destructive",
          })
        }
      } else {
        // If no runId in URL, clear any previously selected run
        setSelectedRun(null)
        setBestSimilarityScore(null)
        setIsLoadingRun(false)
      }
    }
    
    loadDataAndSelectRun()
  }, [searchParams, updateAllLocalData, toast]) // `updateAllLocalData` is a dependency, but it's memoized

  const handleLoadRun = (run: Run) => {
    setIsLoadingRun(true)
    setSelectedRun(run)
    setBestSimilarityScore(null) // Reset best similarity when changing runs
    // Allow React to process the state change before clearing loading
    setTimeout(() => setIsLoadingRun(false), 100)
  }

  const handleDeleteRun = async (id: string) => {
    await deleteRun(id) // Updates IndexedDB
    await updateAllLocalData() // Re-sync state
    toast({
      title: "Run Deleted",
      description: "The selected run has been removed from history.",
    })
    if (selectedRun?.id === id) {
      setSelectedRun(null)
    }
  }

  const handleClearAllData = async () => {
    await clearAllData() // Updates IndexedDB
    await updateAllLocalData() // Re-sync state
    setSelectedRun(null)
    toast({
      title: "All Data Cleared",
      description: "All application data (API keys, tests, runs) has been removed.",
    })
  }

  const handleExportData = async () => {
    await exportAllData()
    toast({
      title: "Data Exported",
      description: "Your comparison data has been downloaded as a JSON file.",
    })
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string)
          await importAllData(importedData) // Updates IndexedDB
          await updateAllLocalData() // Re-sync state
          toast({
            title: "Data Imported",
            description: "Your comparison data has been successfully imported.",
          })
        } catch (error: any) {
          toast({
            title: "Import Failed",
            description: error.message || "Invalid JSON file or data format.",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    }
  }

  const handleRerunTest = (run: Run) => {
    const test = tests.find(t => t.id === run.testId)
    if (!test) {
      toast({
        title: "Test Not Found",
        description: "The associated test could not be found. It may have been deleted.",
        variant: "destructive",
      })
      return
    }

    // Navigate to runs page with the test pre-selected
    router.push(`/runs?testId=${test.id}`)
    toast({
      title: "Test Loaded",
      description: `Test "${test.name}" has been loaded in the runs page. You can now select models and run the comparison.`,
    })
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <HistorySidebar
        history={runs}
        tests={tests}
        onLoadRun={handleLoadRun}
        onRerunTest={handleRerunTest}
        onDeleteRun={handleDeleteRun}
        onClearHistory={handleClearAllData}
        onExportData={handleExportData}
        onImportData={handleImportData}
        storageUsage={storageUsage}
        selectedRunId={selectedRun?.id}
        bestSimilarityScore={bestSimilarityScore}
      />
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-auto">
        {isLoadingRun ? (
          <RunLoadingSkeleton />
        ) : selectedRun ? (
          <ResultDetail 
            run={selectedRun} 
            tests={tests}
            setBestSimilarityScore={setBestSimilarityScore}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Run Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 dark:text-gray-400">Select a run from the history to view its details.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <ResultsPageContent />
    </Suspense>
  )
}
