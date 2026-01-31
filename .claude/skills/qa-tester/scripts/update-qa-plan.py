#!/usr/bin/env python3
"""
Update QA Plan with Test Results

Parses Playwright test results and updates the QA testing plan document(s)
with pass/fail status for each test. Supports multiple QA plan files.

Usage:
    # Update specific file
    python update-qa-plan.py <qa-plan.md> [--results test-results/results.json]

    # Auto-detect and update all QA plans
    python update-qa-plan.py --auto [--results test-results/results.json]

    # Update specific directory of QA plans
    python update-qa-plan.py --dir plans/ [--results test-results/results.json]
"""

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import glob


def parse_test_results(results_file: Path) -> Dict[str, dict]:
    """Parse Playwright JSON results and extract test statuses."""
    if not results_file.exists():
        print(f"Error: Results file not found: {results_file}")
        sys.exit(1)

    with open(results_file, 'r') as f:
        data = json.load(f)

    results = {}

    # Parse suites recursively
    def parse_suite(suite: dict, prefix: str = ""):
        for spec in suite.get('specs', []):
            title = spec.get('title', '')
            # Extract test ID from title (e.g., "AUTH-001: Description")
            match = re.match(r'^([A-Z]+-\d+):', title)
            if match:
                test_id = match.group(1)
                # Get test status from tests array
                tests = spec.get('tests', [])
                if tests:
                    test = tests[0]
                    status = test.get('status', 'unknown')
                    results[test_id] = {
                        'status': status,
                        'title': title,
                        'duration': test.get('duration', 0),
                    }

        # Recurse into child suites
        for child in suite.get('suites', []):
            parse_suite(child, prefix)

    # Parse all suites
    for suite in data.get('suites', []):
        parse_suite(suite)

    return results


def update_qa_plan(plan_file: Path, results: Dict[str, dict]) -> Tuple[int, int, int]:
    """Update the QA plan file with test results."""
    if not plan_file.exists():
        print(f"Error: QA plan not found: {plan_file}")
        sys.exit(1)

    with open(plan_file, 'r') as f:
        content = f.read()

    today = datetime.now().strftime('%Y-%m-%d')
    passed = 0
    failed = 0
    skipped = 0

    # Update individual test entries
    for test_id, result in results.items():
        status = result['status']

        if status == 'expected':
            passed += 1
            checkbox = '[x]'
            result_icon = '✅'
            notes = f"Automated - {result['title'].split(': ', 1)[-1][:50]}"
        elif status == 'unexpected':
            failed += 1
            checkbox = '[ ]'
            result_icon = '❌'
            notes = f"FAILED - Review needed"
        else:
            skipped += 1
            checkbox = '[ ]'
            result_icon = '⏭️'
            notes = f"Skipped"

        # Pattern to match the test entry
        pattern = rf'- \[[ x]\] {test_id}:([^\n]+)\n  - Result: [^\n]*\n  - Notes:[^\n]*\n  - Tested By:[^\n]*\n  - Date:[^\n]*'

        replacement = f'''- {checkbox} {test_id}:\\1
  - Result: {result_icon}
  - Notes: {notes}
  - Tested By: Playwright
  - Date: {today}'''

        content = re.sub(pattern, replacement, content)

    # Write updated content
    with open(plan_file, 'w') as f:
        f.write(content)

    return passed, failed, skipped


def update_summary_table(plan_file: Path, section_stats: Dict[str, Tuple[int, int]]):
    """Update the summary table at the top of the QA plan."""
    with open(plan_file, 'r') as f:
        content = f.read()

    # This would need to be customized based on the actual plan structure
    # For now, just update the overall counts

    with open(plan_file, 'w') as f:
        f.write(content)


def find_qa_plans(directory: Path = None) -> List[Path]:
    """Find all QA plan files in directory or current directory."""
    search_dir = directory if directory else Path.cwd()

    patterns = [
        '**/QA*.md',
        '**/*qa*.md',
        '**/*test*plan*.md',
        '**/*testing*.md',
    ]

    found = set()
    for pattern in patterns:
        for file in search_dir.glob(pattern):
            if file.is_file() and 'node_modules' not in str(file):
                found.add(file)

    return sorted(found)


def get_test_ids_from_file(plan_file: Path) -> set:
    """Extract all test IDs from a QA plan file."""
    if not plan_file.exists():
        return set()

    with open(plan_file, 'r') as f:
        content = f.read()

    # Find all test IDs (e.g., AUTH-001, TEST-200, etc.)
    test_ids = set(re.findall(r'\b([A-Z]+-\d+)\b', content))
    return test_ids


def main():
    parser = argparse.ArgumentParser(description='Update QA plan(s) with test results')
    parser.add_argument('plan', nargs='?', help='Path to QA plan markdown file')
    parser.add_argument('--results', default='test-results/results.json',
                        help='Path to Playwright JSON results')
    parser.add_argument('--auto', action='store_true',
                        help='Auto-detect and update all QA plans')
    parser.add_argument('--dir', help='Directory to search for QA plans')
    args = parser.parse_args()

    results_file = Path(args.results)

    print(f"📊 Parsing test results from {results_file}")
    results = parse_test_results(results_file)

    if not results:
        print("No test results found with valid test IDs (e.g., AUTH-001)")
        sys.exit(1)

    print(f"Found {len(results)} test results")

    # Determine which QA plans to update
    if args.auto or args.dir:
        search_dir = Path(args.dir) if args.dir else None
        plan_files = find_qa_plans(search_dir)

        if not plan_files:
            print("No QA plan files found")
            sys.exit(1)

        print(f"\n📁 Found {len(plan_files)} QA plan file(s):")
        for pf in plan_files:
            print(f"   - {pf}")

        # Filter to only plans that contain the test IDs we have results for
        relevant_plans = []
        for pf in plan_files:
            test_ids = get_test_ids_from_file(pf)
            if test_ids & results.keys():  # Intersection
                relevant_plans.append(pf)

        if not relevant_plans:
            print("\n⚠️  No QA plans contain the test IDs from results")
            sys.exit(1)

        plan_files = relevant_plans
    else:
        if not args.plan:
            print("Error: Must specify plan file or use --auto/--dir")
            parser.print_help()
            sys.exit(1)
        plan_files = [Path(args.plan)]

    # Update each plan file
    total_passed = 0
    total_failed = 0
    total_skipped = 0

    for plan_file in plan_files:
        print(f"\n📝 Updating QA plan: {plan_file}")
        passed, failed, skipped = update_qa_plan(plan_file, results)
        total_passed += passed
        total_failed += failed
        total_skipped += skipped

        if passed + failed + skipped > 0:
            print(f"   ✅ Passed:  {passed}")
            print(f"   ❌ Failed:  {failed}")
            print(f"   ⏭️  Skipped: {skipped}")

    print(f"\n✅ All QA Plans Updated!")
    print(f"   Total Passed:  {total_passed}")
    print(f"   Total Failed:  {total_failed}")
    print(f"   Total Skipped: {total_skipped}")

    if total_failed > 0:
        print(f"\n⚠️  {total_failed} test(s) failed - review needed")
        sys.exit(1)


if __name__ == '__main__':
    main()
