# Autenticación con Clerk

Este módulo implementa autenticación JWT con Clerk para proteger los endpoints de la API.

## 🔑 Configuración

### 1. Variables de Entorno

Añade las siguientes variables a tu archivo `.env`:

```bash
# Clerk Authentication
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Obtener las claves:**

1. Ve a [Clerk Dashboard](https://dashboard.clerk.com/)
2. Selecciona tu aplicación
3. Ve a **API Keys**
4. Copia `Secret Key` y `Publishable Key`

### 2. Estructura del `publicMetadata`

El sistema espera que el `publicMetadata` del usuario tenga la siguiente estructura:

```typescript
{
  storeSlug?: string;           // Slug de la tienda del usuario
  plan?: 'free' | 'premium';    // Plan de suscripción
  onboardingCompleted?: boolean; // Si completó el onboarding
}
```

## 📖 Uso

### Proteger un Controller

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/clerk-user.interface';

@Controller('stores')
@UseGuards(ClerkAuthGuard) // ← Proteger todo el controller
export class StoresController {
  // Endpoint protegido - requiere token
  @Post()
  create(
    @Body() dto: CreateStoreDto,
    @CurrentUser() user: AuthenticatedUser, // ← Obtener usuario
  ) {
    console.log('Usuario:', user.userId, user.email);
    console.log('Metadata:', user.metadata); // { storeSlug, plan, onboardingCompleted }
    return this.service.create(dto);
  }

  // Endpoint público - sin autenticación
  @Get()
  @Public() // ← Marcar como público
  findAll() {
    return this.service.findAll();
  }
}
```

### Decorators Disponibles

#### `@CurrentUser()`

Obtiene el usuario autenticado del request:

```typescript
// Obtener todo el objeto usuario
@Post()
create(@CurrentUser() user: AuthenticatedUser) {
  console.log(user.userId);     // "user_2abc123xyz"
  console.log(user.email);      // "usuario@ejemplo.com"
  console.log(user.metadata);   // { storeSlug: "mi-tienda", plan: "premium" }
}

// Obtener solo una propiedad
@Post()
create(@CurrentUser('userId') userId: string) {
  console.log(userId);  // "user_2abc123xyz"
}
```

**Propiedades de `AuthenticatedUser`:**

- `userId`: ID del usuario en Clerk
- `sessionId`: ID de la sesión
- `email`: Email del usuario
- `firstName`: Nombre
- `lastName`: Apellido
- `imageUrl`: URL de la imagen de perfil
- `metadata`: Object con `publicMetadata` (storeSlug, plan, onboardingCompleted)
- `orgId`: ID de organización (si aplica)
- `orgSlug`: Slug de organización
- `orgRole`: Rol en la organización

#### `@Public()`

Marca un endpoint como público (sin autenticación requerida):

```typescript
@Get('health')
@Public()
checkHealth() {
  return { status: 'ok' };
}
```

### Actualizar Metadata del Usuario

Usa el `AuthService` para actualizar el `publicMetadata`:

```typescript
import { AuthService } from '../auth/auth.service';

@Controller('users')
export class UsersController {
  constructor(private authService: AuthService) {}

  @Patch('me/metadata')
  async updateMyMetadata(
    @CurrentUser() user: AuthenticatedUser,
    @Body() metadata: Record<string, any>,
  ) {
    // Actualizar publicMetadata en Clerk
    const updatedUser = await this.authService.updatePublicMetadata(
      user.userId,
      {
        storeSlug: metadata.storeSlug,
        plan: metadata.plan,
        onboardingCompleted: true,
      },
    );

    return {
      message: 'Metadata actualizado',
      publicMetadata: updatedUser.publicMetadata,
    };
  }
}
```

**Métodos disponibles en `AuthService`:**

```typescript
// Obtener usuario completo
await authService.getUserById(userId);

// Actualizar publicMetadata
await authService.updatePublicMetadata(userId, {
  storeSlug: 'mi-tienda',
  plan: 'premium',
});

// Actualizar privateMetadata (solo backend)
await authService.updatePrivateMetadata(userId, {
  stripeCustomerId: 'cus_123',
});

// Actualizar ambos
await authService.updateAllMetadata(
  userId,
  { plan: 'premium' }, // public
  { internalNotes: 'VIP' }, // private
);
```

## 🌐 Desde el Frontend

### Enviar Token al Backend

```typescript
// React/Next.js con @clerk/nextjs
import { useAuth } from '@clerk/nextjs';

function MyComponent() {
  const { getToken } = useAuth();

  const createStore = async (storeData) => {
    // Obtener token de la sesión actual
    const token = await getToken();

    const response = await fetch('http://localhost:3000/api/stores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,  // ← Token aquí
      },
      body: JSON.stringify(storeData),
    });

    return response.json();
  };

  return <button onClick={() => createStore({ name: 'Mi Tienda' })}>
    Crear Tienda
  </button>;
}
```

### Acceder a Metadata en el Frontend

```typescript
import { useUser } from '@clerk/nextjs';

function Dashboard() {
  const { user } = useUser();

  // publicMetadata sincronizado desde el backend
  const storeSlug = user?.publicMetadata?.storeSlug;
  const plan = user?.publicMetadata?.plan;

  return (
    <div>
      <h1>Dashboard de {storeSlug}</h1>
      <p>Plan: {plan}</p>
    </div>
  );
}
```

## 🔒 Endpoints Protegidos vs Públicos

| Endpoint                   | Método | Acceso       | Razón             |
| -------------------------- | ------ | ------------ | ----------------- |
| `POST /api/users`          | POST   | 🌐 Público   | Webhook de Clerk  |
| `GET /api/stores`          | GET    | 🌐 Público   | Catálogo visible  |
| `GET /api/stores/:slug`    | GET    | 🌐 Público   | Detalle visible   |
| `POST /api/stores`         | POST   | 🔒 Protegido | Solo autenticados |
| `PATCH /api/stores/:slug`  | PATCH  | 🔒 Protegido | Solo autenticados |
| `DELETE /api/stores/:slug` | DELETE | 🔒 Protegido | Solo autenticados |

## 🧪 Testing

### Probar con Token Válido

```bash
# 1. Obtener token desde el frontend (en la consola del navegador)
await window.Clerk.session.getToken()

# 2. Hacer request con curl
curl -X POST http://localhost:3000/api/stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_AQUI>" \
  -d '{"name": "Mi Tienda"}'
```

### Probar Endpoint Público

```bash
# No requiere token
curl http://localhost:3000/api/stores
```

### Respuestas Esperadas

**Sin token (endpoint protegido):**

```json
{
  "statusCode": 401,
  "message": "Authentication token is required",
  "error": "Unauthorized"
}
```

**Con token inválido:**

```json
{
  "statusCode": 401,
  "message": "Invalid or expired token",
  "error": "Unauthorized"
}
```

**Con token válido:**

```json
{
  "id": 1,
  "name": "Mi Tienda",
  "slug": "mi-tienda-abc123",
  ...
}
```

## 🔧 Troubleshooting

### Error: "Authentication token is required"

- **Causa:** No se envió el header `Authorization`
- **Solución:** Asegúrate de enviar `Authorization: Bearer <token>`

### Error: "Invalid or expired token"

- **Causa:** Token expirado o inválido
- **Solución:** Obtén un nuevo token con `getToken()` en el frontend

### Error: "Unable to extract session claims"

- **Causa:** Token no contiene la estructura esperada
- **Solución:** Verifica que el token sea de Clerk y no de otro servicio

### El metadata no se actualiza en el frontend

- **Causa:** El token no se ha renovado
- **Solución:** Fuerza refresh con `await getToken({ skipCache: true })`

### Webhook de Clerk no funciona

- **Causa:** El endpoint no está marcado como `@Public()`
- **Solución:** Añade `@Public()` al endpoint del webhook

## 📚 Referencias

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Backend SDK](https://clerk.com/docs/references/backend/overview)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [JWT Best Practices](https://jwt.io/introduction)
