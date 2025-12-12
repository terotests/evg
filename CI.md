# CI/CD Setup for EVG

This document outlines how to set up the Continuous Integration and Deployment (CI/CD) pipeline for the EVG project.

## Overview

The CI/CD pipeline automatically publishes a new version of the EVG package to NPM when:

1. A pull request is merged into the `master` (or `main`) branch
2. The `version` field in `package.json` has been updated

## Prerequisites

Before setting up the CI/CD pipeline, you need:

1. An NPM account with publishing rights to the `evg` package
2. A GitHub repository with admin access
3. The workflow file at `.github/workflows/publish.yml`

## Setup Instructions

### Step 1: Enable GitHub Actions

1. Go to your GitHub repository: https://github.com/terotests/evg
2. Navigate to **Settings** → **Actions** → **General**
3. Under **Actions permissions**, select one of:
   - **Allow all actions and reusable workflows** (easiest)
   - Or **Allow select actions** and add:
     - `actions/checkout@*`
     - `actions/setup-node@*`
     - `actions/create-release@*`
4. Click **Save**

### Step 2: Configure Workflow Permissions

1. Still in **Settings** → **Actions** → **General**
2. Scroll down to **Workflow permissions**
3. Select **Read and write permissions**
4. Check **Allow GitHub Actions to create and approve pull requests** (optional, for future automation)
5. Click **Save**

### Step 3: Generate an NPM Access Token

> ⚠️ **Important (December 2024)**: NPM classic tokens are deprecated. You must use **Granular Access Tokens** or **OIDC Trusted Publishing**.

#### Option A: Granular Access Token (Recommended for CI/CD)

1. Log in to [npmjs.com](https://www.npmjs.com/)
2. Go to **Access Tokens**: https://www.npmjs.com/settings/~/tokens
3. Click **Generate New Token** → **Granular Access Token**
4. Configure the token:
   - **Token name**: `evg-github-actions` (or similar descriptive name)
   - **Expiration**: Set an appropriate expiration (max 90 days for write tokens)
   - **Packages and scopes**: Select "Only select packages" and choose `evg`
   - **Permissions**: Select **Read and write**
   - **Organizations**: Leave as default unless needed
5. **Important for CI/CD**: Enable **Bypass 2FA for automation** if you have 2FA enabled
6. Click **Generate token**
7. Copy the token immediately (you won't see it again!)

#### Option B: Using CLI to Create Token

```bash
# Login first (creates a 2-hour session)
npm login

# Create a granular token for CI/CD
npm token create --description "evg-github-actions" --cidr "" --publish
```

#### Option C: OIDC Trusted Publishing (Most Secure - No Token Needed)

OIDC (OpenID Connect) allows GitHub Actions to publish without storing tokens. This is the most secure option.

1. Go to https://www.npmjs.com/settings/~/tokens
2. Click **Add new token** → **Granular Access Token**
3. Instead of creating a token, look for **Trusted Publishing** / **OIDC** settings
4. Link your GitHub repository to your NPM package

Then update `.github/workflows/publish.yml` to use OIDC:

```yaml
permissions:
  contents: read
  id-token: write # Required for OIDC

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          registry-url: "https://registry.npmjs.org"
      - run: npm ci
      - run: npm run build
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }} # Or use OIDC
```

> 📖 More info: https://docs.npmjs.com/generating-provenance-statements

### Step 4: Add NPM Token to GitHub Secrets

1. Go to your GitHub repository: https://github.com/terotests/evg
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Set the name to: `NPM_TOKEN`
5. Paste your NPM access token as the value
6. Click **Add secret**

### Step 5: Verify Branch Protection (Optional but Recommended)

If you have branch protection rules on `master`/`main`:

1. Go to **Settings** → **Branches**
2. Click **Edit** on your protection rule for `master`/`main`
3. Ensure **Require status checks to pass before merging** includes your workflow (if desired)
4. Note: The publish workflow runs _after_ merge, so it doesn't block PRs

### Step 6: Verify Workflow File

Ensure the workflow file exists at `.github/workflows/publish.yml`. The workflow:

- Triggers on pushes to `master` or `main` branch
- Compares the current version with the previous version
- Only publishes if the version has changed
- Builds the package using `npm run build`
- Publishes to NPM using `npm publish`
- Creates a GitHub release with version tag

## How to Release a New Version

1. **Update version in `package.json`**:

   ```json
   {
     "name": "evg",
     "version": "1.0.39",  // Increment this
     ...
   }
   ```

2. **Commit and push your changes**:

   ```bash
   git add package.json
   git commit -m "Bump version to 1.0.39"
   git push origin your-feature-branch
   ```

3. **Create a Pull Request** to merge into `master`

4. **Merge the Pull Request** - The CI/CD pipeline will automatically:

   - Detect the version change
   - Build the package
   - Publish to NPM
   - Create a GitHub release

5. **Verify the workflow ran**:
   - Go to the **Actions** tab in your GitHub repository
   - You should see a workflow run named "Publish to NPM"
   - Click on it to see the detailed logs

## Verifying Your Setup

After completing the setup, you can verify everything is working:

1. **Check Actions Tab**: Go to https://github.com/terotests/evg/actions
   - You should see the "Publish to NPM" workflow listed
2. **Test with a Version Bump**:

   - Create a test branch
   - Bump the version in `package.json`
   - Create a PR and merge to `master`
   - Watch the Actions tab for the workflow run

3. **Check Workflow Logs**: If something fails, click on the failed workflow run to see detailed logs for each step

## Workflow Details

### Version Detection

The workflow compares versions by:

1. Reading the current `package.json` version
2. Checking out the previous commit's `package.json`
3. Comparing the two versions
4. Only proceeding with publish if they differ

### Build Process

The build process uses:

- **esbuild** for bundling TypeScript to JavaScript
- Outputs two main files:
  - `dist/index.js` - Main library module
  - `dist/bin/evg.js` - CLI tool
- Copies font files to `dist/fonts/`

### Security

- The NPM token is stored as a GitHub secret
- The token is only exposed to the publish step
- GitHub's `GITHUB_TOKEN` is automatically provided for creating releases

## Troubleshooting

### Actions Not Running At All

- Go to **Settings** → **Actions** → **General**
- Verify Actions are enabled (not disabled for the repository)
- Check if the workflow file is in the correct location: `.github/workflows/publish.yml`
- Ensure the workflow file has valid YAML syntax

### Workflow Fails: "Resource not accessible by integration"

This usually means insufficient permissions:

1. Go to **Settings** → **Actions** → **General** → **Workflow permissions**
2. Select **Read and write permissions**
3. Save and re-run the workflow

### Publish Failed: 401 Unauthorized

- Verify the `NPM_TOKEN` secret is correctly set
- Check if the token has expired or been revoked
- **Classic tokens no longer work** - You must use Granular Access Tokens (see Step 3)
- For Granular tokens, ensure:
  - Token has **Read and write** permissions
  - Token is scoped to the `evg` package (or all packages)
  - **Bypass 2FA for automation** is enabled (if you have 2FA)
  - Token has not expired (max 90 days for write tokens)

### Publish Failed: 403 Forbidden

- Verify you have publishing rights to the `evg` package on NPM
- Check if 2FA is required and **Bypass 2FA for automation** is enabled on your token
- For Granular tokens, verify the token has write access to the specific package

### Token Expired

Granular Access Tokens have a maximum expiration of 90 days for write permissions. Set a calendar reminder to:

1. Generate a new token before expiration
2. Update the `NPM_TOKEN` secret in GitHub

### Version Not Detected as Changed

- Ensure the version in `package.json` is actually different
- Check the workflow logs for version comparison output

### Build Failed

- Run `npm run build` locally to verify the build works
- Check if all dependencies are listed in `package.json`

## Manual Publishing

If you need to publish manually:

```bash
# Build the package
npm run build

# Login to NPM (if not already)
npm login

# Publish
npm publish
```

## Additional Resources

- [NPM Granular Access Tokens](https://docs.npmjs.com/creating-and-viewing-access-tokens)
- [NPM OIDC Trusted Publishing](https://docs.npmjs.com/generating-provenance-statements)
- [NPM Publishing Documentation](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
