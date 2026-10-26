# README release section

Preserve the project title. Replace the previous release block below it with the
new release, leaving useful project documentation below the end marker.

Use the actual repository URL and versions in the compare link. These example
names are formatting guidance, not information to copy into a real release.

```markdown
<!-- sthir-release:start -->
<!-- sthir-release-version: v3 -->
## v3 — A clear title for this release

**Major release** · Previous version: **v2.0**

A short description of the resulting experience and the main change.

[Compare with v2.0](https://github.com/sanilkatula/sthir_website/compare/v2.0...v3)

### Preview

![Homepage in v3](docs/releases/v3/homepage.png)

Caption describing this homepage view.

<!-- sthir-release:end -->
```

For a **major** release, one homepage image and a description are sufficient.

For a **minor** release, use the minor version and label, add one to four focused
images with useful captions, and include `### Other changes` for every change
not shown. Add `### Validation` with the checks actually performed. Do not carry
forward the previous release's screenshots or change list.
