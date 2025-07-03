
import { z } from 'zod';
import { messagingApi } from '@line/bot-sdk';

export abstract class AbstractTool {
  abstract name: string;
  abstract description: string;
  abstract parameters: z.ZodObject<any, any, any>;
  protected client: messagingApi.MessagingApiClient;

  constructor(client: messagingApi.MessagingApiClient) {
    this.client = client;
  }

  abstract use(params: any): Promise<any>;

  get schema() {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters,
    };
  }
}
