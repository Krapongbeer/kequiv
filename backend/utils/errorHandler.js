/**
 * Safe Error Handler Utility for Production (OWASP / Information Leakage Guard)
 */

const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;

function safeErrorResponse(res, err, customMsg = 'เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง') {
    if (err) {
        console.error('Operational error:', err.message || err);
    }
    return res.status(500).json({
        success: false,
        error: isProd ? customMsg : (err && err.message ? err.message : customMsg)
    });
}

module.exports = { safeErrorResponse, isProd };
