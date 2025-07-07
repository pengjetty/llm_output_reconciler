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

interface LineDiffResult {
  diffScore: number // Percentage of different lines (0-1)
  diffHtml: string // HTML string with highlighted line differences
  lineCount: { golden: number; output: number }
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

// JSON-AWARE DIFF IMPLEMENTATION
interface JsonDiffResult {
  diffScore: number // Percentage difference (0-1)
  similarity: number // Similarity score (0-1)
  diffHtml: string // HTML string with highlighted differences
  normalizedGolden: string // Normalized JSON for comparison
  normalizedOutput: string // Normalized JSON for comparison
  isValidJson: { golden: boolean; output: boolean }
  parseErrors: { golden?: string; output?: string }
  changes: {
    structuralChanges: number
    valueChanges: number
    additions: number
    removals: number
  }
}

function extractJsonFromMarkdown(str: string): string {
  const trimmed = str.trim()
  
  // Remove ```json, ```, or ``` language markers
  let extracted = trimmed
    .replace(/^```(?:json|javascript|js)?\s*\n?/i, '')  // Remove opening code block
    .replace(/\n?```\s*$/i, '')  // Remove closing code block
    .trim()
  
  // Also handle single backticks for inline code
  if (extracted.startsWith('`') && extracted.endsWith('`')) {
    extracted = extracted.slice(1, -1).trim()
  }
  
  return extracted
}

function isValidJson(str: string): boolean {
  try {
    // Try original string first
    JSON.parse(str.trim())
    return true
  } catch {
    try {
      // Try with markdown formatting removed
      const extracted = extractJsonFromMarkdown(str)
      JSON.parse(extracted)
      return true
    } catch {
      return false
    }
  }
}

function normalizeJson(jsonStr: string): { normalized: string; parsed: any; error?: string } {
  let jsonToParse = jsonStr.trim()
  
  try {
    // Try parsing original string first
    const parsed = JSON.parse(jsonToParse)
    const normalized = normalizeJsonObject(parsed)
    return {
      normalized: JSON.stringify(normalized, null, 2),
      parsed: normalized
    }
  } catch (firstError) {
    try {
      // Try with markdown formatting removed
      const extracted = extractJsonFromMarkdown(jsonStr)
      const parsed = JSON.parse(extracted)
      const normalized = normalizeJsonObject(parsed)
      return {
        normalized: JSON.stringify(normalized, null, 2),
        parsed: normalized
      }
    } catch (secondError) {
      return {
        normalized: jsonStr,
        parsed: null,
        error: secondError instanceof Error ? secondError.message : 'JSON parsing failed'
      }
    }
  }
}

function normalizeJsonObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (Array.isArray(obj)) {
    // For arrays, normalize each element and optionally sort
    const normalized = obj.map(normalizeJsonObject)
    
    // Sort arrays if they contain objects with 'id', 'name', or 'key' fields
    // Otherwise preserve order (for ordered data like steps, instructions)
    if (normalized.length > 0 && typeof normalized[0] === 'object' && normalized[0] !== null) {
      const firstObj = normalized[0]
      if ('id' in firstObj || 'name' in firstObj || 'key' in firstObj) {
        return normalized.sort((a, b) => {
          const keyA = a.id || a.name || a.key || ''
          const keyB = b.id || b.name || b.key || ''
          return String(keyA).localeCompare(String(keyB))
        })
      }
    }
    
    return normalized
  }
  
  // For objects, sort keys and normalize values
  const normalized: any = {}
  const sortedKeys = Object.keys(obj).sort()
  
  for (const key of sortedKeys) {
    normalized[key] = normalizeJsonObject(obj[key])
  }
  
  return normalized
}

function calculateJsonStructuralSimilarity(obj1: any, obj2: any): number {
  // Use our improved deep equality and similarity functions
  if (deepEqual(obj1, obj2)) return 1
  
  // Use the more sophisticated similarity calculation
  return calculateObjectSimilarity(obj1, obj2)
}

function generateImprovedJsonDiffHtml(goldenParsed: any, outputParsed: any, goldenText: string, outputText: string): string {
  // If both are valid JSON, show improved structural diff
  if (goldenParsed && outputParsed) {
    return generateStructuralDiffHtml(goldenParsed, outputParsed)
  }
  
  // Fall back to text diff for invalid JSON
  const textDiff = calculateDiff(goldenText, outputText)
  return textDiff.diffHtml
}

function generateJsonDiffHtml(golden: string, output: string, normalizedGolden: any, normalizedOutput: any): string {
  // If both are valid JSON, show a structural diff
  if (normalizedGolden && normalizedOutput) {
    return generateStructuralDiffHtml(normalizedGolden, normalizedOutput)
  }
  
  // Fall back to text diff for invalid JSON
  const textDiff = calculateDiff(golden, output)
  return textDiff.diffHtml
}

// LCS-BASED ARRAY DIFFING FOR BETTER ACCURACY
interface ArrayDiffOperation {
  type: 'equal' | 'added' | 'removed' | 'moved'
  value: any
  oldIndex?: number
  newIndex?: number
}

// DEEP EQUALITY COMPARISON FOR JSON OBJECTS
function deepEqual(obj1: any, obj2: any, tolerance: number = 0): boolean {
  // Handle primitive types and null/undefined
  if (obj1 === obj2) return true
  if (obj1 == null || obj2 == null) return false
  if (typeof obj1 !== typeof obj2) return false
  
  // Handle numbers with tolerance for floating point precision
  if (typeof obj1 === 'number' && typeof obj2 === 'number') {
    if (tolerance > 0) {
      return Math.abs(obj1 - obj2) <= tolerance
    }
    return obj1 === obj2
  }
  
  // Handle strings
  if (typeof obj1 === 'string') {
    return obj1 === obj2
  }
  
  // Handle arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false
    return obj1.every((item, index) => deepEqual(item, obj2[index], tolerance))
  }
  
  // Handle objects
  if (typeof obj1 === 'object' && typeof obj2 === 'object') {
    const keys1 = Object.keys(obj1).sort()
    const keys2 = Object.keys(obj2).sort()
    
    // Different number of keys
    if (keys1.length !== keys2.length) {
      console.log('Different number of keys:', keys1.length, 'vs', keys2.length)
      return false
    }
    
    // Different key names
    if (!keys1.every((key, index) => key === keys2[index])) {
      console.log('Different key names:', keys1, 'vs', keys2)
      return false
    }
    
    // Compare all values
    const result = keys1.every(key => {
      const valueEqual = deepEqual(obj1[key], obj2[key], tolerance)
      if (!valueEqual) {
        console.log(`Key ${key} not equal:`, obj1[key], 'vs', obj2[key])
      }
      return valueEqual
    })
    
    return result
  }
  
  return false
}

// FUZZY MATCHING FOR SIMILAR OBJECTS
function calculateObjectSimilarity(obj1: any, obj2: any): number {
  if (deepEqual(obj1, obj2)) return 1.0
  
  // If types don't match, similarity is 0
  if (typeof obj1 !== typeof obj2) return 0
  if (obj1 == null || obj2 == null) return 0
  
  // For primitives, either exact match or no match
  if (typeof obj1 !== 'object') return obj1 === obj2 ? 1.0 : 0
  
  // For arrays, calculate percentage of matching elements
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const maxLen = Math.max(obj1.length, obj2.length)
    if (maxLen === 0) return 1.0
    
    let matches = 0
    const minLen = Math.min(obj1.length, obj2.length)
    for (let i = 0; i < minLen; i++) {
      if (deepEqual(obj1[i], obj2[i])) matches++
    }
    return matches / maxLen
  }
  
  // For objects, calculate percentage of matching key-value pairs
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  const allKeys = new Set([...keys1, ...keys2])
  
  if (allKeys.size === 0) return 1.0
  
  let matches = 0
  allKeys.forEach(key => {
    if (key in obj1 && key in obj2 && deepEqual(obj1[key], obj2[key])) {
      matches++
    }
  })
  
  return matches / allKeys.size
}

function calculateLCSArrayDiff(arr1: any[], arr2: any[]): ArrayDiffOperation[] {
  // Build LCS table using dynamic programming with semantic comparison
  const m = arr1.length
  const n = arr2.length
  const lcs: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
  const similarity: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
  
  // Fill LCS table with deep equality comparison
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const isEqual = deepEqual(arr1[i - 1], arr2[j - 1])
      const objSimilarity = calculateObjectSimilarity(arr1[i - 1], arr2[j - 1])
      
      similarity[i][j] = objSimilarity
      
      // Debug logging for first element comparison
      if (i === 1 && j === 1) {
        console.log('Comparing first elements:')
        console.log('Golden[0]:', JSON.stringify(arr1[0], null, 2))
        console.log('Output[0]:', JSON.stringify(arr2[0], null, 2))
        console.log('Deep equal result:', isEqual)
        console.log('Similarity:', objSimilarity)
      }
      
      if (isEqual) {
        lcs[i][j] = lcs[i - 1][j - 1] + 1
      } else {
        lcs[i][j] = Math.max(lcs[i - 1][j], lcs[i][j - 1])
      }
    }
  }
  
  // Backtrack to build diff operations
  const operations: ArrayDiffOperation[] = []
  let i = m, j = n
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && deepEqual(arr1[i - 1], arr2[j - 1])) {
      // Elements are semantically equal
      operations.unshift({
        type: 'equal',
        value: arr1[i - 1],
        oldIndex: i - 1,
        newIndex: j - 1
      })
      i--
      j--
    } else if (i > 0 && j > 0 && similarity[i][j] > 0.8) {
      // Elements are very similar but not identical - treat as modified
      // For now, we'll treat high similarity as equal to avoid noise
      operations.unshift({
        type: 'equal',
        value: arr2[j - 1], // Use the new version
        oldIndex: i - 1,
        newIndex: j - 1
      })
      i--
      j--
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      // Element was added
      operations.unshift({
        type: 'added',
        value: arr2[j - 1],
        newIndex: j - 1
      })
      j--
    } else {
      // Element was removed
      operations.unshift({
        type: 'removed',
        value: arr1[i - 1],
        oldIndex: i - 1
      })
      i--
    }
  }
  
  return operations
}

function generateArrayDiffHtml(operations: ArrayDiffOperation[]): string {
  return operations.map((op, index) => {
    const valueStr = typeof op.value === 'object' 
      ? JSON.stringify(op.value, null, 2)
      : String(op.value)
    
    switch (op.type) {
      case 'equal':
        return `<div class="array-item-equal" data-index="${index}">${escapeHtml(valueStr)}</div>`
      case 'added':
        return `<div class="array-item-added bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-md border-l-4 border-green-500" data-index="${index}" title="Added at position ${op.newIndex}">
          <span class="text-xs text-green-600 dark:text-green-400 font-mono">+ ${op.newIndex}</span>
          <span class="ml-2">${escapeHtml(valueStr)}</span>
        </div>`
      case 'removed':
        return `<div class="array-item-removed bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-md border-l-4 border-red-500" data-index="${index}" title="Removed from position ${op.oldIndex}">
          <span class="text-xs text-red-600 dark:text-red-400 font-mono">- ${op.oldIndex}</span>
          <span class="ml-2 line-through">${escapeHtml(valueStr)}</span>
        </div>`
      default:
        return `<div class="array-item-equal">${escapeHtml(valueStr)}</div>`
    }
  }).join('\n')
}

function calculateImprovedJsonChanges(obj1: any, obj2: any, text1: string, text2: string): {
  structuralChanges: number
  valueChanges: number
  additions: number
  removals: number
} {
  if (!obj1 || !obj2) {
    // Fall back to text diff
    const textDiff = calculateDiff(text1, text2)
    return {
      structuralChanges: 0,
      valueChanges: textDiff.changes.modified,
      additions: textDiff.changes.added,
      removals: textDiff.changes.removed
    }
  }
  
  let additions = 0
  let removals = 0
  let structuralChanges = 0
  
  function countChanges(o1: any, o2: any, path: string = ''): void {
    if (Array.isArray(o1) && Array.isArray(o2)) {
      // Use LCS-based counting for arrays
      const arrayDiff = calculateLCSArrayDiff(o1, o2)
      arrayDiff.forEach(op => {
        switch (op.type) {
          case 'added':
            additions++
            break
          case 'removed':
            removals++
            break
        }
      })
      
      // Count structural changes in nested objects/arrays
      // Only process equal items for nested comparison
      arrayDiff.forEach(op => {
        if (op.type === 'equal' && typeof op.value === 'object' && op.value !== null) {
          // For equal items, we don't need to recurse since they're already considered equal
          // Only recurse if we want to count internal differences, but that would be double-counting
        }
      })
    } else if (typeof o1 === 'object' && typeof o2 === 'object' && o1 !== null && o2 !== null) {
      // Object comparison with deep equality
      const keys1 = Object.keys(o1)
      const keys2 = Object.keys(o2)
      const allKeys = new Set([...keys1, ...keys2])
      
      allKeys.forEach(key => {
        if (!(key in o1)) {
          additions++
        } else if (!(key in o2)) {
          removals++
        } else if (typeof o1[key] === 'object' && typeof o2[key] === 'object') {
          countChanges(o1[key], o2[key], path ? `${path}.${key}` : key)
        } else if (!deepEqual(o1[key], o2[key])) {
          structuralChanges++
        }
      })
    }
  }
  
  countChanges(obj1, obj2)
  
  return {
    structuralChanges,
    valueChanges: structuralChanges, // For compatibility
    additions,
    removals
  }
}

function generateStructuralDiffHtml(obj1: any, obj2: any, path: string = ''): string {
  if (obj1 === obj2) {
    return `<span class="json-equal">${escapeHtml(JSON.stringify(obj1, null, 2))}</span>`
  }
  
  if (obj1 === null || obj2 === null || typeof obj1 !== typeof obj2) {
    return `<div class="json-change">
      <div class="json-removed">- ${escapeHtml(JSON.stringify(obj1, null, 2))}</div>
      <div class="json-added">+ ${escapeHtml(JSON.stringify(obj2, null, 2))}</div>
    </div>`
  }
  
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    // Use LCS-based array diffing for better accuracy
    const arrayDiffOps = calculateLCSArrayDiff(obj1, obj2)
    return `<div class="json-array-improved">[\n${generateArrayDiffHtml(arrayDiffOps)}\n]</div>`
  }
  
  if (typeof obj1 === 'object' && typeof obj2 === 'object') {
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    const allKeys = new Set([...keys1, ...keys2])
    
    let html = '<div class="json-object">{\n'
    const keyArray = Array.from(allKeys).sort()
    
    keyArray.forEach((key, index) => {
      const keyPath = path ? `${path}.${key}` : key
      
      if (key in obj1 && key in obj2) {
        if (obj1[key] === obj2[key]) {
          html += `  <span class="json-equal">"${escapeHtml(key)}": ${escapeHtml(JSON.stringify(obj1[key]))}</span>`
        } else {
          html += `  <span class="json-key">"${escapeHtml(key)}":</span> ${generateStructuralDiffHtml(obj1[key], obj2[key], keyPath)}`
        }
      } else if (key in obj1) {
        html += `  <div class="json-removed">- "${escapeHtml(key)}": ${escapeHtml(JSON.stringify(obj1[key]))}</div>`
      } else {
        html += `  <div class="json-added">+ "${escapeHtml(key)}": ${escapeHtml(JSON.stringify(obj2[key]))}</div>`
      }
      
      if (index < keyArray.length - 1) html += ',\n'
    })
    
    html += '\n}</div>'
    return html
  }
  
  // Primitive values
  return `<div class="json-change">
    <span class="json-removed">- ${escapeHtml(JSON.stringify(obj1))}</span>
    <span class="json-added">+ ${escapeHtml(JSON.stringify(obj2))}</span>
  </div>`
}

// Helper function to inspect JSON normalization
export function inspectJsonNormalization(jsonStr: string): { normalized: string; parsed: any; error?: string } {
  return normalizeJson(jsonStr)
}

export function calculateJsonDiff(golden: string, output: string): JsonDiffResult {
  const goldenValid = isValidJson(golden)
  const outputValid = isValidJson(output)
  
  // Parse and normalize JSON (with error capture)
  const goldenNorm = normalizeJson(golden)
  const outputNorm = normalizeJson(output)
  
  // If neither is valid JSON, fall back to text diff
  if (!goldenValid && !outputValid) {
    const textDiff = calculateDiff(golden, output)
    return {
      diffScore: textDiff.diffScore,
      similarity: textDiff.similarity,
      diffHtml: textDiff.diffHtml,
      normalizedGolden: golden,
      normalizedOutput: output,
      isValidJson: { golden: false, output: false },
      parseErrors: { 
        golden: goldenNorm.error, 
        output: outputNorm.error 
      },
      changes: {
        structuralChanges: 0,
        valueChanges: textDiff.changes.modified,
        additions: textDiff.changes.added,
        removals: textDiff.changes.removed
      }
    }
  }
  
  // ALWAYS USE NORMALIZED JSON FOR COMPARISON
  // Calculate structural similarity using normalized JSON
  const structuralSimilarity = goldenNorm.parsed && outputNorm.parsed 
    ? calculateJsonStructuralSimilarity(goldenNorm.parsed, outputNorm.parsed)
    : 0
  
  // Calculate changes using improved counting for arrays
  const improvedChanges = calculateImprovedJsonChanges(goldenNorm.parsed, outputNorm.parsed, goldenNorm.normalized, outputNorm.normalized)
  
  // Also calculate text diff for fallback metrics
  const normalizedTextDiff = calculateDiff(goldenNorm.normalized, outputNorm.normalized)
  
  // Generate HTML diff using normalized JSON with improved array handling
  const diffHtml = generateImprovedJsonDiffHtml(goldenNorm.parsed, outputNorm.parsed, goldenNorm.normalized, outputNorm.normalized)
  
  // Combine scores (weighted toward structural similarity for valid JSON)
  const finalSimilarity = goldenValid && outputValid 
    ? (structuralSimilarity * 0.7 + normalizedTextDiff.similarity * 0.3)
    : normalizedTextDiff.similarity
  
  return {
    diffScore: 1 - finalSimilarity,
    similarity: finalSimilarity,
    diffHtml,
    normalizedGolden: goldenNorm.normalized,
    normalizedOutput: outputNorm.normalized,
    isValidJson: { golden: goldenValid, output: outputValid },
    parseErrors: { 
      golden: goldenNorm.error, 
      output: outputNorm.error 
    },
    changes: goldenValid && outputValid ? improvedChanges : {
      structuralChanges: 0,
      valueChanges: normalizedTextDiff.changes.modified,
      additions: normalizedTextDiff.changes.added,
      removals: normalizedTextDiff.changes.removed
    }
  }
}

// LINE-BASED DIFF IMPLEMENTATION
export function calculateLineDiff(golden: string, output: string): LineDiffResult {
  const goldenLines = golden.split('\n')
  const outputLines = output.split('\n')
  
  const diffParts = computeLineDiff(goldenLines, outputLines)
  const stats = calculateLineStats(diffParts)
  const diffHtml = generateLineHtml(diffParts)
  
  return {
    diffScore: stats.diffScore,
    diffHtml,
    lineCount: { golden: goldenLines.length, output: outputLines.length },
    similarity: 1 - stats.diffScore,
    changes: stats.changes,
  }
}

interface LineDiffPart {
  operation: DiffOperation
  text: string
  lineNumber?: number
}

function computeLineDiff(golden: string[], output: string[]): LineDiffPart[] {
  const dp: number[][] = []
  const operations: DiffOperation[][] = []
  
  // Initialize DP table for line-based diff
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
        const isEqual = golden[i - 1].trim() === output[j - 1].trim()
        const isSimilar = calculateLineSimilarity(golden[i - 1], output[j - 1]) > 0.9
        
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
  
  // Backtrack to build line diff parts
  const diffParts: LineDiffPart[] = []
  let i = golden.length
  let j = output.length
  let goldenLineNum = golden.length
  let outputLineNum = output.length
  
  while (i > 0 || j > 0) {
    const operation = operations[i][j]
    
    switch (operation) {
      case DiffOperation.EQUAL:
        diffParts.unshift({
          operation: DiffOperation.EQUAL,
          text: golden[i - 1],
          lineNumber: goldenLineNum,
        })
        i--
        j--
        goldenLineNum--
        outputLineNum--
        break
        
      case DiffOperation.DELETE:
        diffParts.unshift({
          operation: DiffOperation.DELETE,
          text: golden[i - 1],
          lineNumber: goldenLineNum,
        })
        i--
        goldenLineNum--
        break
        
      case DiffOperation.INSERT:
        diffParts.unshift({
          operation: DiffOperation.INSERT,
          text: output[j - 1],
          lineNumber: outputLineNum,
        })
        j--
        outputLineNum--
        break
        
      case DiffOperation.REPLACE:
        // For line-based diff, we show both deleted and inserted lines
        diffParts.unshift({
          operation: DiffOperation.DELETE,
          text: golden[i - 1],
          lineNumber: goldenLineNum,
        })
        diffParts.unshift({
          operation: DiffOperation.INSERT,
          text: output[j - 1],
          lineNumber: outputLineNum,
        })
        i--
        j--
        goldenLineNum--
        outputLineNum--
        break
    }
  }
  
  return diffParts
}

function calculateLineSimilarity(line1: string, line2: string): number {
  const trimmed1 = line1.trim()
  const trimmed2 = line2.trim()
  
  if (trimmed1 === trimmed2) return 1
  
  const maxLength = Math.max(trimmed1.length, trimmed2.length)
  if (maxLength === 0) return 1
  
  const editDistance = levenshteinDistance(trimmed1, trimmed2)
  return 1 - editDistance / maxLength
}

function calculateLineStats(diffParts: LineDiffPart[]): {
  diffScore: number
  changes: { added: number; removed: number; modified: number }
} {
  let added = 0
  let removed = 0
  let modified = 0
  let equal = 0
  
  diffParts.forEach(part => {
    switch (part.operation) {
      case DiffOperation.INSERT:
        added++
        break
      case DiffOperation.DELETE:
        removed++
        break
      case DiffOperation.REPLACE:
        modified++
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
    changes: { added, removed, modified },
  }
}

function generateLineHtml(diffParts: LineDiffPart[]): string {
  return diffParts
    .map(part => {
      switch (part.operation) {
        case DiffOperation.EQUAL:
          return `<div class="line-equal">${escapeHtml(part.text)}</div>`
          
        case DiffOperation.DELETE:
          return `<div class="line-delete bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-md border-l-4 border-red-500" title="Line ${part.lineNumber || 'unknown'} removed">
            <span class="text-xs text-red-600 dark:text-red-400 font-mono">- ${part.lineNumber || '?'}</span>
            <span class="ml-2 line-through">${escapeHtml(part.text)}</span>
          </div>`
          
        case DiffOperation.INSERT:
          return `<div class="line-insert bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-md border-l-4 border-green-500" title="Line ${part.lineNumber || 'unknown'} added">
            <span class="text-xs text-green-600 dark:text-green-400 font-mono">+ ${part.lineNumber || '?'}</span>
            <span class="ml-2">${escapeHtml(part.text)}</span>
          </div>`
          
        default:
          return `<div class="line-equal">${escapeHtml(part.text)}</div>`
      }
    })
    .join('')
}
