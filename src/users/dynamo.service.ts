import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

export interface DynamoUserItem {
  sub: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  id: string;
  tenants: DynamoTenantMembership[];
  updatedAt: string;
}

export interface DynamoTenantMembership {
  tenantId: string;
  tenantName: string;
  tenantDomain: string;
  role: string;
  isActive: boolean;
  pgTenantUserId: string;
}

@Injectable()
export class DynamoService {
  private readonly logger = new Logger(DynamoService.name);
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(private readonly configService: ConfigService) {
    const dynamo = new DynamoDBClient({
      region: configService.get<string>('aws.region'),
    });
    this.client = DynamoDBDocumentClient.from(dynamo);
    this.tableName = configService.getOrThrow<string>('dynamo.tableName');
  }

  async putUser(user: DynamoUserItem): Promise<void> {
    this.logger.log(`Upserting DynamoDB user sub=${user.sub}`);

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          ...user,
          updatedAt: new Date().toISOString(),
        },
      }),
    );
  }

  async addTenantToUser(
    userId: string,
    membership: DynamoTenantMembership,
  ): Promise<void> {
    this.logger.log(
      `Adding tenant=${membership.tenantId} to DynamoDB user userId=${userId}`,
    );

    await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id: userId },
        UpdateExpression:
          'SET tenants = list_append(if_not_exists(tenants, :empty), :membership), updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':membership': [membership],
          ':empty': [],
          ':updatedAt': new Date().toISOString(),
        },
      }),
    );
  }
}
