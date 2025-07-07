"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { loadTests, loadApiKeys, saveRun } from "@/lib/storage"
import { modelCapabilities } from "@/lib/model-info"
import { runComparison } from "@/app/actions"
import { ModelTable } from "@/components/model-table"
import type { Test, ModelConfig, Run, RunResult, StoredApiKeys } from "@/lib/types"
import { useRouter } from "next/navigation"

function RunsPageContent() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tests, setTests] = useState<Test[]>([])
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)
  const [apiKeys, setApiKeys] = useState<StoredApiKeys>({})
  const [selectedModels, setSelectedModels] = useState<ModelConfig[]>([])
  const [activeProvider, setActiveProvider] = useState<string>(Object.keys(modelCapabilities)[0])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{
    completed: number
    total: number
    currentModel?: string
    status: string
  } | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setTests(await loadTests())
      setApiKeys(await loadApiKeys())
      
      // Check for testId in URL params (from re-run functionality)
      const testIdFromUrl = searchParams.get('testId')
      if (testIdFromUrl) {
        setSelectedTestId(testIdFromUrl)
        toast({
          title: "Test Pre-selected",
          description: "A test has been pre-selected from your run history. Select models and run the comparison.",
        })
      }
    }
    
    loadData()
  }, [searchParams, toast])

  const selectedTest = useMemo(() => {
    return tests.find((test) => test.id === selectedTestId)
  }, [selectedTestId, tests])

  const handleModelToggle = (provider: string, model: string, enabled: boolean) => {
    setSelectedModels((prev) => {
      if (enabled) {
        return [...prev, { provider, model }]
      } else {
        return prev.filter((m) => !(m.provider === provider && m.model === model))
      }
    })
  }

  const handleRunComparison = async () => {
    if (!selectedTest) {
      toast({
        title: "No Test Selected",
        description: "Please select a test to run.",
        variant: "destructive",
      })
      return
    }
    if (selectedModels.length === 0) {
      toast({
        title: "No Models Selected",
        description: "Please select at least one LLM model to run.",
        variant: "destructive",
      })
      return
    }

    // Check if API keys are available for selected models
    const missingKeys = selectedModels.filter((m) => !apiKeys[m.provider])
    if (missingKeys.length > 0) {
      toast({
        title: "Missing API Keys",
        description: `Please provide API keys for: ${missingKeys.map((m) => m.provider).join(", ")} in the Models page.`,
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setProgress({ completed: 0, total: selectedModels.length, status: "Initializing..." })

    try {
      const runResults: RunResult[] = await runComparison(
        selectedTest.prompt,
        selectedTest.imageInput,
        selectedTest.goldenCopy,
        selectedModels,
        apiKeys
      )

      const newRun: Run = {
        id: Date.now().toString(),
        testId: selectedTest.id,
        modelConfigs: selectedModels,
        results: runResults,
        timestamp: new Date().toISOString(),
        apiKeysUsed: Object.fromEntries(selectedModels.map((m) => [m.provider, true])), // Mark providers used
      }
      await saveRun(newRun)

      toast({
        title: "Comparison Complete",
        description: "LLM outputs have been compared and saved to history.",
      })
      
      // Refresh tests to ensure they're still available
      setTests(await loadTests())
      
      router.push(`/results?runId=${newRun.id}`) // Redirect to results page for the new run
    } catch (error: any) {
      console.error("Comparison failed:", error)
      toast({
        title: "Comparison Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setProgress(null)
      
      // Refresh tests after any operation
      setTests(await loadTests())
    }
  }

  return (
    <div className="container mx-auto p-6 md:p-8 lg:p-10">
      <h1 className="text-3xl font-bold mb-6">Run Management</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={setSelectedTestId} value={selectedTestId || ""}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a test" />
            </SelectTrigger>
            <SelectContent>
              {tests.length === 0 ? (
                <SelectItem disabled value="no-tests">
                  No tests available. Create one in the Tests page.
                </SelectItem>
              ) : (
                tests.map((test) => (
                  <SelectItem key={test.id} value={test.id}>
                    {test.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {selectedTest && (
            <div className="mt-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold mb-2">{selectedTest.name} Details:</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">Prompt: {selectedTest.prompt}</p>
              {selectedTest.imageInput && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Image:{" "}
                  {selectedTest.imageInput.length > 50
                    ? selectedTest.imageInput.substring(0, 50) + "..."
                    : selectedTest.imageInput}
                </p>
              )}
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                Golden Copy: {selectedTest.goldenCopy}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Models</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Provider Tabs */}
          <div className="flex space-x-1 mb-6 border-b">
            {Object.keys(modelCapabilities).map((providerName) => (
              <button
                key={providerName}
                onClick={() => setActiveProvider(providerName)}
                className={`px-4 py-2 text-sm font-medium capitalize rounded-t-lg transition-colors ${
                  activeProvider === providerName
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {providerName}
                {selectedModels.filter(m => m.provider === providerName).length > 0 && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
                    {selectedModels.filter(m => m.provider === providerName).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Selected Models Summary */}
          {selectedModels.length > 0 && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Selected Models ({selectedModels.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedModels.map((model) => (
                  <span
                    key={`${model.provider}-${model.model}`}
                    className="inline-flex items-center px-2 py-1 text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded"
                  >
                    {model.provider}/{model.model}
                    <button
                      onClick={() => handleModelToggle(model.provider, model.model, false)}
                      className="ml-1 text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Model Table for Active Provider */}
          <ModelTable
            provider={activeProvider}
            models={modelCapabilities[activeProvider]}
            selectedModels={selectedModels}
            onModelToggle={handleModelToggle}
            showSelection={true}
            hasApiKey={!!apiKeys[activeProvider]}
            showDisclaimer={false}
          />
        </CardContent>
      </Card>

      {/* Real-time Progress Display */}
      {progress && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Running Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress: {progress.completed} of {progress.total} models</span>
                  <span>{Math.round((progress.completed / progress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                  />
                </div>
              </div>
              
              {progress.currentModel && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Current:</span>
                  <span className="font-medium">{progress.currentModel}</span>
                  <span className="text-gray-500">- {progress.status}</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {selectedModels.map((model, index) => {
                  const isCompleted = index < progress.completed
                  const isCurrent = index === progress.completed && progress.completed < progress.total
                  
                  return (
                    <div
                      key={`${model.provider}-${model.model}`}
                      className={`px-2 py-1 rounded-md text-xs flex items-center space-x-1 ${
                        isCompleted 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : isCurrent
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {isCompleted && <span className="text-green-500">✓</span>}
                      {isCurrent && <Loader2 className="h-3 w-3 animate-spin" />}
                      <span className="truncate">{model.provider}/{model.model}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleRunComparison} disabled={loading || !selectedTest || selectedModels.length === 0}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Running Comparison..." : "Run Comparison"}
      </Button>
    </div>
  )
}

export default function RunsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <RunsPageContent />
    </Suspense>
  )
}
