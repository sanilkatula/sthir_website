---
name: sthir-release
description: Release changes in the Sthir website repository using incremental version branches and version-specific README change notes. The repository owner handles screenshots. Use whenever asked to push repository changes, create a release, or merge a release into main in this repository.
---

# Sthir release

Make each version branch a clear record of what changed. A normal request to
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

## Prepare the branch

1. Inspect the working tree and release diff. Carry the changes belonging to
   the requested release onto the new version branch; preserve unrelated work.
   Do not publish a release commit directly on `main` first.
2. Run the checks appropriate to the changes and preview the frontend when
   browser access is available. Report visual checks that could not be performed.
   This is a static site: `npm run dev:frontend` normally serves
   `http://localhost:3000/`. Reuse an existing server when it serves this checkout.

The repository owner handles screenshots. Write the README release text only;
do not capture, add, replace, or remove screenshots unless explicitly asked.
Preserve any owner-added image files, embeds, and captions. Do not add screenshot
placeholders, ask for a browser connection just for README images, or block a
release because screenshots are unavailable. This applies to every release,
not just a one-time exception.

## Rewrite the README for this version

Read [the release section template](references/readme-section.md) when updating
`README.md`. Place the current release section immediately after the project
title, preserving the useful setup and architecture documentation below it.

- Replace the previous release's text notes with this release's notes. Preserve
  owner-added image embeds and captions, including ones inside the managed
  release section. If there is no release section, add one without images.
- Identify the version, major/minor classification, previous version, and what
  changed. Include a comparison link to the previous version when it exists.
- For a major release, a clear summary of the redesign is sufficient.
- For a minor release, explain all user-relevant changes, including visual,
  structural, interaction, and nonvisual changes. For motion changes, describe
  the sequence in words. Say which checks ran and distinguish unavailable
  checks from successful ones.
- Keep only this release's text notes in this branch's managed README section.
  Existing version branches stay unchanged, so opening an older branch directly
  shows that version's change notes and any screenshots added by the owner.

Do not remove historic version branches or overwrite their image files.

## Push the version, then merge main

Before pushing, verify that the README notes describe this version and the
complete intended change. Review the staged diff for the intended scope and
exclude local secrets and temporary files. Screenshot capture is not a release
requirement; the owner adds images separately.

1. Commit the release changes and README notes on the new version branch.
2. Push that branch to `origin` with upstream tracking. Keep it as the permanent
   snapshot of this release.
3. Bring local `main` up to date with `origin/main`, then merge the version branch
   with a normal merge commit (`--no-ff`). Resolve conflicts without discarding
   unrelated work; rerun affected checks when needed.
4. Push `main`. Preserve the version branch. Never force-push or rewrite release
   history to make this workflow succeed.
5. Confirm the remote version branch and main contain the release. This
   repository's GitHub Pages workflow runs on pushes to `main`; when deployment
   is relevant, check its actual result before claiming the site is live.

Use the existing authorization for a requested push; do not ask again for each
routine branch, README, commit, push, or merge step. Report real tool
restrictions or merge blockers rather than claiming an unfinished release is done.

Finish with the version and branch link, its README link, a short change summary,
the checks performed, and the merge/deployment status.
