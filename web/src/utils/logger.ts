import adze from 'adze';

// Create logger factory
export const createLogger = (namespace: string) => {
  return new adze({
    name: namespace,
    logLevel: 'info',
    useEmoji: true,
    timestamp: true,
  });
};

// Export pre-configured loggers for common components
export const loggers = {
  organization: createLogger('organization'),
  project: createLogger('project'),
  flight: createLogger('flight'),
  task: createLogger('task'),
  asset: createLogger('asset'),
  user: createLogger('user'),
}; 