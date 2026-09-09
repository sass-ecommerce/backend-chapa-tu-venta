import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';

@Injectable()
export class CognitoAdminService {
  private readonly logger = new Logger(CognitoAdminService.name);
  private readonly client: CognitoIdentityProviderClient;
  private readonly userPoolId: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new CognitoIdentityProviderClient({
      region: configService.get<string>('aws.region'),
    });
    this.userPoolId = configService.getOrThrow<string>('cognito.userPoolId');
  }

  async setDbId(sub: string, id: string): Promise<void> {
    this.logger.log(`Setting custom:id=${id} for sub=${sub}`);

    await this.client.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: sub,
        UserAttributes: [{ Name: 'custom:id', Value: id }],
      }),
    );
  }

  async deleteUser(sub: string): Promise<void> {
    this.logger.log(`Deleting Cognito user sub=${sub}`);

    await this.client.send(
      new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: sub,
      }),
    );
  }

  async setTenantId(sub: string, tenantId: string): Promise<void> {
    this.logger.log(`Setting custom:tenantId=${tenantId} for sub=${sub}`);

    await this.client.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: sub,
        UserAttributes: [{ Name: 'custom:tenantId', Value: tenantId }],
      }),
    );
  }
}
