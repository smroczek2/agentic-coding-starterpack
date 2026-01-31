import { openai } from "@ai-sdk/openai";
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { CHAT_MODEL } from "@/lib/ai-models";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createAITools, proposals, type Proposal } from "@/lib/ai-tools";
import {
  sanitizeUserInput,
  SYSTEM_PROMPT_SAFETY_SUFFIX,
  checkRateLimit,
} from "@/lib/ai-safety";
import { logAIToolCall } from "@/lib/audit";
import { db } from "@/lib/db";
import { shift, schedule } from "@/lib/schema";
import { eq } from "drizzle-orm";
import {
  buildAIContext,
  formatContextForPrompt,
  getContextSummary,
  type AIContext,
} from "@/lib/ai-context";

// Type for text parts in UIMessage
interface TextPart {
  type: "text";
  text: string;
}

// Helper to extract text content from UIMessage parts
function getTextFromMessage(message: UIMessage): string {
  if (!message.parts || !Array.isArray(message.parts)) {
    return "";
  }
  return message.parts
    .filter((part): part is TextPart => part.type === "text" && "text" in part)
    .map((part) => part.text)
    .join(" ");
}

const BASE_SYSTEM_PROMPT = `You are an AI scheduling assistant for a support team. You help managers create and manage employee schedules.

You have access to powerful tools to:
- Query and analyze schedules, employees, and time-off requests
- Generate schedule proposals for review
- Check constraint violations before assignments
- Analyze workload fairness across employees
- Handle emergency situations like sick days

IMPORTANT WORKFLOW:
1. For READ operations (getting schedules, employees, etc.), use tools directly and provide information.
2. For WRITE operations (creating shifts, approving time-off, etc.), you must:
   - Create a PROPOSAL using the "propose*" tools
   - Explain the proposed changes clearly
   - Wait for the user to explicitly say "approve" before changes take effect

When users say "approve" or similar confirmations, you should acknowledge the approval and explain what changes were applied.

SCHEDULING RULES TO ENFORCE:
- Maximum 5 consecutive working days per employee
- Maximum 5 days per week per employee
- In a week with a holiday, maximum 4 working days
- On-call shifts require the employee to work the days before and after
- Respect employee shift preferences (early/mid/late) when possible

Be helpful, proactive, and always explain your reasoning when making suggestions.
${SYSTEM_PROMPT_SAFETY_SUFFIX}`;

/**
 * Build the full system prompt with dynamic context.
 * This ensures the AI always has current date/time and business state awareness.
 */
function buildSystemPrompt(context: AIContext): string {
  const contextSection = formatContextForPrompt(context);
  return `${BASE_SYSTEM_PROMPT}
${contextSection}`;
}

// Handle proposal approval
async function handleProposalApproval(
  proposalId: string,
  userId: string
): Promise<{ success: boolean; message: string; applied?: number }> {
  const proposal = proposals.get(proposalId);
  if (!proposal) {
    return { success: false, message: "Proposal not found or has expired" };
  }

  let appliedCount = 0;

  for (const change of proposal.changes) {
    try {
      if (change.type === "reassign_shift" && change.targetId) {
        // Update existing shift
        await db
          .update(shift)
          .set({
            employeeId: change.after?.employeeId as string,
            updatedAt: new Date(),
          })
          .where(eq(shift.id, change.targetId));
        appliedCount++;
      } else if (change.type === "create_shift" && change.after) {
        // Get or create schedule
        const [existingSchedule] = await db
          .select()
          .from(schedule)
          .where(eq(schedule.userId, userId))
          .limit(1);

        if (existingSchedule) {
          const afterData = change.after as {
            employeeId: string;
            shiftType: string;
            isWeekend: boolean;
          };
          await db.insert(shift).values({
            scheduleId: existingSchedule.id,
            employeeId: afterData.employeeId,
            date: change.date!,
            startTime: getShiftStartTime(afterData.shiftType),
            endTime: getShiftEndTime(afterData.shiftType),
            shiftType: afterData.shiftType,
            isWeekend: afterData.isWeekend || false,
            createdByUserId: userId,
          });
          appliedCount++;
        }
      } else if (
        (change.type === "approve_time_off" ||
          change.type === "deny_time_off") &&
        change.targetId
      ) {
        const status = change.type === "approve_time_off" ? "approved" : "denied";
        const denialReason =
          change.type === "deny_time_off"
            ? ((change.after as { reason?: string })?.reason ?? null)
            : null;

        await db
          .update(
            await import("@/lib/schema").then((m) => m.timeOffRequest)
          )
          .set({
            status,
            denialReason,
            reviewedBy: userId,
            reviewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            eq(
              (await import("@/lib/schema").then((m) => m.timeOffRequest)).id,
              change.targetId
            )
          );
        appliedCount++;
      }
    } catch (error) {
      console.error(`Failed to apply change:`, error);
    }
  }

  // Remove proposal after applying
  proposals.delete(proposalId);

  await logAIToolCall(
    userId,
    "proposal_approved",
    { proposalId, changeCount: proposal.changes.length },
    { appliedCount }
  );

  return {
    success: appliedCount > 0,
    message: `Applied ${appliedCount} of ${proposal.changes.length} changes`,
    applied: appliedCount,
  };
}

function getShiftStartTime(shiftType: string): string {
  switch (shiftType) {
    case "early":
      return "07:00";
    case "mid":
      return "09:00";
    case "late":
      return "10:30";
    default:
      return "09:00";
  }
}

function getShiftEndTime(shiftType: string): string {
  switch (shiftType) {
    case "early":
      return "15:30";
    case "mid":
      return "17:30";
    case "late":
      return "18:00";
    default:
      return "17:30";
  }
}

// Check if a message is an approval
function isApprovalMessage(content: string): boolean {
  const approvalPatterns = [
    /^approve$/i,
    /^yes$/i,
    /^confirm$/i,
    /^do it$/i,
    /^go ahead$/i,
    /^apply$/i,
    /^yes,?\s*(please|go ahead|do it|apply|confirm)/i,
    /approve\s*(it|the|this|that)?/i,
    /looks?\s*good/i,
    /^ok$/i,
    /^okay$/i,
  ];

  return approvalPatterns.some((pattern) => pattern.test(content.trim()));
}

// Find the most recent proposal
function findRecentProposal(): Proposal | null {
  let mostRecent: Proposal | null = null;
  let mostRecentTime = 0;

  proposals.forEach((proposal) => {
    const createdTime = new Date(proposal.createdAt).getTime();
    if (createdTime > mostRecentTime) {
      mostRecentTime = createdTime;
      mostRecent = proposal;
    }
  });

  return mostRecent;
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    // Rate limiting
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          resetIn: Math.ceil(rateLimit.resetIn / 1000),
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build dynamic context - this ensures AI always knows current date/time and business state
    const context = await buildAIContext(userId);
    const systemPrompt = buildSystemPrompt(context);

    // Log context for debugging
    console.log("AI Context:", getContextSummary(context));

    const { messages }: { messages: UIMessage[] } = await req.json();

    // Get the last user message for processing
    const lastUserMessage = messages
      .filter((m) => m.role === "user")
      .pop();

    // Extract text content from the last user message
    const lastContent = lastUserMessage
      ? getTextFromMessage(lastUserMessage)
      : "";

    // Sanitize user input
    if (lastContent) {
      const sanitized = sanitizeUserInput(lastContent);

      if (sanitized.wasModified) {
        // Log potential injection attempt
        console.warn("Potential injection attempt detected:", {
          userId,
          patterns: sanitized.detectedPatterns,
        });
      }
    }

    if (isApprovalMessage(lastContent)) {
      // Find the most recent proposal and apply it
      const recentProposal = findRecentProposal();
      if (recentProposal) {
        const result = await handleProposalApproval(recentProposal.id, userId);

        // Return a simple response about what was applied
        const approvalResponse = result.success
          ? `✅ ${result.message}. The schedule has been updated.`
          : `❌ ${result.message}`;

        // Continue with the AI to provide a natural response
        const approvalMessages: UIMessage[] = [
          ...messages,
          {
            id: `approval-${Date.now()}`,
            role: "assistant" as const,
            parts: [{ type: "text", text: approvalResponse }],
          },
        ];

        // Let the AI acknowledge and provide context
        const tools = createAITools(userId);

        const result2 = streamText({
          model: openai(CHAT_MODEL),
          system: systemPrompt,
          messages: convertToModelMessages(approvalMessages),
          tools,
          stopWhen: stepCountIs(3),
        });

        return (
          result2 as unknown as { toUIMessageStreamResponse: () => Response }
        ).toUIMessageStreamResponse();
      }
    }

    // Normal message processing
    const tools = createAITools(userId);

    const result = streamText({
      model: openai(CHAT_MODEL),
      system: systemPrompt,
      messages: convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(5), // Allow chained tool calls
      onFinish: async ({ response }) => {
        // Log the conversation for debugging
        console.log("Chat finished:", {
          userId,
          model: CHAT_MODEL,
          messageCount: messages.length,
          toolCalls: response.messages.filter((m) => m.role === "tool").length,
        });
      },
    });

    return (
      result as unknown as { toUIMessageStreamResponse: () => Response }
    ).toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
