/**
 * EJEMPLO: Cómo usar el AuthService para actualizar metadata
 *
 * Este archivo muestra ejemplos prácticos de uso del AuthService
 * para operaciones comunes con metadata de usuarios de Clerk.
 */

import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './interfaces/clerk-user.interface';

@Controller('examples')
@UseGuards(ClerkAuthGuard)
export class ExampleController {
  constructor(private authService: AuthService) {}

  /**
   * EJEMPLO 1: Obtener información completa del usuario
   */
  @Get('me')
  async getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    // Obtener datos completos del usuario desde Clerk
    const fullUser = await this.authService.getUserById(user.userId);

    return {
      userId: fullUser.id,
      email: fullUser.emailAddresses[0]?.emailAddress,
      firstName: fullUser.firstName,
      lastName: fullUser.lastName,
      imageUrl: fullUser.imageUrl,
      publicMetadata: fullUser.publicMetadata,
      createdAt: fullUser.createdAt,
    };
  }

  /**
   * EJEMPLO 2: Actualizar storeSlug cuando el usuario crea una tienda
   */
  @Patch('set-store')
  async setUserStore(
    @CurrentUser() user: AuthenticatedUser,
    @Body('storeSlug') storeSlug: string,
  ) {
    // Actualizar el storeSlug en el publicMetadata
    await this.authService.updatePublicMetadata(user.userId, {
      storeSlug,
    });

    return {
      message: 'Store asociada al usuario',
      storeSlug,
    };
  }

  /**
   * EJEMPLO 3: Actualizar plan de suscripción
   */
  @Patch('upgrade-plan')
  async upgradePlan(
    @CurrentUser() user: AuthenticatedUser,
    @Body('plan') plan: 'free' | 'premium',
  ) {
    // Actualizar el plan en el publicMetadata
    await this.authService.updatePublicMetadata(user.userId, {
      plan,
    });

    return {
      message: `Plan actualizado a ${plan}`,
      plan,
    };
  }

  /**
   * EJEMPLO 4: Marcar onboarding como completado
   */
  @Patch('complete-onboarding')
  async completeOnboarding(@CurrentUser() user: AuthenticatedUser) {
    // Marcar onboarding como completado
    await this.authService.updatePublicMetadata(user.userId, {
      onboardingCompleted: true,
    });

    return {
      message: 'Onboarding completado',
    };
  }

  /**
   * EJEMPLO 5: Actualizar metadata privado (solo backend)
   */
  @Patch('set-stripe-customer')
  async setStripeCustomer(
    @CurrentUser() user: AuthenticatedUser,
    @Body('customerId') customerId: string,
  ) {
    // Guardar ID de Stripe en privateMetadata (no visible en frontend)
    await this.authService.updatePrivateMetadata(user.userId, {
      stripeCustomerId: customerId,
    });

    return {
      message: 'Stripe customer ID guardado',
    };
  }

  /**
   * EJEMPLO 6: Actualizar múltiples campos a la vez
   */
  @Patch('update-profile')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      storeSlug?: string;
      plan?: 'free' | 'premium';
      onboardingCompleted?: boolean;
    },
  ) {
    // Actualizar múltiples campos del publicMetadata
    await this.authService.updatePublicMetadata(user.userId, body);

    return {
      message: 'Perfil actualizado',
      updated: body,
    };
  }

  /**
   * EJEMPLO 7: Leer metadata del token (sin llamada adicional)
   */
  @Get('quick-metadata')
  getQuickMetadata(@CurrentUser() user: AuthenticatedUser) {
    // El metadata ya está disponible en el token (si se configuró en Clerk Dashboard)
    return {
      userId: user.userId,
      email: user.email,
      metadata: user.metadata, // { storeSlug, plan, onboardingCompleted }
    };
  }

  /**
   * EJEMPLO 8: Actualizar public y private metadata simultáneamente
   */
  @Patch('full-update')
  async fullUpdate(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      public: {
        storeSlug?: string;
        plan?: 'free' | 'premium';
      };
      private: {
        stripeCustomerId?: string;
        internalNotes?: string;
      };
    },
  ) {
    // Actualizar ambos tipos de metadata
    await this.authService.updateAllMetadata(
      user.userId,
      body.public,
      body.private,
    );

    return {
      message: 'Metadata completo actualizado',
    };
  }

  /**
   * EJEMPLO 9: Validar y actualizar metadata condicional
   */
  @Patch('conditional-update')
  async conditionalUpdate(@CurrentUser() user: AuthenticatedUser) {
    // Obtener metadata actual
    const fullUser = await this.authService.getUserById(user.userId);
    const currentMetadata = fullUser.publicMetadata as any;

    // Solo actualizar si no tiene plan
    if (!currentMetadata?.plan) {
      await this.authService.updatePublicMetadata(user.userId, {
        plan: 'free', // Plan por defecto
      });

      return {
        message: 'Plan free asignado por defecto',
      };
    }

    return {
      message: 'El usuario ya tiene un plan',
      plan: currentMetadata.plan,
    };
  }

  /**
   * EJEMPLO 10: Resetear metadata
   */
  @Patch('reset-metadata')
  async resetMetadata(@CurrentUser() user: AuthenticatedUser) {
    // Resetear a valores por defecto
    await this.authService.updatePublicMetadata(user.userId, {
      storeSlug: undefined,
      plan: 'free',
      onboardingCompleted: false,
    });

    return {
      message: 'Metadata reseteado a valores por defecto',
    };
  }
}

/**
 * USO EN SERVICIOS (NO CONTROLLERS)
 *
 * Si necesitas actualizar metadata desde un servicio:
 */

// import { Injectable } from '@nestjs/common';
// import { AuthService } from '../auth/auth.service';
//
// @Injectable()
// export class StoresService {
//   constructor(private authService: AuthService) {}
//
//   async createStore(userId: string, storeData: any) {
//     // 1. Crear la tienda
//     const store = await this.storeRepository.save(storeData);
//
//     // 2. Actualizar metadata del usuario
//     await this.authService.updatePublicMetadata(userId, {
//       storeSlug: store.slug,
//     });
//
//     return store;
//   }
// }
