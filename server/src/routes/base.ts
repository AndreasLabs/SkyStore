import { Elysia } from 'elysia';
import logger from '../logger';
import { State } from '../types/State';

export function createBaseRoute(prefix: string) {
  return new Elysia<{ store: State }>({ prefix })
    .onError(({ code, error, set }) => {
      logger.error(`Error in ${prefix} route:`, { code, error });
      
      set.status = code === 'NOT_FOUND' ? 404 : 500;
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    })
    .onRequest(({ request }) => {
      logger.info(`${request.method} ${request.url}`);
    });
} 