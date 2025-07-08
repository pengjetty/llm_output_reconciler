import { 
  isValidJson, 
  extractJsonFromMarkdown, 
  normalizeJson, 
  normalizeJsonObject, 
  deepEqual, 
  calculateObjectSimilarity, 
  calculateGranularSimilarity 
} from '../../lib/json-utils'
import { calculateJsonDiff, inspectJsonNormalization } from '../../lib/diff'

describe('JSON Utilities', () => {
  describe('isValidJson', () => {
    test('should validate simple JSON object', () => {
      expect(isValidJson('{"name": "test", "value": 42}')).toBe(true)
    })

    test('should validate JSON array', () => {
      expect(isValidJson('[1, 2, 3]')).toBe(true)
    })

    test('should handle JSON with markdown formatting', () => {
      expect(isValidJson('```json\n{"name": "test"}\n```')).toBe(true)
    })

    test('should handle JSON with generic code blocks', () => {
      expect(isValidJson('```\n{"name": "test"}\n```')).toBe(true)
    })

    test('should handle inline code', () => {
      expect(isValidJson('`{"name": "test"}`')).toBe(true)
    })

    test('should reject invalid JSON', () => {
      expect(isValidJson('{"name": "test", "value": 42')).toBe(false)
    })

    test('should reject non-JSON text', () => {
      expect(isValidJson('not json at all')).toBe(false)
    })
  })

  describe('extractJsonFromMarkdown', () => {
    test('should extract from json code block', () => {
      const input = '```json\n{"name": "test"}\n```'
      const result = extractJsonFromMarkdown(input)
      expect(result).toBe('{"name": "test"}')
    })

    test('should extract from generic code block', () => {
      const input = '```\n{"name": "test"}\n```'
      const result = extractJsonFromMarkdown(input)
      expect(result).toBe('{"name": "test"}')
    })

    test('should extract from inline code', () => {
      const input = '`{"name": "test"}`'
      const result = extractJsonFromMarkdown(input)
      expect(result).toBe('{"name": "test"}')
    })

    test('should return unchanged if no markdown', () => {
      const input = '{"name": "test"}'
      const result = extractJsonFromMarkdown(input)
      expect(result).toBe('{"name": "test"}')
    })
  })

  describe('normalizeJson', () => {
    test('should normalize simple JSON object', () => {
      const input = '{"b": 2, "a": 1}'
      const result = normalizeJson(input)
      
      expect(result.error).toBeUndefined()
      expect(result.parsed).toEqual({ a: 1, b: 2 })
      expect(JSON.parse(result.normalized)).toEqual({ a: 1, b: 2 })
    })

    test('should handle invalid JSON with error', () => {
      const input = '{"a": 1, "b": 2'  // Missing closing brace
      const result = normalizeJson(input)
      
      expect(result.error).toBeDefined()
      expect(result.parsed).toBeNull()
      expect(result.normalized).toBe(input)
    })

    test('should extract and normalize markdown JSON', () => {
      const input = '```json\n{"b": 2, "a": 1}\n```'
      const result = normalizeJson(input)
      
      expect(result.error).toBeUndefined()
      expect(result.parsed).toEqual({ a: 1, b: 2 })
    })
  })

  describe('normalizeJsonObject', () => {
    test('should sort object keys', () => {
      const input = { c: 3, a: 1, b: 2 }
      const result = normalizeJsonObject(input)
      expect(Object.keys(result)).toEqual(['a', 'b', 'c'])
    })

    test('should sort nested objects', () => {
      const input = { z: { y: 2, x: 1 }, a: 1 }
      const result = normalizeJsonObject(input)
      expect(result).toEqual({ a: 1, z: { x: 1, y: 2 } })
    })

    test('should sort arrays with id fields', () => {
      const input = [{ id: 2, name: "b" }, { id: 1, name: "a" }]
      const result = normalizeJsonObject(input)
      expect(result).toEqual([{ id: 1, name: "a" }, { id: 2, name: "b" }])
    })

    test('should sort arrays with name fields', () => {
      const input = [{ name: "zebra" }, { name: "apple" }]
      const result = normalizeJsonObject(input)
      expect(result[0].name).toBe("apple")
      expect(result[1].name).toBe("zebra")
    })

    test('should preserve array order without sortable keys', () => {
      const input = [{ value: 1 }, { value: 2 }, { value: 3 }]
      const result = normalizeJsonObject(input)
      expect(result).toEqual([{ value: 1 }, { value: 2 }, { value: 3 }])
    })

    test('should handle null values', () => {
      const input = { a: null, b: { c: null } }
      const result = normalizeJsonObject(input)
      expect(result).toEqual({ a: null, b: { c: null } })
    })
  })

  describe('deepEqual', () => {
    test('should handle identical objects', () => {
      const obj1 = { a: 1, b: 2 }
      const obj2 = { a: 1, b: 2 }
      expect(deepEqual(obj1, obj2)).toBe(true)
    })

    test('should handle different objects', () => {
      const obj1 = { a: 1, b: 2 }
      const obj2 = { a: 1, b: 3 }
      expect(deepEqual(obj1, obj2)).toBe(false)
    })

    test('should handle arrays', () => {
      const arr1 = [1, 2, 3]
      const arr2 = [1, 2, 3]
      expect(deepEqual(arr1, arr2)).toBe(true)
    })

    test('should handle nested structures', () => {
      const obj1 = { a: { b: [1, 2, { c: 3 }] } }
      const obj2 = { a: { b: [1, 2, { c: 3 }] } }
      expect(deepEqual(obj1, obj2)).toBe(true)
    })

    test('should handle floating point tolerance', () => {
      const obj1 = { value: 3.14159 }
      const obj2 = { value: 3.14160 }
      expect(deepEqual(obj1, obj2, 0.001)).toBe(true)
      expect(deepEqual(obj1, obj2, 0.00001)).toBe(false)
    })
  })

  describe('calculateGranularSimilarity', () => {
    test('should count exact matches for simple objects', () => {
      const obj1 = { a: 1, b: 2, c: 3 }
      const obj2 = { a: 1, b: 2, c: 4 }
      const result = calculateGranularSimilarity(obj1, obj2)
      expect(result.matches).toBe(2)
      expect(result.total).toBe(3)
    })

    test('should handle different keys', () => {
      const obj1 = { a: 1, b: 2 }
      const obj2 = { a: 1, c: 3 }
      const result = calculateGranularSimilarity(obj1, obj2)
      expect(result.matches).toBe(1)
      expect(result.total).toBe(3) // a, b, c
    })

    test('should handle arrays recursively', () => {
      const arr1 = [1, 2, 3]
      const arr2 = [1, 2, 4]
      const result = calculateGranularSimilarity(arr1, arr2)
      expect(result.matches).toBe(2)
      expect(result.total).toBe(3)
    })

    test('should handle nested objects', () => {
      const obj1 = { user: { name: "John", age: 30 }, active: true }
      const obj2 = { user: { name: "John", age: 31 }, active: true }
      const result = calculateGranularSimilarity(obj1, obj2)
      expect(result.matches).toBe(2) // active: true, user.name: "John"
      expect(result.total).toBe(3)   // active, user.name, user.age
    })
  })

  describe('calculateObjectSimilarity', () => {
    test('should return 1 for identical objects', () => {
      const obj1 = { a: 1, b: 2 }
      const obj2 = { a: 1, b: 2 }
      expect(calculateObjectSimilarity(obj1, obj2)).toBe(1)
    })

    test('should return proper fraction for partial matches', () => {
      const obj1 = { a: 1, b: 2, c: 3 }
      const obj2 = { a: 1, b: 2, c: 4 }
      expect(calculateObjectSimilarity(obj1, obj2)).toBe(2/3)
    })

    test('should return 0 for completely different objects', () => {
      const obj1 = { a: 1, b: 2 }
      const obj2 = { c: 3, d: 4 }
      expect(calculateObjectSimilarity(obj1, obj2)).toBe(0)
    })
  })
})

describe('JSON Diff Algorithm', () => {
  describe('calculateJsonDiff', () => {
    test('should handle identical JSON objects', () => {
      const golden = '{"name": "test", "value": 42}'
      const output = '{"name": "test", "value": 42}'
      
      const result = calculateJsonDiff(golden, output)
      
      expect(result.similarity).toBe(1)
      expect(result.diffScore).toBe(0)
      expect(result.isValidJson.golden).toBe(true)
      expect(result.isValidJson.output).toBe(true)
      expect(result.changes.additions).toBe(0)
      expect(result.changes.removals).toBe(0)
    })

    test('should handle JSON with different key order', () => {
      const golden = '{"name": "test", "value": 42, "active": true}'
      const output = '{"active": true, "value": 42, "name": "test"}'
      
      const result = calculateJsonDiff(golden, output)
      
      expect(result.similarity).toBe(1)
      expect(result.diffScore).toBe(0)
      expect(result.isValidJson.golden).toBe(true)
      expect(result.isValidJson.output).toBe(true)
    })

    test('should handle JSON with different formatting', () => {
      const golden = '{"name":"test","value":42}'
      const output = `{
  "name": "test",
  "value": 42
}`
      
      const result = calculateJsonDiff(golden, output)
      
      expect(result.similarity).toBe(1)
      expect(result.diffScore).toBe(0)
    })

    test('should handle JSON arrays with same elements in different order', () => {
      const golden = '[{"id": 1, "name": "a"}, {"id": 2, "name": "b"}]'
      const output = '[{"id": 2, "name": "b"}, {"id": 1, "name": "a"}]'
      
      const result = calculateJsonDiff(golden, output)
      
      // Arrays with identifiable objects should be normalized and considered equal
      expect(result.similarity).toBe(1)
      expect(result.diffScore).toBe(0)
    })

    test('should handle JSON arrays with different elements', () => {
      const golden = '[{"id": 1, "name": "a"}, {"id": 2, "name": "b"}]'
      const output = '[{"id": 1, "name": "a"}, {"id": 3, "name": "c"}]'
      
      const result = calculateJsonDiff(golden, output)
      
      expect(result.similarity).toBeLessThan(1)
      expect(result.diffScore).toBeGreaterThan(0)
      expect(result.changes.additions).toBeGreaterThan(0)
      expect(result.changes.removals).toBeGreaterThan(0)
    })

    test('should handle nested JSON objects', () => {
      const golden = '{"user": {"name": "test", "profile": {"age": 25}}}'
      const output = '{"user": {"name": "test", "profile": {"age": 26}}}'
      
      const result = calculateJsonDiff(golden, output)
      
      expect(result.similarity).toBeLessThan(1)
      expect(result.diffScore).toBeGreaterThan(0)
      expect(result.changes.structuralChanges).toBeGreaterThan(0)
    })

    test('should handle JSON with markdown code blocks', () => {
      const golden = '{"name": "test", "value": 42}'
      const output = '```json\n{"name": "test", "value": 42}\n```'
      
      const result = calculateJsonDiff(golden, output)
      
      expect(result.similarity).toBe(1)
      expect(result.diffScore).toBe(0)
      expect(result.isValidJson.golden).toBe(true)
      expect(result.isValidJson.output).toBe(true)
    })

    test('should handle JSON with different markdown code block formats', () => {
      const golden = '```json\n{"name": "test"}\n```'
      const output = '```\n{"name": "test"}\n```'
      
      const result = calculateJsonDiff(golden, output)
      
      expect(result.similarity).toBe(1)
      expect(result.diffScore).toBe(0)
    })

    test('should handle invalid JSON gracefully', () => {
      const golden = '{"name": "test", "value": 42}'
      const output = '{"name": "test", "value": 42'  // Missing closing brace
      
      const result = calculateJsonDiff(golden, output)
      
      expect(result.isValidJson.golden).toBe(true)
      expect(result.isValidJson.output).toBe(false)
      expect(result.parseErrors.output).toBeDefined()
      expect(result.similarity).toBeLessThan(1)
    })

    test('should handle both inputs as invalid JSON', () => {
      const golden = 'not json at all'
      const output = 'also not json'
      
      const result = calculateJsonDiff(golden, output)
      
      expect(result.isValidJson.golden).toBe(false)
      expect(result.isValidJson.output).toBe(false)
      expect(result.parseErrors.golden).toBeDefined()
      expect(result.parseErrors.output).toBeDefined()
    })

    test('should handle empty JSON objects', () => {
      const golden = '{}'
      const output = '{}'
      
      const result = calculateJsonDiff(golden, output)
      
      expect(result.similarity).toBe(1)
      expect(result.diffScore).toBe(0)
    })

    test('should handle empty JSON arrays', () => {
      const golden = '[]'
      const output = '[]'
      
      const result = calculateJsonDiff(golden, output)
      
      expect(result.similarity).toBe(1)
      expect(result.diffScore).toBe(0)
    })

    test('should handle null values correctly', () => {
      const golden = '{"name": null, "value": 42}'
      const output = '{"name": null, "value": 42}'
      
      const result = calculateJsonDiff(golden, output)
      
      expect(result.similarity).toBe(1)
      expect(result.diffScore).toBe(0)
    })

    test('should handle floating point numbers with precision', () => {
      const golden = '{"pi": 3.14159, "e": 2.71828}'
      const output = '{"pi": 3.14159, "e": 2.71828}'
      
      const result = calculateJsonDiff(golden, output)
      
      expect(result.similarity).toBe(1)
      expect(result.diffScore).toBe(0)
    })

    test('should handle boolean values', () => {
      const golden = '{"active": true, "disabled": false}'
      const output = '{"active": true, "disabled": false}'
      
      const result = calculateJsonDiff(golden, output)
      
      expect(result.similarity).toBe(1)
      expect(result.diffScore).toBe(0)
    })

    test('should handle complex nested structures', () => {
      const golden = `{
        "users": [
          {"id": 1, "name": "Alice", "roles": ["admin", "user"]},
          {"id": 2, "name": "Bob", "roles": ["user"]}
        ],
        "meta": {"total": 2, "page": 1}
      }`
      
      const output = `{
        "meta": {"page": 1, "total": 2},
        "users": [
          {"roles": ["user"], "name": "Bob", "id": 2},
          {"roles": ["admin", "user"], "name": "Alice", "id": 1}
        ]
      }`
      
      const result = calculateJsonDiff(golden, output)
      
      expect(result.similarity).toBe(1)
      expect(result.diffScore).toBe(0)
    })

    test('should detect array element additions', () => {
      const golden = '[{"id": 1, "name": "a"}]'
      const output = '[{"id": 1, "name": "a"}, {"id": 2, "name": "b"}]'
      
      const result = calculateJsonDiff(golden, output)
      
      expect(result.similarity).toBeLessThan(1)
      expect(result.changes.additions).toBeGreaterThan(0)
    })

    test('should detect array element removals', () => {
      const golden = '[{"id": 1, "name": "a"}, {"id": 2, "name": "b"}]'
      const output = '[{"id": 1, "name": "a"}]'
      
      const result = calculateJsonDiff(golden, output)
      
      expect(result.similarity).toBeLessThan(1)
      expect(result.changes.removals).toBeGreaterThan(0)
    })
  })
})

describe('JSON Normalization Logic', () => {
  describe('inspectJsonNormalization', () => {
    test('should normalize simple JSON object', () => {
      const input = '{"b": 2, "a": 1}'
      const result = inspectJsonNormalization(input)
      
      expect(result.error).toBeUndefined()
      expect(result.parsed).toEqual({ a: 1, b: 2 })
      expect(JSON.parse(result.normalized)).toEqual({ a: 1, b: 2 })
    })

    test('should normalize JSON with nested objects', () => {
      const input = '{"z": {"y": 2, "x": 1}, "a": 1}'
      const result = inspectJsonNormalization(input)
      
      expect(result.error).toBeUndefined()
      expect(result.parsed).toEqual({ a: 1, z: { x: 1, y: 2 } })
    })

    test('should normalize arrays with objects that have id fields', () => {
      const input = '[{"id": 2, "name": "b"}, {"id": 1, "name": "a"}]'
      const result = inspectJsonNormalization(input)
      
      expect(result.error).toBeUndefined()
      expect(result.parsed).toEqual([
        { id: 1, name: "a" },
        { id: 2, name: "b" }
      ])
    })

    test('should normalize arrays with objects that have name fields', () => {
      const input = '[{"name": "zebra", "type": "animal"}, {"name": "apple", "type": "fruit"}]'
      const result = inspectJsonNormalization(input)
      
      expect(result.error).toBeUndefined()
      expect(result.parsed[0].name).toBe("apple")
      expect(result.parsed[1].name).toBe("zebra")
    })

    test('should preserve order for arrays without sortable keys', () => {
      const input = '[{"value": 1}, {"value": 2}, {"value": 3}]'
      const result = inspectJsonNormalization(input)
      
      expect(result.error).toBeUndefined()
      expect(result.parsed).toEqual([
        { value: 1 },
        { value: 2 },
        { value: 3 }
      ])
    })

    test('should handle null values in normalization', () => {
      const input = '{"a": null, "b": {"c": null}}'
      const result = inspectJsonNormalization(input)
      
      expect(result.error).toBeUndefined()
      expect(result.parsed).toEqual({ a: null, b: { c: null } })
    })

    test('should extract JSON from markdown code blocks', () => {
      const input = '```json\n{"a": 1, "b": 2}\n```'
      const result = inspectJsonNormalization(input)
      
      expect(result.error).toBeUndefined()
      expect(result.parsed).toEqual({ a: 1, b: 2 })
    })

    test('should extract JSON from generic code blocks', () => {
      const input = '```\n{"a": 1, "b": 2}\n```'
      const result = inspectJsonNormalization(input)
      
      expect(result.error).toBeUndefined()
      expect(result.parsed).toEqual({ a: 1, b: 2 })
    })

    test('should extract JSON from inline code', () => {
      const input = '`{"a": 1, "b": 2}`'
      const result = inspectJsonNormalization(input)
      
      expect(result.error).toBeUndefined()
      expect(result.parsed).toEqual({ a: 1, b: 2 })
    })

    test('should handle invalid JSON with error message', () => {
      const input = '{"a": 1, "b": 2'  // Missing closing brace
      const result = inspectJsonNormalization(input)
      
      expect(result.error).toBeDefined()
      expect(result.parsed).toBeNull()
      expect(result.normalized).toBe(input)
    })

    test('should handle complex nested structures', () => {
      const input = `{
        "c": [{"id": 3}, {"id": 1}, {"id": 2}],
        "a": {"z": 1, "y": 2},
        "b": 42
      }`
      
      const result = inspectJsonNormalization(input)
      
      expect(result.error).toBeUndefined()
      expect(result.parsed.a).toEqual({ y: 2, z: 1 })  // Keys sorted
      expect(result.parsed.c[0].id).toBe(1)  // Array sorted by id
      expect(result.parsed.c[1].id).toBe(2)
      expect(result.parsed.c[2].id).toBe(3)
    })

    test('should handle arrays with mixed types', () => {
      const input = '[1, "string", true, null, {"key": "value"}]'
      const result = inspectJsonNormalization(input)
      
      expect(result.error).toBeUndefined()
      expect(result.parsed).toEqual([1, "string", true, null, {"key": "value"}])
    })

    test('should handle deeply nested objects', () => {
      const input = '{"a": {"b": {"c": {"d": {"e": 1}}}}}'
      const result = inspectJsonNormalization(input)
      
      expect(result.error).toBeUndefined()
      expect(result.parsed.a.b.c.d.e).toBe(1)
    })
  })

  describe('Key-Value Pair Matching Logic', () => {
    test('should calculate exact percentage for partially matching objects', () => {
      const golden = '{"a": 1, "b": 2, "c": 3, "d": 4}'
      const output = '{"a": 1, "b": 2, "c": 999, "d": 888}'
      
      const result = calculateJsonDiff(golden, output)
      
      // 2 out of 4 key-value pairs match exactly (a=1, b=2)
      expect(result.similarity).toBe(0.5)
      expect(result.diffScore).toBe(0.5)
    })

    test('should calculate exact percentage for objects with different keys', () => {
      const golden = '{"a": 1, "b": 2}'
      const output = '{"a": 1, "c": 3}'
      
      const result = calculateJsonDiff(golden, output)
      
      // 1 out of 3 total keys match exactly (a=1)
      // Total keys: a, b, c
      expect(result.similarity).toBe(1/3)
      expect(result.diffScore).toBe(2/3)
    })

    test('should handle exact string matching without fuzzy logic', () => {
      const golden = '{"name": "John", "city": "New York"}'
      const output = '{"name": "John", "city": "New york"}'  // Different case
      
      const result = calculateJsonDiff(golden, output)
      
      // Only 1 out of 2 key-value pairs match exactly (name="John")
      expect(result.similarity).toBe(0.5)
      expect(result.diffScore).toBe(0.5)
    })

    test('should handle nested objects with partial matches', () => {
      const golden = '{"user": {"name": "John", "age": 30}, "active": true}'
      const output = '{"user": {"name": "John", "age": 31}, "active": true}'
      
      const result = calculateJsonDiff(golden, output)
      
      // Granular counting:
      // - "active": true (1 match)
      // - user.name: "John" (1 match)
      // - user.age: 30 vs 31 (0 matches)
      // Total: 2 matches out of 3 = 2/3
      expect(result.similarity).toBe(2/3)
      expect(result.diffScore).toBe(1/3)
    })

    test('should handle arrays with exact element matching', () => {
      const golden = '{"items": [1, 2, 3], "count": 3}'
      const output = '{"items": [1, 2, 4], "count": 3}'
      
      const result = calculateJsonDiff(golden, output)
      
      // Granular counting:
      // - "count": 3 (1 match)
      // - items[0]: 1 (1 match)
      // - items[1]: 2 (1 match)  
      // - items[2]: 3 vs 4 (0 matches)
      // Total: 3 matches out of 4 = 3/4 = 0.75
      expect(result.similarity).toBe(0.75)
      expect(result.diffScore).toBe(0.25)
    })

    test('should handle completely different objects', () => {
      const golden = '{"a": 1, "b": 2}'
      const output = '{"c": 3, "d": 4}'
      
      const result = calculateJsonDiff(golden, output)
      
      // No key-value pairs match
      expect(result.similarity).toBe(0)
      expect(result.diffScore).toBe(1)
    })

    test('should handle empty vs non-empty objects', () => {
      const golden = '{}'
      const output = '{"a": 1}'
      
      const result = calculateJsonDiff(golden, output)
      
      // 0 out of 1 key-value pairs match
      expect(result.similarity).toBe(0)
      expect(result.diffScore).toBe(1)
    })

    test('should verify no LCS string matching is used', () => {
      const golden = '{"message": "Hello World"}'
      const output = '{"message": "Hello Universe"}'  // Similar but not exact
      
      const result = calculateJsonDiff(golden, output)
      
      // Even though strings are similar, they don't match exactly
      expect(result.similarity).toBe(0)
      expect(result.diffScore).toBe(1)
    })

    test('should handle array objects with granular matching', () => {
      const golden = `{
        "users": [
          {"id": 1, "name": "Alice", "role": "admin"},
          {"id": 2, "name": "Bob", "role": "user"}
        ],
        "total": 2,
        "status": "active"
      }`
      
      const output = `{
        "users": [
          {"id": 1, "name": "Alice", "role": "admin"},
          {"id": 2, "name": "Bob", "role": "moderator"}
        ],
        "total": 2,
        "status": "active"
      }`
      
      const result = calculateJsonDiff(golden, output)
      
      // Granular counting of all key-value pairs:
      // - "total": 2 (1 match)
      // - "status": "active" (1 match)
      // - users[0].id: 1 (1 match)
      // - users[0].name: "Alice" (1 match)
      // - users[0].role: "admin" (1 match)
      // - users[1].id: 2 (1 match)
      // - users[1].name: "Bob" (1 match)
      // - users[1].role: "user" vs "moderator" (0 matches)
      // Total: 7 matches out of 8 = 7/8 = 0.875
      expect(result.similarity).toBe(7/8)
      expect(result.diffScore).toBe(1/8)
    })

    test('should handle arrays with completely different objects', () => {
      const golden = `{
        "items": [
          {"type": "book", "title": "1984"},
          {"type": "book", "title": "Brave New World"}
        ],
        "count": 2
      }`
      
      const output = `{
        "items": [
          {"type": "movie", "title": "Inception"},
          {"type": "movie", "title": "Matrix"}
        ],
        "count": 2
      }`
      
      const result = calculateJsonDiff(golden, output)
      
      // Granular counting:
      // - "count": 2 (1 match)
      // - items[0].type: "book" vs "movie" (0 matches)
      // - items[0].title: "1984" vs "Inception" (0 matches)
      // - items[1].type: "book" vs "movie" (0 matches)
      // - items[1].title: "Brave New World" vs "Matrix" (0 matches)
      // Total: 1 match out of 5 = 1/5 = 0.2
      expect(result.similarity).toBe(0.2)
      expect(result.diffScore).toBe(0.8)
    })

    test('should handle arrays with different lengths', () => {
      const golden = `{
        "tags": ["javascript", "react", "typescript"],
        "language": "en"
      }`
      
      const output = `{
        "tags": ["javascript", "react"],
        "language": "en"
      }`
      
      const result = calculateJsonDiff(golden, output)
      
      // Only 1 out of 2 top-level key-value pairs match exactly:
      // - "language": "en" matches exactly
      // - "tags" array doesn't match exactly (different lengths)
      expect(result.similarity).toBe(0.5)
      expect(result.diffScore).toBe(0.5)
    })

    test('should handle nested arrays with partial matches', () => {
      const golden = `{
        "departments": [
          {
            "name": "Engineering",
            "employees": [
              {"name": "Alice", "level": "senior"},
              {"name": "Bob", "level": "junior"}
            ]
          }
        ],
        "company": "TechCorp"
      }`
      
      const output = `{
        "departments": [
          {
            "name": "Engineering", 
            "employees": [
              {"name": "Alice", "level": "senior"},
              {"name": "Bob", "level": "mid"}
            ]
          }
        ],
        "company": "TechCorp"
      }`
      
      const result = calculateJsonDiff(golden, output)
      
      // Only 1 out of 2 top-level key-value pairs match exactly:
      // - "company": "TechCorp" matches exactly
      // - "departments" array doesn't match exactly (Bob's level is different in nested structure)
      expect(result.similarity).toBe(0.5)
      expect(result.diffScore).toBe(0.5)
    })

    test('should handle arrays with same elements but different order', () => {
      const golden = `{
        "priorities": [
          {"id": 1, "task": "Fix bug"},
          {"id": 2, "task": "Add feature"}
        ],
        "project": "WebApp"
      }`
      
      const output = `{
        "priorities": [
          {"id": 2, "task": "Add feature"},
          {"id": 1, "task": "Fix bug"}
        ],
        "project": "WebApp"
      }`
      
      const result = calculateJsonDiff(golden, output)
      
      // Both key-value pairs should match exactly because:
      // - "project": "WebApp" matches exactly
      // - "priorities" array should match exactly (same elements, normalized by id)
      expect(result.similarity).toBe(1)
      expect(result.diffScore).toBe(0)
    })
  })
})