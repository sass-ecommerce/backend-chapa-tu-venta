import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import {
  EventBusArnNotFoundException,
  EventBridgePublishException,
} from './exceptions/events.exceptions';

const BUS_ARN_SSM_PATH = '/dev/ctv/eventbridge/event-bus-arn';

@Injectable()
export class EventBridgeService implements OnModuleInit {
  private readonly logger = new Logger(EventBridgeService.name);
  private readonly eventBridgeClient: EventBridgeClient;
  private readonly ssmClient: SSMClient;
  private eventBusArn: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('aws.region');
    this.eventBridgeClient = new EventBridgeClient({ region });
    this.ssmClient = new SSMClient({ region });
  }

  async onModuleInit(): Promise<void> {
    const command = new GetParameterCommand({ Name: BUS_ARN_SSM_PATH });

    try {
      const response = await this.ssmClient.send(command);
      const arn = response.Parameter?.Value;

      if (!arn) {
        throw new EventBusArnNotFoundException();
      }

      this.eventBusArn = arn;
      this.logger.log(`EventBridge bus ARN loaded from SSM`);
    } catch (error) {
      if (error instanceof EventBusArnNotFoundException) throw error;
      this.logger.error(
        'Failed to retrieve EventBridge bus ARN from SSM',
        error,
      );
      throw new EventBusArnNotFoundException();
    }
  }

  async publish(
    source: string,
    detailType: string,
    detail: Record<string, unknown>,
  ): Promise<void> {
    const command = new PutEventsCommand({
      Entries: [
        {
          EventBusName: this.eventBusArn,
          Source: source,
          DetailType: detailType,
          Detail: JSON.stringify(detail),
        },
      ],
    });

    try {
      const response = await this.eventBridgeClient.send(command);

      if (response.FailedEntryCount && response.FailedEntryCount > 0) {
        this.logger.error(
          `EventBridge rejected ${response.FailedEntryCount} event(s)`,
          { detailType, entries: response.Entries },
        );
        throw new EventBridgePublishException();
      }
    } catch (error) {
      if (error instanceof EventBridgePublishException) throw error;
      this.logger.error('Unexpected error publishing to EventBridge', error);
      throw new EventBridgePublishException();
    }
  }
}
