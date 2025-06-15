const express = require('express');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure structured logging
const logFormat = process.env.LOG_FORMAT || 'json';
const isDevelopment = process.env.NODE_ENV === 'development';

// Choose format based on environment and configuration
const getLogFormat = () => {
    if (logFormat === 'pretty' || isDevelopment) {
        return winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
            })
        );
    }

    return winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    );
};

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.errors({ stack: true }),
        getLogFormat()
    ),
    defaultMeta: {
        service: 'airtasker-app',
        version: process.env.npm_package_version || '0.0.1',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        new winston.transports.Console()
    ]
});

// Middleware for request logging
app.use((req, res, next) => {
    const startTime = Date.now();

    // Log request
    logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (...args) {
        const duration = Date.now() - startTime;

        logger.info('HTTP Response', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            contentLength: res.get('content-length') || 0
        });

        originalEnd.apply(this, args);
    };

    next();
});

// Middleware to parse JSON
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    const APP_NAME = process.env.APP_NAME || 'airtasker';

    logger.info('Root endpoint accessed', {
        endpoint: '/',
        appName: APP_NAME,
        responseData: APP_NAME
    });

    res.set('Content-Type', 'text/plain');
    res.send(`${APP_NAME}\n`);
});

app.get('/healthcheck', (req, res) => {
    logger.info('Health check accessed', {
        endpoint: '/healthcheck',
        status: 'healthy',
        uptime: process.uptime()
    });

    res.set('Content-Type', 'text/plain');
    res.send('OK\n');
});

// 404 handler for unknown routes (Fixed - no wildcard pattern)
app.use((req, res) => {
    logger.warn('Route not found', {
        method: req.method,
        url: req.originalUrl,
        statusCode: 404
    });

    res.status(404).json({
        error: 'Route not found',
        message: `The route ${req.originalUrl} does not exist`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url,
        statusCode: 500
    });

    res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong on the server'
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    logger.info('Server started successfully')
        ;
});