# Publishing Kronova Rust SDK

This guide covers publishing the Kronova Rust SDK to npm and other package managers using WebAssembly (WASM) bindings.

## Prerequisites

### Required Tools

```bash
# Install Rust and Cargo
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack (for WASM bindings)
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Install Node.js and package managers
# npm comes with Node.js
# pnpm
npm install -g pnpm
# yarn
npm install -g yarn
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
lib/rust-sdk/
├── src/
│   ├── lib.rs
│   ├── assets.rs
│   ├── plaid.rs
│   └── ...
├── Cargo.toml
├── package.json (generated)
├── PUBLISHING.md (this file)
└── README.md
```

## Building for Publication

### 1. Configure Cargo.toml

Ensure your `Cargo.toml` includes:

```toml
[package]
name = "kronova-rust-sdk"
version = "0.1.0"
edition = "2021"
authors = ["Kronova Team <dev@kronova.io>"]
description = "Enterprise-grade Rust SDK for Kronova platform"
license = "MIT"
repository = "https://github.com/kronova/kronova-rust-sdk"
homepage = "https://kronova.io"
keywords = ["kronova", "sdk", "wasm", "asset-management"]
categories = ["wasm", "web-programming"]

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
reqwest = { version = "0.11", features = ["json"] }
tokio = { version = "1.0", features = ["full"] }
wasm-bindgen = "0.2"
wasm-bindgen-futures = "0.4"

[dev-dependencies]
wasm-bindgen-test = "0.3"

[profile.release]
opt-level = "z"
lto = true
codegen-units = 1
```

### 2. Build WASM Package

```bash
# Build for nodejs target
wasm-pack build --target nodejs --out-dir pkg

# Build for web target
wasm-pack build --target web --out-dir pkg-web

# Build for bundler target (webpack, rollup, etc.)
wasm-pack build --target bundler --out-dir pkg-bundler
```

### 3. Configure package.json

The generated `pkg/package.json` should be enhanced:

```json
{
  "name": "@kronova/rust-sdk",
  "version": "0.1.0",
  "description": "Enterprise-grade Rust SDK for Kronova platform",
  "main": "kronova_rust_sdk.js",
  "types": "kronova_rust_sdk.d.ts",
  "files": [
    "kronova_rust_sdk_bg.wasm",
    "kronova_rust_sdk.js",
    "kronova_rust_sdk.d.ts"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/kronova/kronova-rust-sdk"
  },
  "keywords": [
    "kronova",
    "sdk",
    "rust",
    "wasm",
    "asset-management",
    "enterprise"
  ],
  "author": "Kronova Team <dev@kronova.io>",
  "license": "MIT",
  "homepage": "https://kronova.io",
  "bugs": {
    "url": "https://github.com/kronova/kronova-rust-sdk/issues"
  }
}
```

## Version Management

### Semantic Versioning

Follow [SemVer](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Update Version

```bash
# Update version in Cargo.toml
# Then rebuild
wasm-pack build --target nodejs

# Or use cargo-edit
cargo install cargo-edit
cargo set-version --bump patch  # or minor, major
```

## Publishing

### To npm

```bash
# Navigate to pkg directory
cd pkg

# Publish (public)
npm publish --access public

# Publish (scoped private)
npm publish --access restricted

# Publish with tag
npm publish --tag beta
```

### To pnpm

```bash
cd pkg

# pnpm uses npm registry by default
pnpm publish --access public

# With custom registry
pnpm publish --registry https://registry.kronova.io
```

### To Yarn

```bash
cd pkg

# Yarn also uses npm registry
yarn publish --access public
```

### To GitHub Packages

Add to `pkg/package.json`:

```json
{
  "publishConfig": {
    "registry": "https://npm.pkg.github.com/@kronova"
  }
}
```

```bash
# Authenticate
npm login --registry=https://npm.pkg.github.com

# Publish
npm publish
```

## CI/CD Automation

### GitHub Actions

Create `.github/workflows/publish-rust-sdk.yml`:

```yaml
name: Publish Rust SDK

on:
  push:
    tags:
      - 'rust-sdk-v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          override: true
      
      - name: Install wasm-pack
        run: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
      
      - name: Build WASM package
        working-directory: lib/rust-sdk
        run: wasm-pack build --target nodejs
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Publish to npm
        working-directory: lib/rust-sdk/pkg
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Publishing Checklist

- [ ] Update version in `Cargo.toml`
- [ ] Update `CHANGELOG.md`
- [ ] Run tests: `cargo test`
- [ ] Build WASM: `wasm-pack build`
- [ ] Test package locally: `npm link`
- [ ] Verify package contents: `npm pack --dry-run`
- [ ] Create git tag: `git tag rust-sdk-v0.1.0`
- [ ] Push tag: `git push origin rust-sdk-v0.1.0`
- [ ] Publish: `npm publish`

## Usage After Publishing

```bash
# Install via npm
npm install @kronova/rust-sdk

# Install via pnpm
pnpm add @kronova/rust-sdk

# Install via yarn
yarn add @kronova/rust-sdk
```

```typescript
// Import in TypeScript/JavaScript
import { KronovaClient } from '@kronova/rust-sdk'

const client = new KronovaClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)
```

## Best Practices

### 1. Size Optimization

```toml
[profile.release]
opt-level = "z"      # Optimize for size
lto = true           # Link-time optimization
codegen-units = 1    # Better optimization
strip = true         # Strip symbols
```

### 2. Testing Before Publish

```bash
# Create a test project
mkdir test-sdk && cd test-sdk
npm init -y

# Link your local package
cd ../lib/rust-sdk/pkg
npm link

cd ../../../test-sdk
npm link @kronova/rust-sdk

# Test import
node -e "console.log(require('@kronova/rust-sdk'))"
```

### 3. Documentation

- Keep README.md up to date
- Include usage examples
- Document breaking changes in CHANGELOG.md
- Provide TypeScript definitions

### 4. Security

```bash
# Run security audit
cargo audit

# Check for vulnerable dependencies
npm audit
```

## Troubleshooting

### WASM Build Fails

```bash
# Ensure wasm32-unknown-unknown target is installed
rustup target add wasm32-unknown-unknown

# Clean and rebuild
cargo clean
wasm-pack build
```

### npm Publish 403 Error

```bash
# Re-authenticate
npm logout
npm login

# Check scope permissions
npm org ls kronova

# Verify package name isn't taken
npm view @kronova/rust-sdk
```

### Package Size Too Large

```bash
# Check package size
npm pack
ls -lh *.tgz

# Optimize WASM
wasm-opt -Oz -o optimized.wasm input.wasm

# Use .npmignore to exclude unnecessary files
echo "src/" >> .npmignore
echo "target/" >> .npmignore
```

## Additional Resources

- [wasm-pack Documentation](https://rustwasm.github.io/wasm-pack/)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Rust and WebAssembly](https://rustwasm.github.io/docs/book/)
- [Kronova Developer Docs](https://docs.kronova.io)

## Support

For issues or questions:
- GitHub Issues: https://github.com/kronova/kronova-rust-sdk/issues
- Email: dev@kronova.io
- Docs: https://docs.kronova.io
