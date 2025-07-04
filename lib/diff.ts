// Enhanced word-level diffing with advanced algorithms
// Supports multiple diff metrics and visualization options

interface DiffResult {
  diffScore: number // Percentage of difference (0-1)
  diffHtml: string // HTML string with highlighted differences
  levenshteinDistance: number
  wordCount: { golden: number; output: number }
  similarity: number // Similarity score (0-1)
  changes: { added: number; removed: number; modified: number }
}

enum DiffOperation {
  EQUAL = 'equal',
  DELETE = 'delete',
  INSERT = 'insert',
  REPLACE = 'replace'
}

interface DiffPart {
  operation: DiffOperation
  text: string
  goldenText?: string
  outputText?: string
}

export function calculateDiff(golden: string, output: string): DiffResult {
  const goldenWords = tokenize(golden)
  const outputWords = tokenize(output)
  
  const diffParts = computeWordDiff(goldenWords, outputWords)
  const stats = calculateStats(diffParts)
  const diffHtml = generateHtml(diffParts)
  
  return {
    diffScore: stats.diffScore,
    diffHtml,
    levenshteinDistance: stats.levenshteinDistance,
    wordCount: { golden: goldenWords.length, output: outputWords.length },
    similarity: 1 - stats.diffScore,
    changes: stats.changes,
  }
}

function tokenize(text: string): string[] {
  // Enhanced tokenization that preserves punctuation context
  return text
    .trim()
    .split(/(\s+)/)
    .filter(token => token.trim().length > 0)
    .map(token => token.trim())
}

function computeWordDiff(golden: string[], output: string[]): DiffPart[] {
  const dp: number[][] = []
  const operations: DiffOperation[][] = []
  
  // Initialize DP table
  for (let i = 0; i <= golden.length; i++) {
    dp[i] = []
    operations[i] = []
    for (let j = 0; j <= output.length; j++) {
      if (i === 0) {
        dp[i][j] = j
        operations[i][j] = DiffOperation.INSERT
      } else if (j === 0) {
        dp[i][j] = i
        operations[i][j] = DiffOperation.DELETE
      } else {
        const isEqual = golden[i - 1] === output[j - 1]
        const isSimilar = calculateWordSimilarity(golden[i - 1], output[j - 1]) > 0.8
        
        if (isEqual) {
          dp[i][j] = dp[i - 1][j - 1]
          operations[i][j] = DiffOperation.EQUAL
        } else {
          const deleteCost = dp[i - 1][j] + 1
          const insertCost = dp[i][j - 1] + 1
          const replaceCost = dp[i - 1][j - 1] + (isSimilar ? 0.5 : 1)
          
          const minCost = Math.min(deleteCost, insertCost, replaceCost)
          dp[i][j] = minCost
          
          if (minCost === replaceCost) {
            operations[i][j] = DiffOperation.REPLACE
          } else if (minCost === deleteCost) {
            operations[i][j] = DiffOperation.DELETE
          } else {
            operations[i][j] = DiffOperation.INSERT
          }
        }
      }
    }
  }
  
  // Backtrack to build diff parts
  const diffParts: DiffPart[] = []
  let i = golden.length
  let j = output.length
  
  while (i > 0 || j > 0) {
    const operation = operations[i][j]
    
    switch (operation) {
      case DiffOperation.EQUAL:
        diffParts.unshift({
          operation: DiffOperation.EQUAL,
          text: golden[i - 1],
        })
        i--
        j--
        break
        
      case DiffOperation.DELETE:
        diffParts.unshift({
          operation: DiffOperation.DELETE,
          text: golden[i - 1],
        })
        i--
        break
        
      case DiffOperation.INSERT:
        diffParts.unshift({
          operation: DiffOperation.INSERT,
          text: output[j - 1],
        })
        j--
        break
        
      case DiffOperation.REPLACE:
        diffParts.unshift({
          operation: DiffOperation.REPLACE,
          text: output[j - 1],
          goldenText: golden[i - 1],
          outputText: output[j - 1],
        })
        i--
        j--
        break
    }
  }
  
  return diffParts
}

function calculateWordSimilarity(word1: string, word2: string): number {
  if (word1 === word2) return 1
  
  const maxLength = Math.max(word1.length, word2.length)
  if (maxLength === 0) return 1
  
  const editDistance = levenshteinDistance(word1, word2)
  return 1 - editDistance / maxLength
}

function levenshteinDistance(str1: string, str2: string): number {
  const dp: number[][] = []
  
  for (let i = 0; i <= str1.length; i++) {
    dp[i] = []
    for (let j = 0; j <= str2.length; j++) {
      if (i === 0) {
        dp[i][j] = j
      } else if (j === 0) {
        dp[i][j] = i
      } else if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }
  
  return dp[str1.length][str2.length]
}

function calculateStats(diffParts: DiffPart[]): {
  diffScore: number
  levenshteinDistance: number
  changes: { added: number; removed: number; modified: number }
} {
  let added = 0
  let removed = 0
  let modified = 0
  let equal = 0
  let totalDistance = 0
  
  diffParts.forEach(part => {
    switch (part.operation) {
      case DiffOperation.INSERT:
        added++
        totalDistance++
        break
      case DiffOperation.DELETE:
        removed++
        totalDistance++
        break
      case DiffOperation.REPLACE:
        modified++
        totalDistance++
        break
      case DiffOperation.EQUAL:
        equal++
        break
    }
  })
  
  const total = added + removed + modified + equal
  const diffScore = total === 0 ? 0 : (added + removed + modified) / total
  
  return {
    diffScore,
    levenshteinDistance: totalDistance,
    changes: { added, removed, modified },
  }
}

function generateHtml(diffParts: DiffPart[]): string {
  return diffParts
    .map(part => {
      switch (part.operation) {
        case DiffOperation.EQUAL:
          return escapeHtml(part.text)
          
        case DiffOperation.DELETE:
          return `<span class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-1 rounded line-through" title="Removed">${escapeHtml(part.text)}</span>`
          
        case DiffOperation.INSERT:
          return `<span class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-1 rounded" title="Added">${escapeHtml(part.text)}</span>`
          
        case DiffOperation.REPLACE:
          return `<span class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-1 rounded" title="Changed from '${escapeHtml(part.goldenText || '')}'">
            <span class="line-through opacity-60">${escapeHtml(part.goldenText || '')}</span>
            <span class="font-medium">${escapeHtml(part.outputText || '')}</span>
          </span>`
          
        default:
          return escapeHtml(part.text)
      }
    })
    .join(' ')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Additional utility functions for advanced diff features
export function calculateSemanticSimilarity(golden: string, output: string): number {
  // Simplified semantic similarity - could be enhanced with word embeddings
  const goldenWords = new Set(tokenize(golden.toLowerCase()))
  const outputWords = new Set(tokenize(output.toLowerCase()))
  
  const intersection = new Set([...goldenWords].filter(word => outputWords.has(word)))
  const union = new Set([...goldenWords, ...outputWords])
  
  return union.size === 0 ? 0 : intersection.size / union.size
}

export function getDiffSummary(result: DiffResult): string {
  const { changes, similarity } = result
  const total = changes.added + changes.removed + changes.modified
  
  if (total === 0) {
    return "Perfect match"
  }
  
  const parts = []
  if (changes.added > 0) parts.push(`${changes.added} added`)
  if (changes.removed > 0) parts.push(`${changes.removed} removed`)
  if (changes.modified > 0) parts.push(`${changes.modified} modified`)
  
  const changeText = parts.join(', ')
  const similarityPercent = Math.round(similarity * 100)
  
  return `${changeText} (${similarityPercent}% similar)`
}
