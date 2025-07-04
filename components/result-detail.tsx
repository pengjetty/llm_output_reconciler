"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { Run, Test } from "@/lib/types"

interface ResultDetailProps {
  run: Run
  tests: Test[]
}

export function ResultDetail({ run, tests }: ResultDetailProps) {
  const associatedTest = tests.find((test) => test.id === run.testId)

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
    if (score === 0) return "text-green-500"
    if (score < 0.2) return "text-lime-500"
    if (score < 0.5) return "text-yellow-500"
    return "text-red-500"
  }

  const sortedResults = [...run.results].sort((a, b) => a.diffScore - b.diffScore)

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
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Image:</strong>{" "}
              {associatedTest.imageInput.length > 100
                ? `${associatedTest.imageInput.substring(0, 100)}...`
                : associatedTest.imageInput}
            </p>
          )}
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
            <strong>Golden Copy:</strong>
          </p>
          <pre className="whitespace-pre-wrap text-sm p-3 bg-gray-100 dark:bg-gray-700 rounded-md mt-1">
            {associatedTest.goldenCopy}
          </pre>
        </div>

        <h3 className="font-semibold text-lg mb-4">Model Outputs:</h3>
        <Accordion type="single" collapsible className="w-full">
          {sortedResults.map((result, index) => (
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
                        {associatedTest.goldenCopy}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Model Output (Diff Highlighted)</h4>
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
