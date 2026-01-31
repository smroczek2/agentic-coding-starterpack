import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  date,
  time,
  integer,
  decimal,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// AUTH TABLES (Better Auth)
// ============================================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified"),
  image: text("image"),
  role: text("role").notNull().default("team_member"), // "manager" | "team_member"
  isSchedulable: boolean("isSchedulable").notNull().default(true), // false for managers
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// ============================================================================
// SCHEDULING TABLES
// ============================================================================

export const employee = pgTable(
  "employee",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    linkedUserId: text("linkedUserId").references(() => user.id), // if employee has login
    name: text("name").notNull(),
    email: text("email").notNull(),
    timeZone: text("timeZone").notNull().default("America/Denver"),
    shiftPreference: text("shiftPreference").default("mid"), // "early" | "mid" | "late"
    colorCode: text("colorCode").notNull(),
    displayOrder: integer("displayOrder").notNull().default(0),
    status: text("status").notNull().default("active"), // "active" | "inactive"
    maxHoursPerWeek: integer("maxHoursPerWeek").notNull().default(40),
    version: integer("version").notNull().default(1), // optimistic locking
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    deletedAt: timestamp("deletedAt"), // soft delete
  },
  (table) => [
    index("employee_user_idx").on(table.userId),
    index("employee_status_idx").on(table.status),
    index("employee_linked_user_idx").on(table.linkedUserId),
  ]
);

export const schedule = pgTable(
  "schedule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    startDate: date("startDate").notNull(),
    endDate: date("endDate").notNull(),
    status: text("status").notNull().default("draft"), // "draft" | "published" | "archived"
    version: integer("version").notNull().default(1), // optimistic locking
    publishedAt: timestamp("publishedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    index("schedule_user_idx").on(table.userId),
    index("schedule_dates_idx").on(table.startDate, table.endDate),
    index("schedule_status_idx").on(table.status),
  ]
);

export const shift = pgTable(
  "shift",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scheduleId: uuid("scheduleId")
      .notNull()
      .references(() => schedule.id, { onDelete: "cascade" }),
    employeeId: uuid("employeeId")
      .notNull()
      .references(() => employee.id),
    createdByUserId: text("createdByUserId")
      .notNull()
      .references(() => user.id),
    date: date("date").notNull(),
    startTime: time("startTime").notNull(),
    endTime: time("endTime").notNull(),
    shiftType: text("shiftType").notNull(), // "early" | "mid" | "late"
    coverageType: text("coverageType").notNull().default("general"), // "phones" | "chat" | "tickets" | "general"
    status: text("status").notNull().default("scheduled"), // "scheduled" | "confirmed" | "called_out" | "covered"
    isOnCall: boolean("isOnCall").notNull().default(false),
    isHoliday: boolean("isHoliday").notNull().default(false),
    isWeekend: boolean("isWeekend").notNull().default(false),
    isPopcornDay: boolean("isPopcornDay").notNull().default(false),
    notes: text("notes"),
    version: integer("version").notNull().default(1), // optimistic locking
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    index("shift_date_employee_idx").on(table.date, table.employeeId),
    index("shift_schedule_idx").on(table.scheduleId),
    index("shift_date_status_idx").on(table.date, table.status),
    index("shift_employee_idx").on(table.employeeId),
  ]
);

export const timeOffRequest = pgTable(
  "time_off_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    employeeId: uuid("employeeId")
      .notNull()
      .references(() => employee.id),
    startDate: date("startDate").notNull(),
    endDate: date("endDate").notNull(),
    startTime: time("startTime"), // for partial day support
    endTime: time("endTime"), // for partial day support
    type: text("type").notNull(), // "pto" | "sick" | "popcorn" | "appointment"
    status: text("status").notNull().default("pending"), // "pending" | "approved" | "denied" | "cancelled"
    reason: text("reason"),
    reviewedBy: text("reviewedBy").references(() => user.id),
    denialReason: text("denialReason"),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    index("time_off_employee_date_idx").on(
      table.employeeId,
      table.startDate,
      table.endDate
    ),
    index("time_off_status_idx").on(table.status),
    index("time_off_user_idx").on(table.userId),
  ]
);

export const employeePreference = pgTable(
  "employee_preference",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    employeeId: uuid("employeeId")
      .notNull()
      .references(() => employee.id, { onDelete: "cascade" }),
    dayOfWeek: integer("dayOfWeek"), // 0-6 (Sunday-Saturday)
    specificDate: date("specificDate"),
    preferenceType: text("preferenceType").notNull(), // "preferred" | "available" | "unavailable"
    notes: text("notes"),
    validFrom: date("validFrom"),
    validUntil: date("validUntil"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    index("preference_employee_idx").on(table.employeeId),
    index("preference_date_idx").on(table.specificDate),
  ]
);

export const fairnessMetric = pgTable(
  "fairness_metric",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    employeeId: uuid("employeeId")
      .notNull()
      .references(() => employee.id, { onDelete: "cascade" }),
    metricType: text("metricType").notNull(), // "weekend_days" | "holidays" | "on_call" | "early_shifts" | "mid_shifts" | "late_shifts" | "popcorn_days"
    count: integer("count").notNull().default(0),
    period: text("period").notNull(), // "summer_2026" | "year_2026"
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    index("fairness_employee_period_idx").on(table.employeeId, table.period),
    index("fairness_type_idx").on(table.metricType),
  ]
);

export const schedulingConstraint = pgTable(
  "scheduling_constraint",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    ruleType: text("ruleType").notNull(), // "hard" | "soft"
    ruleLogic: jsonb("ruleLogic").notNull(),
    scope: text("scope").notNull().default("year_round"), // "summer" | "year_round"
    isActive: boolean("isActive").notNull().default(true),
    priority: integer("priority").notNull().default(0), // for soft rule ordering
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    index("constraint_user_idx").on(table.userId),
    index("constraint_active_idx").on(table.isActive),
  ]
);

export const scheduleAuditLog = pgTable(
  "schedule_audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => user.id),
    scheduleId: uuid("scheduleId").references(() => schedule.id),
    shiftId: uuid("shiftId"),
    action: text("action").notNull(), // "create" | "update" | "delete" | "publish" | "override"
    previousState: jsonb("previousState"),
    newState: jsonb("newState"),
    reason: text("reason"),
    aiGenerated: boolean("aiGenerated").notNull().default(false),
    checksum: text("checksum"), // SHA-256 for tamper detection
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    // NO updatedAt - immutable
    // NO deletedAt - cannot delete audit logs
  },
  (table) => [
    index("audit_schedule_idx").on(table.scheduleId, table.createdAt),
    index("audit_user_idx").on(table.userId),
    index("audit_action_idx").on(table.action),
  ]
);

export const ruleOverride = pgTable(
  "rule_override",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => user.id),
    shiftId: uuid("shiftId")
      .notNull()
      .references(() => shift.id, { onDelete: "cascade" }),
    constraintName: text("constraintName").notNull(),
    justification: text("justification").notNull(),
    violationDetails: jsonb("violationDetails"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    index("override_shift_idx").on(table.shiftId),
    index("override_user_idx").on(table.userId),
  ]
);

export const ptoBalance = pgTable(
  "pto_balance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    employeeId: uuid("employeeId")
      .notNull()
      .references(() => employee.id, { onDelete: "cascade" }),
    balanceType: text("balanceType").notNull(), // "pto" | "sick" | "floating_holiday"
    hoursAvailable: decimal("hoursAvailable", { precision: 6, scale: 2 })
      .notNull()
      .default("0"),
    hoursUsed: decimal("hoursUsed", { precision: 6, scale: 2 })
      .notNull()
      .default("0"),
    period: text("period").notNull(), // "2026"
    ripplingId: text("ripplingId"), // for sync
    lastSyncedAt: timestamp("lastSyncedAt"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => [
    index("pto_employee_idx").on(table.employeeId),
    index("pto_period_idx").on(table.period),
  ]
);

// ============================================================================
// AI CHAT TABLES
// ============================================================================

export const chatMessage = pgTable(
  "chat_message",
  {
    id: text("id").primaryKey(), // Use the message ID from the AI SDK
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // "user" | "assistant"
    parts: jsonb("parts").notNull(), // Message parts array from AI SDK
    createdAt: timestamp("createdAt").notNull().defaultNow(),
  },
  (table) => [
    index("chat_message_user_idx").on(table.userId),
    index("chat_message_created_idx").on(table.userId, table.createdAt),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const userRelations = relations(user, ({ many }) => ({
  employees: many(employee),
  schedules: many(schedule),
  timeOffRequests: many(timeOffRequest),
  auditLogs: many(scheduleAuditLog),
  chatMessages: many(chatMessage),
}));

export const employeeRelations = relations(employee, ({ one, many }) => ({
  owner: one(user, {
    fields: [employee.userId],
    references: [user.id],
  }),
  linkedUser: one(user, {
    fields: [employee.linkedUserId],
    references: [user.id],
    relationName: "linkedEmployee",
  }),
  shifts: many(shift),
  timeOffRequests: many(timeOffRequest),
  preferences: many(employeePreference),
  fairnessMetrics: many(fairnessMetric),
  ptoBalances: many(ptoBalance),
}));

export const scheduleRelations = relations(schedule, ({ one, many }) => ({
  owner: one(user, {
    fields: [schedule.userId],
    references: [user.id],
  }),
  shifts: many(shift),
  auditLogs: many(scheduleAuditLog),
}));

export const shiftRelations = relations(shift, ({ one, many }) => ({
  schedule: one(schedule, {
    fields: [shift.scheduleId],
    references: [schedule.id],
  }),
  employee: one(employee, {
    fields: [shift.employeeId],
    references: [employee.id],
  }),
  createdBy: one(user, {
    fields: [shift.createdByUserId],
    references: [user.id],
  }),
  overrides: many(ruleOverride),
}));

export const timeOffRequestRelations = relations(timeOffRequest, ({ one }) => ({
  owner: one(user, {
    fields: [timeOffRequest.userId],
    references: [user.id],
  }),
  employee: one(employee, {
    fields: [timeOffRequest.employeeId],
    references: [employee.id],
  }),
  reviewer: one(user, {
    fields: [timeOffRequest.reviewedBy],
    references: [user.id],
    relationName: "reviewer",
  }),
}));

export const employeePreferenceRelations = relations(
  employeePreference,
  ({ one }) => ({
    owner: one(user, {
      fields: [employeePreference.userId],
      references: [user.id],
    }),
    employee: one(employee, {
      fields: [employeePreference.employeeId],
      references: [employee.id],
    }),
  })
);

export const fairnessMetricRelations = relations(fairnessMetric, ({ one }) => ({
  owner: one(user, {
    fields: [fairnessMetric.userId],
    references: [user.id],
  }),
  employee: one(employee, {
    fields: [fairnessMetric.employeeId],
    references: [employee.id],
  }),
}));

export const scheduleAuditLogRelations = relations(
  scheduleAuditLog,
  ({ one }) => ({
    user: one(user, {
      fields: [scheduleAuditLog.userId],
      references: [user.id],
    }),
    schedule: one(schedule, {
      fields: [scheduleAuditLog.scheduleId],
      references: [schedule.id],
    }),
  })
);

export const ruleOverrideRelations = relations(ruleOverride, ({ one }) => ({
  user: one(user, {
    fields: [ruleOverride.userId],
    references: [user.id],
  }),
  shift: one(shift, {
    fields: [ruleOverride.shiftId],
    references: [shift.id],
  }),
}));

export const ptoBalanceRelations = relations(ptoBalance, ({ one }) => ({
  owner: one(user, {
    fields: [ptoBalance.userId],
    references: [user.id],
  }),
  employee: one(employee, {
    fields: [ptoBalance.employeeId],
    references: [employee.id],
  }),
}));

export const chatMessageRelations = relations(chatMessage, ({ one }) => ({
  user: one(user, {
    fields: [chatMessage.userId],
    references: [user.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Employee = typeof employee.$inferSelect;
export type NewEmployee = typeof employee.$inferInsert;

export type Schedule = typeof schedule.$inferSelect;
export type NewSchedule = typeof schedule.$inferInsert;

export type Shift = typeof shift.$inferSelect;
export type NewShift = typeof shift.$inferInsert;

export type TimeOffRequest = typeof timeOffRequest.$inferSelect;
export type NewTimeOffRequest = typeof timeOffRequest.$inferInsert;

export type EmployeePreference = typeof employeePreference.$inferSelect;
export type NewEmployeePreference = typeof employeePreference.$inferInsert;

export type FairnessMetric = typeof fairnessMetric.$inferSelect;
export type NewFairnessMetric = typeof fairnessMetric.$inferInsert;

export type SchedulingConstraint = typeof schedulingConstraint.$inferSelect;
export type NewSchedulingConstraint = typeof schedulingConstraint.$inferInsert;

export type ScheduleAuditLog = typeof scheduleAuditLog.$inferSelect;
export type NewScheduleAuditLog = typeof scheduleAuditLog.$inferInsert;

export type RuleOverride = typeof ruleOverride.$inferSelect;
export type NewRuleOverride = typeof ruleOverride.$inferInsert;

export type PtoBalance = typeof ptoBalance.$inferSelect;
export type NewPtoBalance = typeof ptoBalance.$inferInsert;

export type ChatMessage = typeof chatMessage.$inferSelect;
export type NewChatMessage = typeof chatMessage.$inferInsert;
