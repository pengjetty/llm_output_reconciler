// JSON utility functions for parsing, validation, normalization, and comparison

/**
 * Extracts JSON content from markdown code blocks
 */
export function extractJsonFromMarkdown(str: string): string {
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

/**
 * Checks if a string is valid JSON, handling markdown formatting
 */
export function isValidJson(str: string): boolean {
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

/**
 * Normalizes JSON string by parsing and reformatting with consistent structure
 */
export function normalizeJson(jsonStr: string): { normalized: string; parsed: any; error?: string } {
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

/**
 * Normalizes a JSON object by sorting keys and arrays for consistent comparison
 */
export function normalizeJsonObject(obj: any): any {
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

/**
 * Deep equality comparison for JSON objects with optional tolerance for floating-point numbers
 */
export function deepEqual(obj1: any, obj2: any, tolerance: number = 0): boolean {
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

/**
 * Calculates similarity between two objects using fuzzy matching
 */
export function calculateObjectSimilarity(obj1: any, obj2: any): number {
  if (deepEqual(obj1, obj2)) return 1.0
  
  // Use granular similarity calculation for better accuracy
  const granular = calculateGranularSimilarity(obj1, obj2)
  return granular.matches / granular.total
}

/**
 * Calculates granular similarity that counts all individual key-value pairs
 */
export function calculateGranularSimilarity(obj1: any, obj2: any): { matches: number; total: number } {
  // If types don't match, count as 1 total with 0 matches
  if (typeof obj1 !== typeof obj2) return { matches: 0, total: 1 }
  if (obj1 == null || obj2 == null) return { matches: obj1 === obj2 ? 1 : 0, total: 1 }
  
  // For primitives, count as 1 total with 1 match if equal, 0 if not
  if (typeof obj1 !== 'object') return { matches: obj1 === obj2 ? 1 : 0, total: 1 }
  
  // For arrays, recursively compare each element
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    const maxLen = Math.max(obj1.length, obj2.length)
    if (maxLen === 0) return { matches: 1, total: 1 }
    
    let totalMatches = 0
    let totalCount = 0
    
    const minLen = Math.min(obj1.length, obj2.length)
    for (let i = 0; i < minLen; i++) {
      const result = calculateGranularSimilarity(obj1[i], obj2[i])
      totalMatches += result.matches
      totalCount += result.total
    }
    
    // Count missing elements as non-matches
    const missingElements = maxLen - minLen
    totalCount += missingElements
    
    return { matches: totalMatches, total: totalCount }
  }
  
  // For objects, recursively compare all key-value pairs
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  const allKeys = new Set([...keys1, ...keys2])
  
  if (allKeys.size === 0) return { matches: 1, total: 1 }
  
  let totalMatches = 0
  let totalCount = 0
  
  allKeys.forEach(key => {
    if (key in obj1 && key in obj2) {
      // Both objects have this key, compare values recursively
      const result = calculateGranularSimilarity(obj1[key], obj2[key])
      totalMatches += result.matches
      totalCount += result.total
    } else {
      // Key exists in only one object, count as non-match
      totalCount += 1
    }
  })
  
  return { matches: totalMatches, total: totalCount }
}