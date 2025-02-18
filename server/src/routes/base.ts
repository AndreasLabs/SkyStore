import { Elysia } from 'elysia';
import logger from '../logger';
import { State } from '../types/State';
import { ServerError } from '../types/ServerError';
export function createBaseRoute(prefix: string) {
  return new Elysia({ prefix })
    .onError(({ code, error, set }) => {
      logger.error(`Error in ${prefix} route:`, { code });

      if (error instanceof ServerError) {
        set.status = error.status;
        return error.toResponse();
      }

      if (code == 'VALIDATION') {
        set.status = 400;
        return {
          success: false,
          error: `Validation Error: ${error.summary}`
        };
      }

      // If error has a status field, use it
      if (error instanceof Error && 'status' in error) {
        set.status = error.status;
      } else {
        set.status = code === 'NOT_FOUND' ? 404 : 500;
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    })
    .onRequest(({ request }) => {
      logger.info(`${request.method} ${request.url}`);
    });
}