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
const { requireAuth } = require('./middleware/auth');

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Rate Limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts
    message: { success: false, error: 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาทีแล้วลองใหม่' }
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
        units: ['ชิ้น', 'งาน', 'เมตร', 'ตร.ม.', 'ชุด', 'ม้วน', 'กล่อง', 'เที่ยว', 'lot', 'งวด', 'วัน', 'เดือน', 'ต้น', 'แผ่น', 'ถุง'],
        payment_terms: [
            'ชำระเงินสดทันทีเมื่อส่งมอบงาน',
            'เครดิต 15 วัน',
            'เครดิต 30 วัน นับจากวันออกใบแจ้งหนี้',
            'มัดจำ 50% ก่อนเริ่มงาน ส่วนที่เหลือชำระเมื่องานแล้วเสร็จ',
            'แบ่งชำระเป็น 3 งวด (30% / 40% / 30%)'
        ],
        remarks: [
            'ขอบพระคุณที่ไว้วางใจในบริการของเรา',
            'ราคานี้รวมค่าขนส่งถึงหน้างานแล้ว',
            'กรุณาตรวจสอบความถูกต้องของสินค้าและบริการทันทีที่ได้รับ',
            'เอกสารนี้ออกโดยไม่มีภาษีมูลค่าเพิ่ม (ผู้ขายไม่ได้จดทะเบียน VAT)'
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
app.use('/api/backup', requireAuth, require('./routes/backup'));
app.use('/api/reports', requireAuth, require('./routes/reports'));

// Fallback to index.html for SPA navigation
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
    }
    next();
});

// Start server when run directly (not on Vercel serverless)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`🚀 Kequiv Web System v${versionInfo.version} is running!`);
        console.log(`📍 URL: http://localhost:${PORT}`);
        console.log(`🔒 Security: Authentication & Rate Limiting ACTIVE`);
        console.log(`====================================================`);
    });
}

module.exports = app;
