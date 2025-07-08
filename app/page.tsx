"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  FileText, 
  Play, 
  BarChart2, 
  Zap, 
  Target, 
  Brain,
  Globe,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Sparkles
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-blue-600 rounded-full mr-4">
              <img src="/icon.svg" alt="LLM output reconciler" className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
              LLM output reconciler
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Compare outputs from multiple AI models side-by-side with advanced diff analysis and performance metrics
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/runs">
                <Play className="mr-2 h-5 w-5" />
                Start Comparing
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/models">
                <Settings className="mr-2 h-5 w-5" />
                Setup API Keys
              </Link>
            </Button>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-fit">
                <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-xl">Multi-Model Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Test 30+ models from OpenAI, Anthropic, Google, and xAI simultaneously with parallel processing
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-full w-fit">
                <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-xl">Advanced Diff Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Word-level, line-based, and JSON-aware diff algorithms with similarity scoring and visual highlighting
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 dark:border-purple-800">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-purple-100 dark:bg-purple-900 rounded-full w-fit">
                <BarChart2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-xl">Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Automatic ranking, execution time tracking, and detailed performance metrics for every comparison
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How to Use Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            How to Use LLM output reconciler
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Badge variant="outline" className="text-xs">Step 1</Badge>
                </div>
                <CardTitle className="text-lg">Setup API Keys</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Configure your API keys for OpenAI, Anthropic, Google, and xAI in the Models page
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/models">
                    Go to Models <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <Badge variant="outline" className="text-xs">Step 2</Badge>
                </div>
                <CardTitle className="text-lg">Create Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Define test prompts and expected outputs (golden copy) with support for text and images
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/tests">
                    Manage Tests <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-purple-500"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                    <Play className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <Badge variant="outline" className="text-xs">Step 3</Badge>
                </div>
                <CardTitle className="text-lg">Run Comparisons</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Select models and run tests to compare outputs with real-time progress tracking
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/runs">
                    Start Running <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
                    <BarChart2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <Badge variant="outline" className="text-xs">Step 4</Badge>
                </div>
                <CardTitle className="text-lg">Analyze Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  View detailed comparisons with diff highlighting and performance rankings
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/results">
                    View Results <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Supported Models */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Supported AI Models
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-2 p-3 bg-green-100 dark:bg-green-900 rounded-full w-fit">
                  <Globe className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-lg">OpenAI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="outline">GPT-4.1 series</Badge>
                  <Badge variant="outline">GPT-4o series</Badge>
                  <Badge variant="outline">GPT-3.5 Turbo</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-2 p-3 bg-blue-100 dark:bg-blue-900 rounded-full w-fit">
                  <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg">Anthropic</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="outline">Claude 4 series</Badge>
                  <Badge variant="outline">Claude 3.5 Sonnet</Badge>
                  <Badge variant="outline">Claude 3 Haiku</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-2 p-3 bg-red-100 dark:bg-red-900 rounded-full w-fit">
                  <Sparkles className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-lg">Google</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="outline">Gemini 2.5 series</Badge>
                  <Badge variant="outline">Gemini 1.5 Pro</Badge>
                  <Badge variant="outline">Gemini 1.5 Flash</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-2 p-3 bg-purple-100 dark:bg-purple-900 rounded-full w-fit">
                  <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-lg">xAI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="outline">Grok 3 series</Badge>
                  <Badge variant="outline">Grok 2 series</Badge>
                  <Badge variant="outline">Grok Beta</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Why Choose LLM output reconciler?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Privacy-First Design</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    All data stored locally in your browser. API keys never leave your device.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Advanced Diff Algorithms</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Three diff types: word-level, line-based, and JSON-aware with similarity scoring.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Parallel Processing</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Run multiple models simultaneously with real-time progress tracking.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Performance Metrics</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Automatic ranking by similarity, execution time, and detailed change analysis.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Export & Import</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Export results for sharing or import existing test suites for collaboration.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Image Support</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Test vision models with image inputs across all supported providers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <CardTitle className="text-lg text-yellow-800 dark:text-yellow-200">
                API Keys Required
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              To use LLM output reconciler, you'll need API keys from the providers you want to test. Get your keys from:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">API Key Sources:</h4>
                <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                  <li>• OpenAI: <a href="https://platform.openai.com/api-keys" className="underline" target="_blank" rel="noopener noreferrer">platform.openai.com/api-keys</a></li>
                  <li>• Anthropic: <a href="https://console.anthropic.com/" className="underline" target="_blank" rel="noopener noreferrer">console.anthropic.com</a></li>
                  <li>• Google: <a href="https://aistudio.google.com/apikey" className="underline" target="_blank" rel="noopener noreferrer">aistudio.google.com/apikey</a></li>
                  <li>• xAI: <a href="https://console.x.ai/" className="underline" target="_blank" rel="noopener noreferrer">console.x.ai</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Privacy Note:</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Your API keys are stored locally in your browser and never transmitted to our servers. 
                  They're only used to make direct API calls to the respective providers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Get Started CTA */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Ready to Compare AI Models?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Start by setting up your API keys, then create your first test case
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/models">
                <Settings className="mr-2 h-5 w-5" />
                Setup API Keys
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/tests">
                <FileText className="mr-2 h-5 w-5" />
                Create Test Cases
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
