# Sistema de Respuestas Estándar - API

## ✅ Instalación Completada

Se ha implementado un sistema de respuestas estándar para todas las APIs del proyecto.

## 📦 Archivos Creados

### DTOs (Data Transfer Objects)

- `src/common/dto/api-response.dto.ts` - Definiciones de respuestas estándar y códigos

### Interceptors

- `src/common/interceptors/transform-response.interceptor.ts` - Transforma automáticamente las respuestas

### Filters

- `src/common/filters/http-exception.filter.ts` - Maneja excepciones y las convierte al formato estándar

### Exceptions

- `src/common/exceptions/api.exception.ts` - Clase de excepción personalizada con helpers

### Documentación

- `src/common/API_RESPONSE_GUIDE.md` - Guía completa de uso con ejemplos
- `src/users/users.controller.example.ts` - Ejemplos de implementación

### Ejemplos Aplicados

- `src/products/products.controller.ts` - ✅ Actualizado con manejo de errores 404

## 📖 Formatos de Respuesta

### Respuesta Exitosa

```json
{
  "code": 1,
  "message": "Results",
  "data": [
    {
      "id": "123",
      "name": "Producto"
    }
  ]
}
```

### Respuesta de Error

```json
{
  "code": 12,
  "message": "Validation error",
  "details": [
    {
      "code": "custom",
      "path": ["farmaId"],
      "message": "Se ha alcanzado el límite máximo de 5 imágenes por orden"
    }
  ],
  "data": []
}
```

## 🚀 Uso Rápido

### 1. Respuestas Automáticas (GET)

```typescript
@Get()
async findAll() {
  const products = await this.productsService.findAll();
  return products; // Se transforma automáticamente
}
```

**Resultado**: `{ code: 1, message: "Results", data: [...] }`

### 2. Lanzar Errores (404, Validación, etc.)

```typescript
import { ApiException } from 'src/common/exceptions/api.exception';

@Get(':id')
async findOne(@Param('id') id: string) {
  const product = await this.service.findOne(id);

  if (!product) {
    throw ApiException.notFound('Product not found');
  }

  return product;
}
```

### 3. Validación Personalizada

```typescript
@Post()
async create(@Body() dto: CreateDto) {
  if (dto.images && dto.images.length > 5) {
    throw ApiException.validation('Validation error', [
      {
        code: 'max_images_exceeded',
        path: ['images'],
        message: 'Se ha alcanzado el límite máximo de 5 imágenes'
      }
    ]);
  }

  return await this.service.create(dto);
}
```

## 🔧 Configuración Actual

El sistema ya está configurado globalmente en `src/main.ts`:

```typescript
// ✅ Ya configurado
app.useGlobalInterceptors(new TransformResponseInterceptor());
app.useGlobalFilters(new HttpExceptionFilter());
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

## 📊 Códigos de Respuesta

```typescript
SUCCESS = 1; // Operación exitosa
CREATED = 2; // Recurso creado
UPDATED = 3; // Recurso actualizado
DELETED = 4; // Recurso eliminado
NOT_FOUND = 10; // Recurso no encontrado (404)
UNAUTHORIZED = 11; // No autorizado (401)
VALIDATION_ERROR = 12; // Error de validación (400)
INTERNAL_ERROR = 13; // Error interno (500)
BAD_REQUEST = 14; // Petición incorrecta (400)
```

## 🎯 Métodos Helper de ApiException

```typescript
// Error 404
throw ApiException.notFound('Resource not found');

// Error 401
throw ApiException.unauthorized('Access denied');

// Error 500
throw ApiException.internal('Internal error');

// Error de validación con detalles
throw ApiException.validation('Validation error', [
  { code: 'invalid', path: ['field'], message: 'Error message' },
]);
```

## ✨ Características

- ✅ **Transformación automática**: Todas las respuestas exitosas se transforman automáticamente
- ✅ **Arrays siempre**: `data` siempre es un array, incluso para un solo elemento
- ✅ **Manejo de errores**: Excepciones HTTP se convierten automáticamente al formato estándar
- ✅ **Validaciones**: class-validator se integra automáticamente con el formato
- ✅ **Type-safe**: Tipado completo en TypeScript
- ✅ **Sin cambios en webhooks**: Los webhooks de Clerk siguen funcionando sin modificación

## 📚 Documentación Completa

Para ejemplos detallados, consulta:

- `src/common/API_RESPONSE_GUIDE.md` - Guía completa con todos los casos de uso
- `src/users/users.controller.example.ts` - Ejemplos prácticos de implementación

## 🧪 Testing

Todas las respuestas de tus tests ahora tendrán el formato estándar:

```typescript
it('should return products', async () => {
  const response = await request(app).get('/api/products').expect(200);

  expect(response.body.code).toBe(1);
  expect(response.body.message).toBe('Results');
  expect(Array.isArray(response.body.data)).toBe(true);
});
```

## 🎨 Personalización

### Mensaje Personalizado

```typescript
import { ApiSuccessResponse } from 'src/common/dto/api-response.dto';

@Delete(':id')
async remove(@Param('id') id: string) {
  await this.service.remove(id);
  return new ApiSuccessResponse([], 'Product deleted successfully');
}
```

### Código Personalizado

```typescript
@Post()
async create(@Body() dto: CreateDto) {
  const item = await this.service.create(dto);
  // Puedes cambiar el código en la clase si lo necesitas
  return item;
}
```

## ⚠️ Notas Importantes

1. **No modifiques los webhooks**: Los endpoints de webhook de Clerk (`/api/users`) no requieren cambios
2. **Arrays vacíos**: Si no hay datos, se retorna `{ code: 1, message: "No data found", data: [] }`
3. **Errores de DB**: Los errores de PostgreSQL (23505, 23503) se deben manejar manualmente en el servicio
4. **Type safety**: Usa `ApiException` en lugar de las excepciones estándar de NestJS para mejor control

## 🔄 Migración de Controllers Existentes

Para migrar tus controllers existentes:

1. Importa `ApiException`:

```typescript
import { ApiException } from 'src/common/exceptions/api.exception';
```

2. Reemplaza `NotFoundException` con `ApiException.notFound()`:

```typescript
// Antes
throw new NotFoundException('Not found');

// Ahora
throw ApiException.notFound('Not found');
```

3. Las respuestas exitosas no necesitan cambios, se transforman automáticamente.

## ✅ Ejemplo Aplicado: Products Controller

Ya se actualizó `src/products/products.controller.ts` con el nuevo sistema:

```typescript
@Get(':slug')
async findOne(@Param('slug') slug: string) {
  const product = await this.productsService.findOne(slug);

  if (!product) {
    throw ApiException.notFound(`Product with slug '${slug}' not found`);
  }

  return product;
}
```

**Antes**: Retornaba `null` o error sin formato estándar  
**Ahora**: Retorna `{ code: 10, message: "Product...", data: [] }` cuando no existe

---

🎉 **¡El sistema está listo para usar!** Todas tus APIs ahora tienen respuestas consistentes y profesionales.
