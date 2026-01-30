# AI-Native Scheduling App Requirements
## Based on Sarah Meeting Transcript - January 15, 2026

---

## Executive Summary

Sarah manages the CampMinder support team scheduling and currently juggles **4 different systems** (Spreadsheets, Sling, Google Calendar, Rippling) to create and maintain schedules. Her main pain point: **"My job is not scheduling, but it's kind of scheduling. This takes up more of my time than I would like."**

The goal is to build an AI-native scheduling app that consolidates everything into one intelligent system that can understand constraints, generate optimal schedules, and adapt to changes automatically.

---

## Part 1: Current Pain Points (What's Broken)

### 1.1 Multi-System Chaos
| System | Purpose | Problem |
|--------|---------|---------|
| **Spreadsheets** | High-level planning, zoomed-out view | Disconnected from daily schedules |
| **Sling** | Hourly daily schedules | No future planning, team's primary view |
| **Google Calendar** | Company-wide visibility | Only Sarah's team uses Sling, so need to mirror |
| **Rippling** | PTO requests | Requires manual transfer to other systems |

### 1.2 The Manual Update Nightmare
- **Every PTO request requires updates in 2-3 places**
- Cross-referencing multiple systems for every scheduling decision
- Future dates aren't pre-filled anywhere
- Last-minute changes (sick days) require unpublishing and manual rebuilding

### 1.3 Specific Frustrations Mentioned
- "The manual aspect of it"
- "If a PTO request comes in, I'm updating it in two to three places"
- "Future dates aren't filled in yet" in Sling
- Need both "zoomed-out view" AND "hourly detail view"

---

## Part 2: Feature Requirements to Make Sarah Happy

### 2.1 Core Scheduling Features

#### Single Source of Truth
- [ ] **Unified dashboard** - One place for all scheduling information
- [ ] **Automatic sync** - Changes propagate everywhere automatically
- [ ] **No duplicate entry** - Enter information once, reflected everywhere

#### Multi-View Support
- [ ] **Zoomed-out view** - See weeks/months at a glance (like her spreadsheet)
- [ ] **Daily view** - See who's working what shift each day
- [ ] **Hourly view** - Detailed schedule showing phones/chat/tickets coverage (like Sling)
- [ ] **Team member view** - Individual schedules for each person

#### Shift Management
- [ ] **Shift types**: Early, Mid, Late
- [ ] **Coverage types**: Phones, Chat, Tickets
- [ ] **Templates** - Save and apply common schedule patterns
- [ ] **Drag-and-drop** - Easy manual adjustments when needed

### 2.2 Time-Off & Absence Management

#### PTO Handling
- [ ] **PTO request intake** - Accept requests in-app (or integrate with Rippling)
- [ ] **Auto-calendar blocking** - Mark dates as unavailable automatically
- [ ] **Impact analysis** - Show coverage gaps when PTO is requested
- [ ] **Auto-approve suggestions** - AI suggests if coverage allows approval

#### Last-Minute Changes
- [ ] **Sick day handling** - Quick way to mark someone out
- [ ] **Automatic rebalancing** - AI suggests coverage adjustments
- [ ] **Appointment blocks** - Support partial-day absences (2-hour appointments)

### 2.3 AI-Native Features (The Magic)

#### Natural Language Scheduling
- [ ] **"Just tell the AI"** - Describe problems in plain English
- [ ] **Constraint understanding** - AI knows all the rules
- [ ] **Generate then correct** - AI proposes, Sarah adjusts

#### Smart Schedule Generation
- [ ] **Auto-generate schedules** - Based on rules and constraints
- [ ] **Conflict detection** - Warn before violations occur
- [ ] **Optimization suggestions** - "Bennett could swap with Al for better coverage"

#### Conversational Interface
- [ ] **Chat with schedule** - "Who's working late shift next Thursday?"
- [ ] **Request changes** - "Afton needs to leave early Friday"
- [ ] **What-if scenarios** - "What happens if Jordan takes next week off?"

---

## Part 3: Summer Schedule Complexity (Critical)

### 3.1 Summer-Specific Context
- **7-day support coverage** (vs regular weekday-only)
- **On-call rotation** for after-hours support
- **Working holidays**: Juneteenth (June 19) and July 4th
- **Higher stakes**: Peak camp season

### 3.2 Hard Rules (Must Never Violate)

| Rule | Description |
|------|-------------|
| **5-Day Consecutive Max** | No employee works more than 5 days in a row |
| **5-Day Weekly Max** | No employee works more than 5 days in any Sun-Sat week |
| **Holiday Split** | Each employee works only ONE of the two working holidays |
| **Holiday Week Cap** | Only 4 working days in weeks containing a holiday |
| **On-Call Logic** | Only assign on-call when working the surrounding days |

### 3.3 Soft Rules (Balance Fairly)

| Metric | Goal |
|--------|------|
| **Weekend Days** | Evenly distributed across team |
| **Holiday Shifts** | Evenly distributed (one each) |
| **On-Call Nights** | Evenly distributed across team |
| **Shift Types** | Balance early/mid/late per person's preference |
| **Popcorn Days** | Track extra days off, keep relatively even (1-2 per person) |

### 3.4 Employee Preferences

| Preference Type | Example |
|-----------------|---------|
| **Time Zone Alignment** | East Coast → prefer early shifts |
| | Mountain Time → prefer late shifts |
| **Specific Date Requests** | "I need July 22nd off" (not PTO, just scheduling) |
| **Week-off Requests** | Collected before summer starts |

### 3.5 Popcorn Days
- **Definition**: Extra days off (NOT PTO) given to satisfy the 5-day constraints
- **Tracking needed**: Who has how many, ensure fair distribution
- **Rippling integration**: May need to log as "floating holidays"

---

## Part 4: Integration Requirements

### 4.1 Data Imports
- [ ] Import existing skeleton schedule from spreadsheets
- [ ] Import team member list with roles/time zones
- [ ] Import existing PTO requests from Rippling (or accept new ones)
- [ ] Import meeting schedules from Google Calendar

### 4.2 Exports / Visibility
- [ ] Export to Google Calendar for company-wide visibility
- [ ] Generate reports for team (daily assignments)
- [ ] Export metrics (weekend distribution, on-call counts, etc.)

### 4.3 Potential Integrations
- **Rippling** - PTO request sync
- **Google Calendar** - Meeting visibility, company calendar
- **Slack** - Notifications for schedule changes
- **Sling** - If team still wants hourly view there (optional)

---

## Part 5: Tracking & Reporting

### 5.1 Fairness Metrics Dashboard
- [ ] Weekend days worked per person (running total)
- [ ] Holiday shifts per person
- [ ] On-call shifts per person
- [ ] Early/Mid/Late shift distribution per person
- [ ] Popcorn days given per person

### 5.2 Coverage Analytics
- [ ] Daily headcount by shift type
- [ ] Coverage gaps/warnings
- [ ] Historical comparison (vs last year's staffing)

### 5.3 Summer-Specific Tracking
- [ ] Rule violation alerts (5-day rule, holiday week rule)
- [ ] Request fulfillment rate (did everyone get their requested days?)

---

## Part 6: User Experience Requirements

### 6.1 For Sarah (Schedule Manager)
- **Quick data entry** - Faster than current spreadsheet workflow
- **Bulk operations** - Apply changes to multiple weeks at once
- **Undo/history** - Roll back mistakes easily
- **Override capability** - AI suggests, but Sarah has final say

### 6.2 For Team Members
- **View their schedule** - Clear, mobile-friendly view
- **Request time off** - Simple submission process
- **Request day preferences** - Summer schedule input form
- **See fairness** - Transparency on distribution (optional)

### 6.3 General UX
- **Fast** - No waiting for page loads
- **Intuitive** - Sarah shouldn't need training to use it
- **Forgiving** - Easy to correct mistakes

---

## Part 7: AI Behavior Specifications

### 7.1 Schedule Generation Prompts
The AI should be able to respond to requests like:
- "Generate the summer schedule for June"
- "Afton needs July 15-18 off, adjust the schedule"
- "Zachary called in sick today, who can cover?"
- "Make sure nobody works more than 5 days in a row"
- "Redistribute late shifts - Al has too many"

### 7.2 AI Constraints Understanding
The AI must internalize:
1. All hard rules (5-day max, holiday rules, on-call logic)
2. All soft rules (fairness distribution)
3. Individual preferences (time zones, requested days)
4. Current state (who's already assigned what)

### 7.3 AI Output Format
When generating schedules, AI should:
- Show proposed schedule clearly
- Highlight any rule violations or concerns
- Explain trade-offs made
- Allow quick accept/reject/modify

---

## Part 8: Success Criteria

### What "Done" Looks Like for Sarah

1. **Time saved**: Scheduling takes significantly less time than current process
2. **Single system**: No more juggling 4 different tools
3. **Summer confidence**: AI handles complex summer rules correctly
4. **Fair distribution**: Team metrics stay balanced automatically
5. **Easy changes**: Last-minute sick days don't cause panic
6. **"Just tell it"**: Can describe problems in plain language and get solutions

### Sarah's Key Quote
> "You know how Ken's job is beach? My job is not scheduling, but it's kind of scheduling. This takes up more of my time than I would like it to. So any sort of solution would be amazing."

**Goal: Make Sarah's job feel more like a beach.**

---

## Part 9: Prioritized Feature List

### Phase 1: MVP (Minimum Viable Product)
1. Team member management (names, roles, time zones, preferences)
2. Calendar views (zoomed-out + daily)
3. Shift assignment (manual drag-drop)
4. Hard rule validation (5-day rules, holiday rules)
5. AI chat interface for schedule questions
6. Basic PTO tracking

### Phase 2: Smart Scheduling
1. AI-generated schedule proposals
2. On-call assignment logic
3. Fairness tracking dashboard
4. Automatic rebalancing suggestions
5. Summer schedule generation

### Phase 3: Full Integration
1. Rippling PTO sync
2. Google Calendar export
3. Team member self-service portal
4. Slack notifications
5. Historical analytics

---

## Appendix: Data Model Concepts

### Employees
- Name, Email
- Role (CSR, etc.)
- Time zone
- Shift preference (early/mid/late)
- Status (active/inactive)

### Shifts
- Date
- Type (Early, Mid, Late)
- Coverage type (Phones, Chat, Tickets)
- Assigned employee
- Status (scheduled, called-out, etc.)

### Time Off
- Employee
- Date(s)
- Type (PTO, Sick, Popcorn, Appointment)
- Status (requested, approved, denied)

### Constraints
- Rule name
- Rule logic
- Severity (hard/soft)
- Scope (summer-only, year-round)

### Fairness Metrics
- Employee
- Metric type (weekend_days, holidays, oncall, etc.)
- Count
- Period (summer 2025, etc.)

---

*Document generated from Sarah Meeting Transcript analysis*
*Ready for review and implementation planning*
