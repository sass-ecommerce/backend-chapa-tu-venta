# Autenticación con Passport.js

Este módulo implementa autenticación tradicional con Passport.js, JWT tokens y refresh tokens con control de revocación avanzado.

## Características

- Autenticación local con email/password
- JWT access tokens (corta duración: 15 minutos)
- Refresh tokens con rotación automática (larga duración: 7 días)
- Detección de reutilización de tokens (refresh token rotation attack)
- Control de revocación con familia de tokens
- Metadatos de dispositivo (IP, User-Agent)
- Hash seguro de passwords con bcrypt
- **Transacciones ACID**: Registro de usuario con rollback automático en caso de error

## Variables de Entorno

Añade las siguientes variables a tu archivo `.env`:

```bash
# Passport.js JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION_DAYS=7
BCRYPT_ROUNDS=10
```

## Migraciones de Base de Datos

El módulo requiere **tres nuevas tablas independientes** en PostgreSQL:

### 1. Tabla `passport_users` (independiente)

```sql
CREATE TABLE b2b.passport_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_passport_users_email ON b2b.passport_users(email);
```

### 2. Tabla `auth_credentials`

```sql
CREATE TABLE b2b.auth_credentials (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT UNIQUE NOT NULL REFERENCES b2b.passport_users(id) ON DELETE CASCADE,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  verification_token VARCHAR,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_auth_credentials_email ON b2b.auth_credentials(email);
```

### 3. Tabla `refresh_tokens`

```sql
CREATE TABLE b2b.refresh_tokens (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  token_hash VARCHAR UNIQUE NOT NULL,
  user_id BIGINT NOT NULL REFERENCES b2b.passport_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  revocation_reason VARCHAR,
  revoked_at TIMESTAMPTZ,
  token_family UUID DEFAULT gen_random_uuid(),
  replaced_by_token VARCHAR,
  ip_address VARCHAR,
  user_agent VARCHAR,
  device_fingerprint VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user_id ON b2b.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_family ON b2b.refresh_tokens(token_family);
```

**Nota importante:** Este módulo usa una tabla `passport_users` completamente independiente de la tabla `users` existente. Esto permite que el sistema coexista con Clerk sin conflictos de dependencias.

## Endpoints de la API

Todos los endpoints están bajo el prefijo `/api/passport-auth`.

### 1. Registrar Usuario

**POST** `/api/passport-auth/register`

Registra un nuevo usuario con credenciales locales.

**Request Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Validaciones:**

- Email debe ser válido
- Password mínimo 8 caracteres
- Password debe contener: mayúscula, minúscula y número
- firstName y lastName mínimo 2 caracteres

**Response (201):**

```json
{
  "message": "User registered successfully",
  "userId": "1",
  "email": "usuario@ejemplo.com"
}
```

**Errores:**

- `409 Conflict`: Email ya registrado

---

### 2. Login

**POST** `/api/passport-auth/login`

Autentica usuario y devuelve access token y refresh token.

**Request Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "SecurePass123"
}
```

**Response (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "a1b2c3d4e5f6789...",
  "expires_in": 900,
  "token_type": "Bearer"
}
```

**Errores:**

- `401 Unauthorized`: Credenciales inválidas

---

### 3. Renovar Access Token

**POST** `/api/passport-auth/refresh`

Renueva el access token usando un refresh token válido. Implementa **rotación de tokens**.

**Request Body:**

```json
{
  "refreshToken": "a1b2c3d4e5f6789..."
}
```

**Response (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "x9y8z7w6v5u4321...",
  "expires_in": 900,
  "token_type": "Bearer"
}
```

**Comportamiento:**

- El refresh token antiguo se revoca automáticamente
- Se genera un nuevo refresh token en la misma familia
- Si se detecta reutilización, **toda la familia de tokens se revoca**

**Errores:**

- `401 Unauthorized`: Token inválido, expirado o revocado
- `401 Unauthorized`: "Token reuse detected. All tokens revoked." (ataque detectado)

---

### 4. Obtener Perfil

**GET** `/api/passport-auth/me`

Obtiene información del usuario autenticado.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**

```json
{
  "userId": "1",
  "email": "usuario@ejemplo.com",
  "role": "user"
}
```

**Errores:**

- `401 Unauthorized`: Token inválido o ausente

---

### 5. Logout

**POST** `/api/passport-auth/logout`

Revoca un refresh token específico.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "refreshToken": "a1b2c3d4e5f6789..."
}
```

**Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

---

### 6. Revocar Todos los Tokens

**POST** `/api/passport-auth/revoke-all`

Revoca todos los refresh tokens activos del usuario (cerrar sesión en todos los dispositivos).

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**

```json
{
  "message": "All tokens revoked successfully"
}
```

---

## Uso desde el Código

### Proteger Endpoints con JWT

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../passport-auth/guards/jwt-auth.guard';
import { CurrentUser } from '../passport-auth/decorators/current-user.decorator';
import { Public } from '../passport-auth/decorators/public.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard) // Proteger todo el controller
export class ProductsController {
  // Endpoint protegido
  @Post()
  create(@CurrentUser() user: any) {
    console.log('User ID:', user.userId);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    return this.service.create();
  }

  // Endpoint público
  @Get()
  @Public()
  findAll() {
    return this.service.findAll();
  }

  // Obtener solo el userId
  @Get('mine')
  getMyProducts(@CurrentUser('userId') userId: string) {
    return this.service.findByUser(userId);
  }
}
```

### Decorators Disponibles

#### `@CurrentUser()`

Obtiene el usuario autenticado del request:

```typescript
// Obtener todo el objeto usuario
@Get('profile')
getProfile(@CurrentUser() user: any) {
  return {
    userId: user.userId,
    email: user.email,
    role: user.role
  };
}

// Obtener solo una propiedad
@Get('my-data')
getData(@CurrentUser('userId') userId: string) {
  return this.service.getData(userId);
}
```

#### `@Public()`

Marca un endpoint como público (sin autenticación):

```typescript
@Get('health')
@Public()
checkHealth() {
  return { status: 'ok' };
}
```

---

## Flujo de Autenticación Completo

### 1. Registro

```bash
curl -X POST http://localhost:3000/api/passport-auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/passport-auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

**Respuesta:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDkwMH0...",
  "refresh_token": "a1b2c3d4e5f6789...",
  "expires_in": 900,
  "token_type": "Bearer"
}
```

### 3. Acceder a Endpoint Protegido

```bash
curl -X GET http://localhost:3000/api/passport-auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. Renovar Access Token (después de 15 minutos)

```bash
curl -X POST http://localhost:3000/api/passport-auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "a1b2c3d4e5f6789..."
  }'
```

### 5. Logout

```bash
curl -X POST http://localhost:3000/api/passport-auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "a1b2c3d4e5f6789..."
  }'
```

---

## Seguridad

### Refresh Token Rotation

Cada vez que se usa un refresh token:

1. Se verifica que no esté revocado
2. Se genera un nuevo refresh token
3. El token antiguo se marca como revocado con `revocation_reason: 'replaced'`
4. El nuevo token pertenece a la misma familia (`token_family`)

### Detección de Reutilización

Si se intenta usar un refresh token ya revocado:

1. Se detecta como posible ataque
2. Se revoca **toda la familia de tokens**
3. Se retorna error `401: Token reuse detected`
4. El usuario debe hacer login nuevamente

### Hash de Tokens

- **Passwords**: bcrypt con salt (10 rounds por defecto)
- **Refresh Tokens**: SHA-256 hash almacenado en BD
- **Access Tokens**: JWT firmado con secret

### Metadatos de Seguridad

Cada refresh token almacena:

- IP address del dispositivo
- User-Agent del navegador
- Timestamp de creación
- Fecha de expiración

### Resiliencia y Transacciones

El método de **registro de usuario** utiliza transacciones de TypeORM para garantizar atomicidad:

- **ACID Compliance**: Si alguna operación falla (crear usuario o credenciales), se hace rollback automático
- **Prevención de datos inconsistentes**: No se pueden crear usuarios sin credenciales o viceversa
- **Manejo de errores robusto**: Las transacciones se liberan correctamente incluso si hay excepciones
- **Verificación doble**: Se valida que el email no exista en ambas tablas antes de insertar

```typescript
// Flujo de la transacción:
1. BEGIN TRANSACTION
2. Verificar email no existe en passport_users
3. Verificar email no existe en auth_credentials
4. Crear usuario (INSERT)
5. Hashear password
6. Crear credenciales (INSERT)
7. COMMIT (solo si todo fue exitoso)
// Si hay error en cualquier paso → ROLLBACK automático
```

---

## Convivencia con Clerk

El módulo **coexiste** con el sistema de autenticación de Clerk:

- **Clerk**: Sistema actual en producción (módulo `auth`)
- **Passport.js**: Sistema experimental (módulo `passport-auth`)

### Usar Ambos Guards

```typescript
// Rutas con Clerk
@Controller('stores')
@UseGuards(ClerkAuthGuard)
export class StoresController {}

// Rutas con Passport.js
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {}
```

### Migración Futura

Para migrar de Clerk a Passport.js:

1. **Fase 1**: Experimentar con `passport-auth` en endpoints no críticos
2. **Fase 2**: Crear script de migración de usuarios de Clerk a `auth_credentials`
3. **Fase 3**: Cambiar guards globalmente de `ClerkAuthGuard` a `JwtAuthGuard`
4. **Fase 4**: Deprecar módulo `auth` (Clerk)

---

## Troubleshooting

### Error: "JWT_SECRET is not defined"

**Causa:** Falta la variable de entorno `JWT_SECRET`

**Solución:**

```bash
# Añadir a .env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### Error: "Invalid credentials"

**Causa:** Email o password incorrectos

**Solución:** Verificar las credenciales del usuario

### Error: "Token reuse detected"

**Causa:** Se intentó usar un refresh token ya revocado (posible ataque)

**Solución:** Hacer login nuevamente con email/password

### Error: "Email already registered"

**Causa:** El email ya existe en la base de datos

**Solución:** Usar otro email o hacer login con las credenciales existentes

---

## Testing

Para probar el flujo completo:

```bash
# 1. Iniciar base de datos
docker-compose up -d

# 2. Ejecutar migraciones (crear tablas)
# (Las tablas se crean automáticamente con synchronize en desarrollo)

# 3. Iniciar servidor
npm run start:dev

# 4. Probar endpoints
# Usar los ejemplos de curl de la sección "Flujo de Autenticación Completo"
```

---

## Estructura del Módulo

```
src/passport-auth/
├── entities/
│   ├── auth-credential.entity.ts   # Credenciales de usuario
│   └── refresh-token.entity.ts     # Tokens de refresh
├── strategies/
│   ├── local.strategy.ts           # Estrategia email/password
│   └── jwt.strategy.ts             # Estrategia JWT Bearer
├── guards/
│   ├── local-auth.guard.ts         # Guard para login
│   └── jwt-auth.guard.ts           # Guard para rutas protegidas
├── decorators/
│   ├── public.decorator.ts         # Marcar rutas públicas
│   └── current-user.decorator.ts   # Obtener usuario del request
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   └── refresh-token.dto.ts
├── passport-auth.controller.ts
├── passport-auth.service.ts
├── passport-auth.module.ts
└── README.md
```

---

## Referencias

- [Passport.js Documentation](http://www.passportjs.org/)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Refresh Token Rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)
