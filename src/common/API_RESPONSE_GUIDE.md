# Guía de Uso: Respuestas Estándar de API

## Estructura de Respuestas

### Respuesta de Éxito (200)

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

### Respuesta de Error (400, 404, etc.)

```json
{
  "code": 12,
  "message": "Validation error",
  "details": [
    {
      "code": "validation_error",
      "path": ["farmaId"],
      "message": "Se ha alcanzado el límite máximo de 5 imágenes por orden"
    }
  ],
  "data": []
}
```

## Códigos de Respuesta

```typescript
enum ApiResponseCode {
  SUCCESS = 1, // Operación exitosa
  CREATED = 2, // Recurso creado
  UPDATED = 3, // Recurso actualizado
  DELETED = 4, // Recurso eliminado
  NOT_FOUND = 10, // Recurso no encontrado
  UNAUTHORIZED = 11, // No autorizado
  VALIDATION_ERROR = 12, // Error de validación
  INTERNAL_ERROR = 13, // Error interno
  BAD_REQUEST = 14, // Petición incorrecta
}
```

## Uso en Controllers

### Ejemplo 1: Respuesta Simple (Auto-transformada)

```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ✅ Esto se transforma automáticamente a:
  // { code: 1, message: "Results", data: [...products] }
  @Get()
  async findAll() {
    return await this.productsService.findAll();
  }

  // ✅ Esto se transforma automáticamente a:
  // { code: 1, message: "Results", data: [product] }
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.productsService.findOne(id);
  }
}
```

### Ejemplo 2: Respuesta Vacía

```typescript
@Get('filter')
async filterProducts(@Query() filters: FilterDto) {
  const products = await this.productsService.filter(filters);

  // Si products está vacío [], se retorna:
  // { code: 1, message: "No data found", data: [] }
  return products;
}
```

### Ejemplo 3: Lanzar Errores Personalizados

```typescript
import { ApiException } from './common/exceptions/api.exception';
import { ApiResponseCode, ValidationErrorDetail } from './common/dto/api-response.dto';

@Post()
async create(@Body() createDto: CreateProductDto) {
  // Validación personalizada con detalles
  if (createDto.images?.length > 5) {
    throw ApiException.validation(
      'Validation error',
      [
        {
          code: 'max_images_exceeded',
          path: ['images'],
          message: 'Se ha alcanzado el límite máximo de 5 imágenes por orden',
        },
      ],
    );
  }

  return await this.productsService.create(createDto);
}

@Get(':id')
async findOne(@Param('id') id: string) {
  const product = await this.productsService.findOne(id);

  if (!product) {
    // Esto retorna: { code: 10, message: "Product not found", data: [] }
    throw ApiException.notFound('Product not found');
  }

  return product;
}

@Delete(':id')
async remove(@Param('id') id: string) {
  const exists = await this.productsService.exists(id);

  if (!exists) {
    throw ApiException.notFound(`Product with ID ${id} not found`);
  }

  await this.productsService.remove(id);

  // Retorna: { code: 4, message: "Product deleted successfully", data: [] }
  return new ApiSuccessResponse([], 'Product deleted successfully');
}
```

### Ejemplo 4: Errores Múltiples de Validación

```typescript
import { ValidationErrorDetail } from './common/dto/api-response.dto';

@Post()
async create(@Body() createDto: CreateProductDto) {
  const errors: ValidationErrorDetail[] = [];

  if (createDto.price < 0) {
    errors.push({
      code: 'invalid_price',
      path: ['price'],
      message: 'El precio debe ser mayor a 0',
    });
  }

  if (!createDto.title || createDto.title.length < 3) {
    errors.push({
      code: 'invalid_title',
      path: ['title'],
      message: 'El título debe tener al menos 3 caracteres',
    });
  }

  if (errors.length > 0) {
    throw ApiException.validation('Validation error', errors);
  }

  return await this.productsService.create(createDto);
}
```

### Ejemplo 5: Validación Automática con class-validator

```typescript
// create-product.dto.ts
import { IsString, MinLength, IsNumber, Min } from 'class-validator';

export class CreateProductDto {
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  title: string;

  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio debe ser mayor o igual a 0' })
  price: number;
}

// Controller - Los errores de validación se manejan automáticamente
@Post()
async create(@Body() createDto: CreateProductDto) {
  // Si falla la validación, automáticamente retorna:
  // {
  //   code: 12,
  //   message: "Validation error",
  //   details: [
  //     { code: "validation_error", path: ["title"], message: "..." }
  //   ],
  //   data: []
  // }

  return await this.productsService.create(createDto);
}
```

### Ejemplo 6: Manejo de Errores de Base de Datos

```typescript
@Post()
async create(@Body() createDto: CreateProductDto) {
  try {
    return await this.productsService.create(createDto);
  } catch (error) {
    if (error.code === '23505') { // Duplicate key error en PostgreSQL
      throw ApiException.validation(
        'Validation error',
        [
          {
            code: 'duplicate_entry',
            path: ['email'],
            message: 'Este email ya está registrado',
          },
        ],
      );
    }

    // Error inesperado
    console.error(error);
    throw ApiException.internal('Error al crear el producto');
  }
}
```

## Métodos de Ayuda de ApiException

```typescript
// Error de validación con detalles
ApiException.validation(message, details[])

// Recurso no encontrado (404)
ApiException.notFound(message?)

// No autorizado (401)
ApiException.unauthorized(message?)

// Error interno del servidor (500)
ApiException.internal(message?)

// Error genérico con código personalizado
new ApiException(code, message, details?, httpStatus?)
```

## Respuesta Manual con Código Personalizado

```typescript
import { ApiSuccessResponse, ApiResponseCode } from './common/dto/api-response.dto';

@Post()
async create(@Body() createDto: CreateProductDto) {
  const product = await this.productsService.create(createDto);

  // Retorna con código personalizado
  return new ApiSuccessResponse([product], 'Product created successfully');
}

@Delete(':id')
async remove(@Param('id') id: string) {
  await this.productsService.remove(id);

  // Retorna array vacío con mensaje personalizado
  return new ApiSuccessResponse([], 'Product deleted successfully');
}
```

## Notas Importantes

1. **Todos los GET retornan arrays**: Incluso si es un solo elemento, `data` siempre será un array.

2. **Transformación automática**: No necesitas envolver manualmente las respuestas, el interceptor lo hace por ti.

3. **Arrays vacíos**: Si no hay datos, se retorna `{ code: 1, message: "No data found", data: [] }`.

4. **Validaciones de class-validator**: Se convierten automáticamente al formato con `details`.

5. **Errores HTTP estándar**: Se transforman al formato personalizado automáticamente.

## Testing

```typescript
// En tus tests
describe('ProductsController', () => {
  it('should return standard format', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/products')
      .expect(200);

    expect(response.body).toHaveProperty('code', 1);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should return validation error format', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/products')
      .send({ invalid: 'data' })
      .expect(400);

    expect(response.body).toHaveProperty('code', 12);
    expect(response.body).toHaveProperty('message', 'Validation error');
    expect(response.body).toHaveProperty('details');
    expect(response.body.data).toEqual([]);
  });
});
```
