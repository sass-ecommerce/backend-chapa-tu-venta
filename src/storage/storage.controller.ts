import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { S3Service } from './s3.service';
import { PresignedUploadDto } from './dto/presigned-upload.dto';
import { PresignedViewDto } from './dto/presigned-view.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CognitoUser } from '../auth/interfaces/cognito-user.interface';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('storage')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class StorageController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('presigned-upload')
  async getUploadUrl(
    @Body() dto: PresignedUploadDto,
    @CurrentUser() user: CognitoUser,
  ) {
    const { uploadUrl, key } = await this.s3Service.generateUploadUrl(
      dto.folder,
      user.sub,
      user.tenantId!,
      dto.fileName,
      dto.contentType,
      dto.primaryIdentifier,
      dto.secondaryIdentifier,
    );
    return {
      code: 200,
      message: 'Presigned upload URL generated',
      data: { uploadUrl, key },
    };
  }

  @Get('presigned-view')
  @Public()
  async getViewUrl(@Query() dto: PresignedViewDto) {
    const { viewUrl } = await this.s3Service.generateViewUrl(dto.key);
    return {
      code: 200,
      message: 'Presigned view URL generated',
      data: { viewUrl },
    };
  }
}
