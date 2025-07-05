"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import TestForm from "@/components/test-form"
import type { Test } from "@/lib/types"
import { loadTests, saveTest, deleteTest } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react"

export default function TestsPage() {
  const { toast } = useToast()
  const [tests, setTests] = useState<Test[]>([])
  const [editingTest, setEditingTest] = useState<Test | null>(null)
  const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false)

  useEffect(() => {
    setTests(loadTests())
  }, [])

  const handleSaveEditedTest = (testData: Omit<Test, 'id' | 'createdAt'>) => {
    if (!editingTest) return

    const updatedTest: Test = {
      ...editingTest,
      ...testData,
    }

    const updatedTests = saveTest(updatedTest)
    setTests(updatedTests)
    toast({
      title: "Test Updated",
      description: `Test "${updatedTest.name}" has been updated.`,
    })
    setEditingTest(null)
  }

  const handleCancelEdit = () => {
    setEditingTest(null)
  }

  const handleEditTest = (test: Test) => {
    setEditingTest(test)
  }

  const handleDeleteTest = (id: string, name: string) => {
    const updatedTests = deleteTest(id)
    setTests(updatedTests)
    toast({
      title: "Test Deleted",
      description: `Test "${name}" has been removed.`,
    })
    if (editingTest?.id === id) {
      setEditingTest(null)
    }
  }

  const handleCreateTest = (testData: Omit<Test, 'id' | 'createdAt'>) => {
    const newTest: Test = {
      ...testData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }

    const updatedTests = saveTest(newTest)
    setTests(updatedTests)
    toast({
      title: "Test Created",
      description: `Test "${newTest.name}" has been created.`,
    })
    setIsCreateSectionOpen(false)
  }


  return (
    <div className="container mx-auto p-6 md:p-8 lg:p-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Test Management</h1>
        <Button onClick={() => setIsCreateSectionOpen(!isCreateSectionOpen)}>
          <Plus className="mr-2 h-4 w-4" /> Create New Test
        </Button>
      </div>

      {/* Create Test Section */}
      <Collapsible open={isCreateSectionOpen} onOpenChange={setIsCreateSectionOpen}>
        <CollapsibleContent>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Create New Test
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsCreateSectionOpen(false)}
                >
                  {isCreateSectionOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TestForm 
                onSave={handleCreateTest} 
                onCancel={() => setIsCreateSectionOpen(false)}
              />
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Edit Test Dialog */}
      {editingTest && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Edit Test</CardTitle>
          </CardHeader>
          <CardContent>
            <TestForm 
              initialTest={editingTest} 
              onSave={handleSaveEditedTest} 
              onCancel={handleCancelEdit}
              isEditing={true} 
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Existing Tests</CardTitle>
        </CardHeader>
        <CardContent>
          {tests.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No tests created yet.</p>
          ) : (
            <div className="grid gap-4">
              {tests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <h3 className="font-medium">{test.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Created: {new Date(test.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditTest(test)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Test</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete test "{test.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteTest(test.id, test.name)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
