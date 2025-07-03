
import { z } from 'zod';
import { AbstractTool } from './AbstractTool.js';
import { userIdSchema } from '../common/schema/constants.js';

export class GetProfileTool extends AbstractTool {
  name = 'get_profile';
  description =
    'Get detailed profile information of a LINE user including display name, profile picture URL, status message and language.';
  parameters = z.object({
    userId: userIdSchema,
  });

  async use(params: z.infer<typeof this.parameters>): Promise<any> {
    const { userId } = params;
    if (!userId) {
      throw new Error(
        'Error: Specify the userId or set the DESTINATION_USER_ID in the environment variables of this MCP Server.'
      );
    }
    const response = await this.client.getProfile(userId);
    return response;
  }
}
