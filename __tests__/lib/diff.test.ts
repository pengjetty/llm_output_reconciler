import { calculateJsonDiff, inspectJsonNormalization } from '../../lib/diff'

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
})