"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ModelConfig, StoredApiKeys } from "@/lib/types"
import { modelCapabilities } from "@/lib/model-info"
import { loadApiKeys, saveApiKeys } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"

export default function ModelsPage() {
  const { toast } = useToast()
  const [apiKeys, setApiKeys] = useState<StoredApiKeys>({})
  const [selectedModels, setSelectedModels] = useState<ModelConfig[]>([])
  const [providerEnabled, setProviderEnabled] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const storedApiKeys = loadApiKeys()
    setApiKeys(storedApiKeys)

    // Initialize selected models and provider enabled states from a hypothetical global config or default
    // For now, we'll assume all models are initially unselected and providers disabled
    const initialSelected: ModelConfig[] = []
    const initialProviderEnabled: Record<string, boolean> = {}

    Object.entries(modelCapabilities).forEach(([providerName, models]) => {
      initialProviderEnabled[providerName] = false // Default to disabled

      // If you had a way to persist selected models, load them here
      // For this MVP, we'll just initialize based on API key presence for providers
      if (storedApiKeys[providerName]) {
        initialProviderEnabled[providerName] = true
      }
    })

    setSelectedModels(initialSelected) // This will be managed by the Run page
    setProviderEnabled(initialProviderEnabled)
  }, [])

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: value }))
  }

  const handleProviderToggle = (provider: string, enabled: boolean) => {
    setProviderEnabled((prev) => ({ ...prev, [provider]: enabled }))
    // Note: Model selection is now handled on the Run page, not here.
    // This toggle primarily affects API key input enablement.
  }

  const handleSaveSettings = () => {
    saveApiKeys(apiKeys)
    toast({
      title: "Settings Saved",
      description: "Your API keys have been updated.",
    })
  }

  return (
    <div className="container mx-auto p-6 md:p-8 lg:p-10">
      <h1 className="text-3xl font-bold mb-6">Model Management</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API Key Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-6">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Security Warning</AlertTitle>
            <AlertDescription>
              API keys entered here are stored in your browser's local storage. This is **not recommended for production
              environments** as it can expose your keys. For enhanced security, consider using server-side environment
              variables or a secure backend for API key management.
            </AlertDescription>
          </Alert>

          <ScrollArea className="h-[calc(100vh-300px)] pr-4">
            <div className="grid gap-6">
              {Object.entries(modelCapabilities).map(([providerName, models]) => (
                <div key={providerName} className="grid gap-4 border-b pb-4 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold capitalize">{providerName}</h3>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`enable-${providerName}`}
                        checked={providerEnabled[providerName]}
                        onCheckedChange={(checked) => handleProviderToggle(providerName, checked)}
                      />
                      <Label htmlFor={`enable-${providerName}`}>Enable Provider</Label>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`${providerName}-api-key`}>{providerName} API Key</Label>
                    <Input
                      id={`${providerName}-api-key`}
                      type="password"
                      value={apiKeys[providerName] || ""}
                      onChange={(e) => handleApiKeyChange(providerName, e.target.value)}
                      placeholder={`Enter your ${providerName} API Key`}
                      disabled={!providerEnabled[providerName]}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Models Available</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(models).map(([modelName, capabilities]) => (
                        <div key={modelName} className="flex items-start space-x-2 p-3 border rounded-md">
                          <div className="grid gap-1">
                            <Label>{modelName}</Label>
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
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <div className="p-6 border-t flex justify-end">
          <Button onClick={handleSaveSettings}>Save API Keys</Button>
        </div>
      </Card>
    </div>
  )
}
