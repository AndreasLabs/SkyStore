import { Elysia } from 'elysia';
import logger from '../logger';
import { State } from '../types/State';
import { ServerError } from '../types/ServerError';
import { RestResult, makeErrorResult, makeRestResult } from '@skystore/core_types';

interface ValidationSchema {
  type: string;
  properties?: Record<string, { type: string }>;
  required?: string[];
}

interface ValidationError {
  type: string;
  value: Record<string, any>;
  validator: {
    schema: {
      type: string;
      properties?: Record<string, { type: string }>;
      required?: string[];
    };
  };
}

interface InvalidField {
  field: string;
  expected: string;
  received: string;
}

function formatValidationError(error: unknown) {
  // Type guard for ValidationError
  if (!error || typeof error !== 'object' || !('validator' in error) || !('value' in error)) {
    return {
      type: 'unknown',
      message: 'Unknown validation error',
      details: { error }
    };
  }

  const validationError = error as ValidationError;
  const { type, value, validator } = validationError;
  const schema = validator?.schema;
  
  // Get required fields from schema
  const requiredFields = schema?.required || [];
  
  // Check which required fields are missing
  const missingFields = requiredFields.filter((field: string) => !value || !value[field]);
  
  // Check for invalid fields (present but wrong type)
  const invalidFields = Object.entries(value || {}).reduce<InvalidField[]>((acc, [key, val]) => {
    const fieldSchema = schema?.properties?.[key];
    if (fieldSchema && typeof val !== fieldSchema.type) {
      acc.push({
        field: key,
        expected: fieldSchema.type,
        received: typeof val
      });
    }
    return acc;
  }, []);

  // Create human readable message
  const messages: string[] = [];
  
  if (missingFields.length > 0) {
    if (missingFields.length === 1) {
      messages.push(`The field "${missingFields[0]}" is required`);
    } else {
      const lastField = missingFields[missingFields.length - 1];
      const otherFields = missingFields.slice(0, -1).join('", "');
      messages.push(`The fields "${otherFields}" and "${lastField}" are required`);
    }
  }

  if (invalidFields.length > 0) {
    invalidFields.forEach(({ field, expected, received }) => {
      messages.push(`The field "${field}" should be a ${expected}, but received ${received}`);
    });
  }

  const message = messages.join('. ');

  return {
    type,
    message: message || 'Validation failed',
    details: {
      missing_required_fields: missingFields,
      invalid_fields: invalidFields,
      received_value: value
    }
  };
}

export function createBaseRoute(prefix: string) {
  return new Elysia({ prefix })
    .onError(({ code, error, set }) => {
      logger.error(`Error in ${prefix} route:`, { code });

      if (error instanceof ServerError) {
        set.status = error.status;
        return makeErrorResult(error.message, error.status, error.toResponse());
      }

      if (code === 'VALIDATION') {
        set.status = 400;
        const formattedError = formatValidationError(error);
        return makeErrorResult(formattedError.message, 400, formattedError);
      }

      // If error has a status field, use it
      let status = 500;
      if (error instanceof Error && 'status' in error && typeof (error as any).status === 'number') {
        status = (error as any).status;
      } else {
        status = code === 'NOT_FOUND' ? 404 : 500;
      }
      set.status = status;

      return makeErrorResult(
        error instanceof Error ? error.message : "Something went wrong. (see console)",
        status,
        error
      );
    })
    .onRequest(({ request }) => {
      logger.info(`${request.method} ${request.url}`);
    })
    .derive(({ set }) => ({
      // Add helper to wrap successful responses
      wrapSuccess: <T>(content: T, message: string = ''): RestResult<T> => {
        return makeRestResult(content, message, true, set.status || 200);
      }
    }));
}