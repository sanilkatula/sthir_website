---
name: sthir-release
description: Release changes in the Sthir website repository using incremental version branches, fresh README screenshots, and version-specific change notes. Use whenever asked to push repository changes, create a release, or merge a release into main in this repository.
---

# Sthir release

Make each version branch a visual record of what changed. A normal request to
push changes includes creating the next version branch, updating its README,
pushing that branch, merging it into `main`, and pushing `main`.

Creating or editing this skill is not itself a request to publish a release.
Respect any newer user instruction that explicitly changes the release scope.

## Choose the version

Inspect the complete intended change against the last release on `main`, not
just the most recent edit. Fetch `origin` before choosing a version.

- **Major:** a substantial layout redesign, page composition change, or change
  to the site's overall visual structure. Increment the major number and use
  the branch name `vN`, for example `v2.0 → v3` or `v3.4 → v4`.
- **Minor:** smaller structural, visual, interaction, content, bug-fix, or
  documentation changes. Increment the minor number, for example
  `v2.0 → v2.1`, `v2.1 → v2.2`, or `v3 → v3.1`.
- Use two version levels only. Do not create patch names such as `v2.1.1`.
  Existing `vN.0` branches are valid older major releases; do not rename them.
- Every release needs a **new** branch named exactly after its version. Never
  add a new release to an existing version branch or rewrite an older one.

Finishing or retrying an already prepared release uses that release's branch;
do not increment again just to complete its push or merge.

Choose the release kind using judgment; use the helper to calculate a free name:

```sh
python3 .agents/skills/sthir-release/scripts/next_version.py --kind major
# Use --kind minor for a minor release.
```

The helper is read-only. It uses version branches already merged into
`origin/main` (or local `main` if no remote-tracking main exists) as the baseline,
and avoids names already occupied locally or on `origin`. It recognizes `vN`
and `vN.M` as the same version when the minor number is zero. If the user
specifies a version, honor it provided it advances the baseline and is unused.

## Prepare the branch and visuals

1. Inspect the working tree and release diff. Carry the changes belonging to
   the requested release onto the new version branch; preserve unrelated work.
   Do not publish a release commit directly on `main` first.
2. Run the checks appropriate to the changes and preview the actual frontend.
   This is a static site: `npm run dev:frontend` normally serves
   `http://localhost:3000/`. Reuse an existing server when it serves this checkout.
3. Capture **new screenshots of this version's rendered UI** using available
   browser tooling, following its browser skill when applicable. Inspect the
   captures for the intended state and legible framing. Do not substitute old
   screenshots, generated mockups, or images of source code.
4. Save the images under `docs/releases/<version>/` with descriptive filenames.
   Use repository-relative image links so they render on that version branch.

Screenshot requirements:

| Release | README screenshots | Notes |
| --- | --- | --- |
| Major | One fresh homepage overview, preferably full-page when useful | A clear description of the redesign is enough. |
| Minor | One to four focused screenshots of the changed areas | Explain the shown changes and every other user-relevant change in this release. |

For motion changes, choose representative frames and describe the sequence.
For a release with no visible UI changes, use one fresh homepage context image
and clearly state that the changes are nonvisual. Never imply a visual change
that did not occur.

If capturing genuine screenshots is unavailable, finish the code checks and
draft the release notes, then report that screenshot capture is blocked. Do not
push or merge a release with missing, stale, or fabricated screenshots. Ask for
the missing browser connection or capability, not routine release permission.

## Rewrite the README for this version

Read [the release section template](references/readme-section.md) when updating
`README.md`. Place the current release section immediately after the project
title, preserving the useful setup and architecture documentation below it.

- Replace the previous release's screenshot embeds and release notes with this
  release's screenshots and notes. Remove any old preview embeds outside the
  release section too. If there were no screenshots, add the first release section.
- Identify the version, major/minor classification, previous version, and what
  changed. Include a comparison link to the previous version when it exists.
- Give each screenshot a caption explaining the view or change it demonstrates.
  Include a mobile view when it demonstrates a changed mobile layout.
- For a minor release, list all other user-relevant changes not illustrated by
  the screenshots, including behavior and nonvisual changes. Say which checks
  ran and distinguish unavailable checks from successful ones.
- Keep only this release's preview section in this branch's README. Existing
  version branches and their screenshots stay unchanged, so opening an older
  branch directly shows that branch's release notes and visuals.

Do not remove historic version branches or overwrite their image files. New
screenshots belong in the new version's directory.

## Push the version, then merge main

Before pushing, verify that the image files exist, the README points to this
version's images, its notes describe this release, and minor releases contain
no more than four screenshot embeds. Review the staged diff for the intended
scope and exclude local secrets and temporary files.

1. Commit the release changes, README, and screenshots on the new version branch.
2. Push that branch to `origin` with upstream tracking. Keep it as the permanent
   visual snapshot of this release.
3. Bring local `main` up to date with `origin/main`, then merge the version branch
   with a normal merge commit (`--no-ff`). Resolve conflicts without discarding
   unrelated work; rerun affected checks when needed.
4. Push `main`. Preserve the version branch. Never force-push or rewrite release
   history to make this workflow succeed.
5. Confirm the remote version branch and main contain the release. This
   repository's GitHub Pages workflow runs on pushes to `main`; when deployment
   is relevant, check its actual result before claiming the site is live.

Use the existing authorization for a requested push; do not ask again for each
routine branch, README, screenshot, commit, push, or merge step. Report real tool
restrictions or merge blockers rather than claiming an unfinished release is done.

Finish with the version and branch link, its README link, a short change summary,
the checks performed, and the merge/deployment status.
