# UI Patterns Reference

Extended UI patterns for this project. Reference this file for detailed form and performance patterns.

## Form Patterns

### Use shadcn/ui Form Component

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export function TaskForm({ onSubmit }: { onSubmit: (data: z.infer<typeof formSchema>) => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", description: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating..." : "Create Task"}
        </Button>
      </form>
    </Form>
  );
}
```

## Icons

### Use Lucide React

```typescript
import { Check, X, Plus, Trash2, Edit, ChevronRight } from "lucide-react";

<Button>
  <Plus className="h-4 w-4 mr-2" />
  Add Task
</Button>

// Standard icon sizes
h-4 w-4   // 16px - inline with text, buttons
h-5 w-5   // 20px - larger buttons
h-6 w-6   // 24px - headers, prominent actions
h-8 w-8   // 32px - large interactive elements
```

## Performance Considerations

### Optimize Images

```typescript
import Image from "next/image";

<Image
  src={imageUrl}
  alt="Description"
  width={500}
  height={300}
  className="rounded-lg"
/>
```

### Lazy Load Components

```typescript
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("@/components/heavy-component"), {
  loading: () => <Skeleton className="h-32 w-full" />,
});
```

### Memoize Expensive Components

```typescript
import { memo } from "react";

export const ExpensiveItem = memo(function ExpensiveItem({ item }: { item: Item }) {
  return <Card>{/* Complex rendering */}</Card>;
});
```
