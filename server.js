require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigin = process.env.FRONTEND_ORIGIN || `http://localhost:${process.env.PORT || 5000}`;
const blockedStaticFiles = new Set([
    '.env',
    'cargo.db',
    'cargo.db-shm',
    'cargo.db-wal',
    'db.js',
    'server.js',
    'package.json',
    'package-lock.json'
]);

if (isProduction) {
    const requiredProductionValues = ['JWT_SECRET', 'APP_URL', 'FRONTEND_ORIGIN', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'ADMIN_EMAIL'];
    const missingValues = requiredProductionValues.filter(key => !process.env[key]);
    if (missingValues.length > 0) {
        throw new Error(`Missing production configuration: ${missingValues.join(', ')}`);
    }
    if (!process.env.APP_URL.startsWith('https://') || !process.env.FRONTEND_ORIGIN.startsWith('https://')) {
        throw new Error('APP_URL and FRONTEND_ORIGIN must use HTTPS in production');
    }
    if (process.env.PAYFAST_SANDBOX !== 'true' &&
        ['PAYFAST_MERCHANT_ID', 'PAYFAST_MERCHANT_KEY', 'PAYFAST_PASSPHRASE'].some(key => !process.env[key])) {
        throw new Error('Live PayFast credentials are required when PAYFAST_SANDBOX is false');
    }
}

// Database initialization
require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
app.disable('x-powered-by');
app.set('trust proxy', isProduction ? 1 : false);

// Security Headers (configured to allow CDN resources for fonts & styles)
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
                scriptSrcAttr: ["'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:"],
                    connectSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000"]
            }
        },
        crossOriginEmbedderPolicy: false
    })
);

app.use(cors({
    origin(origin, callback) {
        const isLocalFile = !isProduction && (!origin || origin === 'null');
            const isLocalDevelopmentOrigin = !isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
            if (isLocalFile || isLocalDevelopmentOrigin || origin === allowedOrigin) {
            return callback(null, true);
        }
        return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: false
}));

app.use((req, res, next) => {
    const requestedFile = path.basename(req.path);
    if (blockedStaticFiles.has(requestedFile) || req.path.startsWith('/routes/') || req.path.startsWith('/utils/')) {
        return res.status(404).end();
    }
    next();
});

// Body Parsers (Support both JSON and PayFast urlencoded webhook payloads)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// Rate Limiting on checkout & admin auth
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // 20 login attempts per 15 min
    message: { success: false, message: 'Too many login attempts, please try again in 15 minutes.' }
});

app.use('/api/orders/create', apiLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/orders/track', apiLimiter);
app.use('/api/payments', apiLimiter);

// API Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/contact', apiLimiter, require('./routes/contact'));
app.use('/api/store', apiLimiter, require('./routes/store'));
app.use('/api/admin', require('./routes/admin'));

// Serve Static Frontend Assets
app.use(express.static(__dirname));

// Route shortcuts
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'ecommerce.html'));
});

// Fallback error handler
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🎖️  CARGO E-COMMERCE SERVER RUNNING`);
    console.log(`🌐 Storefront: http://localhost:${PORT}`);
    console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`=======================================================`);
});

