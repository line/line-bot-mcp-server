
import { z } from 'zod';
import { AbstractTool } from './AbstractTool.js';

export class GetMessageQuotaTool extends AbstractTool {
  name = 'get_message_quota';
  description =
    'Get the message quota and consumption of the LINE Official Account. This shows the monthly message limit and current usage.';
  parameters = z.object({});

  async use(_: z.infer<typeof this.parameters>) {
    const messageQuotaResponse = await this.client.getMessageQuota();
    const messageQuotaConsumptionResponse =
      await this.client.getMessageQuotaConsumption();
    const response = {
      limited: messageQuotaResponse.value,
      totalUsage: messageQuotaConsumptionResponse.totalUsage,
    };
    return response;
  }
}
