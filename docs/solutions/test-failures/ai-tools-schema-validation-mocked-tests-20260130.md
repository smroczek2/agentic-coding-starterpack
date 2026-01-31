---
module: AI Tools (System-wide)
date: 2026-01-30
problem_type: test_failure
component: testing_framework
symptoms:
  - "Playwright tests passed with 100% success rate"
  - "AI chat API returned 200 OK but no assistant responses rendered"
  - "Browser console showed no errors, but AI was non-functional"
  - "API error in stream: Invalid schema for function getSchedule - got type None"
root_cause: test_isolation
resolution_type: code_fix
severity: high
tags: [test-quality, false-confidence, mocking, ai-sdk, schema-validation, integration-testing]
---

# Troubleshooting: AI Chat Tests Passed But Real Functionality Failed Due to Mocked API Responses

## Problem
All Playwright tests for AI chat functionality passed with 100% success rate, giving false confidence that the feature was working. However, when manually testing in the browser, the AI assistant returned no responses. The tests had mocked the API responses, completely bypassing the actual schema validation that OpenAI performs, hiding a critical schema configuration error.

## Environment
- Module: AI Tools (affects entire application)
- Next.js Version: 15.4.6
- AI SDK Version: 5.0.9
- Affected Component: AI tools system (`src/lib/ai-tools.ts` and `/api/chat`)
- Date: 2026-01-30

## Symptoms
- Playwright AI assistant tests all passing (100% success rate)
- Browser manual testing showed AI chat was completely non-functional
- API endpoint returned 200 OK status
- Network inspection showed streaming response with error: `"type":"error","errorText":"Invalid schema for function 'getSchedule': schema must be a JSON Schema of 'type: \"object\"', got 'type: \"None\"'."`
- No console errors in browser
- User messages appeared but no AI assistant responses rendered
- Quick action buttons and suggested questions were visible but non-functional

## What Didn't Work

**Attempted Solution 1:** Checked OpenAI API key and model configuration
- **Why it failed:** API key was valid and correctly configured. The problem was in how tool schemas were defined.

**Attempted Solution 2:** Inspected React state and client-side useChat hook
- **Why it failed:** The client was working correctly. The problem was server-side schema validation by OpenAI.

**Attempted Solution 3:** Checked network requests and API responses
- **Why it failed:** This revealed the error message in the stream, but the tests had passed because they never made real API calls.

## Solution

Fixed two critical issues in `src/lib/ai-tools.ts`:

**1. Changed tool property from `parameters` to `inputSchema`:**

The AI SDK v5 expects `inputSchema` for tool input schemas, not `parameters`.

**2. Wrapped Zod schemas with `zodSchema()` helper:**

Zod v4 schemas must be explicitly converted to JSON Schema format using the `zodSchema()` wrapper from the AI SDK.

**Code changes:**

```typescript
// Before (broken):
import { z } from "zod";
import { db } from "./db";

export function createAITools(userId: string) {
  return Object.fromEntries(
    Object.entries(toolSchemas).map(([name, schema]) => [
      name,
      {
        description: getToolDescription(name),
        parameters: schema,  // ❌ Wrong property name
        execute: toolImplementations[name],
      },
    ])
  );
}

// After (fixed):
import { z } from "zod";
import { zodSchema } from "ai";  // ✅ Import zodSchema wrapper
import { db } from "./db";

export function createAITools(userId: string) {
  return {
    getSchedule: {
      description: getToolDescription("getSchedule"),
      inputSchema: zodSchema(toolSchemas.getSchedule),  // ✅ Correct property + wrapper
      execute: toolImplementations.getSchedule,
    },
    // ... repeat for all 18 tools
  };
}
```

**Why the tests passed:**

The Playwright tests mocked the `/api/chat` responses, never actually calling OpenAI's API. The mocked responses didn't include schema validation, so the tests passed even though the real OpenAI API would reject the invalid schemas.

## Why This Works

**Root cause analysis:**

1. **Property name mismatch**: The AI SDK v5 expects tools to have an `inputSchema` property, not `parameters`. Using the wrong property name meant OpenAI received no schema information.

2. **Missing schema conversion**: Zod v4 schemas are not automatically converted to JSON Schema format. The `zodSchema()` wrapper from the AI SDK performs this conversion by:
   - Detecting Zod v4 schemas via the `_zod` property
   - Converting them to JSON Schema using `z4.toJSONSchema()`
   - Returning a properly formatted schema that OpenAI can validate

3. **Test isolation problem**: The tests mocked the streaming API responses, completely bypassing OpenAI's schema validation. This created false confidence - the tests passed because they never exercised the critical integration point where schemas are validated.

**Why the solution works:**

- `inputSchema` is the correct property name that the AI SDK expects
- `zodSchema()` properly converts Zod v4 schemas to OpenAI-compatible JSON Schema
- OpenAI now receives valid tool schemas and can successfully validate and use the tools

## Prevention

**Critical lesson: Tests that mock critical integration points are worse than no tests.**

### How to avoid this in future:

1. **Never mock critical validation points**: If a test mocks an API response that includes validation logic (like OpenAI's schema validation), you're creating a false sense of security. The test becomes meaningless.

2. **Distinguish between unit and integration tests**:
   - **Unit tests**: Test isolated logic, mock dependencies
   - **Integration tests**: Test real integrations, NO mocking of critical paths
   - For AI features, integration tests MUST actually call the AI provider (or use a test mode that validates schemas)

3. **What should have been tested**:
   ```typescript
   // ❌ BAD: Mocked response
   test('AI chat responds', async () => {
     // Mocks the entire /api/chat response
     mockFetch('/api/chat', { success: true, response: 'Hello!' });
     // This test is USELESS - it never validates tool schemas
   });

   // ✅ GOOD: Real integration test
   test('AI chat with real API', async () => {
     // Actually calls OpenAI with the tool schemas
     const response = await fetch('/api/chat', {
       method: 'POST',
       body: JSON.stringify({ messages: [{ text: 'hello' }] })
     });
     const stream = await response.text();
     // Validates that schemas are accepted by OpenAI
     expect(stream).not.toContain('"type":"error"');
   });
   ```

4. **Test schema validation explicitly**:
   ```typescript
   test('AI tool schemas are valid', () => {
     const tools = createAITools('test-user-id');
     // Verify each tool has inputSchema (not parameters)
     Object.values(tools).forEach(tool => {
       expect(tool).toHaveProperty('inputSchema');
       expect(tool.inputSchema).toHaveProperty('jsonSchema');
       expect(tool.inputSchema.jsonSchema.type).toBe('object');
     });
   });
   ```

5. **Update QA skill patterns**: The `qa-tester` skill should be updated to avoid creating tests that mock critical validation paths. Add a principle: "Integration tests must test real integrations, especially for external APIs that perform validation."

### Red flags that indicate test quality issues:

- ✅ Tests pass locally and in CI
- ✅ Test coverage is high (>80%)
- ❌ Manual testing reveals the feature doesn't work
- ❌ Tests mock responses from external APIs that validate schemas
- ❌ Tests don't actually exercise the integration point

**If all automated tests pass but manual testing reveals the feature is broken, your tests are giving false confidence and should be rewritten or removed.**

## Related Issues

No related issues documented yet.

---

**Meta-note on test quality**: This issue represents a fundamental testing anti-pattern where mocking creates false confidence. Tests that don't test reality are not just useless - they're actively harmful because they convince you everything works when it doesn't. Future documentation should reference this as a cautionary example of test isolation gone wrong.
