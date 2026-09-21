# GitHub Actions CI/CD

This repository uses GitHub Actions to automatically test and validate changes before they are merged into the master branch.

## Workflows

### CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `master` or `main` branch
- Pull requests targeting `master` or `main` branch

**Jobs:**
1. **Storm engine (Ranger)** — checks out `terotests/Ranger` `master`, then runs `npm run storm:test`. That is the Ranger-compiled EVG unit suite (layout, flex, overlay, reconcile, …) plus the JS host checks. A missing compiler fails the job; the suites are not skipped.
2. **test** — vitest + build. `needs` Storm, so this check is skipped (and cannot satisfy branch protection) if the engine suite is red.
3. **test-gate** — stable required-check name. Fails unless Storm and `test` both succeeded.

`test-gate` is the check to require on `master`. Requiring only vitest used to let Storm regressions merge.

### Test Workflow (`.github/workflows/test.yml`)

**Triggers:**
- Push to `master` or `main` branch
- Pull requests targeting `master` or `main` branch

**Jobs:**

#### Storm engine (Ranger)
Same suite as CI, so the historically required `Run Unit Tests (20.x)` / `(22.x)` checks cannot go green while the engine is red. Those jobs `needs` Storm.

#### Test Job
- Runs on multiple Node.js versions (20.x, 22.x)
- Ensures compatibility across different Node.js versions
- Runs unit tests
- Checks for high-severity vulnerabilities

#### Lint Job
- Checks TypeScript compilation
- Ensures code quality

#### Coverage Job (PR only)
- Runs tests with coverage
- Posts coverage summary as PR comment

## Setting Up Branch Protection

GitHub will not block a merge unless these checks are **required**. In-repo jobs fail closed; the Settings tick is what stops a human clicking Merge on a red PR.

1. Go to **Settings** → **Rules** → **Rulesets** (or **Settings** → **Branches**)
2. Add a rule for `master` (and `main` if you use it)
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date before merging
   - Select status checks:
     - **`test-gate`** (the one to require — Storm engine + vitest + build)
     - `Storm engine (Ranger)` (optional extra; already folded into `test-gate` and into `Run Unit Tests`)
     - `test`
     - `Run Unit Tests (20.x)`, `Run Unit Tests (22.x)`
   - ✅ Do not allow bypassing the above settings (including administrators), or Storm can be skipped by a force merge
   - ✅ Dismiss stale pull request approvals when new commits are pushed

Do **not** require only `Code Quality` or `Test Coverage`. Those jobs do not run the engine suite (`Code Quality` even continues on TypeScript errors).

## Local Testing

Before pushing, ensure your changes pass locally:

```bash
# Thunderstruck TypeScript tests
npm test

# Storm engine: JS host checks always; .rgr suites when Ranger is present
npm run storm:test

# With an explicit compiler checkout
RANGER_ROOT=/path/to/Ranger npm run storm:test

# Run tests in watch mode during development
npm run test:watch

# Build the project
npm run build
```

`npm run storm:test` without Ranger skips the `.rgr` suites locally so the NPM package can be developed on its own. GitHub Actions never skips them.

## Test Suite

### Thunderstruck (vitest)

Current test coverage:
- **9 test files**
- **235 unit tests**
- All tests must pass for CI to succeed

### Test Files:
- `src/core/types.test.ts` - Core type utilities
- `src/core/core.test.ts` - Core functionality
- `src/layout/index.test.ts` - Layout engine unit tests
- `src/layout/layout.test.ts` - Nested layout calculations
- `src/serializers/XMLSerializer.test.ts` - XML parsing
- `src/environment/EVGEnvironment.test.ts` - Environment abstraction
- `src/environment/NodeEnvironment.test.ts` - Node.js environment
- `src/providers/NodeFontProvider.test.ts` - Font management
- `src/renderers/PDFRenderer.test.ts` - PDF rendering

### Storm engine (`npm run storm:test`)

Ranger-compiled suites under `storm/` (JSON, timing, reconcile, invalidate, style cache, component, viewport units, flex, box shorthand, style state, focus, style vars, overlay, fixed, connector, popover, RTL, ruler, host measurer/tree, patch, bitmap tracer, effects) plus JS host checks (adopt, gestures, stroke, view policy, shift, a11y paint). These are the EVG unit tests that used to live only in Ranger CI.

## Troubleshooting

### CI Fails but Tests Pass Locally

1. Ensure you're using Node.js 20.x locally
2. Run `npm ci` instead of `npm install` to get exact dependency versions
3. Check that all files are committed (especially in `dist/` after build)
4. If `storm:test` fails in CI, clone Ranger and set `RANGER_ROOT` — CI does not skip those suites

### Node Version Compatibility Issues

The project requires Node.js 20.x or higher due to:
- `@types/node@^20.0.0` for vitest compatibility
- Modern TypeScript features
- Vitest 4.x requires Node.js 20.x+ (ESM compatibility issues with Node 18.x)

### Audit Failures

The workflow includes `npm audit --audit-level=high` but allows it to fail (`continue-on-error: true`).
Critical security issues should be addressed, but won't block merging.

## Maintenance

- GitHub Actions are defined in `.github/workflows/`
- Update Node.js versions in the matrix as needed
- Keep dependencies up to date with `npm update`
- Run `npm audit fix` regularly to address vulnerabilities
