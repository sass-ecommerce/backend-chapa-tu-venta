# Agent Guidelines for backend-chapa-tu-venta

This document provides coding agents with essential information about this NestJS backend project.

## Technology Stack

- **Framework**: NestJS v11.0.1 with TypeScript v5.7.3
- **Authentication**: Passport.js with JWT + Refresh Tokens (local strategy)
- **Databases**: PostgreSQL 15 (TypeORM) + MongoDB 5 (Mongoose)
- **Validation**: class-validator, class-transformer, Joi
- **Testing**: Jest v30.0.0 with ts-jest and Supertest
- **Code Quality**: ESLint v9.18.0 + Prettier v3.4.2
- **Node Version**: LTS/Jod (see .nvmrc)

## Build, Lint, and Test Commands

### Development

```bash
npm run start:dev          # Start with hot-reload
npm run start:debug        # Start with debugging enabled
```

### Build & Production

```bash
npm run build              # Compile TypeScript to dist/
npm run start:prod         # Run production build
```

### Code Quality

```bash
npm run lint               # Run ESLint with auto-fix
npm run format             # Format all files with Prettier
```

### Testing (SOLO bajo demanda explícita del usuario)

```bash
npm test                   # Run all unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage report
npm run test:debug         # Debug tests with Node inspector
npm run test:e2e           # Run end-to-end tests

# Run a single test file
npm test -- users.service.spec.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should create user"

# Run a single E2E test
npm run test:e2e -- --testNamePattern="/ (GET)"
```

### Database

```bash
docker-compose up -d       # Start PostgreSQL and MongoDB containers
docker-compose down        # Stop database containers
```

## Project Structure

```
src/
├── common/                # Shared utilities (DTOs, decorators, etc.)
├── config/                # Configuration files (DB, validation)
├── products/              # Product management module
├── seed/                  # Database seeding functionality
├── users/                 # User management + Clerk webhook integration
├── app.module.ts          # Root application module
└── main.ts                # Application entry point

test/                      # E2E test files
```

## Code Style Guidelines

### Imports

- **Order**: External packages → NestJS packages → Internal modules
- **Grouping**: Separate groups with blank lines
- **Style**: Use named imports, avoid `import *`

```typescript
// External packages
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// Internal modules
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
```

### Formatting

- **Quotes**: Single quotes (enforced by Prettier)
- **Trailing commas**: Always (enforced by Prettier)
- **Line endings**: Auto (cross-platform compatibility)
- **Indentation**: 2 spaces

### TypeScript & Types

- **Avoid `any`**: Disabled warning, but prefer explicit types
- **Interfaces**: Use for public contracts and data shapes
- **Type inference**: Leverage where obvious, explicit otherwise
- **Async/await**: Prefer over promises, handle floating promises

```typescript
// Good
async findOne(id: string): Promise<User> {
  const user = await this.userRepository.findOne({ where: { id } });
  if (!user) throw new NotFoundException(`User #${id} not found`);
  return user;
}
```

### Naming Conventions

- **Files**: kebab-case (e.g., `create-user.dto.ts`, `users.service.ts`)
- **Classes**: PascalCase (e.g., `UsersService`, `CreateUserDto`)
- **Interfaces**: PascalCase with descriptive names (e.g., `IUserStatus`)
- **Variables/Functions**: camelCase (e.g., `findAllUsers`, `isActive`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_PORT`)
- **Database columns**: snake_case in decorators, camelCase in properties

```typescript
@Entity('users')
export class User {
  @Column('varchar', { name: 'first_name' })
  firstName: string; // camelCase property, snake_case in DB
}
```

### DTOs and Validation

- **class-validator**: Use decorators for all validations
- **Nested validation**: Use `@ValidateNested()` + `@Type()`
- **Updates**: Extend with `PartialType` from `@nestjs/mapped-types`
- **Transformations**: Use `@Transform()` for data coercion

```typescript
export class CreateProductDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
```

### Error Handling

- **Pattern**: Use try-catch with `handleDBExceptions` helper
- **HTTP Exceptions**: Use NestJS built-in exceptions
- **Database Errors**: Map to appropriate HTTP status codes
- **Logging**: Console.error before throwing InternalServerError

```typescript
private handleDBExceptions(error: any): never {
  if (error?.code === '23505') {
    throw new BadRequestException(error.detail);
  }
  console.error(error);
  throw new InternalServerErrorException('Unexpected error, check server logs');
}
```

### Module Organization

- **Structure**: Feature-based modules (users, products, etc.)
- **Exports**: Only export what other modules need
- **Imports**: Import `TypeOrmModule.forFeature([Entity])` for repositories
- **Providers**: List services, repositories, and custom providers

### Database Strategy

- **PostgreSQL**: Relational data (users, products) via TypeORM
- **MongoDB**: Logs and audit trails via Mongoose
- **Entities**: Use decorators (`@Entity`, `@Column`, `@Schema`, `@Prop`)
- **Relations**: Define with decorators (`@ManyToOne`, `@OneToMany`, etc.)

### Configuration

- **Environment**: Use `@nestjs/config` with Joi validation
- **Factory pattern**: `registerAs()` for namespaced config
- **Type-safe**: Inject `ConfigService` with generics
- **Validation**: Define Joi schema in `joi.validation.ts`

### Global Setup

- **Validation pipe**: Enabled globally with `whitelist: true`
- **API prefix**: All routes prefixed with `/api`
- **Port**: From environment variable, fallback to 3000

## Testing Guidelines

### Unit Tests

- **Location**: Alongside source files (`*.spec.ts`)
- **Structure**: Describe block per class, nested for methods
- **Setup**: Use `Test.createTestingModule()` for dependency injection
- **Mocking**: Mock external dependencies (repositories, services)

```typescript
describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### E2E Tests

- **Location**: `test/` directory (`*.e2e-spec.ts`)
- **Setup**: Create full application context
- **Requests**: Use Supertest for HTTP assertions
- **Cleanup**: Close app and connections after tests

## Common Patterns

### Pagination

```typescript
@Query() paginationDto: PaginationDto  // { limit?: number; offset?: number }
```

### Upsert Pattern (Webhook Handling)

```typescript
const user = await this.userRepository.findOne({ where: { email } });
if (user) {
  await this.userRepository.update(user.id, updateData);
} else {
  await this.userRepository.save(createData);
}
```

### Status Tracking

```typescript
interface IUserStatus {
  status: 'pending' | 'completed' | 'error';
  retryCount: number;
  lastError?: string;
}
```

## Important Notes

- **Authentication**: Clerk integration via webhooks in users module
- **Dual Storage**: User data in PostgreSQL, logs in MongoDB
- **TypeORM Sync**: Enabled in development, disable in production
- **Error Messages**: User-friendly, no sensitive data exposure
- **Idempotency**: Webhook handlers use upsert pattern
