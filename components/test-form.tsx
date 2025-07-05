"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Save, X, Eye } from "lucide-react"
import type { Test } from "@/lib/types"

interface TestFormProps {
  initialTest?: Test
  onSave: (test: Omit<Test, 'id' | 'createdAt'>) => void
  onCancel?: () => void
  isEditing?: boolean
}

export default function TestForm({ initialTest, onSave, onCancel, isEditing = false }: TestFormProps) {
  const [testName, setTestName] = useState(initialTest?.name || "")
  const [testPrompt, setTestPrompt] = useState(initialTest?.prompt || "")
  const [testImageFile, setTestImageFile] = useState<File | null>(null)
  const [testImageUrl, setTestImageUrl] = useState(initialTest?.imageInput || "")
  const [testGoldenCopy, setTestGoldenCopy] = useState(initialTest?.goldenCopy || "")
  const [showImageDialog, setShowImageDialog] = useState(false)

  const handleSave = async () => {
    if (!testName || !testPrompt || !testGoldenCopy) {
      return
    }

    let imageInput: string | null = null
    if (testImageFile) {
      try {
        imageInput = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(testImageFile)
        })
      } catch (error) {
        console.error('Failed to read image file:', error)
        return
      }
    } else if (testImageUrl) {
      imageInput = testImageUrl
    }

    onSave({
      name: testName,
      prompt: testPrompt,
      imageInput: imageInput,
      goldenCopy: testGoldenCopy,
    })
  }

  const isFormValid = testName && testPrompt && testGoldenCopy

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="test-name">Test Name</Label>
        <Input
          id="test-name"
          placeholder="e.g., Summarization Test 1"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="prompt">Text Prompt</Label>
        <Textarea
          id="prompt"
          placeholder="Enter your prompt here..."
          value={testPrompt}
          onChange={(e) => setTestPrompt(e.target.value)}
          rows={20}
          className="w-full resize-none"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="image-input">Image Input (Optional)</Label>
        <div className="grid gap-2">
          <Input
            id="image-input"
            type="file"
            accept="image/png, image/jpeg"
            onChange={(e) => setTestImageFile(e.target.files ? e.target.files[0] : null)}
            className="w-full"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">or</span>
            <Input
              id="image-url"
              placeholder="Enter image URL"
              value={testImageUrl}
              onChange={(e) => setTestImageUrl(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        {testImageFile && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Selected file: {testImageFile.name}</p>
        )}
        {testImageUrl && !testImageFile && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {testImageUrl.startsWith('data:') ? 'Using uploaded image' : `Using image URL: ${testImageUrl}`}
            </p>
            <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
              <DialogTrigger asChild>
                <div className="cursor-pointer hover:opacity-80 transition-opacity">
                  <img 
                    src={testImageUrl} 
                    alt="Test image preview" 
                    className="max-w-xs max-h-32 object-contain border rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Click to view full size
                  </p>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Test Image</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center">
                  <img 
                    src={testImageUrl} 
                    alt="Test image full size" 
                    className="max-w-full max-h-[70vh] object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="golden-copy">Golden Copy (Expected Output)</Label>
        <Textarea
          id="golden-copy"
          placeholder="Enter the expected output here..."
          value={testGoldenCopy}
          onChange={(e) => setTestGoldenCopy(e.target.value)}
          rows={20}
          className="w-full resize-none"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={!isFormValid}>
          <Save className="mr-2 h-4 w-4" /> Save Test
        </Button>
        {isEditing && onCancel && (
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
        )}
      </div>
    </div>
  )
}