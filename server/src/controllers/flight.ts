import { PrismaClient } from "@prisma/client";
import prisma from "../lib/prisma";
import logger from "../logger";
import { ServerError } from "../types/ServerError";

// Type aliasing for Flight from Prisma
type Flight = Awaited<ReturnType<PrismaClient["flight"]["findUnique"]>>;

/**
 * Controller for managing flights
 */
export const flightController = {
    /**
     * Creates a new flight
     * 
     * @param params - Parameters for creating the flight
     * @param flightData - The flight data to create
     * @param store - Store containing Redis client
     * 
     * @throws Error if required fields are missing or invalid
     * 
     * @returns The created flight
     */
    createFlight: async (
        params: { flight: string },
        flightData: { name: string, aircraft: string, latitude: number, longitude: number, altitude: number, date: string, description: string },
        store: { redis: any }
    ): Promise<Flight> => {
        try {
            // Validate required fields
            const requiredFields = ['name', 'aircraft', 'latitude', 'longitude', 'altitude', 'date'];
            for (const field of requiredFields) {
                if (!flightData[field as keyof typeof flightData]) {
                    logger.error(`${field} is required`);
                    throw new ServerError(`${field} is required`, 400);
                }
            }

            // Validate required params
            if (!params.flight) {
                logger.error('Missing required parameter: flight');
                throw new ServerError('Missing required parameter: flight', 400);
            }

            logger.info('Creating flight:', {
                flight: params.flight,
                name: flightData.name
            });

            // Create flight in database
            const flight = await prisma.flight.create({
                data: {
                    uuid: params.flight,
                    name: flightData.name,
                    description: flightData.description,
                    latitude: flightData.latitude,
                    longitude: flightData.longitude,
                    altitude: flightData.altitude,  
                    date: new Date(flightData.date),
                    aircraft: flightData.aircraft,
                }
            });

            logger.info(`Flight ${params.flight} created successfully`);
            return flight;
        } catch (error) {
            logger.error('Failed to create flight:', {
                error: error instanceof Error ? error.message : String(error),
                flight: params.flight
            });
            if (error instanceof ServerError) {
                throw error;
            }
            throw new ServerError('Failed to create flight', 500);
        }
    },

    /**
     * Gets a flight by its ID
     * 
     * @param params - Parameters for identifying the flight
     * @param store - Store containing Redis client
     * 
     * @throws Error if flight not found
     * 
     * @returns The flight data
     */
    getFlight: async (
        params: { flight: string },
        store: { redis: any }
    ): Promise<Flight> => {
        try {
            const flight = await prisma.flight.findUnique({
                where: { uuid: params.flight }
            });

            if (!flight) {
                logger.error(`Flight not found: ${params.flight}`);
                throw new ServerError('Flight not found', 404);
            }

            return flight;
        } catch (error) {
            logger.error('Failed to get flight:', {
                error: error instanceof Error ? error.message : String(error),
                flight: params.flight
            });
            if (error instanceof ServerError) {
                throw error;
            }
            throw new ServerError('Failed to get flight', 500);
        }
    },

    /**
     * Lists all flights
     * 
     * @param store - Store containing Redis client
     * 
     * @returns Array of flights
     */
    listFlights: async (store: { redis: any }): Promise<Flight[]> => {
        try {
            const flights = await prisma.flight.findMany();

            return flights;
        } catch (error) {
            logger.error('Failed to list flights:', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw new ServerError('Failed to list flights', 500);
        }
    },

    /**
     * Updates a flight's metadata
     * 
     * @param params - Parameters for identifying the flight
     * @param metadata - New metadata to merge with existing
     * @param store - Store containing Redis client
     * 
     * @throws Error if flight not found
     * 
     * @returns The updated flight
     */
    updateFlightMetadata: async (
        params: { flight: string },
        metadata: Record<string, string>,
        store: { redis: any }
    ): Promise<Flight> => {
        try {
            // Get current flight data
            const flight = await prisma.flight.findUnique({
                where: { uuid: params.flight }
            });

            if (!flight) {
                logger.error(`Flight not found: ${params.flight}`);
                throw new ServerError('Flight not found', 404);
            }

            // Merge metadata
            const updatedMetadata = {
                ...flight.metadata,
                ...metadata
            };

            logger.info(`Updating flight metadata: ${params.flight}`);

            // Update flight in database
            const updatedFlight = await prisma.flight.update({
                where: { uuid: params.flight },
                data: {
                    metadata: updatedMetadata
                }
            });

            logger.info(`Flight ${params.flight} metadata updated successfully`);
            return updatedFlight;
        } catch (error) {
            logger.error('Failed to update flight metadata:', {
                error: error instanceof Error ? error.message : String(error),
                flight: params.flight
            });
            if (error instanceof ServerError) {
                throw error;
            }
            throw new ServerError('Failed to update flight metadata', 500);
        }
    }
}; 