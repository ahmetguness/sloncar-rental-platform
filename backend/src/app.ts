import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler } from './middlewares/index.js';


import authRoutes from './modules/auth/auth.routes.js';
import carsRoutes from './modules/cars/cars.routes.js';
import bookingsRoutes, {
    carAvailabilityRouter,
    adminBookingsRouter
} from './modules/bookings/bookings.routes.js';
import franchiseRoutes, {
    adminFranchiseRouter
} from './modules/franchise/franchise.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import brandsRoutes from './modules/brands/brands.routes.js';
import branchesRoutes from './modules/branches/branches.routes.js';
import uploadRoutes from './modules/upload/upload.routes.js';
import campaignRoutes, { adminCampaignRouter } from './modules/campaigns/campaigns.routes.js';
import { adminInsuranceRouter } from './modules/insurance/insurance.routes.js';
import auditRouter from './modules/audit/audit.routes.js';
import backupRoutes from './modules/backup/backup.routes.js';

const app = express();


app.use(helmet());
app.use(cors({
    origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
    credentials: true,
}));
app.use(compression());


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


// Rate limiter
if (env.NODE_ENV === 'production') {
    app.use(limiter);
}


app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));


// Logger integration
import morgan from 'morgan';
import { Logger } from './lib/logger.js';

// Stream for morgan to use our custom logger
const stream = {
    write: (message: string) => Logger.http(message.trim()),
};

app.use(morgan('combined', { stream }));


app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
}));
app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerSpec);
});


app.use('/api/auth', authRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/cars/:id/availability', carAvailabilityRouter);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/franchise-applications', franchiseRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/upload', uploadRoutes);


app.use('/api/admin/bookings', adminBookingsRouter);
app.use('/api/admin/franchise-applications', adminFranchiseRouter);
app.use('/api/admin/campaigns', adminCampaignRouter);
app.use('/api/admin/insurances', adminInsuranceRouter);
app.use('/api/admin/audit-logs', auditRouter);
app.use('/api/admin/backup', backupRoutes);
app.use('/api/admin', adminRoutes);


app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Endpoint not found',
        },
    });
});


app.use(errorHandler);

export default app;
