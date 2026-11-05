require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Ensure db and schema are initialized
require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const versionInfo = require('./config/version');
const { requireAuth, requireAdmin } = require('./middleware/auth');
const { ensureDefaultUsers } = require('./services/userService');
const { autoBufferMiddleware, ensureDailyBuffer } = require('./services/autoBuffer');
const { pingSupabase, startKeepAliveSchedule, getStatus: getKeepAliveStatus } = require('./services/supabaseKeepAlive');

// Middlewares & Security Headers
app.disable('x-powered-by');

// Security Headers (Clickjacking, MIME Sniffing, XSS, Referrer, CSP, HSTS, Permissions)
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.supabase.co https://*.vercel.app http://localhost:3000 http://127.0.0.1:3000",
        "frame-ancestors 'self'",
        "base-uri 'self'",
        "form-action 'self'"
    ].join('; '));

    next();
});

// Strict Whitelist CORS Policy
const allowedOrigins = [
    'https://kequiv.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        return callback(new Error('CORS blocked: Origin not allowed'));
    },
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(autoBufferMiddleware);

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Rate Limiters (Cybersecurity Hardening)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts
    message: { success: false, error: 'มีการพยายามเข้าสู่ระบบถี่เกินกำหนด กรุณารอ 15 นาทีแล้วลองใหม่อีกครั้ง' }
});

const leadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // max 5 quote requests per 15 min per IP to prevent spam bot abuse
    message: { success: false, error: 'ส่งคำขอใบเสนอราคาบ่อยเกินไป กรุณารอสักครู่ก่อนทำรายการใหม่' }
});

const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 300,
    message: { success: false, error: 'คำขอถี่เกินไป กรุณารอสักครู่' }
});

app.use('/api/', generalLimiter);

// Static frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Public API Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/leads', leadLimiter, require('./routes/leads'));
app.use('/api/cms', require('./routes/cms'));

// Health & Supabase Keep-Alive Heartbeat endpoints (Public / External ping)
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        keepAlive: getKeepAliveStatus()
    });
});

app.get('/api/health/ping', async (req, res) => {
    const result = await pingSupabase();
    res.json({
        success: result.success,
        message: result.success ? 'Supabase heartbeat refreshed successfully' : 'Heartbeat ping failed',
        data: result,
        keepAlive: getKeepAliveStatus()
    });
});

// Version endpoint (Public)
app.get('/api/version', (req, res) => {
    res.json({
        success: true,
        data: versionInfo
    });
});

// Presets endpoint (Public)
app.get('/api/presets', (req, res) => {
    res.json({
        units: [
            'เครื่อง', 'ตัว', 'อัน', 'เส้น', 'ชุด', 'กล่อง', 'ม้วน', 'ชิ้น', 'งาน', 'เมตร', 'ตร.ม.', 'แผ่น', 'เที่ยว', 'lot', 'งวด', 'วัน', 'เดือน', 'ถุง'
        ],
        payment_terms: [
            'ชำระเงินสดทันทีเมื่อส่งมอบงาน',
            'เครดิต 15 วัน',
            'เครดิต 30 วัน นับจากวันออกใบแจ้งหนี้',
            'มัดจำ 50% ก่อนเริ่มงาน ส่วนที่เหลือชำระเมื่องานแล้วเสร็จ',
            'แบ่งชำระเป็น 3 งวด (30% / 40% / 30%)'
        ],
        remarks: [
            'ขอบพระคุณที่ไว้วางใจในบริการของเรา',
            'สินค้ารับประกันศูนย์ 1 ปี (ตามเงื่อนไขผู้ผลิต)',
            'สินค้ารับประกันศูนย์ 3 ปี (ตามเงื่อนไขผู้ผลิต)',
            'ราคานี้รวมค่าขนส่งถึงหน้างานแล้ว',
            'กรุณาตรวจสอบความถูกต้องของสินค้าและบริการทันทีที่ได้รับ',
            'ราคาสินค้าและบริการเป็นราคาสุทธิ'
        ]
    });
});

// Protected API Routes (Require Authentication)
app.use('/api/company', requireAuth, require('./routes/company'));
app.use('/api/customers', requireAuth, require('./routes/customers'));
app.use('/api/reservations', requireAuth, require('./routes/reservations'));
app.use('/api/documents', requireAuth, require('./routes/documents'));
app.use('/api/dashboard', requireAuth, require('./routes/dashboard'));
app.use('/api/upload', requireAuth, require('./routes/upload'));
app.use('/api/backup', requireAdmin, require('./routes/backup'));
app.use('/api/reports', requireAuth, require('./routes/reports'));

// Fallback to index.html for SPA navigation
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
    }
    next();
});

// Global Error Handler Middleware (Cybersecurity Information Leakage Guard)
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    res.status(err.status || 500).json({
        success: false,
        error: isProd ? 'เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง' : (err.message || 'Internal Server Error')
    });
});

// Run User Provisioning, Daily Auto-Buffer & Supabase Keep-Alive on startup
ensureDefaultUsers().catch(err => console.error('Initial user provisioning error:', err));
ensureDailyBuffer(5).catch(err => console.error('Initial auto-buffer error:', err));
startKeepAliveSchedule(24);

// Start server when run directly (not on Vercel serverless and not when required by tests)
if (!process.env.VERCEL && require.main === module) {
    app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`🚀 Kequiv Web System v${versionInfo.version} is running!`);
        console.log(`📍 URL: http://localhost:${PORT}`);
        console.log(`🔒 Security: Authentication & Rate Limiting ACTIVE`);
        console.log(`📦 Auto-Buffer: Daily 5 Reserve Pool ACTIVE`);
        console.log(`====================================================`);
    });
}

module.exports = app;
