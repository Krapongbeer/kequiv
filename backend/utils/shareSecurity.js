const crypto = require('crypto');

// Cryptographically secure secret key for document sharing
const SHARE_SALT = process.env.JWT_SECRET ||
                   process.env.SUPABASE_SECRET_KEY ||
                   crypto.createHash('sha256').update(process.env.SUPABASE_URL || 'kequiv-secure-system-auth-2026').digest('hex');

/**
 * Generate a 10-character tamper-proof, unguessable token for public document sharing
 * @param {string} code - Document code (e.g. RE202611-001)
 * @param {number|string} id - Document primary ID
 * @returns {string} - 10 hex characters
 */
function generateDocShareKey(code, id) {
    if (!code) return '';
    const cleanCode = String(code).trim().toUpperCase();
    const cleanId = String(id || '');
    return crypto.createHmac('sha256', SHARE_SALT)
        .update(`SHARE_KEY:${cleanCode}:${cleanId}`)
        .digest('hex')
        .slice(0, 10);
}

/**
 * Verifies if the provided key matches the expected share key
 * @param {string} code - Document code
 * @param {number|string} id - Document primary ID
 * @param {string} key - User-supplied key from URL (?k=...)
 * @returns {boolean}
 */
function verifyDocShareKey(code, id, key) {
    if (!key || typeof key !== 'string') return false;
    const expected = generateDocShareKey(code, id);
    if (!expected) return false;
    try {
        const a = Buffer.from(key.trim().toLowerCase());
        const b = Buffer.from(expected.toLowerCase());
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
    } catch (_) {
        return false;
    }
}

module.exports = {
    generateDocShareKey,
    verifyDocShareKey,
    SHARE_SALT
};
