#!/usr/bin/env python3
"""Create GitHub issues (and labels) from a milestone issue-list markdown file.

Usage:
  python3 scripts/create-issues.py docs/issues/milestone-0.md --dry-run
  python3 scripts/create-issues.py docs/issues/milestone-0.md

Requires the GitHub CLI (`gh`), authenticated with `gh auth login`, run from
inside the repository clone. Already-existing issues with the same title are
skipped, so the script is safe to re-run.

Format expected: each issue starts with a "## M0-<n>: <title>" heading and has a
"**Labels:** `a`, `b`" line. Sections that do not start with "## M0-" are ignored.
"""
import json
import re
import subprocess
import sys
import tempfile

# Windows defaults to cp1252, which cannot encode characters like arrows and em dashes.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def parse(path):
    text = open(path, encoding="utf-8").read()
    parts = re.split(r"(?m)^## (M\d+-\d+:.*)$", text)
    issues = []
    for i in range(1, len(parts), 2):
        title = parts[i].strip()
        body = parts[i + 1]
        body = re.sub(r"(?m)^---\s*$", "", body).strip()
        m = re.search(r"\*\*Labels:\*\*\s*(.+)", body)
        labels = re.findall(r"`([^`]+)`", m.group(1)) if m else []
        issues.append({"title": title, "body": body, "labels": labels})
    return issues


def gh(*args, check=True):
    return subprocess.run(
        ["gh", *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=check,
    )


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    if not args:
        sys.exit(__doc__)
    issues = parse(args[0])
    labels = sorted({l for it in issues for l in it["labels"]})
    print(f"Parsed {len(issues)} issues, {len(labels)} distinct labels.")
    if dry:
        for it in issues:
            print(f"- {it['title']}  labels={it['labels']}  body={len(it['body'])} chars")
        print("Dry run: nothing created.")
        return

    for l in labels:
        gh("label", "create", l, "--force", "--color", "5319e7", check=False)

    existing = set()
    r = gh("issue", "list", "--state", "all", "--limit", "500", "--json", "title")
    if r.returncode == 0:
        existing = {x["title"] for x in json.loads(r.stdout)}

    for it in issues:
        if it["title"] in existing:
            print(f"skip (exists): {it['title']}")
            continue
        with tempfile.NamedTemporaryFile(
            "w", suffix=".md", delete=False, encoding="utf-8", newline="\n"
        ) as f:
            f.write(it["body"])
            body_file = f.name
        cmd = ["issue", "create", "--title", it["title"], "--body-file", body_file]
        for l in it["labels"]:
            cmd += ["--label", l]
        r = gh(*cmd, check=False)
        print(("created: " if r.returncode == 0 else "FAILED:  ") + it["title"],
              r.stdout.strip() or r.stderr.strip())


if __name__ == "__main__":
    main()