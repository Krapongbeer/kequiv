require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Ensure db and schema are initialized
require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/company', require('./routes/company'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/upload', require('./routes/upload'));

// Presets endpoint
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
        console.log(`🚀 Kequiv Web System is running!`);
        console.log(`📍 URL: http://localhost:${PORT}`);
        console.log(`====================================================`);
    });
}

module.exports = app;
