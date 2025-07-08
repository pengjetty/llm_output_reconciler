import { calculateDiff, calculateLineDiff } from '../../lib/diff'

describe('Word-Level Diff Algorithm', () => {
  describe('calculateDiff', () => {
    test('should handle identical texts', () => {
      const golden = 'Hello world'
      const output = 'Hello world'
      
      const result = calculateDiff(golden, output)
      
      expect(result.similarity).toBe(1)
      expect(result.diffScore).toBe(0)
      expect(result.changes.added).toBe(0)
      expect(result.changes.removed).toBe(0)
      expect(result.changes.modified).toBe(0)
    })

    test('should handle completely different texts', () => {
      const golden = 'Hello world'
      const output = 'Goodbye universe'
      
      const result = calculateDiff(golden, output)
      
      expect(result.similarity).toBe(0)
      expect(result.diffScore).toBe(1)
      expect(result.changes.added).toBeGreaterThan(0)
      expect(result.changes.removed).toBeGreaterThan(0)
    })

    test('should handle partial word matches', () => {
      const golden = 'Hello world test'
      const output = 'Hello universe test'
      
      const result = calculateDiff(golden, output)
      
      expect(result.similarity).toBeGreaterThan(0)
      expect(result.similarity).toBeLessThan(1)
      expect(result.diffScore).toBeGreaterThan(0)
      expect(result.diffScore).toBeLessThan(1)
    })

    test('should handle word additions', () => {
      const golden = 'Hello world'
      const output = 'Hello beautiful world'
      
      const result = calculateDiff(golden, output)
      
      expect(result.similarity).toBeLessThan(1)
      expect(result.changes.added).toBe(1)
      expect(result.changes.removed).toBe(0)
    })

    test('should handle word removals', () => {
      const golden = 'Hello beautiful world'
      const output = 'Hello world'
      
      const result = calculateDiff(golden, output)
      
      expect(result.similarity).toBeLessThan(1)
      expect(result.changes.removed).toBe(1)
      expect(result.changes.added).toBe(0)
    })

    test('should handle empty strings', () => {
      const golden = ''
      const output = ''
      
      const result = calculateDiff(golden, output)
      
      expect(result.similarity).toBe(1)
      expect(result.diffScore).toBe(0)
    })

    test('should handle one empty string', () => {
      const golden = 'Hello world'
      const output = ''
      
      const result = calculateDiff(golden, output)
      
      expect(result.similarity).toBe(0)
      expect(result.diffScore).toBe(1)
      expect(result.changes.removed).toBe(2)
    })
  })
})

describe('Line-Level Diff Algorithm', () => {
  describe('calculateLineDiff', () => {
    test('should handle identical multi-line texts', () => {
      const golden = 'Line 1\nLine 2\nLine 3'
      const output = 'Line 1\nLine 2\nLine 3'
      
      const result = calculateLineDiff(golden, output)
      
      expect(result.similarity).toBe(1)
      expect(result.diffScore).toBe(0)
      expect(result.changes.added).toBe(0)
      expect(result.changes.removed).toBe(0)
    })

    test('should handle line additions', () => {
      const golden = 'Line 1\nLine 2'
      const output = 'Line 1\nLine 2\nLine 3'
      
      const result = calculateLineDiff(golden, output)
      
      expect(result.similarity).toBeLessThan(1)
      expect(result.changes.added).toBe(1)
      expect(result.changes.removed).toBe(0)
    })

    test('should handle line removals', () => {
      const golden = 'Line 1\nLine 2\nLine 3'
      const output = 'Line 1\nLine 3'
      
      const result = calculateLineDiff(golden, output)
      
      expect(result.similarity).toBeLessThan(1)
      expect(result.changes.removed).toBe(1)
      expect(result.changes.added).toBe(0)
    })

    test('should handle line modifications', () => {
      const golden = 'Line 1\nLine 2\nLine 3'
      const output = 'Line 1\nModified Line 2\nLine 3'
      
      const result = calculateLineDiff(golden, output)
      
      expect(result.similarity).toBeLessThan(1)
      expect(result.changes.modified).toBe(1)
    })

    test('should handle completely different texts', () => {
      const golden = 'Line A\nLine B'
      const output = 'Line X\nLine Y'
      
      const result = calculateLineDiff(golden, output)
      
      expect(result.similarity).toBe(0)
      expect(result.diffScore).toBe(1)
    })
  })
})