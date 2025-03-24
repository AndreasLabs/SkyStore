import { t } from 'elysia';
import { createBaseRoute } from './base';
import { flightController } from '../controllers/flight';
import { ServerError } from '../types/ServerError';
import logger from '../logger';

export const flightRoutes = createBaseRoute('/flights')
  // Create a new flight
  .post('/',
    async ({ body, store, set }: {
      body: { 
        name: string, 
        aircraft: string,
        latitude: number,
        longitude: number,
        altitude: number,
        date: string,
        description: string,
        metadata?: Record<string, string> 
      },
      store: { redis: any },
      set: {
        status: number;
        headers: Record<string, string>;
      }
    }) => {
      try {
        logger.info('Creating flight', { body });
        
        // Create params object with generated UUID
        const params = {
          flight: crypto.randomUUID()
        };
        
        const flight = await flightController.createFlight(params, body, store);

        return {
          success: true,
          data: flight
        };
      } catch (error) {
        if (error instanceof ServerError) {
          set.status = error.status;
          return {
            success: false,
            error: error.message
          };
        }
        set.status = 500;
        return {
          success: false,
          error: 'Failed to create flight'
        };
      }
    }, {
      body: t.Object({
        name: t.String(),
        aircraft: t.String(),
        latitude: t.Number(),
        longitude: t.Number(),
        altitude: t.Number(),
        date: t.String(),
        description: t.String(),
        metadata: t.Optional(t.Record(t.String(), t.String()))
      })
    }
  )

  // Get flight by ID
  .get('/:id',
    async ({ params, store, set }: {
      params: { id: string },
      store: { redis: any },
      set: {
        status: number;
        headers: Record<string, string>;
      }
    }) => {
      try {
        logger.info('Getting flight', { id: params.id });
        
        const flight = params.id;
        
        const flightData = await flightController.getFlight({ flight }, store);

        return {
          success: true,
          data: flightData
        };
      } catch (error) {
        if (error instanceof ServerError) {
          set.status = error.status;
          return {
            success: false,
            error: error.message
          };
        }
        set.status = 500;
        return {
          success: false,
          error: 'Failed to get flight'
        };
      }
    }, {
      params: t.Object({
        id: t.String()
      })
    }
  )

  // List all flights
  .get('/',
    async ({ store, set }: {
      store: { redis: any },
      set: {
        status: number;
        headers: Record<string, string>;
      }
    }) => {
      try {
        logger.info('Listing all flights');
        
        const flights = await flightController.listFlights(store);

        return {
          success: true,
          data: flights
        };
      } catch (error) {
        if (error instanceof ServerError) {
          set.status = error.status;
          return {
            success: false,
            error: error.message
          };
        }
        set.status = 500;
        return {
          success: false,
          error: 'Failed to list flights'
        };
      }
    }
  )

  // Update flight metadata
  .patch('/:id/metadata',
    async ({ params, body, store, set }: {
      params: { id: string },
      body: Record<string, string>,
      store: { redis: any },
      set: {
        status: number;
        headers: Record<string, string>;
      }
    }) => {
      try {
        logger.info('Updating flight metadata', { id: params.id, body });
        
        const flight = params.id;
        
        const updatedFlight = await flightController.updateFlightMetadata(
          { flight }, 
          body, 
          store
        );

        return {
          success: true,
          data: updatedFlight
        };
      } catch (error) {
        if (error instanceof ServerError) {
          set.status = error.status;
          return {
            success: false,
            error: error.message
          };
        }
        set.status = 500;
        return {
          success: false,
          error: 'Failed to update flight metadata'
        };
      }
    }, {
      params: t.Object({
        id: t.String()
      }),
      body: t.Record(t.String(), t.String())
    }
  );
