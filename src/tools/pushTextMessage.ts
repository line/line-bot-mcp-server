
import { z } from 'zod';
import { AbstractTool } from './AbstractTool.js';
import { userIdSchema } from '../common/schema/constants.js';
import { textMessageSchema } from '../common/schema/textMessage.js';

export class PushTextMessageTool extends AbstractTool {
  name = 'push_text_message';
  description =
    'Push a simple text message to a user via LINE. Use this for sending plain text messages without formatting.';
  parameters = z.object({
    userId: userIdSchema,
    message: textMessageSchema,
  });

  async use(params: z.infer<typeof this.parameters>): Promise<any> {
    const { userId, message } = params;
    if (!userId) {
      throw new Error(
        'Error: Specify the userId or set the DESTINATION_USER_ID in the environment variables of this MCP Server.'
      );
    }
    const response = await this.client.pushMessage({
      to: userId,
      messages: [message as any],
    });
    return response;
  }
}
