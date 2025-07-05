"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Trophy, Clock, Target, BarChart3, Copy, Check } from "lucide-react"
import type { Run, Test } from "@/lib/types"
import { getDiffSummary } from "@/lib/diff"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface ResultDetailProps {
  run: Run
  tests: Test[]
}

export function ResultDetail({ run, tests }: ResultDetailProps) {
  const { toast } = useToast()
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({})
  const [showDiffHighlight, setShowDiffHighlight] = useState<Record<string, boolean>>({})
  const associatedTest = tests.find((test) => test.id === run.testId)

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

  const sortedResults = [...run.results]
    .filter(result => !result.error)
    .sort((a, b) => {
      // Primary sort: diffScore (lower is better)
      if (a.diffScore !== b.diffScore) {
        return a.diffScore - b.diffScore
      }
      // Secondary sort: semantic similarity (higher is better)
      return (b.semanticSimilarity || 0) - (a.semanticSimilarity || 0)
    })

  const errorResults = run.results.filter(result => result.error)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Details: {associatedTest.name}</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">Run on: {new Date(run.timestamp).toLocaleString()}</p>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold mb-2">Test Input:</h3>
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
          <pre className="whitespace-pre-wrap text-sm p-3 bg-gray-100 dark:bg-gray-700 rounded-md mt-1">
            {associatedTest.goldenCopy}
          </pre>
        </div>

        {/* Performance Summary */}
        {sortedResults.length > 0 && (
          <div className="mb-6 p-4 border rounded-md bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
            <h3 className="font-semibold text-lg mb-3 flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
              Performance Ranking
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedResults.slice(0, 3).map((result, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded-md">
                  {getRankIcon(index + 1)}
                  <span className="text-sm font-medium">{result.provider}/{result.model}</span>
                  <Badge variant={getBadgeVariant(index + 1)} className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <h3 className="font-semibold text-lg mb-4">Model Outputs ({sortedResults.length + errorResults.length} total):</h3>
        
        {/* Successful Results */}
        <Accordion type="single" collapsible className="w-full">
          {sortedResults.map((result, index) => {
            const rank = index + 1
            const diffSummary = result.changes ? getDiffSummary({
              diffScore: result.diffScore,
              diffHtml: result.diffHtml,
              levenshteinDistance: result.levenshteinDistance || 0,
              wordCount: result.wordCount || { golden: 0, output: 0 },
              similarity: result.similarity || 0,
              changes: result.changes
            }) : `${Math.round((1 - result.diffScore) * 100)}% similarity`

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
                    <div className="flex items-center space-x-2 text-sm">
                      <span className={`font-semibold ${getDiffColor(result.diffScore)}`}>
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
                          <Progress value={(result.similarity || 0) * 100} className="flex-1 h-2" />
                          <span className="text-sm font-medium">{Math.round((result.similarity || 0) * 100)}%</span>
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
                      {result.changes && (
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400 block flex items-center">
                            <Target className="mr-1 h-3 w-3" />
                            Changes
                          </label>
                          <span className="text-sm font-medium">
                            +{result.changes.added} -{result.changes.removed} ~{result.changes.modified}
                          </span>
                        </div>
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
                          onClick={() => copyToClipboard(associatedTest.goldenCopy, `golden-${result.provider}-${result.model}`)}
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
                        {associatedTest.goldenCopy}
                      </pre>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Model Output</h4>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-2">
                            <label htmlFor={`diff-toggle-${result.provider}-${result.model}`} className="text-sm">
                              Diff
                            </label>
                            <Switch
                              id={`diff-toggle-${result.provider}-${result.model}`}
                              checked={showDiffHighlight[`${result.provider}-${result.model}`] ?? true}
                              onCheckedChange={(checked) => 
                                setShowDiffHighlight(prev => ({ ...prev, [`${result.provider}-${result.model}`]: checked }))
                              }
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(result.output, `output-${result.provider}-${result.model}`)}
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
                      </div>
                      <pre className="whitespace-pre-wrap text-sm p-3 bg-gray-100 dark:bg-gray-700 rounded-md max-h-84 overflow-y-auto">
                        {showDiffHighlight[`${result.provider}-${result.model}`] ?? true ? (
                          <div dangerouslySetInnerHTML={{ __html: result.diffHtml }} />
                        ) : (
                          result.output
                        )}
                      </pre>
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
      </CardContent>
    </Card>
  )
}
