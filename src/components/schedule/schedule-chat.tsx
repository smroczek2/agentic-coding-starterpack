"use client";

import { useChat, type UIMessage } from "@ai-sdk/react";
import { useState, useEffect, useRef, useCallback, type ReactNode, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Bot,
  User,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Users,
  Clock,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const SUGGESTED_QUESTIONS = [
  "Who is working this week?",
  "Show me pending time off requests",
  "Generate a schedule for next week",
  "Analyze workload fairness this month",
];

const QUICK_ACTIONS = [
  { label: "This week", prompt: "Give me a summary of this week's schedule" },
  { label: "Available", prompt: "Who is available for a shift tomorrow?" },
  { label: "Time off", prompt: "Show me pending time off requests" },
  { label: "Generate", prompt: "Generate a schedule for next week" },
];

type TextPart = { type?: string; text?: string };
type MaybePartsMessage = {
  display?: ReactNode;
  parts?: TextPart[];
  content?: TextPart[];
};

function renderMessageContent(message: MaybePartsMessage): ReactNode {
  if (message.display) return message.display;
  const parts = Array.isArray(message.parts)
    ? message.parts
    : Array.isArray(message.content)
      ? message.content
      : [];
  return parts.map((p, idx) =>
    p?.type === "text" && p.text ? (
      <ReactMarkdown key={idx}>{p.text}</ReactMarkdown>
    ) : null
  );
}

// Check if a message contains a proposal that needs approval
function containsProposal(message: MaybePartsMessage): boolean {
  const parts = Array.isArray(message.parts)
    ? message.parts
    : Array.isArray(message.content)
      ? message.content
      : [];

  const textContent = parts
    .filter((p) => p?.type === "text" && p.text)
    .map((p) => p.text || "")
    .join(" ");

  return (
    textContent.includes("requiresApproval") ||
    textContent.includes("proposed") ||
    textContent.includes("Proposed") ||
    textContent.includes("proposal") ||
    textContent.includes("approve") ||
    textContent.includes("confirm")
  );
}

// Get tool name from a tool part
function getToolName(part: { toolInvocation?: { toolName?: string } }): string | null {
  const invocation = part.toolInvocation;
  return invocation?.toolName || null;
}

// Get friendly tool description
function getToolDescription(toolName: string): string {
  const descriptions: Record<string, string> = {
    getSchedule: "Fetching schedule",
    getEmployees: "Loading employees",
    findAvailableEmployees: "Finding available staff",
    getTimeOffRequests: "Checking time off",
    getWeekSummary: "Summarizing week",
    proposeScheduleChange: "Preparing changes",
    generateWeekSchedule: "Generating schedule",
    analyzeWorkloadFairness: "Analyzing fairness",
    analyzeTimeOffImpact: "Checking impact",
    checkConstraints: "Validating rules",
    handleSickDay: "Finding coverage",
    findCoverage: "Finding replacements",
  };
  return descriptions[toolName] || "Processing";
}

export function ScheduleChat() {
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const savedMessageIds = useRef<Set<string>>(new Set());

  // Load chat history on mount
  useEffect(() => {
    async function loadMessages() {
      try {
        const response = await fetch("/api/chat/messages");
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            setInitialMessages(data.messages);
            // Track which messages are already saved
            data.messages.forEach((msg: UIMessage) => savedMessageIds.current.add(msg.id));
          }
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    loadMessages();
  }, []);

  const { messages, sendMessage, status, setMessages } = useChat({
    messages: initialMessages.length > 0 ? initialMessages : undefined,
  });

  // Save new messages to the database
  const saveMessage = useCallback(async (message: UIMessage) => {
    if (savedMessageIds.current.has(message.id)) return;

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (response.ok) {
        savedMessageIds.current.add(message.id);
      }
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  }, []);

  // Save messages when they change
  useEffect(() => {
    if (isLoadingHistory || status === "streaming") return;

    // Save any new messages
    messages.forEach((msg) => {
      if (!savedMessageIds.current.has(msg.id)) {
        saveMessage(msg);
      }
    });
  }, [messages, status, isLoadingHistory, saveMessage]);

  // Clear conversation
  const clearConversation = async () => {
    try {
      const response = await fetch("/api/chat/messages", { method: "DELETE" });
      if (response.ok) {
        setMessages([]);
        savedMessageIds.current.clear();
      }
    } catch (error) {
      console.error("Failed to clear conversation:", error);
    }
  };

  const [input, setInput] = useState("");

  // Check if the last assistant message has a pending proposal
  const hasPendingProposal = useMemo(() => {
    const lastAssistantMessage = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    return lastAssistantMessage
      ? containsProposal(lastAssistantMessage as MaybePartsMessage)
      : false;
  }, [messages]);

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  const handleQuickAction = (prompt: string) => {
    if (status === "streaming") return;
    sendMessage({ text: prompt });
  };

  const handleApprove = () => {
    if (status === "streaming") return;
    sendMessage({ text: "approve" });
  };

  const handleReject = () => {
    if (status === "streaming") return;
    sendMessage({ text: "reject, don't apply these changes" });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || status === "streaming") return;
    sendMessage({ text });
    setInput("");
  };

  // Show loading state while fetching history
  if (isLoadingHistory) {
    return (
      <div className="flex flex-col h-full border rounded-lg bg-background items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-lg bg-background">
      {/* Quick Actions Bar */}
      {messages.length > 0 && (
        <div className="flex gap-2 p-2 border-b overflow-x-auto items-center">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              size="sm"
              className="text-xs shrink-0"
              onClick={() => handleQuickAction(action.prompt)}
              disabled={status === "streaming"}
            >
              {action.label}
            </Button>
          ))}
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            className="text-xs shrink-0 text-muted-foreground hover:text-destructive"
            onClick={clearConversation}
            disabled={status === "streaming"}
            title="Clear conversation and start fresh"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                AI Schedule Assistant
              </h3>
              <p className="text-muted-foreground max-w-md">
                I can help you generate schedules, find coverage, analyze
                fairness, and manage time-off requests. All changes require your
                approval before being applied.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Try asking:</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <Button
                    key={question}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestedQuestion(question)}
                    className="text-xs"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-3 gap-4 pt-4 max-w-md">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">
                  Generate Schedules
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Find Coverage</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Track Fairness</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" && "justify-end"
                )}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <Card
                  className={cn(
                    "p-3 max-w-[80%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {renderMessageContent(message as MaybePartsMessage)}
                    </div>
                  ) : (
                    <div className="text-sm">
                      {renderMessageContent(message as MaybePartsMessage)}
                    </div>
                  )}

                  {/* Show tool invocations with better UX */}
                  {message.parts?.map((part, index) => {
                    if (part.type?.startsWith("tool-")) {
                      const state = "state" in part ? String(part.state) : "";
                      const toolName = getToolName(
                        part as { toolInvocation?: { toolName?: string } }
                      );
                      const isComplete =
                        state === "done" || state === "output-available";

                      return (
                        <div
                          key={index}
                          className="mt-2 pt-2 border-t flex items-center gap-2"
                        >
                          {isComplete ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                          <Badge variant="outline" className="text-xs">
                            {isComplete ? "Done" : "Running"}:{" "}
                            {toolName ? getToolDescription(toolName) : "Processing"}
                          </Badge>
                        </div>
                      );
                    }
                    return null;
                  })}
                </Card>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {status === "streaming" && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                </div>
                <Card className="p-3 bg-muted">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Thinking...
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Approval buttons when there's a pending proposal */}
      {hasPendingProposal && status !== "streaming" && (
        <div className="p-3 border-t bg-amber-50 dark:bg-amber-950/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-amber-700 dark:text-amber-400">
              Changes require your approval
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button size="sm" onClick={handleApprove}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <form onSubmit={onSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              hasPendingProposal
                ? "Type 'approve' to apply changes, or ask a question..."
                : "Ask about your schedule..."
            }
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={status === "streaming" || !input.trim()}
          >
            {status === "streaming" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
