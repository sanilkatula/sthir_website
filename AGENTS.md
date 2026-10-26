# Repository release workflow

Before pushing changes or merging a release into `main`, read and use the
[sthir-release skill](.agents/skills/sthir-release/SKILL.md).

Every release gets a new incremental version branch and README change notes,
then a merge into `main`. The repository owner handles screenshots; agents write
the release text and do not wait for images before publishing. Preserve any
owner-added screenshots. Older version branches retain their release history.
Creating or updating the skill alone does not publish a release.
