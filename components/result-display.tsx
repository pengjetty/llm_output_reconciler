"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { RunResult } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface ResultDisplayProps {
  results: RunResult[]
  loading: boolean
}

export function ResultDisplay({ results, loading }: ResultDisplayProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparison Results</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Running models...</span>
        </CardContent>
      </Card>
    )
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparison Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400">Run a comparison to see results here.</p>
        </CardContent>
      </Card>
    )
  }

  const getDiffColor = (score: number) => {
    if (score === 0) return "text-green-500"
    if (score < 0.2) return "text-lime-500"
    if (score < 0.5) return "text-yellow-500"
    return "text-red-500"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparison Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {results.map((result, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>
                <div className="flex justify-between items-center w-full pr-4">
                  <span className="font-medium">
                    {result.provider} / {result.model}
                  </span>
                  <span className={`font-semibold ${getDiffColor(result.diffScore)}`}>
                    Diff: {result.diffScore.toFixed(2)}%
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {result.error ? (
                  <div
                    className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md"
                    dangerouslySetInnerHTML={{ __html: result.diffHtml }}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <h4 className="font-semibold mb-2">Golden Copy</h4>
                      <pre className="whitespace-pre-wrap text-sm p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                        {result.goldenCopy}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Model Output</h4>
                      <pre
                        className="whitespace-pre-wrap text-sm p-3 bg-gray-100 dark:bg-gray-800 rounded-md"
                        dangerouslySetInnerHTML={{ __html: result.diffHtml }}
                      />
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
