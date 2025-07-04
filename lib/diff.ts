// Simple word-level diffing logic
// This is a basic implementation. For more robust diffing,
// a library like 'diff-match-patch' could be integrated if compatible.

interface DiffResult {
  diffScore: number // Percentage of difference
  diffHtml: string // HTML string with highlighted differences
}

export function calculateDiff(golden: string, output: string): DiffResult {
  const goldenWords = golden.split(/\s+/).filter(Boolean)
  const outputWords = output.split(/\s+/).filter(Boolean)

  const dp: number[][] = []
  for (let i = 0; i <= goldenWords.length; i++) {
    dp[i] = []
    for (let j = 0; j <= outputWords.length; j++) {
      if (i === 0) {
        dp[i][j] = j
      } else if (j === 0) {
        dp[i][j] = i
      } else if (goldenWords[i - 1] === outputWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const levenshteinDistance = dp[goldenWords.length][outputWords.length]
  const maxLength = Math.max(goldenWords.length, outputWords.length)
  const diffScore = maxLength === 0 ? 0 : levenshteinDistance / maxLength

  // Generate HTML diff
  let i = goldenWords.length
  let j = outputWords.length
  const diffParts: string[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && goldenWords[i - 1] === outputWords[j - 1]) {
      diffParts.unshift(goldenWords[i - 1])
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j] === dp[i][j - 1] + 1)) {
      diffParts.unshift(`<span class="bg-green-200 dark:bg-green-800">${outputWords[j - 1]}</span>`)
      j--
    } else if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + 1)) {
      diffParts.unshift(`<span class="bg-red-200 dark:bg-red-800">${goldenWords[i - 1]}</span>`)
      i--
    } else {
      // This case should ideally not be reached with standard Levenshtein
      break
    }
  }

  const diffHtml = diffParts.join(" ")

  return { diffScore, diffHtml }
}
