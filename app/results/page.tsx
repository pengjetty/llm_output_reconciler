"use client"

import { ScrollArea } from "@/components/ui/scroll-area"

import { Label } from "@/components/ui/label"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
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
import { History, Download, Upload, Trash2, Eye } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { ResultDetail } from "@/components/result-detail"

export default function ResultsPage() {
  const { toast } = useToast()
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
    if (confirm("Are you sure you want to delete this run?")) {
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

  const getTestNameForRun = (run: Run) => {
    const test = tests.find((t) => t.id === run.testId)
    return test ? test.name : "Unknown Test"
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {" "}
      {/* Adjust height for navbar */}
      <aside className="w-64 bg-gray-100 dark:bg-gray-900 p-4 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <History className="mr-2 h-5 w-5" /> Run History
        </h2>
        <div className="mb-4">
          <Label className="text-sm">
            Storage Usage: {storageUsage.toFixed(2)} MB / {MAX_STORAGE_MB} MB
          </Label>
          <Progress value={(storageUsage / MAX_STORAGE_MB) * 100} className="w-full mt-1" />
          {storageUsage >= MAX_STORAGE_MB && (
            <p className="text-xs text-red-500 mt-1">
              Storage limit reached. Oldest data may be removed automatically.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 mb-4">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" /> Export All Data
          </Button>
          <label htmlFor="import-file" className="w-full">
            <Button asChild variant="outline" className="w-full cursor-pointer bg-transparent">
              <span>
                <Upload className="mr-2 h-4 w-4" /> Import Data
              </span>
            </Button>
            <input id="import-file" type="file" accept=".json" className="hidden" onChange={handleImportData} />
          </label>
          <Button variant="destructive" onClick={handleClearAllData}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear All Data
          </Button>
        </div>
        <ScrollArea className="flex-1 pr-2">
          <div className="grid gap-2">
            {runs.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No runs recorded yet.</p>
            ) : (
              runs.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-2 border rounded-md bg-white dark:bg-gray-800"
                >
                  <div className="flex-1 mr-2">
                    <span className="font-medium text-sm">{getTestNameForRun(run)}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(run.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleLoadRun(run)}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteRun(run.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </aside>
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
