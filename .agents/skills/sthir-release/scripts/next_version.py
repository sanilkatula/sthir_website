#!/usr/bin/env python3
"""Suggest an unused Sthir version branch without changing Git state."""

import argparse
import json
from pathlib import Path
import re
import subprocess


VERSION = re.compile(r"v(0|[1-9]\d*)(?:\.(0|[1-9]\d*))?")


def git(repo, *arguments):
    result = subprocess.run(
        ["git", "-C", str(repo), *arguments],
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode:
        raise ValueError(result.stderr.strip() or "Git command failed")
    return result.stdout.strip()


def exists(repo, ref):
    result = subprocess.run(
        ["git", "-C", str(repo), "rev-parse", "--verify", "--quiet", ref + "^{commit}"],
        text=True,
        capture_output=True,
        check=False,
    )
    return result.returncode == 0


def versions(refs):
    found = []
    for ref in refs.splitlines():
        if ref.startswith("refs/heads/"):
            name = ref[len("refs/heads/"):]
        elif ref.startswith("refs/remotes/origin/"):
            name = ref[len("refs/remotes/origin/"):]
        else:
            continue
        match = VERSION.fullmatch(name)
        if match:
            found.append((int(match[1]), int(match[2] or 0), name))
    return found


def suggest(repo, kind, base_ref=None):
    repo = Path(repo).resolve()
    git(repo, "rev-parse", "--show-toplevel")
    if base_ref is None:
        base_ref = "refs/remotes/origin/main" if exists(repo, "refs/remotes/origin/main") else "refs/heads/main"
    if not exists(repo, base_ref):
        raise ValueError("Main baseline is unavailable; fetch origin or specify --base-ref.")
    prefixes = ("refs/heads", "refs/remotes/origin")
    merged = versions(git(repo, "for-each-ref", "--format=%(refname)", "--merged=" + base_ref, *prefixes))
    occupied = versions(git(repo, "for-each-ref", "--format=%(refname)", *prefixes))
    if not merged:
        raise ValueError("No vN or vN.M version branch is merged into the baseline. Establish the initial release version first.")
    major, minor, previous = max(merged)
    used = {(a, b) for a, b, _ in occupied}
    if kind == "major":
        candidate = major + 1
        used_majors = {a for a, _, _ in occupied}
        while candidate in used_majors:
            candidate += 1
        version = "v" + str(candidate)
    else:
        candidate = minor + 1
        while (major, candidate) in used:
            candidate += 1
        version = "v" + str(major) + "." + str(candidate)
    return {
        "previous": previous,
        "base_ref": base_ref,
        "kind": kind,
        "version": version,
        "branch": version,
        "screenshots_directory": "docs/releases/" + version,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--kind", required=True, choices=("major", "minor"))
    parser.add_argument("--repo", default=".")
    parser.add_argument("--base-ref", help="Override the main commit used to identify merged releases")
    args = parser.parse_args()
    try:
        result = suggest(args.repo, args.kind, args.base_ref)
    except (ValueError, OSError) as error:
        parser.exit(2, str(error) + "\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
