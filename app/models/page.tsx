"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Terminal, CheckCircle, XCircle, Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ModelTable } from "@/components/model-table"
import type { ModelConfig, StoredApiKeys } from "@/lib/types"
import { modelCapabilities } from "@/lib/model-info"
import { loadApiKeys, saveApiKeys } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"

// Provider API documentation URLs
const providerUrls: Record<string, string> = {
  openai: "https://platform.openai.com/docs/models",
  anthropic: "https://docs.anthropic.com/en/docs/models-overview",
  google: "https://ai.google.dev/gemini-api/docs/models/gemini",
  xai: "https://docs.x.ai/docs/models"
}

export default function ModelsPage() {
  const { toast } = useToast()
  const [apiKeys, setApiKeys] = useState<StoredApiKeys>({})
  const [selectedModels, setSelectedModels] = useState<ModelConfig[]>([])
  const [providerEnabled, setProviderEnabled] = useState<Record<string, boolean>>({})
  const [activeProvider, setActiveProvider] = useState<string>(Object.keys(modelCapabilities)[0])
  const [showDeprecated, setShowDeprecated] = useState<boolean>(false)

  useEffect(() => {
    const loadData = async () => {
      const storedApiKeys = await loadApiKeys()
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
    }
    
    loadData()
  }, [])

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: value }))
  }

  const handleProviderToggle = (provider: string, enabled: boolean) => {
    setProviderEnabled((prev) => ({ ...prev, [provider]: enabled }))
    // Note: Model selection is now handled on the Run page, not here.
    // This toggle primarily affects API key input enablement.
  }

  const handleSaveSettings = async () => {
    await saveApiKeys(apiKeys)
    toast({
      title: "Settings Saved",
      description: "Your API keys have been updated.",
    })
  }


  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4">
        <h2 className="text-lg font-semibold mb-4">LLM Providers</h2>
        <ScrollArea className="h-[calc(100vh-100px)]">
          <div className="space-y-2">
            {Object.entries(modelCapabilities).map(([providerName, models]) => {
              const isEnabled = providerEnabled[providerName] && apiKeys[providerName]
              const isActive = activeProvider === providerName
              
              return (
                <div
                  key={providerName}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setActiveProvider(providerName)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium capitalize">{providerName}</h3>
                    {isEnabled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      {Object.values(models).filter(cap => showDeprecated || !cap.deprecated).length} models
                      {!showDeprecated && Object.values(models).some(cap => cap.deprecated) && 
                        ` (${Object.values(models).filter(cap => cap.deprecated).length} deprecated)`}
                    </span>
                    <Badge variant={isEnabled ? "default" : "secondary"}>
                      {isEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 md:p-8 lg:p-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Model Management</h1>
            <Button onClick={handleSaveSettings}>Save API Keys</Button>
          </div>

          {/* Security Warning */}
          <Alert variant="destructive" className="mb-6">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Security Warning</AlertTitle>
            <AlertDescription>
              API keys entered here are stored in your browser's local storage. This is **not recommended for production
              environments** as it can expose your keys. For enhanced security, consider using server-side environment
              variables or a secure backend for API key management.
            </AlertDescription>
          </Alert>

          {/* Provider Configuration */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="capitalize">{activeProvider} Configuration</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(providerUrls[activeProvider], '_blank')}
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    API Docs
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`enable-${activeProvider}`}
                    checked={providerEnabled[activeProvider]}
                    onCheckedChange={(checked) => handleProviderToggle(activeProvider, checked)}
                  />
                  <Label htmlFor={`enable-${activeProvider}`}>Enable Provider</Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`${activeProvider}-api-key`}>{activeProvider} API Key</Label>
                  <Input
                    id={`${activeProvider}-api-key`}
                    type="password"
                    value={apiKeys[activeProvider] || ""}
                    onChange={(e) => handleApiKeyChange(activeProvider, e.target.value)}
                    placeholder={`Enter your ${activeProvider} API Key`}
                    disabled={!providerEnabled[activeProvider]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Models Table */}
          <ModelTable
            provider={activeProvider}
            models={modelCapabilities[activeProvider]}
            showDeprecated={showDeprecated}
            onShowDeprecatedChange={setShowDeprecated}
            apiDocsUrl={providerUrls[activeProvider]}
            showDisclaimer={true}
          />
        </div>
      </div>
    </div>
  )
}
