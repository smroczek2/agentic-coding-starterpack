import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatMessage } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";

/**
 * GET /api/chat/messages
 * Load all chat messages for the current user.
 * Returns messages in chronological order for the chat UI.
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const messages = await db
      .select()
      .from(chatMessage)
      .where(eq(chatMessage.userId, session.user.id))
      .orderBy(asc(chatMessage.createdAt));

    // Transform to the format expected by useChat
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      parts: msg.parts,
      createdAt: msg.createdAt,
    }));

    return Response.json({ messages: formattedMessages });
  } catch (error) {
    console.error("Error loading chat messages:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

/**
 * POST /api/chat/messages
 * Save a chat message to the database.
 */
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { message } = await req.json();

    if (!message || !message.id || !message.role || !message.parts) {
      return new Response("Invalid message format", { status: 400 });
    }

    // Upsert the message (in case of retries)
    await db
      .insert(chatMessage)
      .values({
        id: message.id,
        userId: session.user.id,
        role: message.role,
        parts: message.parts,
      })
      .onConflictDoUpdate({
        target: chatMessage.id,
        set: {
          parts: message.parts,
        },
      });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error saving chat message:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

/**
 * DELETE /api/chat/messages
 * Clear all chat messages for the current user (start fresh conversation).
 */
export async function DELETE() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    await db
      .delete(chatMessage)
      .where(eq(chatMessage.userId, session.user.id));

    return Response.json({ success: true, message: "Conversation cleared" });
  } catch (error) {
    console.error("Error clearing chat messages:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
