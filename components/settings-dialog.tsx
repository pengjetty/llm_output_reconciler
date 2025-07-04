"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import type { ModelConfig } from "@/lib/types"
import { modelCapabilities } from "@/lib/model-info"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedModels: ModelConfig[]
  onSave: (models: ModelConfig[]) => void
}

export function SettingsDialog({ isOpen, onClose, selectedModels, onSave }: SettingsDialogProps) {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [currentSelectedModels, setCurrentSelectedModels] = useState<ModelConfig[]>([])
  const [providerEnabled, setProviderEnabled] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (isOpen) {
      // Load API keys from localStorage
      const storedApiKeys = JSON.parse(localStorage.getItem("apiKeys") || "{}")
      setApiKeys(storedApiKeys)

      // Initialize selected models and provider enabled states
      const initialSelected: ModelConfig[] = []
      const initialProviderEnabled: Record<string, boolean> = {}

      Object.entries(modelCapabilities).forEach(([providerName, models]) => {
        initialProviderEnabled[providerName] = false // Default to disabled

        Object.keys(models).forEach((modelName) => {
          const isSelected = selectedModels.some((m) => m.provider === providerName && m.model === modelName)
          if (isSelected) {
            initialSelected.push({ provider: providerName, model: modelName })
            initialProviderEnabled[providerName] = true // Enable provider if any model is selected
          }
        })
      })

      setCurrentSelectedModels(initialSelected)
      setProviderEnabled(initialProviderEnabled)
    }
  }, [isOpen, selectedModels])

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: value }))
  }

  const handleProviderToggle = (provider: string, enabled: boolean) => {
    setProviderEnabled((prev) => ({ ...prev, [provider]: enabled }))
    if (!enabled) {
      // If provider is disabled, unselect all its models
      setCurrentSelectedModels((prev) => prev.filter((m) => m.provider !== provider))
    }
  }

  const handleModelToggle = (provider: string, model: string, enabled: boolean) => {
    setCurrentSelectedModels((prev) => {
      if (enabled) {
        // If enabling a model, ensure its provider is also enabled
        setProviderEnabled((p) => ({ ...p, [provider]: true }))
        return [...prev, { provider, model }]
      } else {
        const newSelected = prev.filter((m) => !(m.provider === provider && m.model === model))
        // If no models are selected for a provider, disable the provider
        if (!newSelected.some((m) => m.provider === provider)) {
          setProviderEnabled((p) => ({ ...p, [provider]: false }))
        }
        return newSelected
      }
    })
  }

  const handleSave = () => {
    // Save API keys to localStorage
    localStorage.setItem("apiKeys", JSON.stringify(apiKeys))
    // Pass selected models back to parent
    onSave(currentSelectedModels)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your LLM API keys and select models for comparison.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="grid gap-6 py-4 flex-1 pr-4">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Security Warning</AlertTitle>
            <AlertDescription>
              API keys entered here are stored in your browser's local storage. This is **not recommended for production
              environments** as it can expose your keys. For enhanced security, consider using server-side environment
              variables or a secure backend for API key management.
            </AlertDescription>
          </Alert>

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
                <Label>Models</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(models).map(([modelName, capabilities]) => {
                    const isSelected = currentSelectedModels.some(
                      (m) => m.provider === providerName && m.model === modelName,
                    )
                    return (
                      <div key={modelName} className="flex items-start space-x-2 p-3 border rounded-md">
                        <Switch
                          id={`${providerName}-${modelName}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleModelToggle(providerName, modelName, checked)}
                          disabled={!providerEnabled[providerName]}
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
                          <p className="text-xs text-gray-500 dark:text-gray-400">Use Cases: {capabilities.useCases}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
        <DialogFooter>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
