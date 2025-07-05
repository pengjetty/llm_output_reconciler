"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import type React from "react"
import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function ResultsPageContent() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [runs, setRuns] = useState<Run[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [selectedRun, setSelectedRun] = useState<Run | null>(null)
  const [storageUsage, setStorageUsage] = useState(0)

  const MAX_STORAGE_MB = 5 // Keep consistent with lib/storage.ts

  // Helper for deep comparison of arrays of objects by ID
  const areArraysEqualById = useCallback((arr1: any[], arr2: any[]) => {
    if (arr1.length !== arr2.length) return false
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i].id !== arr2[i].id) return false
    }
    return true
  }, [])

  // Function to reload all relevant state from localStorage and update conditionally
  const updateAllLocalData = useCallback(() => {
    const newRuns = loadRuns()
    const newTests = loadTests()
    const newStorageUsage = getStorageUsage()

    // Only update state if the data has genuinely changed (content comparison)
    setRuns((prevRuns) => (areArraysEqualById(prevRuns, newRuns) ? prevRuns : newRuns))
    setTests((prevTests) => (areArraysEqualById(prevTests, newTests) ? prevTests : newTests))
    setStorageUsage((prevUsage) => (prevUsage === newStorageUsage ? prevUsage : newStorageUsage))
  }, [areArraysEqualById]) // `areArraysEqualById` is stable, so `updateAllLocalData` is stable

  useEffect(() => {
    updateAllLocalData() // Load data on mount and whenever `updateAllLocalData` is re-created (which it isn't, due to useCallback)

    const runId = searchParams.get("runId")
    if (runId) {
      // Re-load runs here to ensure the latest data is used for selection
      // This is safe because updateAllLocalData is memoized and won't cause a loop.
      const currentRuns = loadRuns() // Get fresh data for selection
      const runToSelect = currentRuns.find((run) => run.id === runId)
      if (runToSelect) {
        setSelectedRun(runToSelect)
      } else {
        toast({
          title: "Run Not Found",
          description: "The requested run could not be found in history.",
          variant: "destructive",
        })
      }
    } else {
      // If no runId in URL, clear any previously selected run
      setSelectedRun(null)
    }
  }, [searchParams, updateAllLocalData, toast]) // `updateAllLocalData` is a dependency, but it's memoized

  const handleLoadRun = (run: Run) => {
    setSelectedRun(run)
  }

  const handleDeleteRun = (id: string) => {
    deleteRun(id) // Updates localStorage
    updateAllLocalData() // Re-sync state
    toast({
      title: "Run Deleted",
      description: "The selected run has been removed from history.",
    })
    if (selectedRun?.id === id) {
      setSelectedRun(null)
    }
  }

  const handleClearAllData = () => {
    clearAllData() // Updates localStorage
    updateAllLocalData() // Re-sync state
    setSelectedRun(null)
    toast({
      title: "All Data Cleared",
      description: "All application data (API keys, tests, runs) has been removed.",
    })
  }

  const handleExportData = () => {
    exportAllData()
    toast({
      title: "Data Exported",
      description: "Your comparison data has been downloaded as a JSON file.",
    })
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string)
          importAllData(importedData) // Updates localStorage
          updateAllLocalData() // Re-sync state
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
      />
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-auto">
        {selectedRun ? (
          <ResultDetail run={selectedRun} tests={tests} />
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
