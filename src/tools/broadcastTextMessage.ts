
import { z } from 'zod';
import { AbstractTool } from './AbstractTool.js';
import { textMessageSchema } from '../common/schema/textMessage.js';

export class BroadcastTextMessageTool extends AbstractTool {
  name = 'broadcast_text_message';
  description =
    'Broadcast a simple text message via LINE to all users who have followed your LINE Official Account. Use this for sending plain text messages without formatting. Please be aware that this message will be sent to all users.';
  parameters = z.object({
    message: textMessageSchema,
  });

  async use(params: z.infer<typeof this.parameters>) {
    const { message } = params;
    const response = await this.client.broadcast({
      messages: [message as any],
    });
    return response;
  }
}
