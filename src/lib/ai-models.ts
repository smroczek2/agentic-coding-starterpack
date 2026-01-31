/**
 * AI Model Configuration
 *
 * Model selection strategy:
 * - GPT-4.1: Smartest non-reasoning model for general chat and simple queries
 * - GPT-5.2: Reasoning model for complex scheduling decisions and constraint solving
 *
 * For Vercel AI SDK, use providerOptions.openai.reasoningEffort to control reasoning:
 * - 'none': No reasoning (default for GPT-4.1)
 * - 'low': Minimal reasoning (fast but smart)
 * - 'medium': Balanced reasoning
 * - 'high': Deep reasoning for complex problems
 */

// GPT-4.1: Smartest non-reasoning model for general chat
export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4.1";

// GPT-5.2: Reasoning model for complex scheduling decisions
export const REASONING_MODEL = process.env.OPENAI_REASONING_MODEL || "gpt-5.2";

// Reasoning effort levels for GPT-5.2
export type ReasoningEffort = "none" | "low" | "medium" | "high";

// Default reasoning effort for scheduling tasks
export const SCHEDULING_REASONING_EFFORT: ReasoningEffort = "low";

/**
 * Get provider options for OpenAI with reasoning effort
 */
export function getReasoningOptions(effort: ReasoningEffort = "low") {
  return {
    openai: {
      reasoningEffort: effort,
    },
  };
}
