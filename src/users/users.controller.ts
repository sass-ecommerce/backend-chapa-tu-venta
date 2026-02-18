import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  Logger,
  UseGuards,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserBasicDto } from './dto/update-user-basic.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('users')
@UseGuards(JwtAuthGuard) // Guard aplicado a todo el controlador
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/users/:slug
   * Retorna información pública del usuario por slug
   * Requiere autenticación JWT
   */
  @Get(':slug')
  async findBySlug(
    @Param('slug', ParseUUIDPipe) slug: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.debug(`[GET /users/${slug}] Requested by user: ${user.userId}`);

    const foundUser = await this.usersService.findBySlug(slug);

    // Mapear a DTO público (sin exponer ID interno)
    return {
      code: 200,
      message: 'User found successfully',
      data: {
        userSlug: foundUser.slug,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        email: foundUser.email,
        imageUrl: foundUser.imageUrl,
        role: foundUser.role,
        createdAt: foundUser.createdAt,
      },
    };
  }

  /**
   * PATCH /api/users/:slug
   * Actualiza información básica del usuario (firstName, lastName, imageUrl)
   * Solo el propietario puede actualizar su perfil
   * Requiere autenticación JWT
   */
  @Patch(':slug')
  async updateBasicInfo(
    @Param('slug', ParseUUIDPipe) slug: string,
    @Body() updateUserBasicDto: UpdateUserBasicDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.logger.debug(
      `[PATCH /users/${slug}] Update requested by user: ${user.userId}`,
    );

    const updatedUser = await this.usersService.updateBasicInfo(
      slug,
      updateUserBasicDto,
      user.userId,
    );

    // Mapear a DTO público
    return {
      code: 200,
      message: 'User updated successfully',
      data: {
        userSlug: updatedUser.slug,
      },
    };
  }
}
