import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarDays, Clock, BarChart3, Sparkles } from "lucide-react";
import { SignInButton } from "@/components/auth/sign-in-button";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  // Redirect authenticated users to the schedule
  if (session) {
    redirect("/schedule");
  }

  // Landing page for unauthenticated users
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm">
              <CalendarDays className="h-9 w-9 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            CM Schedule
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            AI-powered scheduling for the CampMinder support team. Manage shifts,
            track fairness, and handle time-off requests all in one place.
          </p>
          <div className="pt-4">
            <SignInButton size="lg" className="px-8" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group p-8 border rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/5 mb-4 group-hover:bg-primary/10 transition-colors">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Smart Scheduling</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Multi-view calendar with drag-and-drop shift management
              </p>
            </div>
            <div className="group p-8 border rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/5 mb-4 group-hover:bg-primary/10 transition-colors">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-3">AI Assistant</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Generate schedules and find coverage with natural language
              </p>
            </div>
            <div className="group p-8 border rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/5 mb-4 group-hover:bg-primary/10 transition-colors">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Time Off</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Handle PTO requests with impact analysis and approval workflow
              </p>
            </div>
            <div className="group p-8 border rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/5 mb-4 group-hover:bg-primary/10 transition-colors">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-3">Fairness Tracking</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Monitor weekend, holiday, and on-call distribution
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
