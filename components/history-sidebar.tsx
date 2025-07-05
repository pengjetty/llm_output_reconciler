"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { StoredRun, Test } from "@/lib/types"
import { History, Upload, Download, Trash2, Play, Eye, MoreVertical, Star, Clock, Archive } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import type React from "react"

interface HistorySidebarProps {
  history: StoredRun[]
  tests: Test[]
  onLoadRun: (run: StoredRun) => void
  onRerunTest: (run: StoredRun) => void
  onDeleteRun: (runId: string) => void
  onClearHistory: () => void
  onExportData: () => void
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void
  storageUsage: number
  selectedRunId?: string
}

export function HistorySidebar({
  history,
  tests,
  onLoadRun,
  onRerunTest,
  onDeleteRun,
  onClearHistory,
  onExportData,
  onImportData,
  storageUsage,
  selectedRunId,
}: HistorySidebarProps) {
  const getTestName = (testId: string) => {
    const test = tests.find(t => t.id === testId)
    return test ? test.name : 'Unknown Test'
  }

  const getTestPrompt = (testId: string) => {
    const test = tests.find(t => t.id === testId)
    return test ? test.prompt : 'No prompt available'
  }

  const getTestImage = (testId: string) => {
    const test = tests.find(t => t.id === testId)
    return test ? test.imageInput : null
  }

  const getBestResult = (run: StoredRun) => {
    const successfulResults = run.results.filter(r => !r.error)
    if (successfulResults.length === 0) return null
    return successfulResults.reduce((best, current) => 
      current.diffScore < best.diffScore ? current : best
    )
  }

  const getRunStats = (run: StoredRun) => {
    const total = run.results.length
    const successful = run.results.filter(r => !r.error).length
    const failed = total - successful
    return { total, successful, failed }
  }

  return (
    <TooltipProvider>
      <aside className="w-80 bg-gray-100 dark:bg-gray-900 p-4 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <History className="mr-2 h-5 w-5" /> Run History
        </h2>
        
        {/* Storage Usage */}
        <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-md border">
          <Label className="text-sm font-medium">
            Storage Usage: {storageUsage.toFixed(2)} MB
          </Label>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-2 mb-4">
          <Button variant="outline" onClick={onExportData} size="sm">
            <Download className="mr-2 h-4 w-4" /> Export All Data
          </Button>
          <label htmlFor="import-file" className="w-full">
            <Button asChild variant="outline" size="sm" className="w-full cursor-pointer bg-transparent">
              <span>
                <Upload className="mr-2 h-4 w-4" /> Import Data
              </span>
            </Button>
            <input id="import-file" type="file" accept=".json" className="hidden" onChange={onImportData} />
          </label>
          <Button variant="destructive" onClick={onClearHistory} size="sm">
            <Archive className="mr-2 h-4 w-4" /> Clear All History
          </Button>
        </div>

        {/* Run History */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Recent Runs ({history.length})</Label>
          </div>
          
          <ScrollArea className="h-full pr-2">
            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <History className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No runs recorded yet.</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Create a test and run a comparison to get started.</p>
                </div>
              ) : (
                history.map((run) => {
                  const testName = getTestName(run.testId)
                  const testPrompt = getTestPrompt(run.testId)
                  const testImage = getTestImage(run.testId)
                  const bestResult = getBestResult(run)
                  const stats = getRunStats(run)
                  const isSelected = selectedRunId === run.id

                  return (
                    <div
                      key={run.id}
                      className={`p-3 border rounded-md bg-white dark:bg-gray-800 transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate" title={testName}>
                            {testName}
                          </h3>
                          <div className="flex items-center space-x-1 mt-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(run.timestamp).toLocaleDateString()} {new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onLoadRun(run)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onRerunTest(run)}>
                              <Play className="mr-2 h-4 w-4" />
                              Re-run Test
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  className="text-red-600 dark:text-red-400"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Run
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Run</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this run? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDeleteRun(run.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Test Prompt Preview */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 cursor-help">
                            {testPrompt.length > 80 ? `${testPrompt.substring(0, 80)}...` : testPrompt}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{testPrompt}</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Image Preview */}
                      {testImage && (
                        <div className="mb-2">
                          <img 
                            src={testImage} 
                            alt="Test input" 
                            className="max-w-full h-16 object-cover rounded border" 
                          />
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {stats.successful}/{stats.total} models
                          </Badge>
                          {stats.failed > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {stats.failed} failed
                            </Badge>
                          )}
                        </div>
                        
                        {bestResult && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-xs font-medium">
                                  {Math.round((bestResult.similarity || (1 - bestResult.diffScore)) * 100)}%
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Best result: {bestResult.provider}/{bestResult.model}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-1">
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => onLoadRun(run)}
                          className="flex-1 text-xs h-7"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRerunTest(run)}
                          className="text-xs h-7"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </aside>
    </TooltipProvider>
  )
}
