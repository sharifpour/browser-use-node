import winston from 'winston';

export function setupLogging(level: string = 'info'): void {
  const logLevel = process.env.BROWSER_USE_LOGGING_LEVEL?.toLowerCase() || level;

  const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level.toUpperCase()}: ${message}`;
      })
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });

  // Silence third-party loggers
  const silencedLoggers = [
    'playwright',
    'langchain',
    'openai',
    'posthog'
  ];

  silencedLoggers.forEach(name => {
    const thirdPartyLogger = winston.loggers.get(name);
    thirdPartyLogger.level = 'error';
  });
}
