# AI Assistant State Awareness Pattern

## Problem

AI assistants built with LLMs have no inherent awareness of:
1. **Current date/time** - The AI has a knowledge cutoff but doesn't know "today"
2. **Business state** - Active employees, pending requests, schedule gaps
3. **Conversation history** - Each API call starts fresh unless context is provided

This leads to issues like:
- Generating schedules for dates in the past
- Not knowing which fairness period applies (summer vs year)
- Losing conversation context on page refresh
- AI not being proactive about urgent alerts

## Solution

### 1. Dynamic Context Injection

Create a context builder that runs at the start of each chat request:

```typescript
// src/lib/ai-context.ts
export async function buildAIContext(userId: string): Promise<AIContext> {
  const now = new Date();

  return {
    // Temporal context
    currentDate: format(now, "yyyy-MM-dd"),
    dayOfWeek: format(now, "EEEE"),
    currentWeekStart: format(startOfWeek(now), "yyyy-MM-dd"),

    // Business state (fetched from DB)
    activeEmployeeCount: await getActiveEmployeeCount(userId),
    pendingTimeOffRequests: await getPendingRequestCount(userId),

    // Alerts
    upcomingUncoveredShifts: await getUncoveredShiftCount(userId),
  };
}

export function formatContextForPrompt(context: AIContext): string {
  return `
CURRENT CONTEXT:
- Today's Date: ${context.currentDate} (${context.dayOfWeek})
- Active Employees: ${context.activeEmployeeCount}
- Pending Requests: ${context.pendingTimeOffRequests}

IMPORTANT: Always use dates relative to TODAY (${context.currentDate}).
`;
}
```

Inject into system prompt:
```typescript
// In chat route
const context = await buildAIContext(userId);
const systemPrompt = BASE_PROMPT + formatContextForPrompt(context);
```

### 2. Conversation Persistence

Store chat messages in the database:

```typescript
// Schema
export const chatMessage = pgTable("chat_message", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id),
  role: text("role").notNull(),
  parts: jsonb("parts").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
```

Load on mount, save on change:
```typescript
// In chat component
useEffect(() => {
  // Load history on mount
  fetch("/api/chat/messages").then(/* setInitialMessages */);
}, []);

useEffect(() => {
  // Save new messages
  messages.forEach(msg => {
    if (!savedIds.has(msg.id)) saveMessage(msg);
  });
}, [messages]);
```

### 3. Context Refresh Tool

Give the AI a tool to refresh its awareness mid-conversation:

```typescript
getCurrentContext: {
  description: "Get current date, team status, and alerts",
  execute: async () => {
    const context = await buildAIContext(userId);
    return { ...context, message: "Use this for scheduling decisions" };
  },
}
```

## Key Principles

1. **Session-scoped memory**: Messages visible in UI = messages known to AI
2. **Fresh context per request**: Build context at request time, not startup
3. **Explicit date grounding**: Always tell AI what "today" is
4. **Proactive alerts**: Surface urgent items in the context
5. **Refresh capability**: Let AI query current state during long conversations

## What State the AI Should Always Know

| Category | Data | How Provided |
|----------|------|--------------|
| Temporal | Current date, time, week | System prompt |
| Temporal | Fairness period | System prompt |
| Team | Active employee count | System prompt |
| Alerts | Pending requests | System prompt |
| Alerts | Coverage gaps | System prompt |
| History | Previous messages | useChat initialMessages |
| Dynamic | Current DB state | Tools (getSchedule, etc.) |

## Anti-Patterns

- **Static system prompts**: Never hardcode dates or counts
- **Ephemeral state**: Conversation lost on page refresh
- **Implicit dates**: "Next week" without knowing today
- **Stale context**: Building context once at startup
