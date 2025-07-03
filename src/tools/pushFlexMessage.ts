
import { z } from 'zod';
import { AbstractTool } from './AbstractTool.js';
import { userIdSchema } from '../common/schema/constants.js';
import { flexMessageSchema } from '../common/schema/flexMessage.js';

export class PushFlexMessageTool extends AbstractTool {
  name = 'push_flex_message';
  description =
    'Push a highly customizable flex message to a user via LINE. Supports both bubble (single container) and carousel (multiple swipeable bubbles) layouts.';
  parameters = z.object({
    userId: userIdSchema,
    message: flexMessageSchema,
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
