# GitHub Actions CI/CD

This repository uses GitHub Actions to automatically test and validate changes before they are merged into the master branch.

## Workflows

### CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `master` or `main` branch
- Pull requests targeting `master` or `main` branch

**Steps:**
1. Checkout code
2. Setup Node.js 20.x
3. Install dependencies with `npm ci`
4. Run all unit tests with `npm test`
5. Build the project with `npm run build`

This is the **required** workflow that must pass before merging.

### Test Workflow (`.github/workflows/test.yml`)

**Triggers:**
- Push to `master` or `main` branch
- Pull requests targeting `master` or `main` branch

**Jobs:**

#### 1. Test Job
- Runs on multiple Node.js versions (18.x, 20.x, 22.x)
- Ensures compatibility across different Node.js versions
- Runs unit tests
- Checks for high-severity vulnerabilities

#### 2. Lint Job
- Checks TypeScript compilation
- Ensures code quality

#### 3. Coverage Job (PR only)
- Runs tests with coverage
- Posts coverage summary as PR comment

## Setting Up Branch Protection

To enforce these checks before merging, configure branch protection rules on GitHub:

1. Go to **Settings** → **Branches**
2. Add a branch protection rule for `master` (or `main`)
3. Enable:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - Select status checks:
     - `test` (from CI workflow)
     - `test (18.x)`, `test (20.x)`, `test (22.x)` (from Test workflow)
   - ✅ Require pull request reviews before merging (recommended)
   - ✅ Dismiss stale pull request approvals when new commits are pushed

## Local Testing

Before pushing, ensure your changes pass locally:

```bash
# Run tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Build the project
npm run build
```

## Test Suite

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

## Troubleshooting

### CI Fails but Tests Pass Locally

1. Ensure you're using Node.js 20.x locally
2. Run `npm ci` instead of `npm install` to get exact dependency versions
3. Check that all files are committed (especially in `dist/` after build)

### Node Version Compatibility Issues

The project requires Node.js 18.x or higher due to:
- `@types/node@^20.0.0` for vitest compatibility
- Modern TypeScript features

### Audit Failures

The workflow includes `npm audit --audit-level=high` but allows it to fail (`continue-on-error: true`). 
Critical security issues should be addressed, but won't block merging.

## Maintenance

- GitHub Actions are defined in `.github/workflows/`
- Update Node.js versions in the matrix as needed
- Keep dependencies up to date with `npm update`
- Run `npm audit fix` regularly to address vulnerabilities
