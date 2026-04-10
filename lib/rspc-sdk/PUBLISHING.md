# Publishing Kronova rspc SDK

This guide covers publishing the Kronova rspc SDK (TypeScript) to npm, pnpm, and other package managers.

## Prerequisites

### Required Tools

```bash
# Install Node.js (v18+ recommended)
# Download from https://nodejs.org

# Install pnpm
npm install -g pnpm

# Install yarn (optional)
npm install -g yarn

# Install TypeScript compiler
npm install -g typescript
```

### Authentication

```bash
# npm
npm login

# pnpm  
pnpm login

# yarn
yarn login
```

## Project Structure

```
lib/rspc-sdk/
├── src/
│   └── index.ts
├── dist/ (generated)
│   ├── index.js
│   ├── index.d.ts
│   └── index.js.map
├── package.json
├── tsconfig.json
├── PUBLISHING.md (this file)
└── README.md
```

## Configuration

### package.json

```json
{
  "name": "@kronova/rspc-sdk",
  "version": "0.1.0",
  "description": "Enterprise-grade TypeScript SDK for Kronova rspc protocol",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --clean",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "prepublishOnly": "pnpm run build",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src",
    "typecheck": "tsc --noEmit"
  },
  "keywords": [
    "kronova",
    "sdk",
    "rspc",
    "typescript",
    "asset-management",
    "enterprise",
    "supabase"
  ],
  "author": "Kronova Team <dev@kronova.io>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/kronova/kronova-rspc-sdk"
  },
  "homepage": "https://kronova.io",
  "bugs": {
    "url": "https://github.com/kronova/kronova-rspc-sdk/issues"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "eslint": "^8.0.0"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### .npmignore

```
# Source files
src/
*.ts
!*.d.ts

# Config files
tsconfig.json
.eslintrc*
.prettierrc*
vitest.config.ts

# Development
node_modules/
.git/
.github/
.vscode/
*.log
coverage/

# Tests
**/*.test.ts
**/*.spec.ts
__tests__/

# Documentation (keep README.md)
docs/
!README.md
```

## Building

### Install Dependencies

```bash
cd lib/rspc-sdk
pnpm install
```

### Build the Package

```bash
# Build for production
pnpm run build

# Watch mode for development
pnpm run dev
```

### Verify Build Output

```bash
# Check dist directory
ls -la dist/

# Expected files:
# - index.js (CommonJS)
# - index.mjs (ES Module)
# - index.d.ts (TypeScript definitions)
# - index.js.map (source maps)
```

## Version Management

### Semantic Versioning

Follow [SemVer](https://semver.org/):
- **MAJOR**: Breaking API changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Update Version

```bash
# Using npm version command
npm version patch  # 0.1.0 -> 0.1.1
npm version minor  # 0.1.0 -> 0.2.0
npm version major  # 0.1.0 -> 1.0.0

# Or manually edit package.json
```

### Create Git Tag

```bash
# Automatically create and push tag
npm version patch -m "Release v%s"
git push origin main --tags

# Or manually
git tag rspc-sdk-v0.1.0
git push origin rspc-sdk-v0.1.0
```

## Publishing

### Pre-publish Checks

```bash
# Run tests
pnpm test

# Type checking
pnpm run typecheck

# Lint code
pnpm run lint

# Build
pnpm run build

# Dry run (see what will be published)
npm pack --dry-run

# Create tarball for inspection
npm pack
tar -xvzf kronova-rspc-sdk-0.1.0.tgz
```

### To npm

```bash
# Public package
npm publish --access public

# With tag (for beta/alpha releases)
npm publish --tag beta
npm publish --tag next

# Specific registry
npm publish --registry https://registry.npmjs.org
```

### To pnpm

```bash
# pnpm uses npm registry by default
pnpm publish --access public

# With tag
pnpm publish --tag beta

# To custom registry
pnpm publish --registry https://registry.kronova.io
```

### To Yarn

```bash
# Yarn Berry (v2+)
yarn npm publish --access public

# Classic Yarn (v1)
yarn publish --access public
```

### To GitHub Packages

Update `package.json`:

```json
{
  "name": "@kronova/rspc-sdk",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

```bash
# Authenticate
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> ~/.npmrc

# Publish
npm publish
```

### To Private Registry

```bash
# Verdaccio, Nexus, Artifactory, etc.
npm publish --registry https://npm.company.com

# With authentication
npm login --registry https://npm.company.com
npm publish --registry https://npm.company.com
```

## CI/CD Automation

### GitHub Actions

Create `.github/workflows/publish-rspc-sdk.yml`:

```yaml
name: Publish rspc SDK

on:
  push:
    tags:
      - 'rspc-sdk-v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write # For npm provenance
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
          cache: 'pnpm'
      
      - name: Install dependencies
        working-directory: lib/rspc-sdk
        run: pnpm install --frozen-lockfile
      
      - name: Run tests
        working-directory: lib/rspc-sdk
        run: pnpm test
      
      - name: Build package
        working-directory: lib/rspc-sdk
        run: pnpm run build
      
      - name: Publish to npm
        working-directory: lib/rspc-sdk
        run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Automated Version Bumps

Create `.github/workflows/version-bump.yml`:

```yaml
name: Version Bump

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version bump type'
        required: true
        type: choice
        options:
          - patch
          - minor
          - major

jobs:
  bump:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Configure git
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
      
      - name: Bump version
        working-directory: lib/rspc-sdk
        run: |
          npm version ${{ github.event.inputs.version }} -m "chore: release rspc-sdk v%s"
          git push origin main --tags
```

## Testing Package Locally

### Using npm link

```bash
# In SDK directory
cd lib/rspc-sdk
pnpm run build
npm link

# In test project
cd ~/test-project
npm link @kronova/rspc-sdk

# Test the SDK
node -e "console.log(require('@kronova/rspc-sdk'))"
```

### Using npm pack

```bash
cd lib/rspc-sdk
pnpm run build
npm pack

# Creates: kronova-rspc-sdk-0.1.0.tgz

# In test project
npm install /path/to/kronova-rspc-sdk-0.1.0.tgz
```

### Using Verdaccio (Local Registry)

```bash
# Install Verdaccio
npm install -g verdaccio

# Start Verdaccio
verdaccio

# Configure npm to use Verdaccio
npm set registry http://localhost:4873

# Publish to Verdaccio
npm publish

# Test installation
npm install @kronova/rspc-sdk
```

## Usage After Publishing

```bash
# Install via npm
npm install @kronova/rspc-sdk

# Install via pnpm
pnpm add @kronova/rspc-sdk

# Install via yarn
yarn add @kronova/rspc-sdk

# Install specific version
npm install @kronova/rspc-sdk@0.1.0

# Install beta tag
npm install @kronova/rspc-sdk@beta
```

```typescript
// ESM import
import { KronovaSDK } from '@kronova/rspc-sdk'

// CommonJS require
const { KronovaSDK } = require('@kronova/rspc-sdk')

// Usage
const sdk = new KronovaSDK()
const assets = await sdk.assets.list()
```

## Best Practices

### 1. Bundle Size Optimization

```bash
# Analyze bundle
npm install -g source-map-explorer
pnpm run build
source-map-explorer dist/index.js

# Use tree shaking
# Ensure "sideEffects": false in package.json
```

### 2. Type Safety

```typescript
// Export all types for consumers
export type { Asset, AssetCreateInput } from './types'

// Provide strict TypeScript definitions
export interface KronovaSDKOptions {
  apiKey?: string
  baseUrl?: string
}
```

### 3. Documentation

```markdown
# README.md should include:
- Installation instructions
- Quick start guide
- API reference
- Examples
- Migration guides
- Changelog link
```

### 4. Versioning Strategy

```bash
# Use conventional commits
git commit -m "feat: add asset deletion API"    # minor bump
git commit -m "fix: handle null responses"      # patch bump
git commit -m "feat!: change API signature"     # major bump

# Automate with semantic-release
npm install -D semantic-release
```

### 5. Security

```bash
# Enable 2FA for npm account
npm profile enable-2fa auth-and-writes

# Use npm provenance (requires CI/CD)
npm publish --provenance

# Audit dependencies
npm audit
npm audit fix

# Use .npmrc for security
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

## Publishing Checklist

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Run all tests: `pnpm test`
- [ ] Type check: `pnpm run typecheck`
- [ ] Lint code: `pnpm run lint`
- [ ] Build package: `pnpm run build`
- [ ] Test locally: `npm link` and verify
- [ ] Verify package contents: `npm pack --dry-run`
- [ ] Update documentation in README.md
- [ ] Create git tag
- [ ] Push tag: `git push origin --tags`
- [ ] Publish: `npm publish --access public`
- [ ] Verify installation: `npm view @kronova/rspc-sdk`
- [ ] Test in fresh project
- [ ] Announce release (GitHub, docs, etc.)

## Troubleshooting

### 403 Forbidden on Publish

```bash
# Check npm authentication
npm whoami

# Re-authenticate
npm logout
npm login

# Verify scope access
npm access ls-collaborators @kronova/rspc-sdk

# Check package name isn't taken
npm view @kronova/rspc-sdk
```

### TypeScript Definitions Not Working

```bash
# Ensure .d.ts files are in dist/
ls dist/*.d.ts

# Check package.json
# "types": "./dist/index.d.ts"

# Rebuild with declarations
pnpm run build
```

### Module Resolution Issues

```typescript
// Ensure package.json has correct exports
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

### Package Too Large

```bash
# Check package size
npm pack
ls -lh *.tgz

# Optimize build (use .npmignore)
echo "src/" >> .npmignore
echo "**/*.test.ts" >> .npmignore

# Use bundler (tsup, rollup, etc.)
# Minify output
```

## Additional Resources

- [npm Publishing Documentation](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [pnpm Publishing Guide](https://pnpm.io/cli/publish)
- [TypeScript Package Publishing](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html)
- [Kronova Developer Docs](https://docs.kronova.io)

## Support

For issues or questions:
- GitHub Issues: https://github.com/kronova/kronova-rspc-sdk/issues
- Email: dev@kronova.io
- Documentation: https://docs.kronova.io
- Discord: https://discord.gg/kronova
