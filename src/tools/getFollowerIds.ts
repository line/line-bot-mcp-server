
import { z } from 'zod';
import { AbstractTool } from './AbstractTool.js';

export class GetFollowerIdsTool extends AbstractTool {
  name = 'get_follower_ids';

  description =
    "Get a list of users who have added your LINE Official Account as a friend. This feature is available only for verified or premium accounts. Note: This API doesn't return friend user IDs in descending order. Instead, it returns a list of user IDs in ascending order of when the user added the bot as a friend.";

  parameters = z.object({
    limit: z
      .number()
      .min(1)
      .max(1000)
      .optional()
      .default(300)
      .describe(
        'The maximum number of user IDs to retrieve in a single request. Max value: 1000'
      ),
    start: z
      .string()
      .optional()
      .describe(
        'Value of the continuation token found in the next property of the JSON object returned in the response. Include this parameter to get the next array of user IDs.'
      ),
  });

  async use(params: z.infer<typeof this.parameters>) {
    const { limit, start } = params;
    const { data } = await (
      this.client as any
    ).http.get('/v2/bot/followers/ids', {
      params: { limit, start },
    });
    return data;
  }
}
