# Changesets

The four `@validation-os/*` packages are versioned together (see `fixed` in
`config.json`) so an adopter installs one coherent set. To record a change:

```
pnpm changeset
```

Pick the bump (patch/minor/major) and write a one-line summary. Commit the
generated file under `.changeset/`. On merge to `main`, the release workflow
opens a "Version Packages" PR; merging that PR publishes to npm.
