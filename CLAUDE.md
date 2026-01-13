# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TypeScript client library for the Wave API (African fintech platform). Provides type-safe access to Wave's payment services including balance/reconciliation, checkout, payout, and merchants APIs.

Published to npm as `@berrydev-ai/wave-api-client`.

Uses Bun as the runtime, package manager, and test runner.

## Commands

```bash
bun install         # Install dependencies
bun run build       # Compile TypeScript to dist/
bun test            # Run all tests
bun run lint        # Run ESLint
bun run lint:fix    # Fix ESLint issues
bun run format      # Format with Prettier
bun run docs        # Generate TypeDoc documentation
bun run clean       # Remove dist/ and coverage/
```

Run a single test file:
```bash
bun test test/unit/api/checkout/index.test.ts
```

Run tests matching a pattern:
```bash
bun test --test-name-pattern "createSession"
```

## Publishing to npm

The package is scoped under `@berrydev-ai`. Publishing commands:

```bash
bun run publish:patch   # 1.0.0 -> 1.0.1
bun run publish:minor   # 1.0.0 -> 1.1.0
bun run publish:major   # 1.0.0 -> 2.0.0
```

These commands bump the version, push git tags, and publish to npm.

## Architecture

### Entry Point
- `src/index.ts` - Public exports (WaveClient, types, errors)
- `src/wave-client.ts` - Main `WaveClient` class that composes all API modules

### HTTP Layer
- `src/http/client.ts` - Native fetch-based HTTP client with timeout support and error transformation

### API Modules
Each API domain follows the same pattern in `src/api/{domain}/`:
- `index.ts` - API class with methods that delegate to HttpClient
- `types.ts` - TypeScript interfaces for requests/responses

Domains:
- `balance/` - Balance & Reconciliation API
- `checkout/` - Checkout sessions API
- `payout/` - Single payouts and batch payouts API
- `merchants/` - Aggregated merchants API

### Common Utilities
- `src/common/errors.ts` - Error class hierarchy (WaveApiError → specific errors by HTTP status)
- `src/common/types.ts` - Shared types (Currency, ErrorCode enum, pagination)
- `src/common/constants.ts` - API endpoints, headers, defaults
- `src/common/utils.ts` - Helpers (formatAmount, validation)
- `src/config.ts` - Configuration validation

### Error Handling Pattern
API errors are transformed by `createErrorFromResponse()` into typed error classes:
- 401 → AuthenticationError
- 403 → PermissionError
- 404 → NotFoundError
- 422 → ValidationError
- 429 → RateLimitError
- 5xx → ServerError

### Tests
Located in `test/unit/` mirroring `src/` structure. Uses Bun's built-in test runner with `bun:test`.
