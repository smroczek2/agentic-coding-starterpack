import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ScheduleChat } from "@/components/schedule/schedule-chat";

export default async function AssistantPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground">
          Ask questions about your schedule or get help with scheduling tasks
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <ScheduleChat />
      </div>
    </div>
  );
}
