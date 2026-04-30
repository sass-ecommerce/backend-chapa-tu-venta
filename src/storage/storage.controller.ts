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
import { PresignedDownloadDto } from './dto/presigned-download.dto';
import { CurrentUser } from '../cognito-auth/decorators/current-user.decorator';
import type { CognitoUser } from '../cognito-auth/interfaces/cognito-user.interface';

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
      dto.fileName,
      dto.contentType,
    );
    return {
      code: 200,
      message: 'Presigned upload URL generated',
      data: { uploadUrl, key },
    };
  }

  @Get('presigned-download')
  async getDownloadUrl(@Query() dto: PresignedDownloadDto) {
    const { downloadUrl } = await this.s3Service.generateDownloadUrl(dto.key);
    return {
      code: 200,
      message: 'Presigned download URL generated',
      data: { downloadUrl },
    };
  }
}
