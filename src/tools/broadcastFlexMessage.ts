
import { z } from 'zod';
import { AbstractTool } from './AbstractTool.js';
import { flexMessageSchema } from '../common/schema/flexMessage.js';

export class BroadcastFlexMessageTool extends AbstractTool {
  name = 'broadcast_flex_message';
  description =
    'Broadcast a highly customizable flex message via LINE to all users who have added your LINE Official Account. Supports both bubble (single container) and carousel (multiple swipeable bubbles) layouts. Please be aware that this message will be sent to all users.';
  parameters = z.object({
    message: flexMessageSchema,
  });

  async use(params: z.infer<typeof this.parameters>) {
    const { message } = params;
    const response = await this.client.broadcast({
      messages: [message as any],
    });
    return response;
  }
}
