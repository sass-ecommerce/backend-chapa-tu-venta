import clerkClient from '@clerk/clerk-sdk-node';
import { JwtPayload } from '@clerk/types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ClekService {
  //usamos get para retornar el cliente de clerk, la diferencia es que asi lo hacemos lazy loading
  //es decir, solo se crea cuando se accede a el
  get client(): typeof clerkClient {
    return clerkClient;
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    return await this.client.verifyToken(token);
    // if (token === 'mi_token_de_prueba') {
    //   return {
    //     sub: 'user_2026_test',
    //     email: 'test@example.com',
    //     metadata: { role: 'admin' },
    //   };
    // }
  }

  async updateUserIdWithSlug(userId: string, slug: string) {
    try {
      await this.client.users.updateUserMetadata(userId, {
        publicMetadata: {
          storeSlug: slug, // Aquí guardamos el campo slug
        },
      });
    } catch (error) {
      console.error('Error al actualizar metadata en Clerk:', error);
      throw new Error('No se pudo vincular el slug al usuario');
    }
  }
}
