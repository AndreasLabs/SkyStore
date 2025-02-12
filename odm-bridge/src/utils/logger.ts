import adze, { setup, type JsonLogFormatMeta } from 'adze';

// Configure global logger settings
setup<JsonLogFormatMeta>({
  activeLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: process.env.NODE_ENV === 'production' ? 'json' : 'pretty',
  meta: {
    hostname: process.env.HOSTNAME || 'skystore-odm-bridge',
    name: 'skystore'
  }
});

// Create base logger instance with timestamps
const baseLogger = adze.timestamp.seal();

// Create namespace-specific loggers
export const odmLogger = baseLogger.ns('odm').seal();
export const systemLogger = baseLogger.ns('system').seal();

export default baseLogger; 