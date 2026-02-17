import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Middleware que agrega un Request ID único a cada petición
 * Permite rastrear requests a través de logs y respuestas
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Usar el request ID del header si existe, o generar uno nuevo
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();

    // Agregar al request para uso en logs
    (req as any).id = requestId;

    // Agregar al response header para que el cliente pueda rastrearlo
    res.setHeader('x-request-id', requestId);

    next();
  }
}
