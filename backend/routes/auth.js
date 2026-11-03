const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'kequiv_vintage_ocean_secret_key_2026_@jwt';

// Defined system users with pre-hashed or verified passwords
const USERS = [
    {
        id: 1,
        username: 'phongphana',
        name: 'Phongphana (เจ้าของร้าน / ผู้ดูแลระบบ)',
        role: 'admin',
        // 'plakrapong' hashed
        passwordHash: bcrypt.hashSync('plakrapong', 10)
    },
    {
        id: 2,
        username: 'ampui',
        name: 'Ampui (เจ้าหน้าที่ออกบิล)',
        role: 'editor',
        // 'plaakrapong' hashed
        passwordHash: bcrypt.hashSync('plaakrapong', 10)
    }
];

// POST /api/auth/login
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'
            });
        }

        // Constant-time execution to prevent username enumeration via timing analysis
        const DUMMY_HASH = '$2a$10$wK1Vf0r34p/kequivDummyHashSecuritySalt2026';
        const user = USERS.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
        const hashToVerify = user ? user.passwordHash : DUMMY_HASH;
        const isMatch = bcrypt.compareSync(password, hashToVerify);

        if (!user || !isMatch) {
            return res.status(401).json({
                success: false,
                error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
            });
        }

        // Generate token valid for 30 days
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '30d' }
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
router.post('/change-password', (req, res) => {
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

        if (newPassword.length < 4) {
            return res.status(400).json({ success: false, error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร' });
        }

        const user = USERS.find(u => u.username.toLowerCase() === decoded.username.toLowerCase());
        if (!user) {
            return res.status(404).json({ success: false, error: 'ไม่พบบัญชีผู้ใช้งาน' });
        }

        const isMatch = bcrypt.compareSync(oldPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: 'รหัสผ่านเดิมไม่ถูกต้อง' });
        }

        user.passwordHash = bcrypt.hashSync(newPassword, 10);

        res.json({
            success: true,
            message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว'
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
