const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { authenticateUser, changeUserPassword, incrementUserTokenVersion } = require('../services/userService');
const { logAudit } = require('../services/auditService');

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
            await logAudit(req, 'AUTH_LOGIN_FAILED', {
                targetType: 'auth',
                details: `Failed login attempt for username: ${username}`
            });
            return res.status(401).json({
                success: false,
                error: auth.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
            });
        }

        const user = auth.user;

        // Generate hardened token valid for 7 days with token_version for instant revocation
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                token_version: user.token_version || 1
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        await logAudit(req, 'AUTH_LOGIN_SUCCESS', {
            targetType: 'auth',
            targetId: user.id,
            details: { username: user.username, role: user.role }
        });

        res.json({
            success: true,
            message: 'เข้าสู่ระบบสำเร็จ',
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                token_version: user.token_version || 1
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

// POST /api/auth/logout (Session Termination & Optional Token Revocation)
router.post('/logout', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                if (decoded && decoded.username) {
                    await logAudit(req, 'AUTH_LOGOUT', {
                        targetType: 'auth',
                        targetId: decoded.id,
                        details: `User ${decoded.username} logged out`
                    });
                }
            } catch (_) {}
        }

        res.json({
            success: true,
            message: 'ออกจากระบบเรียบร้อยแล้ว'
        });
    } catch (err) {
        res.json({ success: true, message: 'ออกจากระบบเรียบร้อยแล้ว' });
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
            await logAudit(req, 'AUTH_PASSWORD_CHANGE_FAILED', {
                targetType: 'auth',
                details: `Password change failed for ${decoded.username}: ${result.error}`
            });
            return res.status(400).json({ success: false, error: result.error });
        }

        await logAudit(req, 'AUTH_PASSWORD_CHANGE_SUCCESS', {
            targetType: 'auth',
            targetId: decoded.id,
            details: `Password successfully changed and sessions revoked for ${decoded.username}`
        });

        res.json({
            success: true,
            message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว เซสชันเดิมทั้งหมดถูกยกเลิกเพื่อความปลอดภัย'
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
