
import { z } from 'zod';

export const destinationId = process.env.DESTINATION_USER_ID || '';

export const userIdSchema = z
  .string()
  .default(destinationId)
  .describe(
    'The user ID to receive a message. Defaults to DESTINATION_USER_ID.'
  );
