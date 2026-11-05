require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Ensure db and schema are initialized
const db = require('./db');
const { supabase, isSupabaseConfigured } = require('./supabase');

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
app.use('/api/line', require('./routes/line'));

// Public Document Share & View Endpoints (for LINE & Mobile Customers)
app.get('/api/documents/public/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const cleanCode = (code || '').trim().toUpperCase();

        if (isSupabaseConfigured && supabase) {
            const { data: doc, error } = await supabase
                .from('documents')
                .select(`
                    *,
                    customer:customers(name, tax_id, address, phone, email),
                    project:customer_projects(project_name, site_address, contact_person),
                    items:document_items(*)
                `)
                .eq('code', cleanCode)
                .is('deleted_at', null)
                .single();

            if (!error && doc) {
                const { data: company } = await supabase.from('company_profile').select('*').eq('id', 1).single();
                let bank_accounts = [];
                if (company && company.bank_info) {
                    try {
                        bank_accounts = typeof company.bank_info === 'string' ? JSON.parse(company.bank_info) : company.bank_info;
                    } catch (_) {}
                }
                return res.json({
                    success: true,
                    data: {
                        ...doc,
                        customer_name: doc.customer?.name || '-',
                        customer_tax_id: doc.customer?.tax_id || '',
                        customer_address: doc.customer?.address || '',
                        customer_phone: doc.customer?.phone || '',
                        customer_email: doc.customer?.email || '',
                        project_name: doc.project?.project_name || null,
                        project_site_address: doc.project?.site_address || null,
                        project_contact_person: doc.project?.contact_person || null,
                        company: {
                            ...(company || {}),
                            bank_accounts
                        }
                    }
                });
            }
        }

        // SQLite Fallback
        const doc = db.prepare(`
            SELECT d.*, 
                   c.name as customer_name, c.tax_id as customer_tax_id, c.address as customer_address, 
                   c.phone as customer_phone, c.email as customer_email,
                   p.project_name, p.site_address as project_site_address, p.contact_person as project_contact_person
            FROM documents d
            LEFT JOIN customers c ON c.id = d.customer_id
            LEFT JOIN customer_projects p ON p.id = d.project_id
            WHERE d.code = ? AND d.deleted_at IS NULL
        `).get(cleanCode);

        if (!doc) {
            return res.status(404).json({ success: false, error: 'ไม่พบเอกสารนี้ในระบบ' });
        }

        doc.items = db.prepare(`
            SELECT * FROM document_items 
            WHERE document_id = ? 
            ORDER BY sort_order ASC, id ASC
        `).all(doc.id);

        const company = db.prepare('SELECT * FROM company_profile WHERE id = 1').get();
        let bank_accounts = [];
        if (company && company.bank_info) {
            try {
                bank_accounts = JSON.parse(company.bank_info);
            } catch (_) {}
        }
        doc.company = { ...(company || {}), bank_accounts };

        res.json({ success: true, data: doc });
    } catch (err) {
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการโหลดเอกสาร' });
    }
});

// Standalone Public Viewer Route for LINE links (/share/:code)
app.get('/share/:code', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'share.html'));
});

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
