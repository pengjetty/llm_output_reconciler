"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"
import type { ModelConfig } from "@/lib/types"

type SortField = 'name' | 'input' | 'output' | 'context' | 'pricing'
type SortDirection = 'asc' | 'desc'

interface ModelTableProps {
  provider: string
  models: Record<string, any>
  selectedModels?: ModelConfig[]
  onModelToggle?: (provider: string, model: string, enabled: boolean) => void
  showDeprecated?: boolean
  onShowDeprecatedChange?: (show: boolean) => void
  showSelection?: boolean
  hasApiKey?: boolean
  apiDocsUrl?: string
  showDisclaimer?: boolean
  title?: string
}

export function ModelTable({
  provider,
  models,
  selectedModels = [],
  onModelToggle,
  showDeprecated = false,
  onShowDeprecatedChange,
  showSelection = false,
  hasApiKey = true,
  apiDocsUrl,
  showDisclaimer = true,
  title
}: ModelTableProps) {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortedModels = () => {
    const modelEntries = Object.entries(models)
      .filter(([_, capabilities]) => showDeprecated || !capabilities.deprecated)
    
    return modelEntries.sort(([nameA, capsA], [nameB, capsB]) => {
      let compareValue = 0
      
      switch (sortField) {
        case 'name':
          compareValue = nameA.localeCompare(nameB)
          break
        case 'input':
          compareValue = capsA.input.join(',').localeCompare(capsB.input.join(','))
          break
        case 'output':
          compareValue = capsA.output.join(',').localeCompare(capsB.output.join(','))
          break
        case 'context':
          // Convert context to numeric value for proper sorting
          const getContextValue = (context: string) => {
            const num = parseInt(context.replace(/[^0-9]/g, ''))
            if (context.includes('M')) return num * 1000000
            if (context.includes('k') || context.includes('K')) return num * 1000
            return num
          }
          compareValue = getContextValue(capsA.context) - getContextValue(capsB.context)
          break
        case 'pricing':
          // Sort by input pricing, fallback to 0 if no pricing
          const priceA = capsA.pricing?.inputPerMillion || 0
          const priceB = capsB.pricing?.inputPerMillion || 0
          compareValue = priceA - priceB
          break
      }
      
      return sortDirection === 'asc' ? compareValue : -compareValue
    })
  }

  const SortableTableHead = ({ field, children }: { field: SortField, children: React.ReactNode }) => {
    const isActive = sortField === field
    const Icon = isActive ? (sortDirection === 'asc' ? ChevronUp : ChevronDown) : ChevronUp
    
    return (
      <TableHead 
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 select-none"
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          {children}
          <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
        </div>
      </TableHead>
    )
  }

  const deprecatedCount = Object.values(models).filter(cap => cap.deprecated).length
  const displayTitle = title || `${provider.charAt(0).toUpperCase() + provider.slice(1)} Models`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{displayTitle}</span>
          <div className="flex items-center gap-4">
            {onShowDeprecatedChange && deprecatedCount > 0 && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-deprecated"
                  checked={showDeprecated}
                  onCheckedChange={onShowDeprecatedChange}
                />
                <Label htmlFor="show-deprecated" className="text-sm font-normal">
                  Show deprecated models
                </Label>
              </div>
            )}
            {apiDocsUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(apiDocsUrl, '_blank')}
              >
                <Globe className="h-4 w-4 mr-1" />
                API Docs
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showDisclaimer && (
          <Alert className="mb-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Model Information Disclaimer</AlertTitle>
            <AlertDescription>
              The model specifications, pricing, and availability shown below may be outdated as providers frequently update their offerings. 
              Please verify current information on the official API documentation before making decisions.
            </AlertDescription>
          </Alert>
        )}
        
        {!hasApiKey && showSelection && (
          <Alert variant="destructive" className="mb-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>API Key Required</AlertTitle>
            <AlertDescription>
              API Key missing for {provider}. Please add it in the Models page to enable model selection.
            </AlertDescription>
          </Alert>
        )}
        
        <Table>
          <TableHeader>
            <TableRow>
              {showSelection && <TableHead>Select</TableHead>}
              <SortableTableHead field="name">Model Name</SortableTableHead>
              <SortableTableHead field="input">Input Types</SortableTableHead>
              <SortableTableHead field="output">Output Types</SortableTableHead>
              <SortableTableHead field="context">Context Window</SortableTableHead>
              <SortableTableHead field="pricing">Pricing ($/M tokens)</SortableTableHead>
              <TableHead>Use Cases</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getSortedModels().map(([modelName, capabilities]) => {
              const isSelected = selectedModels.some(
                (m) => m.provider === provider && m.model === modelName
              )
              
              return (
                <TableRow key={modelName} className={capabilities.deprecated ? 'opacity-60' : ''}>
                  {showSelection && (
                    <TableCell>
                      <Switch
                        id={`${provider}-${modelName}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => onModelToggle?.(provider, modelName, checked)}
                        disabled={!hasApiKey}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {modelName}
                      {capabilities.deprecated && (
                        <Badge variant="destructive" className="text-xs">
                          Deprecated
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {capabilities.input.map((input: string) => (
                        <Badge key={input} variant="outline">
                          {input}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {capabilities.output.map((output: string) => (
                        <Badge key={output} variant="outline">
                          {output}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{capabilities.context}</Badge>
                  </TableCell>
                  <TableCell>
                    {capabilities.pricing ? (
                      <div className="text-sm">
                        <div className="font-medium">In: ${capabilities.pricing.inputPerMillion}</div>
                        <div className="text-gray-500 dark:text-gray-400">Out: ${capabilities.pricing.outputPerMillion}</div>
                      </div>
                    ) : (
                      <Badge variant="outline">N/A</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {capabilities.useCases}
                    </p>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}