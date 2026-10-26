# README release section

Preserve the project title. Replace the previous release block below it with the
new release, leaving useful project documentation below the end marker. Write
release text only; the repository owner handles screenshots. Preserve any
owner-added image embeds and captions when replacing the release text.

Use the actual repository URL and versions in the compare link. These example
names are formatting guidance, not information to copy into a real release.

```markdown
<!-- sthir-release:start -->
<!-- sthir-release-version: v3 -->
## v3 — A clear title for this release

**Major release** · Previous version: **v2.0**

A short description of the resulting experience and the main change.

[Compare with v2.0](https://github.com/sanilkatula/sthir_website/compare/v2.0...v3)

<!-- sthir-release:end -->
```

For a **major** release, a clear description of the redesign is sufficient.

For a **minor** release, use the minor version and label, and include
`### Changes` explaining every user-relevant visual, structural, behavioral,
and nonvisual change. Add `### Validation` with the checks actually performed.
Do not carry forward the previous release's change list. Do not create a preview
placeholder or require screenshots before pushing or merging.
