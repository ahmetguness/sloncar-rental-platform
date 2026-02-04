import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler, requestLogger } from './middlewares/index.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import carsRoutes from './modules/cars/cars.routes.js';
import bookingsRoutes, {
    carAvailabilityRouter,
    adminBookingsRouter
} from './modules/bookings/bookings.routes.js';
import franchiseRoutes, {
    adminFranchiseRouter
} from './modules/franchise/franchise.routes.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
        },
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
}));
app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerSpec);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/cars/:id/availability', carAvailabilityRouter);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/franchise-applications', franchiseRoutes);

// Admin Routes
app.use('/api/admin/bookings', adminBookingsRouter);
app.use('/api/admin/franchise-applications', adminFranchiseRouter);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found',
        },
    });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
