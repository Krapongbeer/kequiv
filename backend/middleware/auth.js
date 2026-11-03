const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../routes/auth');

function requireAuth(req, res, next) {
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
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่ (Session Expired)'
        });
    }
}

module.exports = {
    requireAuth
};
