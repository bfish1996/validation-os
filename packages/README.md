# @validation-os packages

The code side of validation-os: the dashboard, its reference API, and the
backend seam ship as versioned npm packages so an adopter installs them rather
than forking. `validation-os` stays a pnpm-workspace monorepo; the markdown
registry/skills/docs (this repo's original plugin surface) live alongside and
release separately via the Claude plugin.

| Package | What it is |
|---|---|
| [`@validation-os/core`](./core) | The `DataProvider` interface (the single backend seam), the shared **derivation module** (pure Confidence / Risk / Derived Impact / Strength functions), and shared registry types. Also ships an in-memory provider at `@validation-os/core/testing`. |
| [`@validation-os/adapter-firestore`](./adapter-firestore) | A `DataProvider` over Cloud Firestore via the Admin SDK — the first nosql-family adapter. Version-guarded writes (409 on stale). |
| [`@validation-os/api`](./api) | Framework-neutral Web-`Request`/`Response` route handlers: auth-guarded CRUD with **derive-on-write** via the shared module. Auth is injected (the app supplies Clerk), so the package has no auth-vendor dependency. |
| [`@validation-os/dashboard`](./dashboard) | React components + hooks consuming the `DataProvider`. The walking-skeleton surface is the register-counts panel. |

The four are versioned together (changesets `fixed` group) so an adopter gets
one coherent set.

## Develop

```bash
pnpm install
pnpm build        # tsup builds every package
pnpm test         # vitest (derivation unit tests + in-memory API contract)
pnpm typecheck
```

The adapter's real-backend contract test runs against the Firestore emulator
and is skipped unless you opt in (it needs a Java runtime):

```bash
firebase emulators:start --only firestore        # separate terminal
RUN_EMULATOR_TESTS=1 FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 pnpm test
```

## Release

`pnpm changeset` to record a change; merging the resulting "Version Packages"
PR publishes to npm (see `.github/workflows/publish.yml`). Requires the
`NPM_TOKEN` secret.

## The seam

Everything routes through one ~5-method interface:

```ts
interface DataProvider {
  list(register): Promise<Record[]>
  get(register, id): Promise<Record>
  create(register, data): Promise<Record>
  update(register, id, patch, version): Promise<Record> // version → 409 on stale
  link(relation, from, to): Promise<void>               // sets both ends
}
```

Writing an adapter for a new backend (markdown, SQL, …) is implementing these
five methods — a bounded task, not a rewrite. The derivation module is the
other shared spine: the dashboard, the API, and Claude Code audits all call the
same pure functions, so every writer computes the derived numbers identically.
It is kept in lock-step with `skills/_shared/ontology.yaml`.
