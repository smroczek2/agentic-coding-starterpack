---
name: frontend-design
description: Primary UI skill for this project. Builds distinctive, production-grade interfaces using shadcn/ui, Tailwind CSS, Next.js 15 App Router, and React 19. Handles visual design direction, component architecture, UX states, frontend-backend wiring, and visual verification. Activates for any user-facing work — pages, components, forms, dashboards, landing pages, navigation.
model: sonnet
color: purple
---

# Frontend Design

Builds distinctive, production-grade interfaces that are visually memorable, properly wired to backend behavior, and complete in every UX state.

This is the **primary UI skill** for this project. It merges aesthetic creative direction with Next.js/shadcn/ui engineering patterns and frontend-backend wiring enforcement.

---

## Step 1: Design Thinking (Before Coding)

Before writing a single line, commit to a clear aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Choose deliberately — refined minimal, editorial, utilitarian, playful, bold typographic, architectural, warm/organic. Execute with precision.
- **Differentiation**: What makes this screen memorable? What's the one thing a user will remember?
- **Constraints**: Next.js App Router, shadcn/ui as the component system, Tailwind CSS, TypeScript strict.

**CRITICAL**: Generic AI aesthetics are the enemy. Avoid Inter/Roboto/Arial defaults, purple-gradient-on-white clichés, and cookie-cutter layouts. Every screen should feel intentionally designed for its context.

---

## Step 2: shadcn/ui as the Foundation

**Always use shadcn/ui as the component building block.** It provides accessibility, dark mode, and design system consistency for free.

### Check before building custom
```bash
ls src/components/ui/  # what's already installed
```

### Install components as needed
```bash
npx shadcn@latest add button card form dialog input select toast skeleton alert badge
```

### Why shadcn/ui?
- Radix UI primitives = accessibility built-in
- CSS variable theming = you can make it distinctive without fighting the system
- TypeScript-native, composable, no black-box styling

**Don't reinvent shadcn/ui components.** Build creative designs *with* them, not around them.

---

## Step 3: Make It Distinctive

Creative direction applies *on top of* shadcn/ui's structural foundation:

### Typography (biggest differentiator)
Use `next/font` to load a distinctive font pairing. Don't default to system fonts.

```typescript
import { Playfair_Display, DM_Sans } from "next/font/google";

const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body" });
```

Pair a characterful display font (headings) with a refined body font. The combination should feel designed, not defaulted.

### Color — Customize the Theme, Use Semantic Tokens
Customize `globals.css` CSS variables to build a distinctive palette. Once set, use **only semantic tokens** in components — never raw hex values.

```css
/* globals.css — give the design a real identity */
:root {
  --background: 0 0% 98%;         /* warm off-white, not pure white */
  --foreground: 222 20% 12%;      /* deep charcoal, not pure black */
  --primary: 24 80% 52%;          /* burnt orange — memorable */
  --accent: 162 45% 40%;          /* muted teal accent */
}
```

Then in components:
```typescript
className="bg-primary text-primary-foreground"  // ✓ semantic
className="bg-[#f97316]"                         // ✗ never do this
```

### Motion
Use CSS transitions and animations for high-impact moments. One well-orchestrated entrance is better than scattered micro-animations.

```typescript
// Staggered list reveal
className="animate-in fade-in slide-in-from-bottom-4 duration-300"
style={{ animationDelay: `${index * 50}ms` }}

// Smooth hover
className="transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
```

### Spatial Composition
Avoid predictable symmetric grids. Consider:
- Asymmetric layouts with intentional white space
- Grid-breaking hero elements
- Overlapping sections with z-index depth
- Generous padding that creates breathing room

---

## Step 4: Component Architecture

### Server Components by Default (Next.js 15)
```typescript
// Default: server component — can fetch directly
export default async function TasksPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, session.user.id));

  return (
    <main className="container mx-auto px-6 py-10">
      <h1 className="font-display text-4xl font-bold tracking-tight mb-8">My Tasks</h1>
      <TaskList tasks={tasks} />
    </main>
  );
}
```

Only add `"use client"` when you need: `useState`, `useEffect`, event handlers, or browser APIs.

### Composable Components
```typescript
// Good — composable, accepts className for creative overrides
export function FeatureCard({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("group hover:shadow-lg transition-shadow duration-200", className)}>
      <CardHeader>
        <CardTitle className="font-display">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}
```

Always use `cn()` from `@/lib/utils` for className merging.

---

## Step 5: UX States (All Required)

Every data-dependent screen needs all four states. No exceptions.

### Loading — Use Skeleton, Not Spinners
```typescript
import { Skeleton } from "@/components/ui/skeleton";

export function TaskListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Error State
```typescript
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <Alert variant="destructive" className="max-w-md mx-auto mt-8">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        {message}
        {retry && (
          <Button variant="outline" size="sm" onClick={retry}>Try again</Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

### Empty State
```typescript
export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />}
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 mb-6 max-w-sm text-sm">{description}</p>
      {action}
    </div>
  );
}
```

### Success State
Confirm mutations with toast, inline feedback, or optimistic UI updates — never silently succeed.

```typescript
import { toast } from "sonner";
toast.success("Task created successfully");
```

---

## Step 6: Responsive Design (Mobile-First)

```typescript
// Layout
className="flex flex-col md:flex-row gap-4 p-4 md:p-6 lg:p-8"

// Grid
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"

// Typography
className="text-2xl md:text-3xl lg:text-4xl font-bold"

// Touch targets (min 44×44px on mobile)
className="min-h-[44px] min-w-[44px]"
```

Breakpoints: `sm: 640px` · `md: 768px` · `lg: 1024px` · `xl: 1280px`

---

## Step 7: Accessibility

```typescript
// Icon-only buttons need labels
<Button aria-label="Delete task"><Trash2 className="h-4 w-4" /></Button>

// Form inputs need associated labels
<Label htmlFor="title">Title</Label>
<Input id="title" />

// Loading state communicated to screen readers
<button disabled={loading} aria-busy={loading}>
  {loading ? "Saving..." : "Save"}
</button>

// Semantic structure
<main><article><h1>Page Title</h1><section><h2>Section</h2></section></article></main>
```

shadcn/ui components have Radix accessibility built in. Prefer them over custom implementations.

---

## Step 8: Frontend-Backend Wiring Contract

For every user-facing feature, implement the full loop:

1. **User action in UI** triggers a real backend call (API route or server action)
2. **Backend executes** and returns real data or error
3. **UI reflects result** — success state, error message, or updated data

### Wiring Checklist (Must Pass)
- [ ] Every primary action calls a real backend handler (not mock/hardcoded data)
- [ ] Response data is rendered in the UI (not ignored)
- [ ] Errors are surfaced with user-readable copy
- [ ] Success feedback is visible after mutations
- [ ] Loading is visible during async operations
- [ ] Empty state has a clear next action
- [ ] Auth/permission failures redirect or show clear messaging

---

## Step 9: Visual Verification (BLOCKING)

After tests pass, **run the app and click through the feature**:

```bash
npm run dev
```

Check each affected page:
1. **Does it look designed?** — Distinctive typography, real layout, visual hierarchy
2. **Is boilerplate gone?** — No starter kit hero/demo content on this page
3. **Can a user complete the flow?** — Start action → fill → submit → see result
4. **Are all UX states visible?** — Trigger loading, empty, error, success
5. **Does navigation work?** — Can a user reach this feature from the main app?

**If any check fails, the task is not done.** Fix before moving on.

---

## Definition of Done

A user-facing feature is complete only when ALL pass:

- [ ] Pages have real layout, typography, and visual hierarchy (not bare HTML)
- [ ] Starter kit boilerplate not visible on any affected page
- [ ] Navigation includes routes to the new feature
- [ ] All UX states implemented with proper shadcn/ui components
- [ ] Every primary UI action wired to real backend behavior
- [ ] Auth failures handled in UI flow
- [ ] Critical user path passes at least one E2E test
- [ ] Visual verification performed by running the app
- [ ] Lint, typecheck, and tests are green
- [ ] The page looks like a finished product, not a prototype

---

## Anti-Patterns

❌ Generic fonts (Inter, Roboto, Arial, system-ui) — choose something with character
❌ Purple gradient on white — the most recognizable "AI-generated" cliché
❌ `bg-[#hex]` colors — always customize via CSS variables, then use semantic tokens
❌ Bare `<div>Loading...</div>` — use `<Skeleton>` components
❌ Backend-only completion — if users can't access it through the UI, it's not done
❌ All four UX states not handled — loading/error/empty/success are all required
❌ Vague CTA labels — "Submit" → "Create Task", "OK" → "Save Changes"
❌ Custom components when shadcn/ui has one — check `src/components/ui/` first
❌ `"use client"` everywhere — server components by default
❌ Accumulating UI debt — fix each screen before moving to the next task
