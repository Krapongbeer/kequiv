/**
 * Kequiv Security & Compliance Audit Logging Service
 * Records sensitive actions (Logins, Password Changes, Backups, Document Cancellations, Profile Updates)
 */

const db = require('../db');
const { supabase, isSupabaseConfigured } = require('../supabase');

// Ensure audit_logs table exists in SQLite
try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT DEFAULT NULL,
            username TEXT DEFAULT 'system',
            action TEXT NOT NULL,
            target_type TEXT DEFAULT '',
            target_id TEXT DEFAULT '',
            details TEXT DEFAULT '',
            ip_address TEXT DEFAULT '',
            user_agent TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_audit_action_time ON audit_logs(action, created_at);
        CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(username);
    `);
} catch (err) {
    console.error('Error ensuring audit_logs table:', err.message);
}

function getClientIp(req) {
    if (!req) return '127.0.0.1';
    const xForwardedFor = req.headers ? req.headers['x-forwarded-for'] : null;
    if (xForwardedFor) {
        return xForwardedFor.split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || '127.0.0.1';
}

/**
 * Log a security or compliance event
 */
async function logAudit(req, action, { targetType = '', targetId = '', details = '' } = {}) {
    const username = (req && req.user && req.user.username) 
        ? req.user.username 
        : (details?.username || (typeof details === 'string' && details.includes('user:') ? details : 'anonymous'));
    const userId = (req && req.user && req.user.id) ? String(req.user.id) : null;
    const ip = getClientIp(req);
    const userAgent = (req && req.headers && req.headers['user-agent']) 
        ? req.headers['user-agent'].slice(0, 255) 
        : '';
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details || '');

    // 1. Write to SQLite
    try {
        db.prepare(`
            INSERT INTO audit_logs (user_id, username, action, target_type, target_id, details, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(userId, username, action, targetType, String(targetId || ''), detailsStr, ip, userAgent);
    } catch (err) {
        console.error('Audit log SQLite error:', err.message);
    }

    // 2. Async Mirror to Supabase (if configured)
    if (isSupabaseConfigured && supabase) {
        try {
            supabase.from('audit_logs').insert({
                user_id: userId,
                username,
                action,
                target_type: targetType,
                target_id: String(targetId || ''),
                details: detailsStr,
                ip_address: ip,
                user_agent: userAgent
            }).then(({ error }) => {
                if (error && error.code !== '42P01') {
                    console.warn('Supabase audit log notice:', error.message);
                }
            }).catch(() => {});
        } catch (_) {}
    }
}

/**
 * Retrieve recent audit logs (Protected, Admin only)
 */
async function getAuditLogs({ limit = 100, action = null, username = null } = {}) {
    if (isSupabaseConfigured && supabase) {
        try {
            let query = supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (action) query = query.eq('action', action);
            if (username) query = query.ilike('username', `%${username}%`);

            const { data, error } = await query;
            if (!error && data) return data;
        } catch (_) {}
    }

    // SQLite Fallback
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    if (action) {
        sql += ' AND action = ?';
        params.push(action);
    }
    if (username) {
        sql += ' AND username LIKE ?';
        params.push(`%${username}%`);
    }
    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    return db.prepare(sql).all(...params);
}

module.exports = {
    logAudit,
    getAuditLogs
};
