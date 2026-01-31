# QA Tester Skill

Automated Playwright testing skill with intelligent QA plan detection and multi-file support.

## Features

✅ **Flexible QA Plan Detection** - Works with any QA plan file
✅ **Multi-File Support** - Handle split test plans (e.g., tests 1-100, 200-400)
✅ **Auto-Discovery** - Automatically finds QA plans in your project
✅ **Smart Mapping** - Maps test results back to correct plan files
✅ **Page Object Pattern** - Generates maintainable test code
✅ **Parallel Execution** - Fast tests with multiple workers

## Quick Start

### Invoke the Skill

```bash
# Auto-detect and run all tests
"run the QA tests"

# Test specific range
"test cases 200-400"

# Test specific file
"test the items in docs/qa-part2.md"

# Create tests for a section
"create tests for the API section"
```

## QA Plan File Support

The skill automatically detects QA plan files matching these patterns:
- `**/QA*.md`
- `**/*qa*.md`
- `**/*test*plan*.md`
- `**/*testing*.md`

### Supported File Structures

```
✅ plans/QA-TESTING-PLAN.md
✅ plans/qa-tests-001-100.md
✅ plans/qa-tests-200-400.md
✅ docs/testing/integration-tests.md
✅ tests/QA_PLAN.md
✅ QA-Tests-Part-2.md
```

### Multiple Plans Example

```
project/
├── plans/
│   ├── qa-core-features.md      # Tests 1-100
│   ├── qa-advanced-features.md  # Tests 101-200
│   └── qa-integrations.md       # Tests 201-300
└── tests/
    └── [generated test files]
```

The skill will:
1. Find all 3 QA plan files
2. Run tests for each
3. Update each plan with its relevant results

## Script Usage

### Update QA Plans Manually

```bash
# Update specific file
python scripts/update-qa-plan.py plans/QA-TESTING-PLAN.md

# Auto-detect and update all plans
python scripts/update-qa-plan.py --auto

# Update plans in specific directory
python scripts/update-qa-plan.py --dir plans/

# Specify custom results file
python scripts/update-qa-plan.py --auto --results test-results/results.json
```

### Run Tests with Script

```bash
# Basic run
bash scripts/run-tests.sh

# Run with specific workers
bash scripts/run-tests.sh --workers=8

# Run in headed mode
bash scripts/run-tests.sh --headed

# Run specific tests
bash scripts/run-tests.sh --grep="AUTH-001"
```

## How It Works

### 1. QA Plan Detection
When you say "run tests", the skill:
- Searches project for QA plan files
- Lists them if multiple found
- Parses test IDs from each file

### 2. Test Generation
For each test in the plan:
- Generates Playwright test with proper ID
- Creates Page Objects if needed
- Follows best practices and patterns

### 3. Test Execution
- Runs tests in parallel
- Captures screenshots on failure
- Generates JSON + HTML reports

### 4. Plan Updates
- Maps test results to plan files by test ID
- Updates each plan with pass/fail status
- Updates summary tables

## Directory Structure

```
.claude/skills/qa-tester/
├── SKILL.md                    # Main skill instructions
├── README.md                   # This file
├── scripts/
│   ├── run-tests.sh           # Test execution script
│   └── update-qa-plan.py      # Multi-file plan updater
├── references/
│   ├── playwright-patterns.md  # Locator patterns & best practices
│   └── page-object-patterns.md # POM implementation guide
└── assets/
    └── templates/              # Boilerplate templates
        ├── spec-template.ts
        ├── page-object-template.ts
        └── playwright.config.ts
```

## Examples

### Example 1: Single QA Plan
```
User: "Run my QA tests"
→ Finds plans/QA-TESTING-PLAN.md
→ Runs 51 tests
→ Updates that file with results
```

### Example 2: Multiple QA Plans
```
User: "Test everything"
→ Finds:
  - plans/qa-tests-001-100.md
  - plans/qa-tests-101-200.md
  - plans/qa-tests-201-300.md
→ Asks which to test
→ Updates all relevant plans
```

### Example 3: Specific Range
```
User: "Test items 200-250"
→ Searches for plans with TEST-200 through TEST-250
→ Finds plans/qa-tests-200-400.md
→ Generates tests for that range
→ Updates only that file
```

### Example 4: Specific File
```
User: "Test docs/api-qa.md"
→ Uses exact file path
→ Runs those specific tests
→ Updates only that file
```

## Tips

1. **Naming Convention**: Use descriptive test IDs (AUTH-001, API-200, NAV-050)
2. **Split Large Plans**: Break 500+ test plans into multiple files by feature or range
3. **Consistent Format**: Keep same markdown structure across all plan files
4. **Version Control**: Track QA plans in git to see progress over time

## Troubleshooting

### No QA Plans Found
- Ensure files have "qa", "test", or "plan" in filename
- Check files are `.md` format
- Verify files aren't in `node_modules/`

### Tests Not Updating Plan
- Ensure test IDs match format: `[A-Z]+-\d+`
- Check test names include the ID (e.g., "AUTH-001: Description")
- Verify JSON results file exists

### Multiple Plans Conflicting
- Use unique test ID prefixes per plan
- Example: AUTH- for auth tests, API- for API tests

## Contributing

The skill is located in `.claude/skills/qa-tester/` and can be modified:
1. Edit `SKILL.md` for instructions
2. Update scripts for new functionality
3. Add references for new patterns
4. Repackage with: `python3 [path]/package_skill.py .claude/skills/qa-tester`
