"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Trophy, Clock, Target, BarChart3, Copy, Check } from "lucide-react"
import type { Run, Test } from "@/lib/types"
import { getDiffSummary, calculateDiff, calculateLineDiff, calculateJsonDiff } from "@/lib/diff"

// Helper function to check if a string is valid JSON
function isValidJson(str: string): boolean {
  try {
    JSON.parse(str.trim())
    return true
  } catch {
    try {
      // Try with markdown formatting removed
      const extracted = str.trim()
        .replace(/^```(?:json|javascript|js)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim()
      if (extracted.startsWith('`') && extracted.endsWith('`')) {
        JSON.parse(extracted.slice(1, -1).trim())
      } else {
        JSON.parse(extracted)
      }
      return true
    } catch {
      return false
    }
  }
}
import { useState, useMemo, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

interface ResultDetailProps {
  run: Run
  tests: Test[]
  setBestSimilarityScore: (score: number | null) => void
}

export function ResultDetail({ 
  run, 
  tests, 
  setBestSimilarityScore 
}: ResultDetailProps) {
  const { toast } = useToast()
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({})
  // Local diff controls - apply to all model results
  const [showDiffHighlight, setShowDiffHighlight] = useState<boolean>(true)
  const [diffMode, setDiffMode] = useState<'word' | 'line' | 'json'>('word')
  const [viewMode, setViewMode] = useState<'raw' | 'normalized'>('raw')
  const associatedTest = tests.find((test) => test.id === run.testId)
  
  // Check if golden copy is valid JSON - if so, force JSON diff mode
  const isGoldenCopyJson = useMemo(() => {
    return associatedTest ? isValidJson(associatedTest.goldenCopy) : false
  }, [associatedTest?.goldenCopy])
  
  // Force JSON mode if golden copy is JSON, otherwise use user preference
  const effectiveDiffMode = isGoldenCopyJson ? 'json' : diffMode
  
  // Force normalized view if golden copy is JSON, otherwise use user preference
  const effectiveViewMode = isGoldenCopyJson ? 'normalized' : viewMode

  const copyToClipboard = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItems(prev => ({ ...prev, [itemId]: true }))
      toast({
        title: "Copied to clipboard",
        description: "Content has been copied to your clipboard.",
      })
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [itemId]: false }))
      }, 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy content to clipboard.",
        variant: "destructive",
      })
    }
  }

  // Pre-calculate all diff results for maximum performance
  const preCalculatedDiffs = useMemo(() => {
    const diffs = new Map<string, any>()
    
    run.results.forEach(result => {
      if (result.error) return
      
      const resultKey = `${result.provider}-${result.model}`
      const modes = ['raw', 'normalized']
      const diffTypes = ['word', 'line', 'json']
      
      modes.forEach(view => {
        diffTypes.forEach(diffType => {
          const cacheKey = `${resultKey}-${view}-${diffType}`
          
          // Get content based on view mode
          const goldenContent = view === 'normalized' && result.normalizedGolden
            ? result.normalizedGolden
            : associatedTest?.goldenCopy || ''
          
          const outputContent = view === 'normalized' && result.normalizedOutput
            ? result.normalizedOutput
            : result.output
          
          // Calculate diff based on selected type
          let diffResult
          switch (diffType) {
            case 'line':
              diffResult = calculateLineDiff(goldenContent, outputContent)
              break
            case 'json':
              diffResult = calculateJsonDiff(goldenContent, outputContent)
              break
            default:
              diffResult = calculateDiff(goldenContent, outputContent)
          }
          
          diffs.set(cacheKey, diffResult)
        })
      })
    })
    
    return diffs
  }, [run.results, associatedTest?.goldenCopy])
  
  // Fast lookup for diff results - no calculation needed (now uses global settings)
  const getDiffResult = useCallback((result: any, resultKey: string) => {
    const view = effectiveViewMode
    const diffType = effectiveDiffMode
    const cacheKey = `${resultKey}-${view}-${diffType}`
    return preCalculatedDiffs.get(cacheKey)
  }, [preCalculatedDiffs, effectiveViewMode, effectiveDiffMode])

  const getDisplayContent = useCallback((result: any, resultKey: string) => {
    const view = effectiveViewMode
    const highlight = showDiffHighlight
    
    if (!highlight) {
      // No highlighting - show plain content based on view mode
      return view === 'normalized' && result.normalizedOutput 
        ? result.normalizedOutput 
        : result.output
    }
    
    // With highlighting - use pre-calculated diff (no calculation needed!)
    const diffResult = getDiffResult(result, resultKey)
    return diffResult?.diffHtml || result.output
  }, [effectiveViewMode, showDiffHighlight, getDiffResult])

  const getContentForCopy = useCallback((result: any, resultKey: string) => {
    const view = effectiveViewMode
    return view === 'normalized' && result.normalizedOutput 
      ? result.normalizedOutput 
      : result.output
  }, [effectiveViewMode])

  const getDynamicSimilarity = useCallback((result: any, resultKey: string) => {
    const diffResult = getDiffResult(result, resultKey)
    return diffResult?.similarity || 0
  }, [getDiffResult])

  const getDynamicDiffSummary = useCallback((result: any, resultKey: string) => {
    const dynamicDiff = getDiffResult(result, resultKey)
    if (!dynamicDiff) return "No diff available"
    
    // Handle different diff result types
    if ('lineCount' in dynamicDiff) {
      // LineDiffResult
      const changes = dynamicDiff.changes
      const similarityPercent = Math.round(dynamicDiff.similarity * 100)
      const total = changes.added + changes.removed + changes.modified
      if (total === 0) return "Perfect match"
      
      const parts = []
      if (changes.added > 0) parts.push(`${changes.added} added`)
      if (changes.removed > 0) parts.push(`${changes.removed} removed`)
      if (changes.modified > 0) parts.push(`${changes.modified} modified`)
      
      return `${parts.join(', ')} (${similarityPercent}% similar)`
    } else if ('isValidJson' in dynamicDiff) {
      // JsonDiffResult
      const changes = dynamicDiff.changes
      const similarityPercent = Math.round(dynamicDiff.similarity * 100)
      const total = changes.additions + changes.removals + changes.valueChanges
      if (total === 0) return "Perfect match"
      
      const parts = []
      if (changes.additions > 0) parts.push(`${changes.additions} added`)
      if (changes.removals > 0) parts.push(`${changes.removals} removed`)
      if (changes.valueChanges > 0) parts.push(`${changes.valueChanges} modified`)
      
      return `${parts.join(', ')} (${similarityPercent}% similar)`
    } else {
      // DiffResult
      return getDiffSummary(dynamicDiff)
    }
  }, [getDiffResult])

  if (!associatedTest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Run Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error: Associated test not found for this run.</p>
        </CardContent>
      </Card>
    )
  }

  const getDiffColor = (score: number) => {
    if (score === 0) return "text-green-600"
    if (score < 0.2) return "text-lime-600"
    if (score < 0.5) return "text-yellow-600"
    return "text-red-600"
  }

  const getBadgeVariant = (rank: number) => {
    if (rank === 1) return "default" // Gold
    if (rank === 2) return "secondary" // Silver
    if (rank === 3) return "outline" // Bronze
    return "outline"
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />
    if (rank === 2) return <Trophy className="h-4 w-4 text-gray-400" />
    if (rank === 3) return <Trophy className="h-4 w-4 text-amber-600" />
    return <BarChart3 className="h-4 w-4" />
  }

  // Dynamic sorting based on current view/diff settings
  const sortedResults = useMemo(() => {
    const sorted = [...run.results]
      .filter(result => !result.error)
      .sort((a, b) => {
        const aKey = `${a.provider}-${a.model}`
        const bKey = `${b.provider}-${b.model}`
        
        // Get dynamic similarity scores
        const aSimilarity = getDynamicSimilarity(a, aKey)
        const bSimilarity = getDynamicSimilarity(b, bKey)
        
        // Primary sort: similarity (higher is better)
        if (aSimilarity !== bSimilarity) {
          return bSimilarity - aSimilarity
        }
        
        // Secondary sort: semantic similarity (higher is better)
        return (b.semanticSimilarity || 0) - (a.semanticSimilarity || 0)
      })
    
    // Update the best similarity score for the sidebar
    if (sorted.length > 0) {
      const bestResult = sorted[0]
      const bestKey = `${bestResult.provider}-${bestResult.model}`
      const bestSimilarity = getDynamicSimilarity(bestResult, bestKey)
      setBestSimilarityScore(bestSimilarity)
    } else {
      setBestSimilarityScore(null)
    }
    
    return sorted
  }, [run.results, effectiveViewMode, effectiveDiffMode, getDynamicSimilarity, setBestSimilarityScore])

  const errorResults = run.results.filter(result => result.error)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Details: {associatedTest.name}</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">Run on: {new Date(run.timestamp).toLocaleString()}</p>
      </CardHeader>
      <CardContent>
        {/* Performance Summary */}
        {sortedResults.length > 0 && (
          <div className="mb-6 p-4 border rounded-md bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
            <h3 className="font-semibold text-lg mb-3 flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
              Performance Ranking
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedResults.slice(0, 3).map((result, index) => {
                const resultKey = `${result.provider}-${result.model}`
                const dynamicSimilarity = getDynamicSimilarity(result, resultKey)
                return (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded-md">
                    {getRankIcon(index + 1)}
                    <span className="text-sm font-medium">{result.provider}/{result.model}</span>
                    <Badge variant={getBadgeVariant(index + 1)} className="text-xs">
                      #{index + 1} ({Math.round(dynamicSimilarity * 100)}%)
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <h3 className="font-semibold text-lg mb-4">Model Outputs ({sortedResults.length + errorResults.length} total):</h3>
        
        {/* Global Diff Controls */}
        <div className="mb-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
          <h4 className="font-semibold mb-3 text-sm text-gray-700 dark:text-gray-300">Comparison Settings (applies to all models):</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <label htmlFor="global-diff-toggle" className="text-sm font-medium">
                  Show Diff Highlighting
                </label>
                <Switch
                  id="global-diff-toggle"
                  checked={showDiffHighlight}
                  onCheckedChange={setShowDiffHighlight}
                />
              </div>
              <div className="flex items-center space-x-2 border-l pl-6">
                <label className="text-sm font-medium">Diff Type:</label>
                {isGoldenCopyJson ? (
                  <div className="flex items-center space-x-2">
                    <select
                      value="json"
                      disabled
                      className="text-sm border rounded px-3 py-1.5 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    >
                      <option value="json">JSON-aware (Auto)</option>
                    </select>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Auto-selected</span>
                  </div>
                ) : (
                  <select
                    value={diffMode}
                    onChange={(e) => setDiffMode(e.target.value as 'word' | 'line' | 'json')}
                    className="text-sm border rounded px-3 py-1.5 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  >
                    <option value="word">Word-level</option>
                    <option value="line">Line-based</option>
                    <option value="json">JSON-aware</option>
                  </select>
                )}
              </div>
              <div className="flex items-center space-x-2 border-l pl-6">
                <label className="text-sm font-medium">Content View:</label>
                {isGoldenCopyJson ? (
                  <div className="flex items-center space-x-2">
                    <select
                      value="normalized"
                      disabled
                      className="text-sm border rounded px-3 py-1.5 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    >
                      <option value="normalized">Normalized JSON (Auto)</option>
                    </select>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Auto-selected</span>
                  </div>
                ) : (
                  <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value as 'raw' | 'normalized')}
                    className="text-sm border rounded px-3 py-1.5 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  >
                    <option value="raw">Raw Output</option>
                    <option value="normalized">Normalized JSON</option>
                  </select>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {isGoldenCopyJson 
                ? "JSON diff and normalized view auto-selected because golden copy is valid JSON"
                : "Changes affect ranking and all model comparisons"
              }
            </div>
          </div>
        </div>
        
        {/* Successful Results */}
        <Accordion type="single" collapsible className="w-full">
          {sortedResults.map((result, index) => {
            const rank = index + 1
            const resultKey = `${result.provider}-${result.model}`
            const dynamicSimilarity = getDynamicSimilarity(result, resultKey)
            const diffSummary = getDynamicDiffSummary(result, resultKey)

            return (
              <AccordionItem key={index} value={`item-${index}`} className={rank <= 3 ? "border-l-4 border-l-green-500" : ""}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex justify-between items-center w-full pr-4">
                    <div className="flex items-center space-x-3">
                      {getRankIcon(rank)}
                      <span className="font-medium">
                        {result.provider} / {result.model}
                      </span>
                      {rank <= 3 && (
                        <Badge variant={getBadgeVariant(rank)} className="text-xs">
                          #{rank}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      {result.executionTime && (
                        <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{result.executionTime}ms</span>
                        </div>
                      )}
                      <span className={`font-semibold ${getDiffColor(1 - dynamicSimilarity)}`}>
                        {diffSummary}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {/* Performance Metrics */}
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Performance Metrics
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block">Similarity</label>
                        <div className="flex items-center space-x-2">
                          <Progress value={dynamicSimilarity * 100} className="flex-1 h-2" />
                          <span className="text-sm font-medium">{Math.round(dynamicSimilarity * 100)}%</span>
                        </div>
                      </div>
                      {result.semanticSimilarity && (
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400 block">Semantic</label>
                          <div className="flex items-center space-x-2">
                            <Progress value={result.semanticSimilarity * 100} className="flex-1 h-2" />
                            <span className="text-sm font-medium">{Math.round(result.semanticSimilarity * 100)}%</span>
                          </div>
                        </div>
                      )}
                      {result.executionTime && (
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400 block flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            Response Time
                          </label>
                          <span className="text-sm font-medium">{result.executionTime}ms</span>
                        </div>
                      )}
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block flex items-center">
                          <Target className="mr-1 h-3 w-3" />
                          Changes
                        </label>
                        <span className="text-sm font-medium">
                          {useMemo(() => {
                            const dynamicDiff = getDiffResult(result, resultKey)
                            if (!dynamicDiff) return "No diff"
                            if ('added' in dynamicDiff.changes) {
                              return `+${dynamicDiff.changes.added} -${dynamicDiff.changes.removed} ~${dynamicDiff.changes.modified}`
                            } else {
                              return `+${dynamicDiff.changes.additions} -${dynamicDiff.changes.removals} ~${dynamicDiff.changes.valueChanges}`
                            }
                          }, [getDiffResult, result, resultKey])}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* JSON Status Indicator */}
                  <div className="mb-4 flex justify-end">
                    <div className="flex items-center space-x-1">
                      {result.isValidJson ? (
                        result.isValidJson.output ? (
                          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full flex items-center">
                            ✓ Valid JSON
                          </span>
                        ) : (
                          <span 
                            className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full cursor-help"
                            title={`JSON Parse Error: ${result.parseErrors?.output || 'Invalid JSON syntax. Check for missing quotes, trailing commas, or unescaped characters.'}`}
                          >
                            ✗ Invalid JSON
                          </span>
                        )
                      ) : (
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                          No JSON Data
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Side-by-side Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Golden Copy</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(
                            effectiveViewMode === 'normalized' && result.normalizedGolden
                              ? result.normalizedGolden
                              : associatedTest?.goldenCopy || '', 
                            `golden-${result.provider}-${result.model}`
                          )}
                        >
                          {copiedItems[`golden-${result.provider}-${result.model}`] ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <pre className="whitespace-pre-wrap text-sm p-3 bg-gray-100 dark:bg-gray-700 rounded-md max-h-84 overflow-y-auto">
                        {effectiveViewMode === 'normalized' && result.normalizedGolden
                          ? result.normalizedGolden
                          : associatedTest?.goldenCopy || ''}
                      </pre>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Model Output</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(getContentForCopy(result, `${result.provider}-${result.model}`), `output-${result.provider}-${result.model}`)}
                        >
                          {copiedItems[`output-${result.provider}-${result.model}`] ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="text-sm p-3 bg-gray-100 dark:bg-gray-700 rounded-md max-h-84 overflow-y-auto json-diff-container">
                        {showDiffHighlight ? (
                          <pre className="whitespace-pre-wrap font-mono">
                            <div dangerouslySetInnerHTML={{ __html: getDisplayContent(result, `${result.provider}-${result.model}`) }} />
                          </pre>
                        ) : (
                          <pre className="whitespace-pre-wrap font-mono">
                            {getContentForCopy(result, `${result.provider}-${result.model}`)}
                          </pre>
                        )}
                        
                        {/* JSON Parse Error Details */}
                        {result.parseErrors?.output && (
                          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-r-md">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <span className="text-yellow-400">⚠️</span>
                              </div>
                              <div className="ml-3">
                                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                  JSON Parsing Failed
                                </h4>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                  <strong>Error:</strong> {result.parseErrors.output}
                                </p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                                  <strong>Common fixes:</strong> Check for missing quotes around strings, 
                                  remove trailing commas, escape backslashes, or ensure proper nesting of objects/arrays.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>

        {/* Error Results */}
        {errorResults.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-4 text-red-600">Failed Models ({errorResults.length}):</h3>
            <div className="space-y-2">
              {errorResults.map((result, index) => (
                <div key={index} className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-red-800 dark:text-red-200">
                      {result.provider} / {result.model}
                    </span>
                    <Badge variant="destructive">Error</Badge>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-2">{result.output}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Input Section */}
        <h3 className="font-semibold text-lg mb-4 mt-4">Test Input:</h3>
        <div className="mb-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Prompt:</strong> {associatedTest.prompt}
          </p>
          {associatedTest.imageInput && (
            <div className="mt-2">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <strong>Image:</strong>
              </p>
              <img 
                src={associatedTest.imageInput} 
                alt="Test input" 
                className="max-w-sm max-h-32 object-contain border rounded-md" 
              />
            </div>
          )}
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
            <strong>Golden Copy:</strong>
          </p>
          <pre className="whitespace-pre-wrap text-sm p-3 bg-gray-100 dark:bg-gray-700 rounded-md mt-1 max-h-lvh
 overflow-y-auto">
            {associatedTest?.goldenCopy || ''}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
