"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Test } from "@/lib/types"
import { loadTests, saveTest, deleteTest } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2, Save, X } from "lucide-react"

export default function TestsPage() {
  const { toast } = useToast()
  const [tests, setTests] = useState<Test[]>([])
  const [editingTest, setEditingTest] = useState<Test | null>(null)
  const [newTestName, setNewTestName] = useState("")
  const [newTestPrompt, setNewTestPrompt] = useState("")
  const [newTestImageFile, setNewTestImageFile] = useState<File | null>(null)
  const [newTestImageUrl, setNewTestImageUrl] = useState("")
  const [newTestGoldenCopy, setNewTestGoldenCopy] = useState("")

  useEffect(() => {
    setTests(loadTests())
  }, [])

  const resetForm = () => {
    setEditingTest(null)
    setNewTestName("")
    setNewTestPrompt("")
    setNewTestImageFile(null)
    setNewTestImageUrl("")
    setNewTestGoldenCopy("")
  }

  const handleSaveTest = async () => {
    if (!newTestName || !newTestPrompt || !newTestGoldenCopy) {
      toast({
        title: "Missing Fields",
        description: "Please fill in test name, prompt, and golden copy.",
        variant: "destructive",
      })
      return
    }

    let imageInput: string | null = null
    if (newTestImageFile) {
      try {
        imageInput = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(newTestImageFile)
        })
      } catch (error) {
        toast({
          title: "Image Error",
          description: "Failed to read image file.",
          variant: "destructive",
        })
        return
      }
    } else if (newTestImageUrl) {
      imageInput = newTestImageUrl
    }

    const testToSave: Test = editingTest
      ? {
          ...editingTest,
          name: newTestName,
          prompt: newTestPrompt,
          imageInput: imageInput,
          goldenCopy: newTestGoldenCopy,
        }
      : {
          id: Date.now().toString(),
          name: newTestName,
          prompt: newTestPrompt,
          imageInput: imageInput,
          goldenCopy: newTestGoldenCopy,
          createdAt: new Date().toISOString(),
        }

    const updatedTests = saveTest(testToSave)
    setTests(updatedTests)
    toast({
      title: "Test Saved",
      description: `Test "${testToSave.name}" has been saved.`,
    })
    resetForm()
  }

  const handleEditTest = (test: Test) => {
    setEditingTest(test)
    setNewTestName(test.name)
    setNewTestPrompt(test.prompt)
    setNewTestImageFile(null) // Clear file input when editing
    setNewTestImageUrl(test.imageInput || "")
    setNewTestGoldenCopy(test.goldenCopy)
  }

  const handleDeleteTest = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete test "${name}"?`)) {
      const updatedTests = deleteTest(id)
      setTests(updatedTests)
      toast({
        title: "Test Deleted",
        description: `Test "${name}" has been removed.`,
      })
      if (editingTest?.id === id) {
        resetForm()
      }
    }
  }

  return (
    <div className="container mx-auto p-6 md:p-8 lg:p-10">
      <h1 className="text-3xl font-bold mb-6">Test Management</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{editingTest ? "Edit Test" : "Create New Test"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="test-name">Test Name</Label>
            <Input
              id="test-name"
              placeholder="e.g., Summarization Test 1"
              value={newTestName}
              onChange={(e) => setNewTestName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prompt">Text Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Enter your prompt here..."
              value={newTestPrompt}
              onChange={(e) => setNewTestPrompt(e.target.value)}
              rows={5}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="image-input">Image Input (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image-input"
                type="file"
                accept="image/png, image/jpeg"
                onChange={(e) => setNewTestImageFile(e.target.files ? e.target.files[0] : null)}
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">or</span>
              <Input
                id="image-url"
                placeholder="Enter image URL"
                value={newTestImageUrl}
                onChange={(e) => setNewTestImageUrl(e.target.value)}
              />
            </div>
            {newTestImageFile && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Selected file: {newTestImageFile.name}</p>
            )}
            {newTestImageUrl && !newTestImageFile && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Using image URL: {newTestImageUrl}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="golden-copy">Golden Copy (Expected Output)</Label>
            <Textarea
              id="golden-copy"
              placeholder="Enter the expected output here..."
              value={newTestGoldenCopy}
              onChange={(e) => setNewTestGoldenCopy(e.target.value)}
              rows={5}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveTest}>
              <Save className="mr-2 h-4 w-4" /> Save Test
            </Button>
            {editingTest && (
              <Button variant="outline" onClick={resetForm}>
                <X className="mr-2 h-4 w-4" /> Cancel Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteTest(test.id, test.name)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
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
