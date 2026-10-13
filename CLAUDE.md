# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

NestJS 11 REST API on **PostgreSQL** (TypeORM). Authentication is delegated to **AWS Cognito**: every endpoint requires a valid Cognito JWT unless decorated with `@Public()`.

**Response envelope:** All controllers return `{ code, message, data }` for success. The `TransformResponseInterceptor` applies this globally. Errors use `{ code, message, errors }` via `HttpExceptionFilter`.

**Custom exceptions:** Domain errors extend `ApiException` (`src/common/exceptions/api.exception.ts`), which takes a business `code`, `message`, optional `errors[]`, and an HTTP status. Each domain has its own exceptions file (e.g., `auth/exceptions/auth.exceptions.ts`).

**Database:** PostgreSQL entities live in `schema: 'public'` (set on each `@Entity`). `synchronize: false` — migrations are manual.

### Database migrations

Manual SQL migrations live in `migrations/`. `0001_init_schema.sql` is the baseline (full schema as of the production cutover) — it is **closed** and must never be edited again.

Every future database change, no matter how small, is a **new file**:

- Name it `NNNN_short_description.sql`, where `NNNN` is the next zero-padded sequence number after the highest one currently in `migrations/` (e.g. `0002_add_orders_table.sql`).
- One logical change per file (one new table, one column addition, one index, etc.) — don't bundle unrelated changes.
- Wrap the file in `BEGIN; ... COMMIT;`.
- Prefer idempotent DDL where practical (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`) so a migration can be safely re-run.
- Update the corresponding TypeORM entity in the same change/PR as the migration that alters its table, so entities and schema never drift.
- Never edit or delete a migration file once it has been applied to any shared environment (staging/production) — ship a corrective migration instead.

Env vars are validated at startup via Joi (`src/config/joi.validation.ts`); the app fails fast if required vars are missing.

### Conventions

- **Public routes**: Apply `@Public()` decorator (from `src/auth/decorators/public.decorator.ts`) to bypass the global JWT guard.
- **Current user**: Use `@CurrentUser()` decorator to get the Cognito token payload (`sub`, `tenantId`, …) in controllers. `tenantId` is null for users who haven't created a store yet.
- **Validation**: Controllers use `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`.
- **Test files**: Co-located with source files as `*.spec.ts`. Jest root is `src/`.
