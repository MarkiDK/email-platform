import express, { Express } from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { config } from '@/config';
import { setupMiddleware } from './middleware';
import { setupRoutes } from './routes';
import { setupWebsocket } from './websocket';
import { connectDB } from '@/utils/database';
import { logger } from '@/utils/logger';
import { initializeServices } from './services';
import { setupCronJobs } from './cron';
import { setupEventListeners } from './events';
import { gracefulShutdown } from './utils/shutdown';

export class Server {
  private app: Express;
  private httpServer: any;
  private io: SocketServer;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketServer(this.httpServer, {
      cors: {
        origin: config.corsOrigins,
        methods: ['GET', 'POST'],
        credentials: true
      }
    });
  }

  private async initialize() {
    try {
      // Connect to database
      await connectDB();
      logger.info('Database connected successfully');

      // Initialize core services
      await initializeServices();
      logger.info('Core services initialized');

      // Setup middleware
      setupMiddleware(this.app);
      logger.info('Middleware setup completed');

      // Setup routes
      setupRoutes(this.app);
      logger.info('Routes setup completed');

      // Setup websocket
      setupWebsocket(this.io);
      logger.info('WebSocket setup completed');

      // Setup cron jobs
      setupCronJobs();
      logger.info('Cron jobs setup completed');

      // Setup event listeners
      setupEventListeners();
      logger.info('Event listeners setup completed');

    } catch (error) {
      logger.error('Server initialization failed:', error);
      throw error;
    }
  }

  public async start() {
    try {
      await this.initialize();

      this.httpServer.listen(config.port, () => {
        logger.info(`Server running on port ${config.port} in ${config.env} mode`);
        
        if (config.env === 'development') {
          logger.info(`API Documentation available at http://localhost:${config.port}/api-docs`);
          logger.info(`Admin Dashboard available at http://localhost:${config.port}/admin`);
        }
      });

      // Setup graceful shutdown
      process.on('SIGTERM', () => gracefulShutdown(this.httpServer));
      process.on('SIGINT', () => gracefulShutdown(this.httpServer));

      // Handle uncaught exceptions
      process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', error);
        gracefulShutdown(this.httpServer);
      });

      // Handle unhandled promise rejections
      process.on('unhandledRejection', (error) => {
        logger.error('Unhandled Rejection:', error);
        gracefulShutdown(this.httpServer);
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public getApp(): Express {
    return this.app;
  }

  public getHttpServer() {
    return this.httpServer;
  }

  public getIO(): SocketServer {
    return this.io;
  }
}

// Create and export server instance
export const server = new Server();

// Start server if this file is run directly
if (require.main === module) {
  server.start().catch((error) => {
    logger.error('Server startup failed:', error);
    process.exit(1);
  });
}