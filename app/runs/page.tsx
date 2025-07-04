"use client"

import { useState, useEffect, useMemo } from "react"
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
import type { Test, ModelConfig, Run, RunResult, StoredApiKeys } from "@/lib/types"
import { useRouter } from "next/navigation"

export default function RunsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [tests, setTests] = useState<Test[]>([])
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)
  const [apiKeys, setApiKeys] = useState<StoredApiKeys>({})
  const [selectedModels, setSelectedModels] = useState<ModelConfig[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setTests(loadTests())
    setApiKeys(loadApiKeys())
  }, [])

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

    try {
      const runResults: RunResult[] = await runComparison(
        selectedTest.prompt,
        selectedTest.imageInput,
        selectedTest.goldenCopy,
        selectedModels,
        apiKeys, // Pass API keys to the server action
      )

      const newRun: Run = {
        id: Date.now().toString(),
        testId: selectedTest.id,
        modelConfigs: selectedModels,
        results: runResults,
        timestamp: new Date().toISOString(),
        apiKeysUsed: Object.fromEntries(selectedModels.map((m) => [m.provider, true])), // Mark providers used
      }
      saveRun(newRun)

      toast({
        title: "Comparison Complete",
        description: "LLM outputs have been compared and saved to history.",
      })
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
          <div className="grid gap-6">
            {Object.entries(modelCapabilities).map(([providerName, models]) => {
              const hasApiKey = !!apiKeys[providerName]
              return (
                <div key={providerName} className="grid gap-4 border-b pb-4 last:border-b-0">
                  <h3 className="text-lg font-semibold capitalize">{providerName}</h3>
                  {!hasApiKey && (
                    <p className="text-sm text-red-500">
                      API Key missing for {providerName}. Please add it in the Models page.
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(models).map(([modelName, capabilities]) => {
                      const isSelected = selectedModels.some(
                        (m) => m.provider === providerName && m.model === modelName,
                      )
                      return (
                        <div key={modelName} className="flex items-start space-x-2 p-3 border rounded-md">
                          <Switch
                            id={`${providerName}-${modelName}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleModelToggle(providerName, modelName, checked)}
                            disabled={!hasApiKey}
                          />
                          <div className="grid gap-1">
                            <Label htmlFor={`${providerName}-${modelName}`}>{modelName}</Label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Input: {capabilities.input.join(", ")}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Output: {capabilities.output.join(", ")}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Context: {capabilities.context}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Use Cases: {capabilities.useCases}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleRunComparison} disabled={loading || !selectedTest || selectedModels.length === 0}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Run Comparison
      </Button>
    </div>
  )
}
