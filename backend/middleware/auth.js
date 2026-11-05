const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../routes/auth');
const { verifyUserTokenVersion } = require('../services/userService');

async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'จำเป็นต้องเข้าสู่ระบบก่อนใช้งาน (Unauthorized)'
        });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Token Version Check (Invalidates older tokens on password change or logout)
        if (decoded && decoded.username) {
            const isValid = await verifyUserTokenVersion(decoded.username, decoded.token_version);
            if (!isValid) {
                return res.status(401).json({
                    success: false,
                    error: 'เซสชันนี้ถูกยกเลิกเนื่องจากมีการเปลี่ยนรหัสผ่านหรือออกจากระบบ กรุณาเข้าสู่ระบบใหม่ (Session Revoked)'
                });
            }
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่ (Session Expired)'
        });
    }
}

function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            return next();
        }
        return res.status(403).json({
            success: false,
            error: 'สิทธิ์ไม่เพียงพอ: สงวนสิทธิ์สำหรับผู้ดูแลระบบ (Admin) เท่านั้น'
        });
    });
}

module.exports = {
    requireAuth,
    requireAdmin
};
