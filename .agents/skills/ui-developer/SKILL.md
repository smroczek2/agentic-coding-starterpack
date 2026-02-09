---
name: ui-developer
description: Expert in UI/UX design and implementation using React, Next.js 15, shadcn/ui, and Tailwind CSS. Activates when creating or modifying components, designing user flows, implementing responsive layouts, ensuring accessibility, or working on any frontend visual elements. Focuses on user-centered design, consistent styling patterns, reusable component architecture, and seamless user experiences across devices.
---

# UI/UX Developer

Expert in user experience design and UI implementation for modern React applications using Next.js 15, shadcn/ui, and Tailwind CSS.

## When to Activate

**Activate when:**
- Creating new UI components or pages
- Designing user flows and interactions
- Modifying existing component styling or layout
- Implementing responsive designs
- Building forms, modals, cards, or visual elements
- Ensuring accessibility (a11y)
- Working on loading states, error states, or empty states

## Core Principles

### Server Components by Default

```typescript
// Server Component (default) — no "use client" needed
export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  return <Dashboard user={session.user} />;
}
```

Only add `"use client"` when you need: `useState`, `useEffect`, `onClick`, `onChange`, `useRef`, or browser APIs.

### Use shadcn/ui Components

**Always check `src/components/ui/` first.** Install new components:

```bash
pnpm dlx shadcn@latest add button card dialog form input select textarea
```

**Never build custom components when shadcn/ui has them.**

### Styling with Tailwind

**Semantic Colors (ALWAYS use these):**
- `text-foreground` / `text-muted-foreground` — text colors
- `bg-background` / `bg-card` / `bg-muted` — backgrounds
- `border-border` — borders
- `bg-primary` / `bg-destructive` — action colors

**Never use custom hex colors.** Always use semantic CSS variables.

**Responsive Design (mobile-first):**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
<div className="flex flex-col md:flex-row items-center">
<div className="text-sm md:text-base lg:text-lg">
```

## Component Patterns

### Page Layout
```typescript
export default async function FeaturePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Page Title</h1>
      <ClientComponent />
    </main>
  );
}
```

### Data Fetching Component
```typescript
"use client";
import { useState, useEffect } from "react";

export function DataList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/resource")
      .then(res => res.json())
      .then(d => setData(d.items))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!data.length) return <EmptyState />;

  return <div>{/* render data */}</div>;
}
```

### Three Required States

**Every data-driven component MUST handle:**

1. **Loading** — Skeleton or spinner while fetching
2. **Error** — User-friendly error with retry option
3. **Empty** — Helpful message when no data exists

```typescript
if (loading) return <div className="animate-pulse bg-muted h-32 rounded-lg" />;
if (error) return <p className="text-destructive">Something went wrong. Try again.</p>;
if (!items.length) return <p className="text-muted-foreground">No items yet. Create your first one.</p>;
```

## Accessibility

- Use semantic HTML (`<main>`, `<nav>`, `<section>`, `<article>`)
- Add `aria-label` to icon-only buttons
- Ensure keyboard navigation works (Tab, Enter, Escape)
- Use shadcn/ui components — they handle ARIA attributes
- Test with keyboard-only navigation
- Maintain color contrast ratios (4.5:1 minimum)

## Class Name Utility

Always use `cn()` for conditional classes:

```typescript
import { cn } from "@/lib/utils";

<div className={cn(
  "rounded-lg border p-4",
  isActive && "border-primary bg-primary/5",
  isDisabled && "opacity-50 pointer-events-none"
)} />
```

## Extended Patterns

For form patterns (react-hook-form + zod + shadcn), icon usage (Lucide React), and performance optimization (next/image, dynamic imports), see `docs/patterns/ui-patterns.md`.

## Anti-Patterns

❌ Use `"use client"` when not needed
❌ Build custom components when shadcn/ui has them
❌ Use hex colors instead of semantic variables
❌ Skip loading, error, or empty states
❌ Use `<img>` instead of `next/image`
❌ Put large bundles in client components (use dynamic imports)
❌ Forget keyboard navigation and accessibility
❌ Use index as key in lists
