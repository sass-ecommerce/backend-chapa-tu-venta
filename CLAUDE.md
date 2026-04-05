# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev        # Start with hot reload
npm run build            # Compile TypeScript

# Testing
npm run test             # Run all unit tests
npm run test:watch       # Watch mode
npm run test:cov         # With coverage
npm run test:e2e         # End-to-end tests
npx jest path/to/file.spec.ts  # Run a single test file

# Code quality
npm run lint             # Lint and auto-fix
npm run format           # Prettier format
```

## Architecture

NestJS 11 REST API with dual-database architecture: **PostgreSQL** (TypeORM) for relational data and **MongoDB** (Mongoose) for logs/audit trails.

### Module Structure

- **`PassportAuthModule`** — Global module registered as `@Global()`. Registers `JwtAuthGuard` as the **default APP_GUARD** for all routes, meaning every endpoint requires a valid JWT unless decorated with `@Public()`.
- **`UsersModule`** — User profile management (read/update by slug). User creation is delegated to `PassportAuthService`.
- **`ProductsModule`** / **`StoresModule`** — Domain modules following the same controller/service/entity pattern.
- **`CommonModule`** — Shared services: `AppLoggerService`, `EmailService` (AWS SES), and common DTOs/interfaces.

### Key Architectural Patterns

**Authentication flow:**

1. Register → OTP sent via email → verify email → login → receives `accessToken` + `refreshToken` + `userSlug`
2. Refresh token rotation with token family tracking (reuse detection revokes entire family)
3. User is identified publicly by `slug` (UUID), not by internal `id` (bigint)

**Response envelope:** All controllers return `{ code, message, data }` for success. The `TransformResponseInterceptor` applies this globally. Errors use `{ code, message, errors }` via `HttpExceptionFilter`.

**Custom exceptions:** Domain errors extend `ApiException` (`src/common/exceptions/api.exception.ts`), which takes a business `code`, `message`, optional `errors[]`, and an HTTP status. Each domain has its own exceptions file (e.g., `auth/exceptions/auth.exceptions.ts`).

**Database:**

- PostgreSQL entities live in `schema: 'public'` (set on each `@Entity`). `synchronize: false` — migrations are manual.
- MongoDB is used only for audit logs via `UserLog` Mongoose schema.

### Required Environment Variables

```
# PostgreSQL
POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_SCHEMA

# MongoDB
MONGO_URI

# JWT / Auth
JWT_SECRET, JWT_ACCESS_TOKEN_EXPIRATION (default: 15m), JWT_REFRESH_TOKEN_EXPIRATION_DAYS (default: 7)
BCRYPT_ROUNDS (default: 10)

# AWS SES (email)
AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SES_FROM_EMAIL, AWS_SES_FROM_NAME

# OTP
OTP_EXPIRATION_MINUTES (default: 5), OTP_MAX_ATTEMPTS (default: 3), OTP_CODE_LENGTH (default: 6)
```

All vars are validated at startup via Joi (`src/config/joi.validation.ts`). App fails fast if required vars are missing.

### Conventions

- **Public routes**: Apply `@Public()` decorator (from `src/auth/decorators/public.decorator.ts`) to bypass the global JWT guard.
- **Current user**: Use `@CurrentUser()` decorator to extract the JWT payload (`sub`, `email`, `role`) in controllers.
- **Validation**: Controllers use `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`.
- **Test files**: Co-located with source files as `*.spec.ts`. Jest root is `src/`.
