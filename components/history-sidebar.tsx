import { Label } from "@/components/ui/label"
import type React from "react"
;("use client")

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { StoredRun } from "@/lib/types"
import { History, Upload, Download, Trash2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface HistorySidebarProps {
  history: StoredRun[]
  onLoadRun: (run: StoredRun) => void
  onClearHistory: () => void
  onExportData: () => void
  onImportData: (event: React.ChangeEvent<HTMLInputElement>) => void
  storageUsage: number // in MB
}

export function HistorySidebar({
  history,
  onLoadRun,
  onClearHistory,
  onExportData,
  onImportData,
  storageUsage,
}: HistorySidebarProps) {
  const maxStorage = 5 // MB, arbitrary limit for demonstration

  return (
    <aside className="w-64 bg-gray-100 dark:bg-gray-900 p-4 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <History className="mr-2 h-5 w-5" /> History
      </h2>
      <div className="mb-4">
        <Label className="text-sm">
          Storage Usage: {storageUsage.toFixed(2)} MB / {maxStorage} MB
        </Label>
        <Progress value={(storageUsage / maxStorage) * 100} className="w-full mt-1" />
        {storageUsage >= maxStorage && (
          <p className="text-xs text-red-500 mt-1">Storage limit reached. Oldest data may be removed automatically.</p>
        )}
      </div>
      <div className="flex flex-col gap-2 mb-4">
        <Button variant="outline" onClick={onExportData}>
          <Download className="mr-2 h-4 w-4" /> Export Data
        </Button>
        <label htmlFor="import-file" className="w-full">
          <Button asChild variant="outline" className="w-full cursor-pointer bg-transparent">
            <span>
              <Upload className="mr-2 h-4 w-4" /> Import Data
            </span>
          </Button>
          <input id="import-file" type="file" accept=".json" className="hidden" onChange={onImportData} />
        </label>
        <Button variant="destructive" onClick={onClearHistory}>
          <Trash2 className="mr-2 h-4 w-4" /> Clear History
        </Button>
      </div>
      <ScrollArea className="flex-1 pr-2">
        <div className="grid gap-2">
          {history.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No history yet.</p>
          ) : (
            history.map((run) => (
              <Button
                key={run.id}
                variant="ghost"
                className="justify-start h-auto py-2 text-left whitespace-normal break-words"
                onClick={() => onLoadRun(run)}
              >
                <span className="font-medium">{new Date(run.timestamp).toLocaleString()}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  Prompt: {run.prompt.substring(0, 50)}...
                </p>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
