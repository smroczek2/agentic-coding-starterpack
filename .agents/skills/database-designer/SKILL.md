---
name: database-designer
description: Specialized in designing database schemas with Drizzle ORM and PostgreSQL. Use when adding new tables, defining relationships, or modifying the database structure. Ensures proper foreign keys, timestamps, and data integrity.
---

# Database Designer

Expert in designing and implementing database schemas using Drizzle ORM with PostgreSQL.

## When to Activate

Use this skill when:
- Adding new tables to the database
- Defining relationships between entities
- Modifying existing schema
- Planning data models for features
- Setting up foreign keys and constraints

## Schema Patterns

### User-Specific Data Table

For data that belongs to a user (tasks, notes, projects, etc.):

```typescript
import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { user } from "./schema";

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Key Points:**
- UUID primary keys (consistent with existing schema)
- `userId` with CASCADE DELETE (data deleted when user deleted)
- Include `createdAt` and `updatedAt` timestamps
- Use `.notNull()` for required fields
- Use `.default()` for fields with default values

### Shared/Public Data Table

```typescript
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### Many-to-Many Relationship

```typescript
export const taskTags = pgTable("task_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .references(() => tasks.id, { onDelete: "cascade" })
    .notNull(),
  tagId: uuid("tag_id")
    .references(() => tags.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## Data Types Reference

| Type | Use Case | Example |
|------|----------|---------|
| `uuid` | Primary keys, foreign keys | User IDs, record IDs |
| `text` | Unlimited length strings | Content, descriptions |
| `varchar(n)` | Fixed max length | Slugs (varchar(100)) |
| `integer` | Whole numbers | Counts, quantities |
| `boolean` | True/false values | isPublished, isActive |
| `timestamp` | Date & time | createdAt, publishedAt |
| `jsonb` | Structured data | Preferences, metadata |

## Migration Workflow

### Development (Fast Iteration)
```bash
npm run db:push  # Push schema changes directly
```

### Production (With Migration Files)
```bash
npm run db:generate  # Generate migration file
npm run db:migrate   # Apply migration
```

### Verify Changes
```bash
npm run db:studio  # Open Drizzle Studio to inspect database
```

## Schema Design Checklist

✓ UUID primary key: `uuid("id").defaultRandom().primaryKey()`
✓ Foreign keys with CASCADE: `references(() => user.id, { onDelete: "cascade" })`
✓ Timestamps: `createdAt` and `updatedAt`
✓ NOT NULL for required fields: `.notNull()`
✓ Default values where appropriate: `.default(value)`
✓ Unique constraints for unique data: `.unique()`
✓ Export the table: `export const tableName = ...`

## Common Mistakes

❌ **Forgetting CASCADE DELETE** — orphaned records if user deleted
❌ **Missing timestamps** — no audit trail
❌ **Using serial instead of UUID** — inconsistent with existing schema
❌ **Not exporting the table** — can't import it elsewhere

## Querying Examples

```typescript
import { db } from "@/lib/db";
import { tasks } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";

// Get user's tasks
const userTasks = await db
  .select()
  .from(tasks)
  .where(eq(tasks.userId, session.user.id))
  .orderBy(desc(tasks.createdAt));

// Insert
const [newTask] = await db
  .insert(tasks)
  .values({ userId: session.user.id, title: "Task" })
  .returning();

// Update with ownership check
const [updated] = await db
  .update(tasks)
  .set({ title: "Updated", updatedAt: new Date() })
  .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)))
  .returning();

// Delete with ownership check
await db
  .delete(tasks)
  .where(and(eq(tasks.id, taskId), eq(tasks.userId, session.user.id)));
```
