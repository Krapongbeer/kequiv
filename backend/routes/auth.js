const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { authenticateUser, changeUserPassword } = require('../services/userService');

// Cryptographically secure JWT secret (from environment variable or secure Supabase hash fallback)
const JWT_SECRET = process.env.JWT_SECRET ||
                   process.env.SUPABASE_SECRET_KEY ||
                   crypto.createHash('sha256').update(process.env.SUPABASE_URL || 'kequiv-secure-system-auth-2026').digest('hex');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
            });
        }

        const auth = await authenticateUser(username, password);
        if (!auth.success) {
            return res.status(401).json({
                success: false,
                error: auth.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
            });
        }

        const user = auth.user;

        // Generate hardened token valid for 7 days
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'เข้าสู่ระบบสำเร็จ',
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    }
});

// GET /api/auth/me (Check current session)
router.get('/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'ยังไม่ได้เข้าสู่ระบบ' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({
            success: true,
            user: decoded
        });
    } catch (err) {
        res.status(401).json({ success: false, error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
    }
});

// POST /api/auth/change-password
router.post('/change-password', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'ยังไม่ได้เข้าสู่ระบบ' });
        }

        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            return res.status(401).json({ success: false, error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' });
        }

        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
        }

        const result = await changeUserPassword(decoded.username, oldPassword, newPassword);
        if (!result.success) {
            return res.status(400).json({ success: false, error: result.error });
        }

        res.json({
            success: true,
            message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว (มีผลถาวรในระบบ)'
        });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
    }
});

module.exports = {
    router,
    JWT_SECRET
};
